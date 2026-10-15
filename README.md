# web

Independent repository for the existing Miles & Moments web. Includes app source under `apps/web` and local shared packages under `packages/`; no sibling repository is required to resolve shared source.

## Run

Use Node.js 20+ and pnpm 10+ (workspace dependencies require pnpm).

```sh
pnpm install
cp apps/web/.env.example apps/web/.env
pnpm dev
pnpm typecheck
```

The Next.js server proxies `/api` to `API_INTERNAL_URL`. Set that variable in your hosting environment. The APK binary is excluded; distribute it separately.

All four clients require the same separately running backend API. This repository does not contain the backend, database, real environment secrets, installed dependencies, or build outputs. Shared package copies are independent after export; coordinate future shared changes across repositories.

## Push to an empty GitHub repository

Run from this folder, replacing YOUR_ACCOUNT:

```sh
git init -b main
git add .
git commit -m "Initial web source"
git remote add origin https://github.com/YOUR_ACCOUNT/web.git
git push -u origin main
```

Commit the generated `pnpm-lock.yaml` after installing dependencies for reproducible installs.

## One website, two routes

Customer: `/` (also `/download` and `/track`). Admin: `/admin`. Both use the same domain and Next.js server on port 3000. `/api/*` is proxied to the separate backend. Set API_INTERNAL_URL in apps/web/.env (local) or in the hosting environment, without a trailing slash or /api prefix. Build with `pnpm build`, then serve with `pnpm start`. Admin authentication and server-side role checks remain in place.
