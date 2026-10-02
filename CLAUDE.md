# Crowvo website — crow-vo.com

Marketing site for Crowvo. **Separate repo and stack from `crowvo-app/`** — don't mix them.

- Next.js 16 + React 19 + Tailwind 4, deployed to **Cloudflare Workers** via `@opennextjs/cloudflare`
- Data: Prisma with the Neon serverless adapter; Upstash Redis for rate limiting
- Analytics: PostHog
- Dev server runs on **:3000** (the app runs on :3001, the API on :4000)

## Commands

```bash
npm run dev          # local dev on :3000
npm run build        # production build (uses --webpack, not Turbopack)
npm run cf:preview   # deploy a Cloudflare preview
npm run cf:deploy    # publish to crow-vo.com
```

`cf:deploy` publishes to the live public site — only run it when explicitly asked.

Claude Code: start the dev server with `preview_start` using the `crowvo-website` entry in
the workspace `.claude/launch.json`.

## Environment

`.env`, `.env.local`, `.env.production`, `.env.supabase` all exist and are populated.
Never print or commit their values.

## Known traps

- `next.config.ts` pins `turbopack.root` to this package because the parent folder is the
  editor workspace. That pin does **not** cover PostCSS resolution — if a `package-lock.json`
  ever reappears in the parent folder, the build fails with `Can't resolve 'tailwindcss'`.
  See the workspace `CLAUDE.md`.
- `build` deliberately uses `--webpack`. Keep it that way unless you've verified Turbopack
  is stable here; it has panicked in `mio ... selector.rs` on this OneDrive tree.

## Git

Working tree has ~250 uncommitted changes on top of `d220da9`. Do not commit or push
unless asked.
