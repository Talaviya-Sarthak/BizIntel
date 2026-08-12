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
