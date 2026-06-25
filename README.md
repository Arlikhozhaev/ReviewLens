# ReviewLens

Turn customer review CSVs into actionable product insights — themes, sentiment, and an executive summary — in under a minute.

## Stack

- **Next.js 14** (App Router)
- **PostgreSQL** via **Prisma** (Supabase-compatible pooling)
- **OpenAI** — `text-embedding-3-small` + `gpt-4o-mini`
- **Tailwind CSS** + shadcn/ui

## Quick start

```bash
cp .env.example .env.local
# Set DATABASE_URL, DIRECT_URL, OPENAI_API_KEY, NEXT_PUBLIC_APP_URL

npm install
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How it works

1. **Upload** — CSV with a `review` column (optional: `rating`, `author`, `date`). Max 500 reviews / 10 MB.
2. **Pipeline** — embeddings → k-means clustering → per-theme GPT summaries → executive summary.
3. **Dashboard** — shareable report at `/dashboard/[slug]`.

Typical processing time: **15–45 seconds** for 100–500 reviews (depends on OpenAI latency).

## API

| Route | Description |
|-------|-------------|
| `POST /api/analysis` | Create session + bulk insert reviews |
| `POST /api/analysis/[slug]/process` | Start pipeline (atomic claim) |
| `GET /api/analysis/[slug]/status` | Poll status + result |
| `GET /api/sessions?slugs=…` | List sessions by shareable slug (browser history) |
| `GET /api/health` | DB connectivity check |

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run type-check   # TypeScript
npm run lint         # ESLint
```

## Production notes

- Pipeline uses `@vercel/functions` `waitUntil` so analysis completes after the HTTP response on Vercel.
- Rate limits: 20 uploads / hour / IP, 30 pipeline starts / hour / IP (in-memory; use Redis for strict multi-instance limits).
- Sessions page shows analyses **tracked in this browser** only — share links work globally without login.
- Stuck `PROCESSING` sessions auto-recover after 10 minutes.

## Environment

See `.env.example` for required variables.
