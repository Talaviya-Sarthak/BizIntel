# Architecture

PS-05 is built as two decoupled applications (frontend + backend) sharing one
PostgreSQL database and one versioned REST contract. Every layer has a single,
well-defined responsibility.

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React + Vite + Tailwind)                         │
│  pages · features · components · hooks · services · routes │
└──────────────────────────┬──────────────────────────────────┘
                           │  HTTP/JSON (REST /api/v1)  +  cookies
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  REST API  (Express)                                        │
│  routes ──► controllers ──► services ──► repositories       │
│               ▲            ▲            ▲                   │
│               │            │            │                   │
│         validators     utils        pg (Pool)               │
│         (Zod)        error/cookies                          │
└──────────────────────────┬──────────────────────────────────┘
                           │  PostgreSQL wire protocol
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Neon Serverless PostgreSQL                                 │
│  schema_migrations · users (schema.sql + migrations/)       │
└─────────────────────────────────────────────────────────────┘
```

## Request lifecycle (example: `POST /api/v1/auth/login`)

1. **Route** (`routes/v1/auth.routes.ts`) wires middleware + controller.
2. **Rate limiter** (`middlewares/rateLimiter.ts`) applies to auth endpoints.
3. **Validation** (`middlewares/validate.ts` + `validators/auth.validator.ts`)
   parses and type-checks the body with Zod at the API boundary.
4. **Controller** (`controllers/auth.controller.ts`) orchestrates HTTP concerns
   (status codes, cookies, response envelope) and stays thin.
5. **Service** (`services/auth.service.ts`) holds business logic: normalization,
   account-existence checks, password hashing/verification, token issuance.
6. **Repository** (`repositories/user.repository.ts`) is the only layer that
   touches SQL. Controllers never run queries.
7. Errors bubble to the **centralized error handler**
   (`middlewares/errorHandler.ts`) and become a consistent error envelope.

## Backend module map

| Module                  | Responsibility                                   |
| ----------------------- | ------------------------------------------------ |
| `config/env.ts`         | Zod-validated environment configuration (fail-fast) |
| `config/database.ts`    | `pg` connection pool (Neon `DATABASE_URL`)       |
| `config/logger.ts`      | pino logger + HTTP logging with redaction        |
| `routes/v1/*`           | Versioned route definitions                      |
| `controllers/*`         | HTTP concerns only                               |
| `services/*`            | Business logic                                   |
| `repositories/*`        | SQL access (parameterized queries)               |
| `validators/*`          | Zod request schemas                              |
| `middlewares/*`         | Auth, validation, rate limiting, error handling  |
| `models/*`              | Entities + safe public shapes (no password_hash) |
| `utils/*`               | Cross-cutting helpers (JWT, cookies, errors)     |
| `scripts/*`             | Migration/seed/schema tooling                    |

## Frontend module map

| Module                         | Responsibility                                    |
| ------------------------------ | ------------------------------------------------- |
| `features/landing/`            | Public marketing site (navbar, hero, sections)    |
| `features/auth/`               | Auth UI + `AuthProvider` (single source of truth) |
| `features/dashboard/`          | Authenticated placeholder workspace              |
| `services/api/auth.service.ts` | All auth API calls (isolated)                    |
| `lib/api.ts`                   | Centralized axios client + error normalization   |
| `routes/`                      | Route table + `ProtectedRoute` / `GuestRoute`    |

## Key decisions

- **Separation of concerns.** Controllers never touch SQL; repositories never
  format HTTP responses. This keeps each module small and testable.
- **Centralized configuration.** All environment variables are validated once
  in `config/env.ts`; secrets are never imported in scattered places.
- **API versioning.** Everything lives under `/api/v1`, so future breaking
  changes can be introduced as `/api/v2` without disrupting clients.
- **Auth state abstraction.** The `AuthProvider` + `useAuth()` hook is the only
  place authentication state lives; components never duplicate session logic.
- **No database logic in routes.** Database access is exclusively through
  repositories via a shared `pg` pool.
- **Extension points.** New modules (Backtesting, DataMart, AI Assistant,
  Organizations, Teams, Datasets) are intended to follow the same
  route → controller → service → repository pattern and be mounted under
  `/api/v1/`. Database additions always arrive as migrations.

## Environment layers

| Variable          | Used by        | Purpose                              |
| ----------------- | -------------- | ------------------------------------ |
| `NODE_ENV`        | backend        | Runtime mode (drives security flags) |
| `PORT`            | backend        | API listen port                      |
| `DATABASE_URL`    | backend/scripts| Neon connection string               |
| `JWT_SECRET`      | backend        | Token signing secret                 |
| `JWT_EXPIRES_IN`  | backend        | Access-token lifetime                |
| `AUTH_COOKIE_NAME`| backend        | Auth cookie name                     |
| `CORS_ORIGIN`     | backend        | Allowed frontend origins             |
| `VITE_API_URL`    | frontend       | API base URL (defaults to `/api/v1`) |
