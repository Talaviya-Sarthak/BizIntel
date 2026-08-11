# PS-05 Database

PostgreSQL (Neon Serverless) schema, migrations, and seed data for the
Enterprise Intelligence Platform.

## Layout

| Path                  | Purpose                                                        |
| --------------------- | -------------------------------------------------------------- |
| `schema.sql`          | **Complete current database state.** Creates the whole database |
| `migrations/`         | **Ordered history of database changes** (forward-only)          |
| `seed.sql`            | Development-only demo data (idempotent)                         |
| `README.md`           | This document                                                   |

## Core concept

* **Migrations = history.** Every schema change is a new file
  (`003_add_organizations.sql`, …). Never rewrite an applied migration.
* **`schema.sql` = snapshot.** It reproduces the entire current database
  from an empty database, including the migration tracking table.

Both must stay in sync. `schema.sql` is **generated** from the applied
migrations by:

```bash
npm run db:schema
```

After adding a migration and running `npm run db:migrate`, regenerate the
snapshot and commit it alongside the migration.

## Quick start (new database)

```bash
psql "$DATABASE_URL" -f database/schema.sql
```

This creates the complete current schema. For a demo user as well:

```bash
psql "$DATABASE_URL" -f database/seed.sql
```

## Migration workflow

Run from the repository root (uses `DATABASE_URL` from `backend/.env` or
the environment):

```bash
npm run db:migrate     # apply only pending migrations (transactional, forward-only)
npm run db:status      # show applied / pending migrations with checksums
npm run db:seed        # insert development demo data (idempotent)
```

To add a schema change:

1. Create `database/migrations/00N_description.sql` with the next sequential
   number. Do **not** edit already-applied migrations.
2. Run `npm run db:migrate`.
3. Run `npm run db:schema` to regenerate `database/schema.sql`.
4. Commit both the migration and the updated `schema.sql`.

## Migration tracking

Applied migrations are recorded in `schema_migrations`:

| Column      | Type     | Description                          |
| ----------- | -------- | ------------------------------------ |
| `version`   | integer  | Sequential version (PK)              |
| `name`      | text     | Migration file name                  |
| `checksum`  | text     | SHA-256 of the file at apply time    |
| `applied_at`| timestamptz | When it was applied               |

`db:status` compares the files on disk against this table to determine
which migrations are pending.

## Rules

1. Never hardcode database credentials — always use `DATABASE_URL`.
2. Never commit `.env`.
3. Never store plaintext passwords.
4. Never modify production tables outside a migration.
5. Never rewrite an already-applied migration.
6. Every schema change requires a new migration.
7. `schema.sql` must always reflect the latest complete schema.
8. Keep migrations sequential, deterministic, and transactional.
9. Keep database initialization reproducible.
