-- =====================================================================
-- 003_datasets.sql
-- PS-05 Enterprise Intelligence Platform
--
-- Creates the dataset registry for uploaded user datasets.
-- Backtesting and DataMart modules reference datasets by ID.
--
-- NOTE: The migration runner wraps each migration file in a transaction.
-- Do not add BEGIN/COMMIT to migration files.
-- =====================================================================

-- ---------------------------------------------------------------------
-- datasets
-- Metadata for uploaded user datasets. Actual data is stored in DuckDB.
-- ---------------------------------------------------------------------
CREATE TABLE datasets (
    id              UUID        NOT NULL DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL,
    name            TEXT        NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 200),
    description     TEXT,
    filename        TEXT        NOT NULL CHECK (char_length(filename) > 0),
    file_path       TEXT        NOT NULL,
    file_size       BIGINT      NOT NULL CHECK (file_size > 0),
    mime_type       TEXT        NOT NULL DEFAULT 'text/csv',
    row_count       BIGINT,
    column_schema   JSONB       NOT NULL DEFAULT '[]'::jsonb,
    status          TEXT        NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT datasets_pkey PRIMARY KEY (id),
    CONSTRAINT datasets_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT datasets_status_check
        CHECK (status IN ('pending', 'processing', 'ready', 'failed'))
);

CREATE INDEX datasets_user_id_idx ON datasets (user_id);
CREATE INDEX datasets_status_idx ON datasets (status);
CREATE INDEX datasets_created_at_idx ON datasets (created_at DESC);

-- Auto-update updated_at
CREATE TRIGGER datasets_set_updated_at
    BEFORE UPDATE ON datasets
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
