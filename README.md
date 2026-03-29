# BUSOS — Founder Operating System

Monorepo with the main product in **`apps/web`**: a Next.js (App Router) app for founders — Dream Intake (VentureDNA), stress-adaptive dashboard, journey milestones, Ada (LLM), demo mode, and investor flows.

## Requirements

- **Node.js 20+** (recommended)
- **PostgreSQL** (e.g. Supabase) — connection string in **`DATABASE_URL`**
- **OpenAI API key** — **`OPENAI_API_KEY`** (Ada, demo, stress alerts, Blue Ocean scan, documents where applicable)

## Environment variables (`apps/web`)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string for Prisma |
| `JWT_SECRET` | Secret for session JWT (cookies) |
| `OPENAI_API_KEY` | OpenAI API for Ada, `/api/demo`, Blue Ocean, etc. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Optional; only if you use `/api/clerk-dev-init` for hosted dev |

Copy from your host’s dashboard as needed; never commit real secrets.

## Database

From **`apps/web`**:

```bash
npx prisma generate --schema=./prisma/schema.prisma
npx prisma db push --schema=./prisma/schema.prisma
# or: npx prisma migrate deploy (if you use migrations)
```

Schema source of truth: **`apps/web/prisma/schema.prisma`** (kept in sync with the repo root `prisma/schema.prisma` where present).

## Run locally

```bash
cd apps/web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Key routes

| Area | Path |
|------|------|
| Marketing | `/` |
| No-login demo | `/demo`, `POST /api/demo` |
| Auth | `/sign-in`, `/sign-up` (custom JWT; no Clerk UI components in-app) |
| NDA gate | `/nda` (middleware) |
| Dashboard | `/dashboard?ventureId=…` |
| Dream / DNA | `/ventures/[ventureId]/dream` |
| Journey | `/ventures/[ventureId]/journey` |
| Survival emergency kits | `/ventures/[ventureId]/emergency/bridge-financing`, `pivot-canvas`, `cost-reduction` |
| Investor room (token) | `/investor/rooms/[accessToken]` |

## API notes

- Most **`/api/ventures/[ventureId]/...`** routes require auth and verify **venture ownership** via `getOrCreateUserFromClerk()` → internal `userId`.
- **`POST /api/ventures/[ventureId]/blue-ocean`** runs a **synchronous** Blue Ocean analysis (JSON). For very high traffic you can later move execution to a queue; the response shape supports `jobId` + `status` + `analysis`.

## Tests

From **`apps/web`**:

```bash
npm test
```

Uses **Vitest** (`*.test.ts` next to source or under `tests/`).

## Deploy

Configure the same env vars on your host (Vercel, Cloudflare, etc.). Build:

```bash
cd apps/web && npm run build && npm start
```

See also `apps/web` scripts for Cloudflare OpenNext if you deploy there.

## License

Private / all rights reserved unless otherwise stated by the repository owner.
