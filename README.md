This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Dream intake and journey roadmap (`apps/web`)

- **Dream (founding story):** `/ventures/[ventureId]/dream` — multi-step VentureDNA form. Submit saves to `POST /api/ventures/[ventureId]/dna`, which upserts `VentureDNA` and regenerates journey milestones via `lib/journey.ts`.
- **Journey:** `/ventures/[ventureId]/journey` — roadmap UI; requires DNA (otherwise links to Dream). Milestones: `GET/POST /api/ventures/[ventureId]/milestones`, updates `PATCH /api/ventures/[ventureId]/milestones/[milestoneId]`.
- **New venture flow:** creating a venture from `/ventures` redirects to `/ventures/[id]/dream` first.
- **Database:** `VentureDNA` and `JourneyMilestone` live in `prisma/schema.prisma` at the repo root. After pulling, run migrations against your PostgreSQL (e.g. `npx prisma migrate deploy` or `prisma migrate dev`) so these tables exist before using Dream/Journey in production.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
