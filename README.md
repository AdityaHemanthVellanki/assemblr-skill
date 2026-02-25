# Assemblr

Skill graph platform for cross-tool workflow intelligence. Connects to SaaS tools via Composio, detects repeating workflow patterns, and compiles them into visual skill graphs.

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌───────────────┐
│   Vercel         │     │   Supabase   │     │   Upstash     │
│   (Next.js)      │────▶│   (Postgres) │     │   (Redis)     │
│   API + Frontend │     └──────────────┘     └───────┬───────┘
└─────────┬────────┘                                  │
          │ enqueueJob()                              │
          └──────────────────────────────────────────▶│
                                                      │
┌─────────────────┐                                   │
│   Railway        │◀──────────────────────────────────┘
│   (Worker)       │     BullMQ Workers
│   - Backfill     │
│   - Normalize    │
│   - Detect       │
│   - Compile      │
│   - Nightly      │
└──────────────────┘
```

## Project Structure

```
assemblr-skill/
├── prisma/                   # Prisma schema
├── packages/
│   └── shared/               # Shared: Prisma client, queue, types, encryption
├── apps/
│   └── web/                  # Next.js app (Vercel)
│       └── src/
│           ├── app/          # App Router pages + API routes
│           ├── components/   # React components (layout, graph editor)
│           ├── hooks/        # Custom React hooks
│           ├── stores/       # Zustand stores
│           └── lib/          # Auth, API client, utilities
└── services/
    └── worker/               # Background worker (Railway)
        └── src/
            ├── adapters/     # Composio integration adapters
            ├── services/     # Business logic
            └── workers/      # BullMQ job handlers
```

## Prerequisites

- Node.js 20+
- npm 10+
- Supabase project (Postgres)
- Upstash Redis instance (with TLS / `rediss://`)
- Composio account + API key
- Stripe account (for payment webhooks)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in all values in `.env`:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase pooled connection string |
| `DIRECT_URL` | Supabase direct connection string (for migrations) |
| `REDIS_URL` | Upstash Redis URL (`rediss://...`) |
| `JWT_SECRET` | Random 256-bit secret for JWT signing |
| `ENCRYPTION_KEY` | 64-char hex key for AES-256-GCM encryption |
| `COMPOSIO_API_KEY` | Composio API key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

### 3. Generate Prisma client + push schema

```bash
npx prisma generate
npx prisma db push
```

### 4. Build shared package

```bash
npm run build -w packages/shared
```

### 5. Run locally

```bash
# Terminal 1: Web app
npm run dev -w apps/web

# Terminal 2: Worker
npm run dev -w services/worker
```

## Deployment

### Vercel (Web App)

1. Connect your repo to Vercel
2. Set **Root Directory** to `apps/web`
3. Set **Build Command** to `cd ../.. && npx prisma generate && npm run build -w packages/shared && npm run build -w apps/web`
4. Set **Framework** to Next.js
5. Add all environment variables from `.env`
6. Deploy

### Railway (Worker)

1. Create a new Railway service
2. Set **Root Directory** to `services/worker`
3. Set **Build Command** to `cd ../.. && npx prisma generate && npm run build -w packages/shared && npm run build -w services/worker`
4. Set **Start Command** to `npm start -w services/worker`
5. Add environment variables: `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, `COMPOSIO_API_KEY`, `STRIPE_SECRET_KEY`
6. Deploy

### Supabase

1. Create a new Supabase project
2. Copy the connection strings to `DATABASE_URL` and `DIRECT_URL`
3. Run `npx prisma db push` to create tables

### Upstash

1. Create a new Upstash Redis database
2. Enable TLS
3. Copy the `rediss://` URL to `REDIS_URL`

### Stripe Webhooks

1. In Stripe Dashboard, create a webhook endpoint pointing to `https://your-vercel-domain.com/api/webhooks/stripe`
2. Select events: `payment_intent.succeeded`, `invoice.paid`, `customer.subscription.created`, etc.
3. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

## API Routes

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/signup` | Create account + org |
| POST | `/api/auth/signin` | Sign in, get memberships |
| POST | `/api/auth/select-org` | Select org, get JWT |
| GET | `/api/org` | Get org details |
| PATCH | `/api/org` | Update org name |
| GET | `/api/org/members` | List org members |
| POST | `/api/org/members` | Invite member |
| GET | `/api/integrations` | List integrations |
| POST | `/api/integrations/connect` | Connect integration |
| POST | `/api/integrations/backfill` | Start backfill job |
| GET | `/api/events` | List events (paginated) |
| GET | `/api/events/stats` | Event statistics |
| GET | `/api/workflows` | List workflow clusters |
| GET | `/api/workflows/[id]` | Workflow cluster detail |
| POST | `/api/workflows/detect` | Trigger workflow detection |
| GET | `/api/skills` | List skills |
| GET | `/api/skills/[id]` | Skill detail |
| PATCH | `/api/skills/[id]` | Update skill |
| DELETE | `/api/skills/[id]` | Delete skill |
| POST | `/api/skills/compile` | Compile cluster to skill |
| GET | `/api/skills/[id]/export` | Export skill graph JSON |
| POST | `/api/skills/[id]/version` | Create new version |
| PUT | `/api/skills/[id]/nodes` | Update graph nodes |
| PUT | `/api/skills/[id]/edges` | Update graph edges |
| GET | `/api/actors` | List actors |
| POST | `/api/actors/merge` | Merge two actors |
| POST | `/api/webhooks/stripe` | Stripe webhook receiver |
| GET | `/api/audit` | Audit logs |

## Background Jobs

| Job | Description | Trigger |
|---|---|---|
| `BACKFILL_JOB` | Fetch historical data from integrations | Manual (API) |
| `NORMALIZE_EVENTS_JOB` | Normalize raw events to universal format | After backfill / webhook |
| `WORKFLOW_CLUSTER_JOB` | Detect workflow patterns via clustering | Manual (API) / Nightly |
| `SKILL_COMPILE_JOB` | Compile cluster into skill graph | Manual (API) |
| `NIGHTLY_RECOMPUTE_JOB` | Nightly workflow re-detection | Cron (2 AM daily) |

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS v4, React Flow, Zustand, Lucide Icons
- **Backend**: Next.js API Routes (Vercel serverless)
- **Database**: PostgreSQL (Supabase) via Prisma ORM
- **Queue**: BullMQ on Upstash Redis
- **Worker**: Node.js on Railway
- **Auth**: JWT via `jose` (Edge-compatible)
- **Integrations**: Composio SDK
- **Payments**: Stripe webhooks
