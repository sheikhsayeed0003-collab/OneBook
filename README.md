# OneBook

OneBook is an original social network UI: news feed, stories, reels, messenger, groups, pages, marketplace, events, jobs, and role-based dashboards (User, Moderator, Admin, Owner).

This is **not** a copy of any proprietary website. Branding, copy, components, and assets are original. The layout follows familiar social-network patterns (top nav, three-column desktop, bottom nav on phones).

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Prisma + MongoDB Atlas (`DATABASE_URL`)
- HTTP-only JWT sessions (`AUTH_SECRET`)

## Run locally

```bash
npm install
cp .env.example .env
# set AUTH_SECRET to a long random string
npx prisma db push
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Seeded owner: `mursalin@facbook.app` / `Facbook@123`  
Seeded admin: `sara@facbook.app` / `Password@123`

```bash
npm run build
npm start
```

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | MongoDB Atlas `mongodb+srv://...` |
| `AUTH_SECRET` | Yes | 16+ chars; signs session cookies |
| `SEED_OWNER_PASSWORD` | No | Owner password used by `prisma db seed` |
| `NEXT_PUBLIC_APP_URL` | No | Canonical URL |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | No | Help Center |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `MAIL_FROM` | For email | Password-reset mail. Until set, reset tokens are written to **server logs** |

Backend auth cookies, OAuth secrets, SMTP, S3, and database URLs should live only on the server when you add APIs (never `NEXT_PUBLIC_`).

## Roles

| Role | Default demo access |
| --- | --- |
| Owner | `/owner` system config |
| Admin | `/admin` users, reports, ads |
| Moderator | `/moderator` queues |
| User | feed, profile, messenger, marketplace |

## Project map

- `src/app/(auth)` — login, register, reset, verify, recover
- `src/app/(main)` — signed-in product
- `src/components/layout` — header, sidebars, mobile nav
- `src/components/feed` — composer, stories, posts, reactions, comments
- `src/lib/api.ts` — swap mock for `fetch` here

## Deploy (Vercel)

1. Import the repo
2. Set the env vars above
3. Build command: `npm run build`
4. Output: Next.js default

When you add a real API, keep CORS + cookie `SameSite` aligned with `NEXT_PUBLIC_APP_URL`.
