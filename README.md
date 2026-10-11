# Narrative Reports — MVP v1

White-labeled client reporting for small agencies and PPC freelancers.
Upload campaign metrics (CSV) → auto-generated plain-English narrative →
white-labeled PDF → scheduled generation on the 1st of each month
(delivery **stubbed** in v1: console log only, no emails ever sent).

## Thesis

Small agencies / PPC freelancers bleed 5–15 hrs/month/client on reports
nobody reads; Supermetrics prices them out from $99+/mo. v1 scopes to
**DAYS**: ingest campaign data → narrative PDF → scheduled generation.

## Run locally

```bash
npm install
npm run dev   # http://localhost:3000
```

Two sample clients ship seeded (BluePeak Outfitters, Harbor & Vale Law —
fake demo data). Use "Load sample data", "Upload CSV", or paste CSV with
columns: `campaign, spend, impressions, clicks, conversions`. A sample file
is at `public/sample-campaign-data.csv`.

## API

- `GET/POST /api/clients` — list (row counts) / create `{name, agencyName, primaryColor, contactEmail}`
- `GET/PUT/DELETE /api/clients/[id]` — read / update white-label settings & schedule / delete
- `POST /api/clients/[id]/upload` — `{csv: string}` replaces campaign rows
- `POST /api/clients/[id]/sample` — load built-in sample dataset
- `GET /api/clients/[id]/narrative` — JSON preview of the generated narrative
- `GET /api/clients/[id]/report` — white-labeled PDF download
- `GET /api/cron/monthly-reports` — cron scaffold (1st of month, see vercel.json);
  generates reports for clients with `schedule: "monthly"` and **stubs** email
  delivery to the console. Honors `CRON_SECRET` (Bearer) when set.

## Narrative engine (`src/lib/narrative.ts`)

Everything is derived from the uploaded data — no invented benchmarks:
summary headline, wins (top converters, best CTR, efficient spend), and
recommendations (big spenders with zero conversions, below-average CTR,
expensive converters, efficient campaigns worth scaling).

## v1 boundaries (guardrails)

- No emails/SMS are ever sent — `sendReportEmailStub` only logs.
- No real customer data (seed data is fictional).
- No Google Ads API — CSV ingest only.
- No new accounts, purchases, or paid services.
- In-memory store: data resets on server restart.

## v2 ideas

File/DB persistence, agency logo upload in PDF, real email delivery
(Resend/SES) with approval, Google Ads API ingest, PDF preview in browser.
