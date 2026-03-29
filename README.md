# BUSOS — Founder Operating System

## Where the app lives

**Develop and run the product from `apps/web/`** (Next.js App Router, Prisma, API routes).  
The repository root may contain other `package.json` files; treat them as separate unless documented. Primary commands:

```bash
cd apps/web
npm install
npm run dev
```

Monorepo layout: **`apps/web`** = BUSOS web app · **`prisma/schema.prisma`** (repo root) is kept in sync with **`apps/web/prisma/schema.prisma`** for Prisma CLI.

## Requirements

- **Node.js 20+** (recommended)
- **PostgreSQL** (e.g. Supabase) — **`DATABASE_URL`**
- **`OPENAI_API_KEY`** — Ada, demo, stress alerts, Blue Ocean, **Dream voice (`/api/transcribe` via Whisper)**, documents where applicable

## Environment variables (`apps/web`)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string for Prisma |
| `JWT_SECRET` | Secret for session JWT (cookies) |
| `OPENAI_API_KEY` | Whisper transcription, chat, demo, Blue Ocean, etc. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Optional; `/api/clerk-dev-init` only |

Never commit secrets.

## Database

From **`apps/web`**:

```bash
npx prisma generate --schema=./prisma/schema.prisma
npx prisma db push --schema=./prisma/schema.prisma
# or: npx prisma migrate deploy
```

## Voice transcription (`POST /api/transcribe`)

1. **Preferred:** **OpenAI Whisper** (`whisper-1`) when `OPENAI_API_KEY` is set — works on Vercel/serverless without extra binaries.  
2. **Fallback:** `manus-speech-to-text` CLI on the server (temp file), if Whisper fails or is unavailable.

## Public demo rate limits

**`POST /api/demo`** is limited per IP (in-memory, **10 requests / 15 minutes**; best-effort per server instance). Returns **429** with **`Retry-After`**.

## Blue Ocean history

Scans are stored in **`BlueOceanScan`** (see Prisma schema). **`GET /api/ventures/[ventureId]/blue-ocean`** lists saved scans; **`POST`** runs a new scan and persists it.

## Observability

Server routes use structured JSON logs via **`apps/web/lib/logger.ts`** (`log("info"|"warn"|"error", msg, meta?)`) for grep-friendly output in platform logs.

## Key routes

| Area | Path |
|------|------|
| Marketing | `/` |
| No-login demo | `/demo`, `POST /api/demo` |
| Voice STT | `POST /api/transcribe` |
| Auth | `/sign-in`, `/sign-up` |
| NDA | `/nda` |
| Dashboard | `/dashboard?ventureId=…` |
| Dream / DNA | `/ventures/[ventureId]/dream` |
| Journey | `/ventures/[ventureId]/journey` |
| Emergency kits | `/ventures/[ventureId]/emergency/...` |
| Blue Ocean | `/ventures/[ventureId]/blue-ocean` · `GET` / `POST` `.../blue-ocean` |
| Investor room | `/investor/rooms/[accessToken]` |

## Tests

```bash
cd apps/web && npm test
```

Vitest — `**/*.test.ts`.

## Deploy

```bash
cd apps/web && npm run build && npm start
```

CI (GitHub Actions) runs **lint**, **test**, and **build** for `apps/web` on push/PR to `main`.

### Security / `npm audit`

`next` is pinned to the latest **14.2.x** patch. Some advisory noise remains from **devDependencies** (e.g. `wrangler` / `eslint-config-next` trees) and would require **major** upgrades (`npm audit fix --force`) — do that in a dedicated upgrade PR, not blindly in production.

After schema changes, run **`prisma db push`** (or migrate) so **`BlueOceanScan`** exists before using saved Blue Ocean history.

## License

Private / all rights reserved unless otherwise stated by the repository owner.
