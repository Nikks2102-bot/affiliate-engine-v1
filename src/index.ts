import { env } from 'cloudflare:workers';
import { httpServerHandler } from 'cloudflare:node';
import express from 'express';

type EventType = 'spend' | 'commission' | 'click' | 'impression';

type EngineEnv = {
  DB?: D1Database;
  BANKROLL_CENTS?: string;
  MAX_DAILY_SPEND_CENTS?: string;
  MAX_TOTAL_LOSS_CENTS?: string;
  AUTOMATION_MODE?: string;
};

const app = express();
app.use(express.json({ limit: '32kb' }));

const runtimeEnv = env as unknown as EngineEnv;
const envCents = (name: keyof EngineEnv, fallback: number) => {
  const value = runtimeEnv[name];
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const config = {
  bankroll: envCents('BANKROLL_CENTS', 200000),
  maxDailySpend: envCents('MAX_DAILY_SPEND_CENTS', 50000),
  maxTotalLoss: envCents('MAX_TOTAL_LOSS_CENTS', 200000),
  automationMode: runtimeEnv.AUTOMATION_MODE || 'approval_required',
};

const memory = {
  spend: 0,
  commission: 0,
  conversions: 0,
  clicks: 0,
  impressions: 0,
};

const cents = (value: string | number | undefined) => Math.round(Number(value || 0) * 100);

async function initDb() {
  if (!runtimeEnv.DB) return;
  await runtimeEnv.DB.prepare(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      campaign_id TEXT,
      amount_cents INTEGER NOT NULL DEFAULT 0,
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  await runtimeEnv.DB.prepare('CREATE INDEX IF NOT EXISTS events_created_at_idx ON events(created_at)').run();
  await runtimeEnv.DB.prepare('CREATE INDEX IF NOT EXISTS events_campaign_idx ON events(campaign_id)').run();
}

async function record(type: EventType, campaignId: string | undefined, amountCents: number, metadata: object = {}) {
  if (runtimeEnv.DB) {
    await runtimeEnv.DB.prepare(
      'INSERT INTO events(type,campaign_id,amount_cents,metadata) VALUES(?,?,?,?)',
    ).bind(type, campaignId || null, amountCents, JSON.stringify(metadata)).run();
    return;
  }

  if (type === 'spend') memory.spend += amountCents;
  if (type === 'commission') {
    memory.commission += amountCents;
    memory.conversions += 1;
  }
  if (type === 'click') memory.clicks += 1;
  if (type === 'impression') memory.impressions += 1;
}

async function totals() {
  if (!runtimeEnv.DB) return { ...memory };

  const row = await runtimeEnv.DB.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type='spend' THEN amount_cents ELSE 0 END),0) AS spend,
      COALESCE(SUM(CASE WHEN type='commission' THEN amount_cents ELSE 0 END),0) AS commission,
      COALESCE(SUM(CASE WHEN type='commission' THEN 1 ELSE 0 END),0) AS conversions,
      COALESCE(SUM(CASE WHEN type='click' THEN 1 ELSE 0 END),0) AS clicks,
      COALESCE(SUM(CASE WHEN type='impression' THEN 1 ELSE 0 END),0) AS impressions
    FROM events
  `).first<Record<string, number>>();

  return {
    spend: Number(row?.spend || 0),
    commission: Number(row?.commission || 0),
    conversions: Number(row?.conversions || 0),
    clicks: Number(row?.clicks || 0),
    impressions: Number(row?.impressions || 0),
  };
}

function decision(t: { spend: number; commission: number; conversions: number }) {
  const profit = t.commission - t.spend;
  const roas = t.spend ? t.commission / t.spend : null;

  if (t.spend >= config.maxTotalLoss) {
    return { action: 'PAUSE_ALL', reason: 'Total loss cap reached' };
  }
  if (t.spend >= config.bankroll) {
    return { action: 'PAUSE_ALL', reason: 'Bankroll ceiling reached' };
  }
  if (profit < 0 && t.spend >= config.maxDailySpend) {
    return { action: 'PAUSE_LOSERS', reason: 'Negative result after test budget' };
  }
  if (t.conversions >= 3 && profit > 0 && roas !== null && roas >= 1.5) {
    return { action: 'SCALE_CANDIDATE', reason: 'Positive profit with sufficient conversions' };
  }
  return { action: 'HOLD', reason: 'Need more data before changing spend' };
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'affiliate-engine-v1', runtime: 'cloudflare-workers' });
});

app.get('/api/config', (_req, res) => {
  res.json({
    bankrollCents: config.bankroll,
    maxDailySpendCents: config.maxDailySpend,
    maxTotalLossCents: config.maxTotalLoss,
    automationMode: config.automationMode,
    database: runtimeEnv.DB ? 'd1' : 'memory-fallback',
    moneyMovingActionsRequireApproval: true,
  });
});

app.get('/api/metrics', async (_req, res) => {
  try {
    const t = await totals();
    const profit = t.commission - t.spend;
    res.json({
      ...t,
      profitCents: profit,
      cpaCents: t.conversions ? Math.round(t.spend / t.conversions) : null,
      roas: t.spend ? Number((t.commission / t.spend).toFixed(2)) : null,
      decision: decision(t),
      bankrollRemainingCents: Math.max(0, config.bankroll - t.spend),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to calculate metrics' });
  }
});

app.post('/api/events', async (req, res) => {
  const { type, campaignId, amount, metadata } = req.body || {};
  if (!['spend', 'commission', 'click', 'impression'].includes(type)) {
    return res.status(400).json({ error: 'Invalid event type' });
  }

  const eventType = type as EventType;
  const amountCents = eventType === 'click' || eventType === 'impression' ? 0 : cents(amount);
  if (!Number.isFinite(amountCents) || amountCents < 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    await record(eventType, campaignId, amountCents, metadata || {});
    res.status(201).json(await totals());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to record event' });
  }
});

app.get('/', async (_req, res) => {
  res.type('html').send(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Affiliate Engine V1</title><style>body{font-family:system-ui;max-width:900px;margin:40px auto;padding:0 18px}h1{margin-bottom:4px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}.card{border:1px solid #ddd;border-radius:12px;padding:16px}.value{font-size:24px;font-weight:700}button{padding:10px 14px;border-radius:8px;border:1px solid #aaa;background:white}</style></head><body><h1>Affiliate Engine V1</h1><p>Cloudflare Workers dashboard — controlled affiliate testing, budget guardrails and no autonomous money-moving actions.</p><div class="grid" id="cards"></div><p><button onclick="load()">Refresh</button></p><pre id="decision"></pre><script>async function load(){const m=await fetch('/api/metrics').then(r=>r.json());const labels=[['Spend',m.spend],['Commission',m.commission],['Profit',m.profitCents],['Conversions',m.conversions],['CPA',m.cpaCents??'-'],['ROAS',m.roas??'-']];document.getElementById('cards').innerHTML=labels.map(x=>'<div class=card><div>'+x[0]+'</div><div class=value>'+x[1]+'</div></div>').join('');document.getElementById('decision').textContent=JSON.stringify(m.decision,null,2)}load();</script></body></html>`);
});

void initDb().catch((error) => console.error('D1 initialization failed', error));

app.listen(3000);
export default httpServerHandler({ port: 3000 });
