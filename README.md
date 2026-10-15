# Narrative Reports

Narrative Reports turns advertising campaign metrics into a plain-English monthly report. It accepts CSV data, calculates account and campaign metrics, highlights data-derived wins and recommendations, and produces a white-labeled PDF.

## Current status

This is an early local prototype. It uses in-memory storage that resets when the server restarts. Sample companies, campaign names, and metrics are fictional. No advertising platform is connected, and report delivery is a console log only. Do not enter real client data or rely on the scheduled delivery path in production.

## How it works

1. Create a client and add CSV campaign data.
2. The CSV parser checks for `campaign`, `spend`, `impressions`, `clicks`, and `conversions` columns. Column order is flexible; blank lines are skipped and invalid rows are reported.
3. The narrative engine totals spend, impressions, clicks, and conversions, then derives click-through rate, average cost per click, and cost per conversion.
4. It selects campaign highlights from the uploaded values. It does not add external benchmarks.
5. The PDF generator applies the client's agency name and color to the report.
6. The monthly cron route can generate reports for clients marked monthly. Email delivery is stubbed and only writes to the server log.

The app is built with Next.js, React, TypeScript, and PDFKit. Its main pieces are:

- `src/lib/csv.ts`: CSV parsing and validation
- `src/lib/narrative.ts`: calculations and narrative generation
- `src/lib/pdf.ts`: white-labeled PDF rendering
- `src/lib/store.ts`: in-memory sample client store
- `src/app/api/`: client management, uploads, report generation, and monthly cron routes
- `public/sample-campaign-data.csv`: fictional sample input

## Run locally

Requirements: Node.js and npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000. Use the sample data, upload a CSV, or paste CSV content. The sample CSV is also available at `/sample-campaign-data.csv`.

Build and serve a production-mode local instance with:

```bash
npm run build
npm start
```

## API overview

- `GET/POST /api/clients`: list clients or create one
- `GET/PUT/DELETE /api/clients/[id]`: read, update, or delete a client
- `POST /api/clients/[id]/upload`: replace a client's campaign rows from CSV
- `POST /api/clients/[id]/sample`: load the sample dataset
- `GET /api/clients/[id]/narrative`: return a JSON narrative preview
- `GET /api/clients/[id]/report`: download a generated PDF
- `GET /api/cron/monthly-reports`: generate reports for monthly clients and log the delivery stub

The cron route checks the `CRON_SECRET` bearer token when that variable is set. Configure a secret before exposing the route on a network.

## Before using real client data

A production service would need authenticated users, client-level data isolation, persistent storage, input-size limits, secure scheduling, and an actual delivery provider. The current prototype does not provide these protections or integrations.

## License

No license file is currently included. If the repository is made public without a license, visitors can read it but do not have explicit permission to reuse, modify, or redistribute it. Add a license before presenting the project as open source.
