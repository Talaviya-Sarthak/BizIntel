# Database

PS-05 uses **Neon Serverless PostgreSQL**. All credentials come from
`DATABASE_URL`; nothing is hardcoded and `.env` is never committed.

## Neon setup

1. Create a project at <https://neon.tech>.
2. Copy the connection string (direct or pooled).
3. Put it in `backend/.env`:

```env
DATABASE_URL=postgresql://user:password@ep-xxxx.aws.neon.tech/neondb?sslmode=require
```

> Neon supports the standard PostgreSQL wire protocol, so `schema.sql`,
> `migrations/`, and the `pg` driver all work unchanged.

## Files

| File                        | Purpose                                        |
| --------------------------- | ---------------------------------------------- |
| `database/schema.sql`       | **Complete current database state** (generated snapshot) |
| `database/migrations/*.sql` | Ordered, forward-only **history** of changes   |
| `database/seed.sql`         | Development-only demo data (idempotent)        |

### The schema.sql ↔ migrations contract

- **Migrations = history.** Every schema change is a new file
  (`001_initial_schema.sql`, `002_add_authentication.sql`, …). Applied
  migrations are never rewritten.
- **schema.sql = snapshot.** It reproduces the entire current database from an
  empty one, including the `schema_migrations` registry. A new developer can
  build the whole database with one command.

```bash
psql "$DATABASE_URL" -f database/schema.sql
```

`schema.sql` is **generated** from the applied migrations:

```bash
npm run db:schema
```

After any migration change, regenerate the snapshot and commit both files.

## Migration tracking

Applied migrations are recorded in `schema_migrations`:

```sql
CREATE TABLE schema_migrations (
    version    INTEGER     PRIMARY KEY,
    name       TEXT        NOT NULL,
    checksum   TEXT        NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- `checksum` is the SHA-256 of the migration file at apply time. If an applied
  migration's file changes on disk, `db:migrate`/`db:status` report a
  **checksum mismatch** — a signal that history was rewritten.
- The runner applies only **pending** migrations, each inside its own
  transaction (forward-only; no automatic rollback).
- Because `schema.sql` records the migrations as applied, a database built from
  the snapshot reports fully migrated with no pending items.

## Commands

Run from the repository root (they execute in `backend/`):

| Command                 | Description                                        |
| ----------------------- | -------------------------------------------------- |
| `npm run db:migrate`    | Apply only pending migrations (transactional)      |
| `npm run db:status`     | List applied / pending migrations with checksums   |
| `npm run db:seed`       | Insert development demo data (idempotent)          |
| `npm run db:schema`     | Regenerate `database/schema.sql` from migrations   |
| `npm run db:setup`      | `db:migrate` then `db:seed`                        |

`DATABASE_URL` is read from `backend/.env` or the repository root `.env`.

## Developer workflow

### New developer, empty database

```bash
psql "$DATABASE_URL" -f database/schema.sql   # complete schema in one step
psql "$DATABASE_URL" -f database/seed.sql     # optional demo user
```

### Adding a schema change

```bash
# 1. create database/migrations/00N_description.sql
npm run db:migrate     # 2. apply
npm run db:schema      # 3. refresh the snapshot
# 4. commit the migration + regenerated schema.sql
```

### Verifying state

```bash
npm run db:status
```

## Seed data

`database/seed.sql` creates one **development-only** demo user:

| Field    | Value          |
| -------- | -------------- |
| Email    | `dev@ps05.local` |
| Password | `DevPass#2026` |

The stored value is a valid bcrypt hash. The seed is idempotent
(`ON CONFLICT (lower(email)) DO NOTHING`) and safe to re-run. It must never
contain production credentials.

## Current schema (v0.1)

- `schema_migrations` — migration registry.
- `users`
  - `id` UUID PK (`gen_random_uuid()`)
  - `name`, `email` (unique case-insensitive), `password_hash`
  - `role` (`user` | `owner` | `admin`), `is_active`, `email_verified`
  - `created_at` / `updated_at` (maintained by an `updated_at` trigger)
  - Check constraints on name/email/password length and role
- `datasets`
  - `id` UUID PK (`gen_random_uuid()`)
  - `user_id` UUID FK → users
  - `name`, `description`, `status` (pending/processing/ready/failed)
  - `row_count`, `column_info` (JSONB), `file_name`, `file_size`
  - `created_at` / `updated_at`
- `backtests`
  - `id` UUID PK (`gen_random_uuid()`)
  - `user_id` UUID FK → users
  - `dataset_id` UUID FK → datasets
  - `strategy_id` TEXT, `name` TEXT, `parameters` JSONB
  - `initial_capital` DECIMAL, `commission` DECIMAL, `slippage` DECIMAL
  - `start_date` DATE, `end_date` DATE
  - `status` ENUM (pending/running/completed/failed)
  - `error_message` TEXT, `started_at` TIMESTAMPTZ, `completed_at` TIMESTAMPTZ
  - `created_at` / `updated_at`
- `backtest_trades`
  - `id` UUID PK (`gen_random_uuid()`)
  - `backtest_id` UUID FK → backtests (CASCADE DELETE)
  - `timestamp` TIMESTAMPTZ, `side` TEXT (BUY/SELL)
  - `quantity` INTEGER, `price` DECIMAL, `execution_price` DECIMAL
  - `commission` DECIMAL, `slippage_amount` DECIMAL, `pnl` DECIMAL
  - `created_at` TIMESTAMPTZ
- `backtest_metrics`
  - `id` UUID PK (`gen_random_uuid()`)
  - `backtest_id` UUID FK → backtests (CASCADE DELETE)
  - `total_return`, `annualized_return`, `volatility`, `sharpe_ratio`
  - `sortino_ratio`, `max_drawdown`, `calmar_ratio`
  - `win_rate`, `profit_factor`, `total_trades`, `winning_trades`, `losing_trades`
  - `avg_winning_trade`, `avg_losing_trade`, `largest_winning_trade`, `largest_losing_trade`
  - `avg_trade` DECIMAL, `created_at` TIMESTAMPTZ
- `backtest_equity`
  - `id` UUID PK (`gen_random_uuid()`)
  - `backtest_id` UUID FK → backtests (CASCADE DELETE)
  - `timestamp` TIMESTAMPTZ, `equity` DECIMAL, `cash` DECIMAL
  - `position_value` DECIMAL, `daily_return` DECIMAL, `drawdown` DECIMAL
  - `created_at` TIMESTAMPTZ

Future entities (organizations, strategies, AI conversations, …) will be added
as new migrations — never by editing the existing ones.

## Rules

1. Never hardcode database credentials — use `DATABASE_URL`.
2. Never commit `.env`.
3. Never store plaintext passwords.
4. Never modify production tables outside a migration.
5. Never rewrite an already-applied migration.
6. Every schema change requires a new migration.
7. `schema.sql` must always reflect the latest complete schema.
8. Keep migrations sequential, deterministic, and transactional.
9. Keep database initialization reproducible.
