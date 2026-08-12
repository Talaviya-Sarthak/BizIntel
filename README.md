# PS-05 — Enterprise Intelligence Platform

A production-oriented foundation for a **Unified Analytics & AI Assistant**
platform: analytics, backtesting, data exploration, and AI-powered business
insights — backed by a secure, versioned REST API and Neon Serverless
PostgreSQL.

> This repository currently implements the **foundation phase**: a professional
> landing page, a complete authentication module (frontend + backend), the
> backend API foundation, database schema management, and a versioned migration
> system. The Backtesting, DataMart, and AI Assistant modules are intentionally
> **not implemented yet** — the architecture is designed to host them cleanly.

---

## Technology stack

| Layer      | Technology                                              |
| ---------- | ------------------------------------------------------- |
| Frontend   | React 18 · TypeScript · Vite · Tailwind CSS · React Router · TanStack Query |
| Backend    | Node.js · TypeScript · Express · REST (versioned `/api/v1`) |
| Database   | Neon Serverless PostgreSQL · `pg` connection pool       |
| Auth       | JWT (HTTP-only cookies) · bcrypt password hashing       |
| Validation | Zod                                                      |
| Logging    | pino / pino-http (structured, redacted)                 |
| Migrations | Custom forward-only runner with `schema_migrations` tracking |

---

## Requirements

- Node.js **20+** (tested on 22)
- npm 10+
- A Neon PostgreSQL database (or any PostgreSQL 14+)

## Project layout

```
ps05-enterprise-intelligence/
├── frontend/            # React + Vite SPA (landing, auth, dashboard)
├── backend/             # Express REST API (src) + DB tooling (scripts)
├── database/            # schema.sql, migrations/, seed.sql
├── docs/                # architecture, authentication, database guides
├── .env.example         # environment reference
└── package.json         # root orchestration scripts
```

---

## Installation

```bash
# 1. Install dependencies
npm run setup          # installs backend + frontend

# 2. Create environment files
copy .env.example .env         # root (used by database scripts)
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env

# 3. Set your Neon connection string in backend/.env
#    DATABASE_URL=postgresql://user:password@ep-xxx.aws.neon.tech/neondb?sslmode=require
#    JWT_SECRET=<strong random string, 32+ chars>
```

Generate a strong JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Database setup (Neon)

```bash
# Option A — create the complete current schema from the snapshot
psql "$DATABASE_URL" -f database/schema.sql

# Option B — apply migrations from scratch (equivalent result)
npm run db:migrate
npm run db:seed        # optional development demo user
```

Migrating an existing database (recommended workflow):

```bash
npm run db:migrate     # apply only pending migrations (forward-only)
npm run db:status      # show applied / pending migrations + checksums
```

See [database/README.md](database/README.md) and [docs/database.md](docs/database.md).

---

## Running the stack

```bash
npm run dev            # backend (tsx watch, :5000) + frontend (vite, :5173)
npm run dev:backend    # API only
npm run dev:frontend   # frontend only
```

- Frontend: <http://localhost:5173>
- Backend health: <http://localhost:5000/api/v1/health>

In development the Vite dev server proxies `/api` to the backend, so auth
cookies flow same-origin (no CORS friction). When the frontend is served from
another origin, set `VITE_API_URL` and keep `CORS_ORIGIN` in sync.

## Build / typecheck

```bash
npm run build          # production build of both apps
npm run typecheck      # strict TypeScript checks for both apps
```

---

## API overview (v1)

| Method | Endpoint                  | Auth  | Description                        |
| ------ | ------------------------- | ----- | ---------------------------------- |
| GET    | `/api/v1/health`          | —     | Liveness + database connectivity   |
| POST   | `/api/v1/auth/register`   | —     | Create account (auto sign-in)      |
| POST   | `/api/v1/auth/login`      | —     | Sign in, set auth cookie           |
| POST   | `/api/v1/auth/logout`     | —     | Clear auth cookie                  |
| GET    | `/api/v1/auth/me`         | JWT   | Current authenticated user profile |

Consistent response envelopes:

```jsonc
// success
{ "success": true, "data": { "user": { ... } }, "message": "..." }

// error
{ "success": false, "error": { "code": "AUTH_INVALID_CREDENTIALS", "message": "..." } }
```

---

## Development seed account

After `npm run db:seed` (development only):

| Field    | Value          |
| -------- | -------------- |
| Email    | `dev@ps05.local` |
| Password | `DevPass#2026` |

Never use this data anywhere near production.

---

## Contributing a schema change

1. Add `database/migrations/00N_description.sql` (next sequential number).
2. `npm run db:migrate`
3. `npm run db:schema` — regenerates `database/schema.sql` (the snapshot)
4. Commit the migration **and** the regenerated `schema.sql`.

Rules: never rewrite an applied migration, never commit `.env`, never store
plaintext passwords, always express schema changes as migrations.

---

## Backtesting Module

The backtesting module enables strategy simulation against historical market data with realistic execution modeling, transaction costs, and comprehensive performance metrics.

### Quick Start

```typescript
// 1. Upload a CSV dataset with OHLC data
// 2. Configure a backtest via the API
POST /api/v1/backtests
{
  "datasetId": "your-dataset-uuid",
  "strategyId": "sma-crossover",
  "parameters": { "shortWindow": 20, "longWindow": 50 },
  "initialCapital": 10000,
  "commission": 0,
  "slippage": 0.001
}

// 3. Retrieve results with metrics and equity curve
GET /api/v1/backtests/:id
```

### Available Strategies

| Strategy | ID | Best For |
|----------|-----|----------|
| SMA Crossover | `sma-crossover` | Trending markets |
| RSI | `rsi` | Range-bound markets |
| Bollinger Bands | `bollinger-bands` | Volatile markets |

### Key Features

- **Realistic execution:** Next-bar execution at open price
- **Transaction costs:** Configurable commission and slippage
- **Look-ahead bias prevention:** Strict data isolation
- **Performance metrics:** Sharpe, Sortino, Calmar ratios, max drawdown, win rate
- **Benchmark comparison:** Buy & Hold baseline
- **Market data validation:** Automatic column detection and OHLC validation

See [docs/backtesting.md](docs/backtesting.md) for complete documentation.

---

## Documentation

- [docs/architecture.md](docs/architecture.md) — system architecture & layers
- [docs/authentication.md](docs/authentication.md) — auth flows & security
- [docs/database.md](docs/database.md) — database workflow
- [docs/backtesting.md](docs/backtesting.md) — backtesting module reference
- [database/README.md](database/README.md) — schema/migration/seed reference
