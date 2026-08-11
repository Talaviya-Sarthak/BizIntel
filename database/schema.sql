-- =============================================================================
-- schema.sql — PS-05 Enterprise Intelligence Platform
--
-- GENERATED FILE. Do not edit by hand.
-- Represents the COMPLETE CURRENT DATABASE STATE (all migrations applied).
--
-- Regenerate after migration changes with:
--     npm run db:schema
--
-- Create a fresh database from scratch:
--     psql "$DATABASE_URL" -f database/schema.sql
-- =============================================================================

BEGIN;

-- Migration tracking (applied-migration registry)
CREATE TABLE IF NOT EXISTS schema_migrations (
    version    INTEGER     PRIMARY KEY,
    name       TEXT        NOT NULL,
    checksum   TEXT        NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Migrations (applied in order)
-- -----------------------------------------------------------------------------
-- =====================================================================
-- 001_initial_schema.sql
-- PS-05 Enterprise Intelligence Platform
--
-- Foundation schema: pgcrypto extension + users table.
--
-- NOTE: The migration runner wraps each migration file in a transaction.
-- Do not add BEGIN/COMMIT to migration files.
-- =====================================================================

-- UUID generation support (gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- users
-- Base account model. Authentication-related columns are added by
-- migration 002 so this file demonstrates the additive migration flow.
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id            UUID        NOT NULL DEFAULT gen_random_uuid(),
    name          TEXT        NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
    email         TEXT        NOT NULL CHECK (char_length(email) BETWEEN 5 AND 320),
    password_hash TEXT        NOT NULL CHECK (char_length(password_hash) >= 20),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Case-insensitive uniqueness: emails are normalized to lowercase by the
-- application, but this index is a defensive guarantee.
CREATE UNIQUE INDEX users_email_unique_idx ON users (lower(email));

CREATE INDEX users_created_at_idx ON users (created_at DESC);

-- ---------------------------------------------------------------------
-- updated_at maintenance trigger (shared helper)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_set_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- =====================================================================
-- 002_add_authentication.sql
-- PS-05 Enterprise Intelligence Platform
--
-- Adds authentication-related columns to `users`:
--   role, is_active, email_verified
-- This migration demonstrates the additive (forward-only) workflow.
--
-- NOTE: The migration runner wraps each migration file in a transaction.
-- Do not add BEGIN/COMMIT to migration files.
-- =====================================================================

ALTER TABLE users
    ADD COLUMN role           TEXT        NOT NULL DEFAULT 'user',
    ADD COLUMN is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
    ADD COLUMN email_verified BOOLEAN     NOT NULL DEFAULT FALSE;

-- Restrict allowed roles.
ALTER TABLE users
    ADD CONSTRAINT users_role_check
    CHECK (role IN ('user', 'owner', 'admin'));

-- Indexes used by authentication lookups and future admin queries.
CREATE INDEX users_role_idx ON users (role);
CREATE INDEX users_is_active_idx ON users (is_active);

-- Record that all migrations are applied so npm run db:status reports
-- the database as fully migrated.
INSERT INTO schema_migrations (version, name, checksum) VALUES
  (1, '001_initial_schema.sql', '37cb0d307380f3b2d324ed81bfb7cde4258449fc4dd930abae39bb4387e884be'),
  (2, '002_add_authentication.sql', '8ee25c28b4e880e96ae816f2b7d085453016b3fee43f40dedd89ab902e987bba')
ON CONFLICT (version) DO NOTHING;

COMMIT;
