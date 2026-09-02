# AGENTS.md

## Cursor Cloud specific instructions

NaturaLens is a monorepo with **two runnable apps**; everything under `services/`,
`models/`, `tools/data-pipeline`, and `infra/` is a placeholder (README only, nothing to
run). `tools/brand/build-brand.py` is a one-off brand-asset generator, not a service.

Each app has its own `package-lock.json` (there is no root workspace). Install and run
commands must be executed **inside each app directory** (`apps/web`, `apps/mobile`). The
startup update script already runs `npm install` in both.

### apps/web — Next.js 16 landing page + Cloudflare Worker waitlist (D1)

Standard scripts live in `apps/web/package.json`. Key commands (run from `apps/web`):

- Lint: `npm run lint`
- Build (static export to `out/`): `npm run build`
- Next.js-only dev server (no Worker/API): `npm run dev` → http://localhost:3000
- Full stack (Worker API + local D1) — see the wrangler caveat below.

The waitlist API (`POST /api/waitlist`) lives in the Worker (`worker/index.ts`), **not** in
Next.js. `npm run dev` serves the UI but the waitlist call will 404. To exercise the
waitlist end to end you must run the Worker with `wrangler dev`, which serves the built
`out/` assets plus the API against a local D1 database.

- Apply local D1 migrations first: `npm run db:migrate:local` (uses local state under
  `.wrangler/`, no Cloudflare login needed).
- Inspect the local DB: `npx wrangler d1 execute naturalens-waitlist --local --command "SELECT * FROM waitlist;"`

**Wrangler compatibility-date caveat (non-obvious):** `wrangler.jsonc` pins
`compatibility_date: 2026-08-09`, but the bundled `workerd` in the pinned `wrangler`
(`^4.120.0`) only supports dates up to `2026-08-08`, so a plain `wrangler dev`/`npm run
preview` fails with *"This Worker requires compatibility date ... but the newest date
supported by this server binary is ..."*. To run the full stack locally, override the date
on the CLI (do not edit the committed config):

```
npm run build   # once, produces out/
npx wrangler d1 migrations apply naturalens-waitlist --local   # once
npx wrangler dev --port 8788 --compatibility-date 2026-08-08
```

Then the site is at http://localhost:8788 and the waitlist works end to end. (Bumping
`wrangler` to a newer minor within `^4.120.0` also resolves it, but the CLI override avoids
touching pinned files.) `db:migrate`/`deploy`/`preview`'s remote steps need Cloudflare auth
and are not usable in this environment.

### apps/mobile — Expo (React Native) app

Standard scripts live in `apps/mobile/package.json`. This is the CI-checked surface
(`.github/workflows/ci.yml` runs `npx tsc --noEmit`):

- Type check: `npx tsc --noEmit`
- Start Metro dev server: `CI=1 npx expo start` → Metro on http://localhost:8081. `CI=1`
  keeps it non-interactive (no watch prompt / QR TTY). Confirm a real bundle with
  `curl "http://localhost:8081/index.bundle?platform=ios&dev=true"` (expect HTTP 200).

The core "identify a species" flow needs a **physical camera** and a **Gemini API key**
(`EXPO_PUBLIC_GEMINI_API_KEY` in `apps/mobile/.env`, copied from `.env.example`), so it
cannot be exercised fully in a headless VM — the dev server + full bundle compile is the
practical verification here. `EXPO_PUBLIC_*` vars are inlined at bundle time; restart Metro
after editing `.env`.
