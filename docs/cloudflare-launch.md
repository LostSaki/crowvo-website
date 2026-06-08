# Cloudflare Launch Checklist (Crowvo)

This project is ready to launch behind Cloudflare as the edge/security layer.

## Cloudflare Dashboard Setup (Workers + OpenNext)

Use this when creating/updating the Cloudflare project so deployment does not fall back to the auto-migration flow.

1. **Framework preset**
   - Select **Next.js** if asked, but keep custom commands below.
2. **Build command**
   - `npm run cf:build`
3. **Deploy command**
   - `npm run cf:deploy`
4. **Root directory**
   - `crowvo-website` (if repo root has multiple folders)
5. **Node version**
   - Node `22.x` (or latest supported 22 in Cloudflare UI)
6. **Wrangler/OpenNext**
   - Keep `wrangler.jsonc` in repo.
   - Keep `open-next.config.ts` in repo.
   - Do **not** use raw `npx wrangler deploy` as your project deploy command.

### Required Cloudflare variables/secrets

Set these in Cloudflare project settings before first deploy.

- **Required secret**
  - `DATABASE_URL` (Supabase transaction pooler, port 6543, `pgbouncer=true`)
  - `DIRECT_URL` (Supabase session pooler, port 5432 — required by Prisma schema for builds)
  - `ADMIN_USERNAME`
  - `ADMIN_PASSWORD`
  - `CLOUDFLARE_TURNSTILE_SECRET`
  - `UPSTASH_REDIS_REST_TOKEN`
  - `RESEND_API_KEY` (if sending emails)
- **Required plain text variable**
  - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
  - `UPSTASH_REDIS_REST_URL`
- **Optional plain text variable**
  - `NEXT_PUBLIC_GA_MEASUREMENT_ID`
  - `NEXT_PUBLIC_POSTHOG_KEY`
  - `NEXT_PUBLIC_POSTHOG_HOST`
  - `NEXT_PUBLIC_HOTJAR_ID`
  - `RESEND_FROM_EMAIL`

### Post-deploy smoke test

After first successful deploy:

1. Open `/api/health` and confirm `{ "ok": true, ... }`.
2. Submit waitlist form once (valid Turnstile token).
3. Open `/admin`, sign in with the same username and password configured in secrets, and verify metrics load.
4. Confirm one analytics event appears in admin attribution/snapshot cards.

**If `/admin` still shows the old single-token login:**

- Deployments must rebuild the OpenNext bundle (`npm run cf:deploy` or your CI build). Older Workers/KV payloads will keep serving stale HTML until you redeploy.
- Force-refresh (`Ctrl`+`Shift`+`R` / empty cache hard reload).
- Clear site data for your domain if a service worker/browser cache persists.
- In Cloudflare, confirm cache rules **bypass** `/admin*` and `/api/*` per the rules below — or **purge cache** for your hostname after deploying.

### “Admin data query failed” / DATABASE_URL

The admin APIs use Prisma with **network Postgres**. Your Workers runtime must use a **`DATABASE_URL` that resolves on the public internet**:

- Wrong for production if it looks like **`@db:`** or **`localhost`** / **`127.0.0.1`** — that’s local/Docker Postgres and Workers cannot reach it.
- Set **`DATABASE_URL` as a Cloudflare Workers secret** to your database — **never** reuse the Compose-only value from `.env` (`postgresql://...@db:5432/...`; Workers cannot resolve `db`).

### Supabase (recommended)

Use the **transaction mode / pooler** connection string (**port `6543`**) with **`pgbouncer=true`** so serverless/OpenNext opens fewer raw connections.

- Paste that string into **`DATABASE_URL` Workers secret** (`wrangler secret put DATABASE_URL` or dashboard Secrets).
- For local `npm run dev` outside Docker, put the **same string** into **`.env.local`** so it overrides the Docker `DATABASE_URL` in `.env`.
- Applying schema: Supabase recommends a **direct** or **session** URI for tooling; temporarily run `DATABASE_URL="<session-or-direct-uri>" npx prisma db push` against the same Supabase project (official guide: [Supabase × Prisma](https://supabase.com/docs/guides/database/prisma)).

For other hosts (Railway / Neon): set `DATABASE_URL` secret to whatever they provide as the pooled/serverless‑friendly URI, then run `DATABASE_URL="<prod-uri>" npx prisma db push` once against production.

## Recommended architecture

- **Frontend origin**: Vercel (Next.js)
- **Database/API origin**: Supabase/Railway Postgres + Next.js API routes
- **Cloudflare role**: DNS, WAF, DDoS protection, caching, bot management, Turnstile

> Why: this codebase uses Prisma in server routes and password-based admin auth, both supported cleanly with OpenNext on Cloudflare Workers.

## 1) DNS + Proxy

1. Add your domain in Cloudflare.
2. Point `@` and `www` to your frontend origin.
3. Keep records **proxied** (orange cloud).

## 2) SSL/TLS

- Set SSL mode to **Full (strict)**.
- Enable **Always Use HTTPS**.
- Enable **Automatic HTTPS Rewrites**.

## 3) Caching rules

Create rules:

- **Bypass cache** for:
  - `/api/*`
  - `/admin*`
- **Cache static assets** aggressively:
  - `/_next/static/*`
  - `/public/*` assets

## 4) WAF + Rate limiting

Create Cloudflare WAF custom rules:

- Challenge suspicious bot traffic on:
  - `/api/waitlist`
  - `/api/investor-interest`
  - `/api/analytics/track`
- Add Cloudflare rate limits per IP:
  - waitlist/investor routes (e.g. 10 req/min)
  - analytics route (e.g. 120 req/min)

## 5) Turnstile

In Cloudflare Turnstile:

- Add allowed hostnames:
  - `localhost`
  - your production domain(s)
- Set environment variables:
  - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
  - `CLOUDFLARE_TURNSTILE_SECRET`

## 6) Origin protection

- Restrict origin access to Cloudflare only (firewall/IP allowlist where possible).
- Keep API auth secrets server-side only.
- Ensure no private keys are exposed in client env vars.
- Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` as secure Cloudflare secrets.

## 7) Monitoring / health checks

- Health endpoint:
  - `GET /api/health`
- Monitor:
  - 5xx rates
  - latency by route
  - waitlist + investor conversion

## 8) Launch validation (must pass)

- Home page loads via Cloudflare domain
- `/api/health` returns `200` with `{ ok: true }`
- Waitlist + investor forms succeed and are bot-protected
- Admin auth works (HTTP Basic with `ADMIN_USERNAME` / `ADMIN_PASSWORD`)
- Analytics events appear in admin dashboard
