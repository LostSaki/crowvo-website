# Cloudflare Launch Checklist (Crowvo)

This project is ready to launch behind Cloudflare as the edge/security layer.

## Recommended architecture

- **Frontend origin**: Vercel (Next.js)
- **Database/API origin**: Supabase/Railway Postgres + Next.js API routes
- **Cloudflare role**: DNS, WAF, DDoS protection, caching, bot management, Turnstile

> Why: this codebase currently uses Prisma + Firebase Admin in server routes, which are best supported on Node-compatible origins.

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
- Admin auth works (Firebase)
- Analytics events appear in admin dashboard
