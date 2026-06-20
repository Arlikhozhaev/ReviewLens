# ReviewLens

**Turn customer reviews into product decisions — in seconds.**

ReviewLens accepts a CSV of product reviews, runs them through an AI pipeline (embeddings → clustering → summarization), and produces a structured insight report: top complaints, top praises, sentiment breakdown, and an executive summary. Every report gets a permanent shareable link with no login required to view it.

[Live demo](https://review-lens-ten.vercel.app/) · [Report an issue](mailto:arlikhozhaevca@gmail.com)

---

## What it does

1. **Upload** — Drop a CSV of reviews. Column names are detected automatically (`review`, `rating`, `author`, `date` in any format).
2. **Embed** — Each review is converted into a 1536-dimensional vector using OpenAI's `text-embedding-3-small`.
3. **Cluster** — k-means groups semantically similar reviews together. Reviews describing the same problem in different words end up in the same cluster.
4. **Summarize** — `gpt-4o-mini` reads each cluster and writes a theme label, description, and sentiment tag. One final call produces the executive summary.
5. **Report** — A dashboard shows sentiment breakdown, theme distribution chart, complaint and praise cards with example quotes, and a shareable URL.

Analyzing 50 reviews takes under 10 seconds end to end.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router (RSC + Server Actions) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + shadcn/ui (Nova preset) |
| Charts | Recharts |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 6 |
| AI | OpenAI `text-embedding-3-small` + `gpt-4o-mini` |
| Validation | Zod |
| Deployment | Vercel |

---

## Getting started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)
- An [OpenAI](https://platform.openai.com) API key with a positive credit balance

### Setup

```bash
git clone https://github.com/your-username/reviewlens.git
cd reviewlens
npm install
```

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

Push the database schema:

```bash
npx prisma migrate dev --name init
```

Start the dev server:

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase pooled connection string (Transaction mode, port 6543) |
| `DIRECT_URL` | Supabase direct connection string (Session mode, port 5432) — required for migrations |
| `OPENAI_API_KEY` | OpenAI secret key (`sk-proj-...`) |
| `NEXT_PUBLIC_APP_URL` | Public URL of the deployment (`http://localhost:3000` in dev) |

See `.env.example` for the exact format.

---

## Project structure

```
reviewlens/
├── app/
│   ├── api/analysis/          # Route handlers: create session, trigger pipeline, poll status
│   ├── analyze/               # Upload page
│   ├── dashboard/[id]/        # Analysis results (server-rendered, no loading flicker)
│   └── sessions/              # Analysis history with optimistic delete
├── features/
│   ├── upload/                # CSV parsing, column detection, drop zone
│   ├── analysis/              # AI pipeline: embeddings, clustering, summarization
│   └── dashboard/             # Charts and theme components
├── lib/
│   ├── validations/           # Zod schemas for all API inputs
│   ├── env.ts                 # Validated env — throws at startup if misconfigured
│   ├── prisma.ts              # Singleton client
│   └── api.ts                 # Typed fetch wrapper (ApiResponse<T> discriminated union)
├── types/index.ts             # Global TypeScript types
└── prisma/schema.prisma
```

---

## AI pipeline

```
Reviews (DB)
    │
    ▼
Embeddings         text-embedding-3-small · batches of 100 · retry on 429
    │
    ▼
k-means clustering k = max(2, min(8, round(n / 15))) · k-means++ init
    │
    ▼
Theme summarization gpt-4o-mini · one call per cluster (parallel) · JSON mode
    │
    ▼
Executive summary  gpt-4o-mini · one call across all themes
    │
    ▼
Persist            AnalysisResult (JSON columns) · AnalysisSession → COMPLETED
```

The pipeline is triggered from the dashboard via `POST /api/analysis/[slug]/process`. The route atomically claims the session using `updateMany WHERE status = PENDING` before starting — preventing duplicate runs from React Strict Mode's double-invocation or concurrent requests.

---

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run type-check   # tsc --noEmit
npm run lint         # ESLint
npm run format       # Prettier
```

---

## Deployment

The app deploys to Vercel without configuration beyond environment variables.

1. Push to GitHub
2. Import the repo in Vercel
3. Add the four environment variables from the table above
4. Deploy

Connection pooling is handled by Supabase's pgbouncer. The `?pgbouncer=true` flag on `DATABASE_URL` is required — Prisma uses the `DIRECT_URL` for migrations only.

---

## License

MIT
