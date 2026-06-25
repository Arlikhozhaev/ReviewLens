# ReviewLens

**Turn customer reviews into product decisions — in seconds.**

ReviewLens accepts a CSV of product reviews, runs them through an AI pipeline (embeddings → clustering → summarization), and produces a structured insight report: top complaints, top praises, sentiment breakdown, and an executive summary. Every report gets a permanent shareable link with no login required to view it.

- **Next.js 14** (App Router)
- **PostgreSQL** + **Prisma**
- **Auth.js** (magic link via Resend)
- **OpenAI** — embeddings + GPT-4o-mini
- **Inngest** — background pipeline (optional)
- **Upstash Redis** — distributed rate limits (optional)
- **Sentry** — error monitoring (optional)
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

## Getting started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)
- An [OpenAI](https://platform.openai.com) API key with a positive credit balance

### Setup

```bash
git clone https://github.com/Arlikhozhaev/ReviewLens.git
cd reviewlens
npm install
cp .env.example .env.local
```

Push the database schema:

```bash
npx prisma migrate dev --name init
```

Start the dev server:

```bash
cp .env.example .env.local
# Required: DATABASE_URL, DIRECT_URL, OPENAI_API_KEY, AUTH_SECRET
# Optional: RESEND_API_KEY, UPSTASH_*, INNGEST_*, SENTRY_*

npm install
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Open [localhost:3000](http://localhost:3000).

### Dev sign-in (no Resend)

Without `RESEND_API_KEY`, magic links print to the **terminal** when you submit the login form.

## Production services

| Service | Purpose | Required? |
|---------|---------|-------------|
| **Resend** | Magic link emails | Production |
| **Upstash Redis** | Rate limits across instances | Production |
| **Inngest** | Reliable background pipeline | Production |
| **Sentry** | Error monitoring | Recommended |

### Inngest local dev

```bash
npx inngest-cli dev
```

Point Inngest at `http://localhost:3000/api/inngest`.

Without Inngest, the pipeline falls back to Vercel `waitUntil`.

## Auth & tenancy

- Sign in at `/login` with email magic link
- `/analyze` and `/sessions` require authentication
- Analyses are linked to `User.id` in the database
- Dashboard share links (`/dashboard/[slug]`) remain public for viewers
### Environment variables

See `.env.example` for placeholder formats. Key variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase pooled connection string (Transaction mode, port 6543) |
| `DIRECT_URL` | Supabase direct connection string (Session mode, port 5432) — required for migrations |
| `OPENAI_API_KEY` | OpenAI secret key (`sk-proj-...`) |
| `AUTH_SECRET` | Session signing secret (32+ chars) — required in production |
| `AUTH_URL` | App URL (`http://localhost:3000` in dev) |
| `NEXT_PUBLIC_APP_URL` | Public URL of the deployment |
| `RESEND_API_KEY` | Magic link emails (production) |
| `UPSTASH_REDIS_*` | Distributed rate limits (production) |
| `INNGEST_*` | Background job queue (production) |
| `INNGEST_DEV=1` | **Local only** — use with `npx inngest-cli dev` |
| `SENTRY_DSN` | Error monitoring (optional) |

---

## Auth & tenancy

- Sign in at `/login` with email magic link
- `/analyze` and `/sessions` require authentication
- Analyses are linked to `User.id` in the database
- Dashboard share links (`/dashboard/[slug]`) remain public for viewers

---

## Production services

| Service | Purpose | Required? |
|---------|---------|-------------|
| **Resend** | Magic link emails | Production |
| **Upstash Redis** | Rate limits across instances | Production |
| **Inngest** | Reliable background pipeline | Production |
| **Sentry** | Error monitoring | Recommended |

### Inngest local dev

```bash
npx inngest-cli dev -u http://localhost:3000/api/inngest
```

Set `INNGEST_DEV=1` in `.env.local`. Without Inngest, the pipeline falls back to Vercel `waitUntil`.

---

## API

| Route | Auth | Description |
|-------|------|-------------|
| `POST /api/analysis` | Required | Create session + reviews |
| `GET /api/sessions` | Required | List user's analyses |
| `POST /api/analysis/[slug]/process` | Public | Start pipeline |
| `GET /api/analysis/[slug]/status` | Public | Poll status |
| `GET /api/health` | Public | DB + service flags |
| `POST /api/inngest` | Inngest | Job worker webhook |

---

## Project structure

```
reviewlens/
├── app/
│   ├── api/analysis/          # Route handlers: create session, trigger pipeline, poll status
│   ├── api/auth/              # Auth.js magic link
│   ├── api/inngest/           # Inngest worker webhook
│   ├── analyze/               # Upload page (auth required)
│   ├── dashboard/[id]/        # Analysis results (public share links)
│   ├── login/                 # Magic link sign-in
│   └── sessions/              # Analysis history (auth required)
├── features/
│   ├── upload/                # CSV parsing, column detection, drop zone
│   ├── analysis/              # AI pipeline: embeddings, clustering, summarization
│   └── dashboard/             # Charts and theme components
├── inngest/                   # Background job functions
├── lib/
│   ├── validations/           # Zod schemas for all API inputs
│   ├── env.ts                 # Validated env — throws at startup if misconfigured
│   ├── logger.ts              # Structured JSON logging
│   ├── rate-limit.ts          # Upstash + in-memory fallback
│   └── jobs/pipeline-trigger.ts
├── middleware.ts              # Auth + request IDs
└── prisma/schema.prisma
```

---

| Route | Auth | Description |
|-------|------|-------------|
| `POST /api/analysis` | Required | Create session + reviews |
| `GET /api/sessions` | Required | List user's analyses |
| `POST /api/analysis/[slug]/process` | Public | Start pipeline |
| `GET /api/analysis/[slug]/status` | Public | Poll status |
| `GET /api/health` | Public | DB + service flags |
| `POST /api/inngest` | Inngest | Job worker webhook |
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
npm run dev
npm run build
npm run type-check
npm run lint
```

## Logs

Structured JSON logs include `requestId`, `sessionId`, `userId`, pipeline `stage`, and OpenAI `totalTokens`.
npm run dev          # Start development server
npm run build        # Production build
npm run type-check   # tsc --noEmit
npm run lint         # ESLint
npm run format       # Prettier
```

---

## Logs

Structured JSON logs include `requestId`, `sessionId`, `userId`, pipeline `stage`, and OpenAI `totalTokens`.

---

## Deployment

The app deploys to Vercel. Add all environment variables from `.env.example` to Vercel (except `INNGEST_DEV`).

1. Push to GitHub and merge to `main`
2. Import the repo in Vercel (or connect existing project)
3. Add environment variables for Production
4. Run `npx prisma migrate deploy` against your production database
5. Redeploy

Connection pooling is handled by Supabase's pgbouncer. The `?pgbouncer=true` flag on `DATABASE_URL` is required — Prisma uses the `DIRECT_URL` for migrations only.

---

## License

MIT
