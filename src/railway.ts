import 'dotenv/config';
import express from 'express';
import { Pool } from 'pg';

const app = express();
app.use(express.json({ limit: '32kb' }));

const port = Number(process.env.PORT || 3000);
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: false })
  : null;
const edgeSecret = process.env.EDGE_SHARED_SECRET;

// Railway's health probe must remain public. Protect the application API behind Cloudflare.
app.use((req, res, next) => {
  if (req.path === '/health') return next();
  if (!edgeSecret) return next();
  if (req.header('x-edge-secret') !== edgeSecret) return res.status(403).json({ error: 'Edge gateway required' });
  next();
});

const cents = (value: string | number | undefined) => Math.round(Number(value || 0) * 100);
const envCents = (name: string, fallback: number) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
};

const config = {
  bankroll: envCents('BANKROLL_CENTS', 200000),
  maxDailySpend: envCents('MAX_DAILY_SPEND_CENTS', 50000),
  maxTotalLoss: envCents('MAX_TOTAL_LOSS_CENTS', 200000),
  automationMode: process.env.AUTOMATION_MODE || 'approval_required',
};

const memory = { spend: 0, commission: 0, conversions: 0, clicks: 0, impressions: 0 };

async function initDb() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS events (
      id BIGSERIAL PRIMARY KEY,
      type TEXT NOT NULL,
      campaign_id TEXT,
      amount_cents INTEGER NOT NULL DEFAULT 0,
      metadata JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS events_created_at_idx ON events(created_at);
    CREATE INDEX IF NOT EXISTS events_campaign_idx ON events(campaign_id);
  `);
}

async function record(type: string, campaignId: string | undefined, amountCents: number, metadata: object = {}) {
  if (pool) {
    await pool.query('INSERT INTO events(type,campaign_id,amount_cents,metadata) VALUES($1,$2,$3,$4)', [type, campaignId || null, amountCents, metadata]);
    return;
  }
  if (type === 'spend') memory.spend += amountCents;
  if (type === 'commission') { memory.commission += amountCents; memory.conversions += 1; }
  if (type === 'click') memory.clicks += 1;
  if (type === 'impression') memory.impressions += 1;
}

async function totals() {
  if (!pool) return { ...memory };
  const { rows } = await pool.query(`
    SELECT
      COALESCE(SUM(amount_cents) FILTER (WHERE type='spend'),0)::int spend,
      COALESCE(SUM(amount_cents) FILTER (WHERE type='commission'),0)::int commission,
      COUNT(*) FILTER (WHERE type='commission')::int conversions,
      COUNT(*) FILTER (WHERE type='click')::int clicks,
      COUNT(*) FILTER (WHERE type='impression')::int impressions
    FROM events
  `);
  return rows[0];
}

function decision(t: { spend: number; commission: number; conversions: number }) {
  const profit = t.commission - t.spend;
  const roas = t.spend ? t.commission / t.spend : null;
  if (t.spend >= config.maxTotalLoss) return { action: 'PAUSE_ALL', reason: 'Total loss cap reached' };
  if (t.spend >= config.bankroll) return { action: 'PAUSE_ALL', reason: 'Bankroll ceiling reached' };
  if (profit < 0 && t.spend >= config.maxDailySpend) return { action: 'PAUSE_LOSERS', reason: 'Negative result after test budget' };
  if (t.conversions >= 3 && profit > 0 && roas !== null && roas >= 1.5) return { action: 'SCALE_CANDIDATE', reason: 'Positive profit with sufficient conversions' };
  return { action: 'HOLD', reason: 'Need more data before changing spend' };
}

app.get('/health', async (_req, res) => {
  if (!pool) return res.status(503).json({ ok: false, service: 'affiliate-engine-v1', runtime: 'railway-core', database: 'not-configured' });
  try {
    await pool.query('SELECT 1');
    return res.json({ ok: true, service: 'affiliate-engine-v1', runtime: 'railway-core', database: 'postgres' });
  } catch (error) {
    console.error(error);
    return res.status(503).json({ ok: false, service: 'affiliate-engine-v1', runtime: 'railway-core', database: 'postgres-unavailable' });
  }
});

app.get('/api/config', (_req, res) => res.json({ bankrollCents: config.bankroll, maxDailySpendCents: config.maxDailySpend, maxTotalLossCents: config.maxTotalLoss, automationMode: config.automationMode, database: pool ? 'postgres' : 'memory-fallback', moneyMovingActionsRequireApproval: true }));

app.get('/api/metrics', async (_req, res) => {
  try {
    const t = await totals();
    const profit = Number(t.commission || 0) - Number(t.spend || 0);
    res.json({ ...t, profitCents: profit, cpaCents: t.conversions ? Math.round(t.spend / t.conversions) : null, roas: t.spend ? Number((t.commission / t.spend).toFixed(2)) : null, decision: decision(t), bankrollRemainingCents: Math.max(0, config.bankroll - t.spend) });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Failed to calculate metrics' }); }
});

app.post('/api/events', async (req, res) => {
  const { type, campaignId, amount, metadata } = req.body || {};
  if (!['spend', 'commission', 'click', 'impression'].includes(type)) return res.status(400).json({ error: 'Invalid event type' });
  const amountCents = type === 'click' || type === 'impression' ? 0 : cents(amount);
  if (!Number.isFinite(amountCents) || amountCents < 0) return res.status(400).json({ error: 'Invalid amount' });
  try { await record(type, campaignId, amountCents, metadata || {}); res.status(201).json(await totals()); }
  catch (error) { console.error(error); res.status(500).json({ error: 'Failed to record event' }); }
});

app.get('/', (_req, res) => res.json({ service: 'affiliate-engine-v1', role: 'railway-core', edge: 'Cloudflare Workers' }));

initDb().then(() => app.listen(port, () => console.log(`Affiliate Engine Railway core listening on ${port}`))).catch((error) => { console.error(error); process.exit(1); });
