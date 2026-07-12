# ReviewLens

**Turn customer reviews into product decisions — in under 60 seconds.**

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://review-lens-app.vercel.app/)
[![CI](https://github.com/Arlikhozhaev/ReviewLens/actions/workflows/ci.yml/badge.svg)](https://github.com/Arlikhozhaev/ReviewLens/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Tests](https://img.shields.io/badge/tests-93%20unit-success)](https://github.com/Arlikhozhaev/ReviewLens/blob/main/README.md#testing--ci)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**[Live app](https://review-lens-app.vercel.app/)** · **[Try sample data](https://review-lens-app.vercel.app/analyze)** · **[Report an issue](mailto:arlikhozhaevca@gmail.com)**

![ReviewLens dashboard — themes, sentiment, and executive summary](/public/images/preview.png)

---

## Impact at a glance

| Metric | Value |
|--------|-------|
| Time to insight | **< 60s** from CSV upload to themed report |
| Reviews per upload | **500+** supported |
| Automated unit tests | **93** (Vitest — no DB/network in CI) |
| E2E specs | **4** (Playwright — auth gating + golden path) |
| CI gates on every merge | **Lint · type-check · test · build · Playwright e2e** |
| AI pipeline stages | **4** (embed → cluster → summarize → executive summary) |
| Share protection modes | **Password + expiry** (scrypt + HMAC cookie) |
| Export formats | **PDF · summary CSV · raw reviews CSV** |

---

## The problem → the solution (XYZ)

| Challenge | ReviewLens response |
|-----------|---------------------|
| Product teams drown in unstructured review text | **Clustered AI themes** with sentiment and an executive summary — not a wall of individual reviews |
| Manual theming doesn't scale past a few dozen reviews | **Embedding + k-means pipeline** groups semantically similar feedback automatically |
| Stakeholders need reports, not repo access | **Shareable dashboard links** with optional password and expiry — no account required for viewers |
| AI pipelines fail silently in production | **Atomic job claiming**, structured JSON logs, health checks, and **93 unit tests** guarding core logic |
| Long-running analysis blocks the UI | **Inngest background jobs** with Vercel `waitUntil` fallback — API returns immediately, status polls live |

**In one sentence:** ReviewLens accepts a CSV of product reviews, runs an embeddings → clustering → LLM summarization pipeline, and delivers a stakeholder-ready insight report with PDF/CSV export and password-protected sharing.

---

## What it does

1. **Upload** — Drop a CSV or use **Try sample data**. Columns auto-detected (`review`, `rating`, `author`, `date`).
2. **Embed** — Each review → 1536-dim vector (`text-embedding-3-small`), batched in groups of 100 with 429 retry.
3. **Cluster** — k-means (`k = max(2, min(8, round(n / 15)))`, k-means++ init) groups similar feedback.
4. **Summarize** — `gpt-4o-mini` labels each cluster (theme, description, sentiment) + one executive summary.
5. **Report** — Dashboard with sentiment charts, complaint/praise cards, export menu, and shareable URL.

**Live demo path:** Sign in → `/analyze` → **Try sample data** → dashboard → **Share** → copy link.

---

## Engineering highlights (XYZ)

- **Reduced duplicate pipeline runs in concurrent requests**, measured by zero double-processing on the same session, by atomically claiming jobs with `updateMany WHERE status = PENDING`.
- **Kept stakeholder handoff friction near zero**, measured by view-only share links requiring no login, by shipping password/expiry gates with scrypt hashing and HMAC-signed httpOnly cookies (12h).
- **Maintained release confidence as features grew**, measured by **93 passing unit tests** and GitHub Actions CI on every push to `main`, by testing CSV detection, validation, share crypto, and API contracts without a live database in CI.
- **Chose share-first collaboration over email invites**, measured by zero custom-domain email dependencies on Vercel, by deferring team-inbox UI while shipping PDF/CSV export and `mailto:` share drafts.
- **Made ingestion flexible without brittle schemas**, measured by automatic column mapping across common CSV formats, by building header-detection and paste-to-review parsers with dedicated test coverage.

---

## Tech stack

| Layer | Technology |
|-------|------------|
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

Triggered via `POST /api/analysis/[slug]/process`. Pipeline logs include `requestId`, `sessionId`, `userId`, stage, and OpenAI `totalTokens`.

---

## Features

### Auth & sessions

- Magic-link sign-in at `/login` (JWT sessions, edge-safe middleware)
- `/analyze` and `/sessions` require authentication; analyses scoped to `User.id`
- Dev mode: without `RESEND_API_KEY`, magic links print to the terminal

### Share protection

- **Copy link** — works on any Vercel URL
- **Email draft** — pre-filled `mailto:` (no API keys required)
- **Password** — scrypt-hashed; viewers unlock via HMAC-signed httpOnly cookie (12h)
- **Expiry** — 1 / 7 / 30 days or never
- Analysis owner always bypasses gates

### Export

- **PDF** — branded report (summary, sentiment, themes), client-side via lazy-loaded `jspdf`
- **Summary CSV** — themes + sentiment + executive summary
- **Raw reviews CSV** — streamed from API, gated by same share rules as dashboard

### Collaboration model (intentional scope)

| Approach | Status | Why |
|----------|--------|-----|
| **Share link** (+ password / expiry) | Shipped | Read-only stakeholder access without org membership or custom email domains |
| **Export PDF / CSV** | Shipped | Offline handoff to execs and clients |
| **Team workspaces** | Schema + API only | Multi-tenant path exists in Prisma; UI deferred to keep the portfolio demo focused |

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

### Environment variables

See `.env.example`. Key variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase pooled connection (port 6543, `?pgbouncer=true`) |
| `DIRECT_URL` | Supabase direct connection (port 5432) — migrations only |
| `OPENAI_API_KEY` | OpenAI secret key |
| `AUTH_SECRET` | Session signing secret (32+ chars) — required in production |
| `AUTH_URL` / `NEXT_PUBLIC_APP_URL` | App URL |
| `RESEND_API_KEY` | Magic link emails (production) |
| `UPSTASH_REDIS_*` | Distributed rate limits (production) |
| `INNGEST_*` | Background job queue (production) |
| `INNGEST_DEV=1` | Local only — use with `npx inngest-cli dev` |
| `SENTRY_DSN` | Error monitoring (optional) |

### Inngest local dev

```bash
npx inngest-cli dev -u http://localhost:3000/api/inngest
```

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

## Testing & CI

```bash
npm test          # 93 Vitest unit tests
npm run test:watch
npm run test:e2e  # 4 Playwright specs (golden path + auth gating)
```

**CI** (`.github/workflows/ci.yml`) on every push/PR to `main`:

1. **verify** — ESLint, `tsc --noEmit`, Vitest (no live DB/network), production build  
2. **e2e** — Postgres service + `prisma migrate deploy`, Playwright (Chromium) with placeholder env; API routes mocked in specs. Trace + HTML report uploaded on failure.

**E2E setup:**

```bash
npx playwright install   # first run only
npm run test:e2e
```

- `auth.setup.ts` — signed session cookie for authed specs  
- `golden-path.spec.ts` — upload → preview → submit (mocks create/process/status APIs)
- `auth-redirect.spec.ts` — middleware gating without DB  

---

## Production services

| Service | Purpose | Required? |
|---------|---------|-----------|
| **Resend** | Magic link sign-in | Optional locally |
| **Upstash Redis** | Rate limits across instances | Production |
| **Inngest** | Reliable background pipeline | Production |
| **Sentry** | Error monitoring | Recommended |

---

## Deployment

Deploys to **Vercel**. Add environment variables from `.env.example` (except `INNGEST_DEV`).

1. Push to GitHub and merge to `main` (CI must pass)
2. Import repo in Vercel
3. Add Production environment variables
4. Run `npx prisma migrate deploy` against production DB
5. Redeploy

Supabase pgbouncer handles pooling — `DATABASE_URL` uses `?pgbouncer=true`; `DIRECT_URL` for migrations only.

---

## Scripts

```bash
npm run dev          # Development server
npm run build        # prisma generate + production build
npm run type-check   # tsc --noEmit
npm run lint         # ESLint
npm run format       # Prettier
npm test             # Vitest
npm run test:e2e     # Playwright
```

---

## Interview talking points

1. **Problem** — Unstructured review text doesn't scale; manual theming breaks past dozens of rows.
2. **Approach** — Embeddings + k-means + LLM summarization with atomic job claiming and share-gated read-only reports.
3. **Tradeoff** — Built org/tenant models but shipped **share-link collaboration** instead of email invites (no custom domain on Vercel free tier).
4. **Reliability** — Inngest + `waitUntil` fallback, Upstash rate limits, `/api/health`, **93 unit tests**, Playwright e2e, GitHub Actions CI.
5. **Outcome** — CSV → themed report in **< 60s**, PDF/CSV export, password-protected links for stakeholders.

---

## License

MIT

---

<p align="center">
  <sub>
    Built by <a href="https://github.com/Arlikhozhaev">Abdu Alim Arlikhozhaev</a> ·
    <a href="https://review-lens-app.vercel.app/">Live demo</a> ·
    <a href="https://github.com/Arlikhozhaev/ReviewLens/issues">Issues</a>
  </sub>
</p>
