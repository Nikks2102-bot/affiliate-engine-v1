import 'dotenv/config';
import express from 'express';
import { Pool } from 'pg';

const app = express();
app.use(express.json());

const port = Number(process.env.PORT || 3000);
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }) : null;

const cents = (v: string | number | undefined) => Math.round(Number(v || 0) * 100);
const envCents = (name: string, fallback: number) => Number(process.env[name] || fallback);

const config = {
  bankroll: envCents('BANKROLL_CENTS', 200000),
  maxDailySpend: envCents('MAX_DAILY_SPEND_CENTS', 50000),
  maxTotalLoss: envCents('MAX_TOTAL_LOSS_CENTS', 200000),
};

let memory = {
  spend: 0,
  commission: 0,
  conversions: 0,
  clicks: 0,
  impressions: 0,
};

async function initDb() {
  if (!pool) return;
  await pool.query(`
    create table if not exists events (
      id bigserial primary key,
      type text not null,
      campaign_id text,
      amount_cents integer not null default 0,
      metadata jsonb not null default '{}',
      created_at timestamptz not null default now()
    );
    create index if not exists events_created_at_idx on events(created_at);
    create index if not exists events_campaign_idx on events(campaign_id);
  `);
}

async function record(type: string, campaignId: string | undefined, amountCents: number, metadata: object = {}) {
  if (pool) {
    await pool.query('insert into events(type,campaign_id,amount_cents,metadata) values($1,$2,$3,$4)', [type, campaignId || null, amountCents, metadata]);
  }
  if (type === 'spend') memory.spend += amountCents;
  if (type === 'commission') { memory.commission += amountCents; memory.conversions += 1; }
  if (type === 'click') memory.clicks += 1;
  if (type === 'impression') memory.impressions += 1;
}

async function totals() {
  if (!pool) return memory;
  const r = await pool.query(`select
    coalesce(sum(amount_cents) filter (where type='spend'),0)::int spend,
    coalesce(sum(amount_cents) filter (where type='commission'),0)::int commission,
    count(*) filter (where type='commission')::int conversions,
    count(*) filter (where type='click')::int clicks,
    count(*) filter (where type='impression')::int impressions
    from events`);
  return r.rows[0];
}

function decision(t: any) {
  const spend = Number(t.spend || 0);
  const commission = Number(t.commission || 0);
  const conversions = Number(t.conversions || 0);
  const profit = commission - spend;
  const cpa = conversions ? spend / conversions : null;
  const roas = spend ? commission / spend : null;
  const remaining = Math.max(0, config.bankroll - spend);

  if (spend >= config.maxTotalLoss) return { action: 'PAUSE_ALL', reason: 'Total loss cap reached' };
  if (spend >= config.bankroll) return { action: 'PAUSE_ALL', reason: 'Bankroll ceiling reached' };
  if (profit < 0 && spend >= config.maxDailySpend) return { action: 'PAUSE_LOSERS', reason: 'Negative result after test budget' };
  if (conversions >= 3 && profit > 0 && roas && roas >= 1.5) return { action: 'SCALE_CANDIDATE', reason: 'Positive profit with sufficient conversions' };
  return { action: 'HOLD', reason: 'Need more data before changing spend' };
}

app.get('/health', (_req, res) => res.json({ ok: true, service: 'affiliate-engine-v1' }));

app.get('/api/config', (_req, res) => res.json({
  bankrollCents: config.bankroll,
  maxDailySpendCents: config.maxDailySpend,
  maxTotalLossCents: config.maxTotalLoss,
  moneyMovingActionsRequireApproval: true,
}));

app.get('/api/metrics', async (_req, res) => {
  const t = await totals();
  const spend = Number(t.spend || 0), commission = Number(t.commission || 0), conversions = Number(t.conversions || 0);
  res.json({
    ...t,
    profitCents: commission - spend,
    cpaCents: conversions ? Math.round(spend / conversions) : null,
    roas: spend ? Number((commission / spend).toFixed(2)) : null,
    decision: decision(t),
    bankrollRemainingCents: Math.max(0, config.bankroll - spend),
  });
});

app.post('/api/events', async (req, res) => {
  const { type, campaignId, amount, metadata } = req.body || {};
  if (!['spend','commission','click','impression'].includes(type)) return res.status(400).json({ error: 'Invalid event type' });
  const amountCents = type === 'click' || type === 'impression' ? 0 : cents(amount);
  await record(type, campaignId, amountCents, metadata || {});
  res.status(201).json(await totals());
});

app.get('/', (_req, res) => {
  res.type('html').send(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Affiliate Engine V1</title><style>body{font-family:system-ui;max-width:900px;margin:40px auto;padding:0 18px}h1{margin-bottom:4px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}.card{border:1px solid #ddd;border-radius:12px;padding:16px}.value{font-size:24px;font-weight:700}button{padding:10px 14px;border-radius:8px;border:1px solid #aaa;background:white}</style></head><body><h1>Affiliate Engine V1</h1><p>Controlled affiliate testing dashboard — no autonomous money-moving actions.</p><div class="grid" id="cards"></div><p><button onclick="load()">Refresh</button></p><pre id="decision"></pre><script>async function load(){const m=await fetch('/api/metrics').then(r=>r.json());const labels=[['Spend',m.spend],['Commission',m.commission],['Profit',m.profitCents],['Conversions',m.conversions],['CPA',m.cpaCents??'-'],['ROAS',m.roas??'-']];document.getElementById('cards').innerHTML=labels.map(x=>'<div class=card><div>'+x[0]+'</div><div class=value>'+x[1]+'</div></div>').join('');document.getElementById('decision').textContent=JSON.stringify(m.decision,null,2)}load();</script></body></html>`);
});

initDb().then(() => app.listen(port, () => console.log(`Affiliate Engine V1 listening on ${port}`))).catch(err => { console.error(err); process.exit(1); });
