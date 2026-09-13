# Affiliate Engine V1

A controlled affiliate-marketing engine for small-budget experiments. V1 focuses on measurement, UTM/event tracking and hard spending guardrails. **It does not autonomously move money or scale campaigns without approval.**

## Current V1

- PostgreSQL event store when `DATABASE_URL` is configured.
- Metrics: spend, commission, conversions, clicks, impressions, profit, CPA and ROAS.
- Hard bankroll ceiling: default ₹2,000.
- Default test-spend ceiling: ₹500.
- Automatic decision suggestions: HOLD, PAUSE_LOSERS, PAUSE_ALL or SCALE_CANDIDATE.
- Simple browser dashboard at `/`.
- API endpoint for recording conversion/ad events.
- Environment-based secrets; never commit tokens.

## Run

```bash
npm install
npm run dev
```

For production:

```bash
npm run build
npm start
```

Set `DATABASE_URL` to a PostgreSQL connection string for persistent metrics. Without it, the server uses temporary in-memory metrics.

## Event API

`POST /api/events`

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
