# Full platform deployment (crow-vo.com + app + API)

Three pieces work together:

| Piece | URL (target) | Host | Status |
|-------|----------------|------|--------|
| Marketing site | https://crow-vo.com | Cloudflare Workers | Live |
| Web app | https://app.crow-vo.com | Vercel or Railway | **Not deployed yet** |
| API | https://api.crow-vo.com | Railway or Render | **Not deployed yet** |

Until the app and API are public, **Open app** on the website will not work for visitors (links now point to `https://app.crow-vo.com`, not localhost).

---

## 1. Fix website links (done in repo)

`wrangler.jsonc` sets:

```json
"NEXT_PUBLIC_CROWVO_APP_URL": "https://app.crow-vo.com"
```

Redeploy after changes:

```powershell
cd crowvo-website
npm run cf:deploy
```

Local dev: keep `NEXT_PUBLIC_CROWVO_APP_URL=http://localhost:3001` in `crowvo-website/.env.local` only.

---

## 2. Deploy the API (Railway recommended)

From `crowvo-app/backend`:

1. Create a [Railway](https://railway.app) project → deploy from GitHub, root **`crowvo-app/backend`**
2. **Build:** `npm install && npx prisma generate && npm run build`
3. **Start:** `npm run start`
4. Add environment variables (same Supabase DB as the website):

   - `DATABASE_URL`, `DIRECT_URL`
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
   - `ADMIN_API_KEY` (generate a long random string)
   - `DEMO_ACCESS_REQUIRED=true`
   - `APP_WEB_URL=https://app.crow-vo.com`
   - `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
   - `CORS_ORIGIN=https://app.crow-vo.com,https://crow-vo.com`

5. Railway → **Settings → Networking** → generate domain, e.g. `crowvo-api-production.up.railway.app`
6. Optional custom domain: **`api.crow-vo.com`** → CNAME to Railway

Verify: `GET https://your-api-url/health` → `{ "status": "ok" }`

See also: `crowvo-app/docs/backend-deploy.md`

---

## 3. Deploy the web app (Vercel recommended)

From `crowvo-app/web`:

1. Import repo in [Vercel](https://vercel.com), root directory **`crowvo-app/web`**
2. Environment variables:

   ```
   NEXT_PUBLIC_API_URL=https://api.crow-vo.com/v1
   ```
   (or your Railway URL + `/v1` until custom domain is ready)

3. Add domain **`app.crow-vo.com`** in Vercel → DNS: CNAME `app` → `cname.vercel-dns.com` (in Cloudflare DNS)

4. Redeploy

Verify: open https://app.crow-vo.com/join — signup with invite code should hit the live API.

---

## 4. Wire the marketing site to the API

Cloudflare secrets (website worker):

```powershell
cd crowvo-website
npx wrangler secret put CROWVO_API_URL
# → https://api.crow-vo.com/v1  (or Railway URL)

npx wrangler secret put CROWVO_ADMIN_API_KEY
# → same value as ADMIN_API_KEY on the API server
```

Already set (if you configured earlier):

- `ADMIN_USERNAME`, `ADMIN_PASSWORD`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- `DATABASE_URL`, `DIRECT_URL`

Then redeploy: `npm run cf:deploy`

**Admin dashboard** at https://crow-vo.com/admin → **Access Codes** tab will create codes on the live API.

---

## 5. DNS checklist (Cloudflare)

| Record | Type | Points to |
|--------|------|-----------|
| `@` / `www` | CNAME/A | Cloudflare Workers (already) |
| `app` | CNAME | Vercel (or Railway) |
| `api` | CNAME | Railway |

SSL: **Full (strict)** on all subdomains.

---

## 6. OAuth & email (optional)

On **API** + **web app**:

- `GOOGLE_CLIENT_ID` / `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `APPLE_CLIENT_ID` / `NEXT_PUBLIC_APPLE_CLIENT_ID`

On **API** only:

- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- `APP_WEB_URL=https://app.crow-vo.com`

---

## 7. Smoke test (production)

- [ ] https://crow-vo.com → **Open app** → https://app.crow-vo.com (not localhost)
- [ ] https://app.crow-vo.com/join → enter invite code → signup
- [ ] New account → empty feed and empty realms (no demo data)
- [ ] https://crow-vo.com/admin → create access code → code works on /join
- [ ] Password reset email arrives (Resend configured on API)

---

## Quick reference: who reads which env var

| Variable | Website (CF) | Web app (Vercel) | API (Railway) |
|----------|--------------|------------------|---------------|
| `NEXT_PUBLIC_CROWVO_APP_URL` | wrangler var | — | — |
| `NEXT_PUBLIC_API_URL` | — | yes | — |
| `CROWVO_API_URL` | secret | — | — |
| `CROWVO_ADMIN_API_KEY` | secret | — | — |
| `ADMIN_API_KEY` | — | — | yes |
| `DATABASE_URL` | secret | — | yes |
