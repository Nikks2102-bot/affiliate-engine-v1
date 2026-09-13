# Affiliate Engine V1

Controlled affiliate-marketing engine for small-budget experiments. V1 measures traffic and commissions and enforces hard spending guardrails. **Money-moving actions remain approval-gated.**

## Runtime

The production architecture is **Cloudflare edge gateway → Railway core → Railway PostgreSQL**.

- Cloudflare Worker entrypoint: `src/index.ts`
- Railway core entrypoint: `src/railway.ts`
- Wrangler config: `wrangler.jsonc`
- PostgreSQL schema/bootstrap: `schema.sql`

The Railway core uses the private Railway PostgreSQL network connection. The internal Railway connection is configured without SSL because this PostgreSQL endpoint does not accept SSL. The Cloudflare edge is intended to be the public gateway, while the Railway API is protected with `EDGE_SHARED_SECRET` except for `/health`.

## Current V1

- Metrics: spend, commission, conversions, clicks, impressions, profit, CPA and ROAS.
- Hard bankroll ceiling: default ₹2,000.
- Default test-spend ceiling: ₹500.
- Decision suggestions: HOLD, PAUSE_LOSERS, PAUSE_ALL or SCALE_CANDIDATE.
- Browser dashboard at `/`.
- Event API for ad/conversion tracking.
- PostgreSQL persistence on Railway.
- Money-moving actions remain approval-gated.

## Railway deployment

Build command:

```bash
npm run build:railway
```

Start command:

```bash
npm run start:railway
```

Healthcheck:

```text
/health
```

Required Railway variables:

- `DATABASE_URL` — PostgreSQL connection string using Railway private networking.
- `EDGE_SHARED_SECRET` — secret shared only with the Cloudflare edge.
- `BANKROLL_CENTS=200000`
- `MAX_DAILY_SPEND_CENTS=50000`
- `MAX_TOTAL_LOSS_CENTS=200000`
- `AUTOMATION_MODE=approval_required`

## Cloudflare edge

The Worker forwards protected API traffic to the Railway core and supplies the shared edge secret. Keep `EDGE_SHARED_SECRET` out of GitHub and client-side code.

## API

### `GET /health`

Performs a PostgreSQL connectivity check on Railway and returns HTTP 200 only when the core can reach its configured database.

### `GET /api/config`

Returns guardrail configuration and database mode. Protected by the edge secret when configured.

### `GET /api/metrics`

Returns spend, commission, conversions, clicks, impressions, profit, CPA, ROAS, bankroll remaining and the current rule-engine decision.

### `POST /api/events`

Example:

```json
{
  "type": "commission",
  "campaignId": "test-001",
  "amount": 25,
  "metadata": { "orderId": "example", "source": "meta" }
}
```

Allowed event types: `spend`, `commission`, `click`, `impression`.

## Safety model

The engine treats the ₹2,000 bankroll as a hard ceiling. It never commits credentials to source code and does not autonomously create or scale paid campaigns without approval. Meta API integration should only be enabled after the affiliate offer, landing page, tracking and account permissions are verified.

## Important affiliate rule

For Fiverr paid traffic, paid traffic should first land on an affiliate-owned website/landing page rather than linking paid ads directly to Fiverr, and all affiliate-program and Meta advertising rules must be followed.
