# ReviewLens

**Turn customer reviews into product decisions — in seconds.**

ReviewLens accepts a CSV of product reviews, runs them through an AI pipeline (embeddings → clustering → summarization), and produces a structured insight report: top complaints, top praises, sentiment breakdown, and an executive summary. Every report gets a shareable link.

[Live demo](https://review-lens-app.vercel.app/) · [Report an issue](mailto:arlikhozhaevca@gmail.com)

---

## What it does

1. **Upload** — Drop a CSV of reviews. Column names are detected automatically (`review`, `rating`, `author`, `date` in any format).
2. **Embed** — Each review is converted into a 1536-dimensional vector using OpenAI's `text-embedding-3-small`.
3. **Cluster** — k-means groups semantically similar reviews together.
4. **Summarize** — `gpt-4o-mini` writes a theme label, description, and sentiment per cluster, plus one executive summary.
5. **Report** — A dashboard shows sentiment breakdown, theme distribution, complaint/praise cards, export options, and a shareable URL.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router (RSC + Server Actions) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 6 |
| Auth | Auth.js (magic link via Resend, JWT sessions) |
| AI | OpenAI `text-embedding-3-small` + `gpt-4o-mini` |
| Jobs | Inngest (optional — `waitUntil` fallback) |
| Rate limits | Upstash Redis (optional — in-memory fallback) |
| Monitoring | Sentry (optional) |
| Export | jsPDF (PDF) + native CSV |
| Testing | Vitest (unit) + Playwright (e2e) |

---

## Getting started

```bash
git clone https://github.com/Arlikhozhaev/ReviewLens.git
cd reviewlens
npm install
cp .env.example .env.local
# Required: DATABASE_URL, DIRECT_URL, OPENAI_API_KEY, AUTH_SECRET
# Optional: RESEND_API_KEY, UPSTASH_*, INNGEST_*, SENTRY_*

npx prisma migrate deploy
npx prisma generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Dev sign-in (no Resend)

Without `RESEND_API_KEY`, magic links print to the **terminal** when you submit the login form.

### Environment variables

See `.env.example` for placeholder formats. Key variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase pooled connection string (port 6543) |
| `DIRECT_URL` | Supabase direct connection string (port 5432) — for migrations |
| `OPENAI_API_KEY` | OpenAI secret key (`sk-...`) |
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

- Sign in at `/login` with an email magic link (JWT sessions, edge-safe middleware)
- `/analyze` and `/sessions` require authentication
- Analyses are linked to `User.id`
- Dashboard share links (`/dashboard/[slug]`) are viewable by anyone with the link, subject to optional share protection (below)

## Exporting reports

The dashboard's **Export** menu produces stakeholder-ready outputs:

- **PDF** — branded report (summary, sentiment, themes table), generated client-side via `jspdf` (lazy-loaded, kept out of the main bundle)
- **Summary CSV** — themes + sentiment + executive summary, built client-side
- **Raw reviews CSV** — streamed from `GET /api/analysis/[slug]/export`, gated by the same share access rules as the dashboard

## Share protection

Owners can secure a shared report from the **Share** dialog:

- **Password** — scrypt-hashed; viewers unlock via a form that sets an HMAC-signed, httpOnly access cookie (12h)
- **Expiry** — 1 / 7 / 30 days or never; expired links show a friendly notice
- The owner (analysis creator) always bypasses both gates

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
| `GET /api/analysis/[slug]/export` | Share-gated | Download raw reviews CSV |
| `GET /api/health` | Public | DB + service flags |
| `POST /api/inngest` | Inngest | Job worker webhook |

---

## Testing

```bash
npm test          # Vitest unit tests (CSV detection, validation, share crypto)
npm run test:watch
npm run test:e2e  # Playwright golden path + auth gating
```

**Unit tests** (`*.test.ts`) are pure and CI-safe — no DB or network.

**E2E tests** (`e2e/`) run against a local dev server:

```bash
npx playwright install   # first run only — downloads browsers
npm run test:e2e
```

- `auth.setup.ts` mints a signed session cookie so authed specs skip the email flow
- `golden-path.spec.ts` drives upload → preview → submit (create API mocked)
- `auth-redirect.spec.ts` verifies middleware gating (no DB needed)

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

The pipeline is triggered via `POST /api/analysis/[slug]/process`, which atomically claims the session using `updateMany WHERE status = PENDING` to prevent duplicate runs.

---

## Scripts

```bash
npm run dev          # Start development server
npm run build        # prisma generate + production build
npm run type-check   # tsc --noEmit
npm run lint         # ESLint
npm run format       # Prettier
npm test             # Vitest
npm run test:e2e     # Playwright
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
