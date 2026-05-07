# AGENTS.md

## Cursor Cloud specific instructions

### Project Overview

Chinese Mortgage Calculator (房贷计算器) — a full-stack TypeScript app with React 19 frontend + Hono backend served via tRPC, built with Vite.

### Running the Dev Server

```bash
npm run dev
```

This starts a single Vite dev server on **port 3000** that serves both the React SPA frontend and the Hono/tRPC API backend (via `@hono/vite-dev-server`). No separate backend process is needed.

### Key Commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Lint | `npm run lint` |
| Type check | `npm run check` |
| Tests | `npm test` |
| Format | `npm run format` |
| Build | `npm run build` |

### Important Notes

- **Node.js 20** is required (set via `nvm use 20`). The nvm default alias should be set to 20.
- **No database required for dev** — the MySQL/Drizzle ORM schema exists but no API routes currently query it. All calculation logic and city price data are in-memory from `contracts/loan.ts`.
- **No `.env` secrets needed for dev** — `APP_ID`, `APP_SECRET`, and `DATABASE_URL` are only enforced in production (`NODE_ENV=production`).
- **Lint errors are pre-existing** — shadcn/ui components produce `react-refresh/only-export-components` warnings. These are expected and not caused by your changes.
- **No test files exist yet** — `npm test` (vitest) looks for `api/**/*.test.ts` files but the repo has none, so it exits with code 1. This is expected.
- The tRPC API is accessible at `/api/trpc/*` (e.g., `/api/trpc/ping` for health check).
