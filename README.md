# Affiliate Engine V1

A controlled affiliate-marketing engine for small-budget experiments. V1 focuses on measurement, UTM/event tracking and hard spending guardrails. **It does not autonomously move money or scale campaigns without approval.**

## Runtime

V1 now targets **Cloudflare Workers + D1** instead of a long-running Node server + PostgreSQL. Cloudflare officially supports Express.js on Workers with the `nodejs_compat` compatibility flag and D1 bindings.

- Cloudflare Worker entrypoint: `src/index.ts`
- Wrangler config: `wrangler.jsonc`
- D1 schema: `schema.sql`
- D1 is optional in the code: until a database is bound, the app uses temporary in-memory metrics for smoke testing.

## Current V1

- Metrics: spend, commission, conversions, clicks, impressions, profit, CPA and ROAS.
- Hard bankroll ceiling: default ₹2,000.
- Default test-spend ceiling: ₹500.
- Automatic decision suggestions: HOLD, PAUSE_LOSERS, PAUSE_ALL or SCALE_CANDIDATE.
- Simple browser dashboard at `/`.
- API endpoint for recording conversion/ad events.
- Environment-based configuration; never commit tokens.
- Money-moving actions remain approval-gated.

## Local development

```bash
npm install
npm run cf-typegen
npm run dev
```

## Cloudflare deployment

1. Create a Cloudflare Worker from the GitHub repository `Nikks2102-bot/affiliate-engine-v1`.
2. Set the Worker environment variables for the guardrails:
   - `BANKROLL_CENTS=200000`
   - `MAX_DAILY_SPEND_CENTS=50000`
   - `MAX_TOTAL_LOSS_CENTS=200000`
   - `AUTOMATION_MODE=approval_required`
3. For persistent storage, create a D1 database and bind it to the Worker as `DB`.
4. Apply `schema.sql` to the D1 database.
5. Deploy. Cloudflare will provide a `workers.dev` URL.

The app will still boot without D1, which makes the first deployment easy to smoke-test before persistence is configured.

## API

### `GET /health`

Returns a simple Worker health response.

### `GET /api/config`

Returns guardrail configuration and whether D1 is active.

### `GET /api/metrics`

Returns current spend, commission, conversions, clicks, impressions, profit, CPA, ROAS, bankroll remaining and the current rule-engine decision.

### `POST /api/events`

Example conversion event:

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

The engine treats the ₹2,000 bankroll as a hard ceiling. It never contains credentials in source code and V1 intentionally stops short of autonomous campaign creation/scaling. Meta API integration can be added after the affiliate offer, landing page, tracking and account permissions are verified.

## Important affiliate rule

For Fiverr paid traffic, traffic should first land on an affiliate-owned website/landing page rather than linking paid ads directly to Fiverr, and all affiliate-program and Meta advertising rules must be followed.
