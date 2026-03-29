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

**Limits:** uploads over **25 MB** return **413**. **Rate limit:** **30 requests / 15 minutes / IP** (in-memory per instance) with **429** + **`Retry-After`**.

## Public demo rate limits

**`POST /api/demo`** is limited per IP (in-memory, **10 requests / 15 minutes**; best-effort per server instance). Returns **429** with **`Retry-After`**.

## Blue Ocean history

Scans are stored in **`BlueOceanScan`** (see Prisma schema). **`GET /api/ventures/[ventureId]/blue-ocean`** lists saved scans; **`POST`** runs a new scan and persists it.

## Lean Canvas

One canvas per venture (**`LeanCanvas`**, JSON **`blocks`**). **`GET`** returns saved content or a **seed** from Venture DNA + venture fields (not persisted until **`PATCH`**). **`PATCH`** merges **`blocks`**. **`POST`** with **`{ "action": "reseed" }`** replaces the canvas from the latest DNA snapshot. The UI can **export** a **Markdown** file for sharing or archiving.

## Observability

Server routes use structured JSON logs via **`apps/web/lib/logger.ts`** (`log("info"|"warn"|"error", msg, meta?)`) for grep-friendly output in platform logs.

## Security & access control

- **Venture access**: API routes resolve access with **`getVentureAccess`** / **`ventureAccessibleByUser`** so **owners and venture members** can use the product; **`VIEWER`** cannot mutate tasks, DNA, documents generation, etc.
- **Audit trail**: Writes to **`AuditLog`** via **`lib/audit-log.ts`** for transactions, integrations, milestone edits, and OAuth connects. **Owner / Admin** can list entries with **`GET /api/ventures/[ventureId]/audit`**.
- **Integrations OAuth**: Register redirect URI **`{APP_URL}/api/oauth/integration/callback`**. Env: **`JWT_SECRET`** (required for OAuth `state`), **`NEXT_PUBLIC_APP_URL`** or **`VERCEL_URL`**, plus provider keys (**`SLACK_CLIENT_ID`**, **`SLACK_CLIENT_SECRET`**, **`GITHUB_CLIENT_ID`**, **`GITHUB_CLIENT_SECRET`**, **`GOOGLE_CLIENT_ID`**, **`GOOGLE_CLIENT_SECRET`**). Start URL: **`GET /api/ventures/[ventureId]/integrations/oauth/start?provider=…`**.

## AI rate limits (in-memory)

- **Ada** (`GET`/`POST` **`/api/ventures/.../ada`**): per-user sliding window (see route).
- **Milestone AI generate** (`POST` **`.../milestones/generate`**): **8** requests per user per **hour** (best-effort per server instance).

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
| Lean Canvas | `/ventures/[ventureId]/lean-canvas` · `GET` / `PATCH` / `POST` (reseed) `.../lean-canvas` |
| Funding | `/ventures/[ventureId]/funding` · investor matching API; **Pitch Deck** in Documents = **12-slide** markdown from Venture DNA |
| Investor room | `/investor/rooms/[accessToken]` |

## Tests

```bash
cd apps/web && npm test
```

Vitest — `**/*.test.ts`.

**E2E (Playwright)** — smoke tests start Next on port **3333** by default (`PLAYWRIGHT_PORT` to override). First time locally:

```bash
cd apps/web && npx playwright install chromium && npm run test:e2e
```

## Deploy

```bash
cd apps/web && npm run build && npm start
```

CI (GitHub Actions) runs **lint**, **unit tests**, **Playwright smoke** (Chromium), and **build** for `apps/web` on push/PR to `main`.

### Security / `npm audit`

`next` is pinned to the latest **14.2.x** patch. Some advisory noise remains from **devDependencies** (e.g. `wrangler` / `eslint-config-next` trees) and would require **major** upgrades (`npm audit fix --force`) — do that in a dedicated upgrade PR, not blindly in production.

After schema changes, run **`prisma db push`** (or migrate) so **`BlueOceanScan`** and **`LeanCanvas`** exist before using those features.

## License

Private / all rights reserved unless otherwise stated by the repository owner.
