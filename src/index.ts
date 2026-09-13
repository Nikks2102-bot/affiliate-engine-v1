interface Env {
  BACKEND_URL?: string;
  EDGE_SHARED_SECRET?: string;
}

const dashboard = `<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Affiliate Engine V2</title>
<style>body{font-family:system-ui;max-width:980px;margin:32px auto;padding:0 18px;background:#fafafa}.hero{padding:24px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}.card{background:#fff;border:1px solid #ddd;border-radius:14px;padding:16px}.value{font-size:25px;font-weight:750;margin-top:5px}button{padding:10px 14px;border-radius:9px;border:1px solid #aaa;background:#fff;cursor:pointer}pre{background:#111;color:#eee;padding:16px;border-radius:12px;overflow:auto}</style></head>
<body><div class="hero"><h1>Affiliate Engine V2</h1><p>Cloudflare edge + Railway core + PostgreSQL. Controlled testing only — money-moving actions require approval.</p></div>
<div class="grid" id="cards"></div><p><button onclick="load()">Refresh</button></p><pre id="decision">Loading…</pre>
<script>async function load(){try{const r=await fetch('/api/metrics');const m=await r.json();if(!r.ok)throw new Error(m.error||'API error');const labels=[['Spend',m.spend],['Commission',m.commission],['Profit',m.profitCents],['Conversions',m.conversions],['CPA',m.cpaCents??'-'],['ROAS',m.roas??'-']];document.getElementById('cards').innerHTML=labels.map(x=>'<div class="card"><div>'+x[0]+'</div><div class="value">'+x[1]+'</div></div>').join('');document.getElementById('decision').textContent=JSON.stringify(m.decision,null,2)}catch(e){document.getElementById('decision').textContent='Backend not connected yet: '+e.message}}load();</script></body></html>`;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/') return new Response(dashboard, { headers: { 'content-type': 'text/html; charset=UTF-8' } });

    if (!env.BACKEND_URL) {
      return new Response(JSON.stringify({ ok: false, error: 'BACKEND_URL is not configured' }), { status: 503, headers: { 'content-type': 'application/json' } });
    }

    const backend = new URL(url.pathname + url.search, env.BACKEND_URL.replace(/\/$/, '') + '/');
    const headers = new Headers(request.headers);
    if (env.EDGE_SHARED_SECRET) headers.set('x-edge-secret', env.EDGE_SHARED_SECRET);
    headers.delete('host');

    const proxied = new Request(backend.toString(), { method: request.method, headers, body: ['GET','HEAD'].includes(request.method) ? undefined : request.body, redirect: 'follow' });
    return fetch(proxied);
  }
};
