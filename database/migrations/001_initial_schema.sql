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
