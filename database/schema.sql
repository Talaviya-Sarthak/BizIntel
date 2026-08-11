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

-- =====================================================================
-- 003_datasets.sql
-- PS-05 Enterprise Intelligence Platform
--
-- Adds the dataset registry and column metadata tables:
--   datasets         (file metadata, status, profiling summary)
--   dataset_columns  (per-column schema + profile statistics)
--
-- PostgreSQL stores METADATA only; the raw file lives in abstracted
-- storage (StorageService) and analytical scans run in DuckDB.
--
-- NOTE: The migration runner wraps each migration file in a transaction.
-- Do not add BEGIN/COMMIT to migration files.
-- =====================================================================

-- ---------------------------------------------------------------------
-- datasets
-- ---------------------------------------------------------------------
CREATE TABLE datasets (
    id                UUID        NOT NULL DEFAULT gen_random_uuid(),
    user_id           UUID        NOT NULL,
    name              TEXT        NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
    description       TEXT        CHECK (description IS NULL OR char_length(description) <= 500),
    original_filename TEXT        NOT NULL CHECK (char_length(original_filename) BETWEEN 1 AND 255),
    storage_path      TEXT        CHECK (storage_path IS NULL OR char_length(storage_path) BETWEEN 1 AND 500),
    file_type         TEXT        NOT NULL DEFAULT 'csv' CHECK (file_type IN ('csv', 'parquet', 'xlsx', 'json')),
    file_size         BIGINT      NOT NULL CHECK (file_size >= 0),
    row_count         BIGINT      CHECK (row_count IS NULL OR row_count >= 0),
    column_count      INTEGER     CHECK (column_count IS NULL OR column_count >= 0),
    status            TEXT        NOT NULL DEFAULT 'UPLOADING'
                        CHECK (status IN ('UPLOADING', 'VALIDATING', 'PROCESSING', 'READY', 'FAILED', 'DELETED')),
    error_message     TEXT        CHECK (error_message IS NULL OR char_length(error_message) <= 1000),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT datasets_pkey PRIMARY KEY (id),
    CONSTRAINT datasets_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
);

-- Every dataset lookup is scoped by owner.
CREATE INDEX datasets_user_id_idx ON datasets (user_id);
CREATE INDEX datasets_user_created_at_idx ON datasets (user_id, created_at DESC);
CREATE INDEX datasets_status_idx ON datasets (status);

-- ---------------------------------------------------------------------
-- dataset_columns
-- Describes each detected column so the platform understands a dataset
-- without repeatedly scanning the original file.
-- ---------------------------------------------------------------------
CREATE TABLE dataset_columns (
    id               UUID        NOT NULL DEFAULT gen_random_uuid(),
    dataset_id       UUID        NOT NULL,
    column_name      TEXT        NOT NULL,
    data_type        TEXT        NOT NULL,
    nullable         BOOLEAN     NOT NULL DEFAULT TRUE,
    ordinal_position INTEGER     NOT NULL CHECK (ordinal_position >= 1),
    unique_count     BIGINT      CHECK (unique_count IS NULL OR unique_count >= 0),
    null_count       BIGINT      CHECK (null_count IS NULL OR null_count >= 0),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT dataset_columns_pkey PRIMARY KEY (id),
    CONSTRAINT dataset_columns_dataset_id_fkey FOREIGN KEY (dataset_id)
        REFERENCES datasets (id) ON DELETE CASCADE,
    CONSTRAINT dataset_columns_position_unique UNIQUE (dataset_id, ordinal_position)
);

CREATE INDEX dataset_columns_dataset_id_idx ON dataset_columns (dataset_id);

-- ---------------------------------------------------------------------
-- updated_at maintenance trigger for datasets
-- ---------------------------------------------------------------------
CREATE TRIGGER datasets_set_updated_at
    BEFORE UPDATE ON datasets
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Record that all migrations are applied so npm run db:status reports
-- the database as fully migrated.
INSERT INTO schema_migrations (version, name, checksum) VALUES
  (1, '001_initial_schema.sql', '37cb0d307380f3b2d324ed81bfb7cde4258449fc4dd930abae39bb4387e884be'),
  (2, '002_add_authentication.sql', '8ee25c28b4e880e96ae816f2b7d085453016b3fee43f40dedd89ab902e987bba'),
  (3, '003_datasets.sql', 'e4c84b5feb6eb5e9417bdee014bb46df73f8dc18cb642dcfffcd178247a3f2e3')
ON CONFLICT (version) DO NOTHING;

COMMIT;
