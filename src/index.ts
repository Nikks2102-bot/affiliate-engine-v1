interface Env {
  DB: D1Database;
  BANKROLL_CENTS?: string;
  MAX_DAILY_SPEND_CENTS?: string;
  MAX_TOTAL_LOSS_CENTS?: string;
  AUTOMATION_MODE?: string;
  ADMIN_SECRET?: string;
  META_ENABLED?: string;
  META_ACCESS_TOKEN?: string;
  META_AD_ACCOUNT_ID?: string;
  META_API_VERSION?: string;
  META_PAGE_ID?: string;
  META_PIXEL_ID?: string;
}

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=UTF-8' } });

const config = (env: Env) => ({
  bankroll: Number(env.BANKROLL_CENTS || 200000),
  maxDailySpend: Number(env.MAX_DAILY_SPEND_CENTS || 50000),
  maxTotalLoss: Number(env.MAX_TOTAL_LOSS_CENTS || 200000),
  automationMode: env.AUTOMATION_MODE || 'approval_required',
  metaEnabled: env.META_ENABLED === 'true'
});

const dashboard = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Affiliate Engine</title><style>body{font-family:system-ui;max-width:1000px;margin:30px auto;padding:0 18px;background:#f7f7f7}.hero{padding:18px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:12px}.card{background:#fff;border:1px solid #ddd;border-radius:14px;padding:16px}.value{font-size:24px;font-weight:750;margin-top:5px}button{padding:10px 14px;border-radius:9px;border:1px solid #aaa;background:#fff}pre{background:#111;color:#eee;padding:16px;border-radius:12px;overflow:auto}</style></head><body><div class="hero"><h1>Affiliate Engine V1</h1><p>Cloudflare Worker + D1. Controlled affiliate testing with hard bankroll limits.</p></div><div class="grid" id="cards"></div><p><button onclick="load()">Refresh</button></p><pre id="decision">Loading...</pre><script>async function load(){try{const r=await fetch('/api/metrics');const m=await r.json();if(!r.ok)throw Error(m.error||'API error');const labels=[['Spend',m.spend],['Commission',m.commission],['Profit',m.profitCents],['Conversions',m.conversions],['Clicks',m.clicks],['CPA',m.cpaCents??'-'],['ROAS',m.roas??'-']];document.getElementById('cards').innerHTML=labels.map(x=>'<div class="card"><div>'+x[0]+'</div><div class="value">'+x[1]+'</div></div>').join('');document.getElementById('decision').textContent=JSON.stringify(m.decision,null,2)}catch(e){document.getElementById('decision').textContent=e.message}}load();</script></body></html>`;

async function ensureSchema(env: Env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, campaign_id TEXT, amount_cents INTEGER NOT NULL DEFAULT 0, metadata TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS events_created_at_idx ON events(created_at)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS events_campaign_idx ON events(campaign_id)`).run();
}

async function totals(env: Env) {
  await ensureSchema(env);
  const r = await env.DB.prepare(`SELECT COALESCE(SUM(CASE WHEN type='spend' THEN amount_cents ELSE 0 END),0) spend, COALESCE(SUM(CASE WHEN type='commission' THEN amount_cents ELSE 0 END),0) commission, SUM(CASE WHEN type='commission' THEN 1 ELSE 0 END) conversions, SUM(CASE WHEN type='click' THEN 1 ELSE 0 END) clicks, SUM(CASE WHEN type='impression' THEN 1 ELSE 0 END) impressions FROM events`).first<Record<string, number>>();
  return { spend: Number(r?.spend || 0), commission: Number(r?.commission || 0), conversions: Number(r?.conversions || 0), clicks: Number(r?.clicks || 0), impressions: Number(r?.impressions || 0) };
}

function decision(t: {spend:number; commission:number; conversions:number}, c: ReturnType<typeof config>) {
  const profit = t.commission - t.spend;
  const roas = t.spend ? t.commission / t.spend : null;
  if (t.spend >= c.maxTotalLoss) return { action:'PAUSE_ALL', reason:'Total loss cap reached' };
  if (t.spend >= c.bankroll) return { action:'PAUSE_ALL', reason:'Bankroll ceiling reached' };
  if (profit < 0 && t.spend >= c.maxDailySpend) return { action:'PAUSE_LOSERS', reason:'Negative result after test budget' };
  if (t.conversions >= 3 && profit > 0 && roas !== null && roas >= 1.5) return { action:'SCALE_CANDIDATE', reason:'Positive profit with sufficient conversions' };
  return { action:'HOLD', reason:'Need more data before changing spend' };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/') return new Response(dashboard, {headers:{'content-type':'text/html; charset=UTF-8'}});
    if (url.pathname === '/health') {
      try { await ensureSchema(env); return json({ok:true,service:'affiliate-engine-v1',runtime:'cloudflare-worker',database:'d1'}); }
      catch { return json({ok:false,service:'affiliate-engine-v1',runtime:'cloudflare-worker',database:'d1-unavailable'},503); }
    }
    if (url.pathname === '/api/config' && request.method === 'GET') return json({...config(env), moneyMovingActionsRequireApproval:true, database:'d1'});
    if (url.pathname === '/api/metrics' && request.method === 'GET') {
      try { const t=await totals(env); const profit=t.commission-t.spend; return json({...t,profitCents:profit,cpaCents:t.conversions?Math.round(t.spend/t.conversions):null,roas:t.spend?Number((t.commission/t.spend).toFixed(2)):null,decision:decision(t,config(env)),bankrollRemainingCents:Math.max(0,config(env).bankroll-t.spend)}); }
      catch { return json({error:'Failed to calculate metrics'},500); }
    }
    if (url.pathname === '/api/events' && request.method === 'POST') {
      const secret=env.ADMIN_SECRET;
      if (secret && request.headers.get('x-admin-secret') !== secret) return json({error:'Unauthorized'},401);
      const body=await request.json().catch(()=>null) as {type?:string;campaignId?:string;amount?:number;metadata?:object}|null;
      if (!body || !['spend','commission','click','impression'].includes(body.type || '')) return json({error:'Invalid event type'},400);
      const type=body.type!; const amountCents=(type==='click'||type==='impression')?0:Math.round(Number(body.amount||0)*100);
      if (!Number.isFinite(amountCents)||amountCents<0) return json({error:'Invalid amount'},400);
      await ensureSchema(env);
      await env.DB.prepare('INSERT INTO events(type,campaign_id,amount_cents,metadata) VALUES(?,?,?,?)').bind(type,body.campaignId||null,amountCents,JSON.stringify(body.metadata||{})).run();
      return json(await totals(env),201);
    }
    return json({error:'Not found'},404);
  }
};