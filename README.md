# ReviewLens

Turn customer review CSVs into actionable product insights — themes, sentiment, and an executive summary — in under a minute.

## Stack

- **Next.js 14** (App Router)
- **PostgreSQL** + **Prisma**
- **Auth.js** (magic link via Resend)
- **OpenAI** — embeddings + GPT-4o-mini
- **Inngest** — background pipeline (optional)
- **Upstash Redis** — distributed rate limits (optional)
- **Sentry** — error monitoring (optional)

## Quick start

```bash
cp .env.example .env.local
# Required: DATABASE_URL, DIRECT_URL, OPENAI_API_KEY, AUTH_SECRET
# Optional: RESEND_API_KEY, UPSTASH_*, INNGEST_*, SENTRY_*

npm install
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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

## API

| Route | Auth | Description |
|-------|------|-------------|
| `POST /api/analysis` | Required | Create session + reviews |
| `GET /api/sessions` | Required | List user's analyses |
| `POST /api/analysis/[slug]/process` | Public | Start pipeline |
| `GET /api/analysis/[slug]/status` | Public | Poll status |
| `GET /api/health` | Public | DB + service flags |
| `POST /api/inngest` | Inngest | Job worker webhook |

## Scripts

```bash
npm run dev
npm run build
npm run type-check
npm run lint
```

## Logs

Structured JSON logs include `requestId`, `sessionId`, `userId`, pipeline `stage`, and OpenAI `totalTokens`.
