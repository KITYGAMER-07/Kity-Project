# KITY Digital Store

A single-page React + Vite + Tailwind storefront for selling digital game keys
with a built-in admin panel, UPI QR payments, trial code redemption, broadcast
messaging and feedback.

## Stack

- React 19 + TypeScript
- Vite 7 (with `vite-plugin-singlefile` — entire app bundles to one HTML file)
- Tailwind CSS 4 (via `@tailwindcss/vite`)
- `qrcode.react` for UPI payment QR codes
- Persistence: browser `localStorage` (no backend; the project is fully client-side)

## Project structure

```
index.html              Vite entry HTML
vite.config.ts          Vite config (port 5000, host 0.0.0.0, allowedHosts: true)
vercel.json             Vercel build/rewrite/cache config
src/
  main.tsx              React root mount
  App.tsx               Manual page router (state-based, no react-router)
  index.css             Tailwind theme tokens, animations, utility classes
  store/
    db.ts               Typed localStorage data layer + demo seed data
    AppContext.tsx      Auth + navigation context provider
    helpers.ts          Re-exports + formatting helpers
  components/
    Navbar.tsx
    HomePage.tsx
    LoginPage.tsx       Username login + admin key login (key: sri@1234)
    GamesPage.tsx
    GameDetailPage.tsx  Plan selection, UPI QR, proof upload, status polling
    ProfilePage.tsx     Profile, history, trial redemption, feedback
    AdminPanel.tsx      10-tab admin: dashboard, files, prices, keys,
                        payments, trials, users, feedback, settings, broadcast
  utils/
    cn.ts               clsx + tailwind-merge helper
```

## Scripts

- `npm run dev` — Vite dev server on port 5000
- `npm run build` — TypeScript check + Vite production build to `dist/`
- `npm run preview` — Preview the production build
- `npm run typecheck` — TypeScript check only

## Deployment (Vercel)

The project is configured for one-click Vercel deploys:

- `vercel.json` sets framework to `vite`, build command `npm run build`,
  output directory `dist`, and SPA rewrites so any path serves `index.html`.
- `.vercelignore` excludes local-only environment files and `node_modules`.
- `engines.node >= 20` in `package.json` pins the runtime.

Steps: connect the repo to Vercel → it auto-detects Vite → deploy.

## Environment

A PostgreSQL database is provisioned (env: `DATABASE_URL`, `PGHOST`,
`PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`) but the current frontend uses
`localStorage` only. The DB is reserved for future server-side features.

## Recent changes

- 2026-04-25: Provisioned PostgreSQL database.
- 2026-04-25: Added Vercel build config (`vercel.json`, `.vercelignore`),
  `.gitignore`, Node engine pin, and `tsc --noEmit` in the build script.
  Fixed bugs: stat string concatenation in `HomePage`, invalid Tailwind
  class `text-x2` → `text-xl`, deprecated `String.prototype.substr`, and
  cleaned up an import path in `AppContext`.
