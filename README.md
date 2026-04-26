# Hubly Marketing Site

Brand: **Hubly**  
Tagline: **"Where nights out become communities."**  
Short copy: **Discover events, join hubs, chat live, and share moments in one app.**

Production-ready startup marketing website built with:
- Next.js App Router + TypeScript
- Tailwind CSS + Framer Motion
- Prisma + PostgreSQL (or Supabase Postgres)
- GA4 + PostHog + Hotjar
- Resend email confirmations
- Firebase Auth admin access
- Cloudflare Turnstile bot protection
- Upstash Redis distributed rate limiting

## Project Structure

- `app/` - pages and API routes
- `app/api/waitlist` - waitlist capture endpoint
- `app/api/investor-interest` - investor lead endpoint
- `app/api/referrals/leaderboard` - live referral leaderboard data
- `app/api/admin/waitlist` - protected CSV export
- `app/api/admin/overview` - secure admin metrics endpoint
- `components/` - navbar, forms, animated sections, analytics provider
- `lib/` - Prisma client, validation, rate limiting
- `prisma/schema.prisma` - database schema

## Pages Included

- `/` - high-conversion landing page
- `/investors` - pitch-style investor page + contact form
- `/about` - mission, vision, founder story section
- `/admin` - Firebase-authenticated dashboard (analytics + CSV export)

## Setup

1. Install dependencies:
   - `npm install`
2. Create env file:
   - `copy .env.example .env` (Windows)
3. Configure required vars in `.env`:
   - `DATABASE_URL`
   - Firebase vars (`NEXT_PUBLIC_FIREBASE_*`, `FIREBASE_*`, `ADMIN_ALLOWED_EMAILS`)
   - Upstash vars (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`)
   - Cloudflare Turnstile vars (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `CLOUDFLARE_TURNSTILE_SECRET`)
   - Optional analytics + email keys
4. Generate Prisma client:
   - `npm run prisma:generate`
5. Push schema:
   - `npm run prisma:push`
6. Start dev server:
   - `npm run dev`

## Environment Variables

Use `.env.example` as template:

- `DATABASE_URL` - Postgres/Supabase connection string
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` - GA4 ID
- `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` - PostHog tracking
- `NEXT_PUBLIC_HOTJAR_ID` - Hotjar site ID
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `CLOUDFLARE_TURNSTILE_SECRET` - Cloudflare Turnstile
- `RESEND_API_KEY` and `RESEND_FROM_EMAIL` - transactional waitlist emails
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` - distributed rate limiting
- `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` - server-side token verification
- `ADMIN_ALLOWED_EMAILS` - comma-separated admin allowlist

## Deployment

- Frontend: deploy to [Vercel](https://vercel.com)
- Database: Supabase Postgres or Railway Postgres
- Add environment variables in Vercel project settings
- Run `prisma db push` in CI/CD or post-deploy hook
- Optional: Proxy domain through Cloudflare and keep SSL mode Full (strict)

## Docker (Local Preview)

1. Create your env file:
   - `copy .env.example .env`
2. Update at minimum:
   - `DATABASE_URL="postgresql://postgres:postgres@db:5432/hubly"`
3. Start with Docker:
   - `docker compose up --build`
4. Open:
   - [http://localhost:3000](http://localhost:3000)

Notes:
- This Compose setup runs:
  - `web` (Next.js in dev mode)
  - `db` (Postgres 16)
- Prisma client and schema push run automatically on container start.
- Stop with:
  - `docker compose down`

### Docker production profile (Vercel-like runtime)

- Start production profile:
  - `docker compose --profile prod up --build web-prod db`
- Open production app:
  - [http://localhost:3001](http://localhost:3001)

### One-command Windows script

- Dev mode:
  - `.\start-docker.ps1`
- Prod profile:
  - `.\start-docker.ps1 -Mode prod`
- Stop:
  - `.\start-docker.ps1 -Down`

## Growth Features

- Real referral logic:
  - Each signup gets a unique `inviteCode`
  - `/?ref=CODE` links credit referrals
  - Public leaderboard endpoint ranks top ambassadors
- Admin auth:
  - Google login via Firebase Auth
  - Backend routes verify Firebase ID token and allowlisted admin emails
- Abuse prevention:
  - Cloudflare Turnstile on waitlist and investor forms
  - Upstash Redis sliding-window rate limits for serverless

## Analytics Events

PostHog events currently tracked:
- `$pageview`
- `waitlist_submission`
- `investor_form_submission`
- `scroll_depth` (25/50/75/100%)
