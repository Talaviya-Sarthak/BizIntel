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

-- =====================================================================
-- 004_backtesting.sql
-- PS-05 Enterprise Intelligence Platform
--
-- Adds the backtesting module metadata tables:
--   backtests          (a single strategy execution over a dataset)
--   backtest_trades    (executed orders with costs and realized P&L)
--   backtest_metrics   (performance + benchmark metrics)
--   backtest_equity    (portfolio/cash/position/drawdown per timestamp)
--
-- PostgreSQL stores RESULTS/METADATA only. The raw market data stays in
-- the dataset file and is read via DuckDB at execution time.
--
-- NOTE: The migration runner wraps each migration file in a transaction.
-- Do not add BEGIN/COMMIT to migration files.
-- =====================================================================

-- ---------------------------------------------------------------------
-- backtests
-- ---------------------------------------------------------------------
CREATE TABLE backtests (
    id               UUID        NOT NULL DEFAULT gen_random_uuid(),
    user_id          UUID        NOT NULL,
    dataset_id       UUID        NOT NULL,
    strategy_id      TEXT        NOT NULL,
    name             TEXT        NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 200),
    symbol           TEXT        NOT NULL DEFAULT 'ASSET'
                                  CHECK (char_length(symbol) BETWEEN 1 AND 32),
    initial_capital  NUMERIC     NOT NULL CHECK (initial_capital > 0),
    commission       NUMERIC     NOT NULL DEFAULT 0 CHECK (commission >= 0 AND commission < 1),
    slippage         NUMERIC     NOT NULL DEFAULT 0 CHECK (slippage >= 0 AND slippage < 1),
    parameters       JSONB       NOT NULL DEFAULT '{}'::jsonb,
    start_date       TIMESTAMPTZ,
    end_date         TIMESTAMPTZ,
    status           TEXT        NOT NULL DEFAULT 'PENDING'
                                  CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED')),
    error_message    TEXT        CHECK (error_message IS NULL OR char_length(error_message) <= 1000),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT backtests_pkey PRIMARY KEY (id),
    CONSTRAINT backtests_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT backtests_dataset_id_fkey FOREIGN KEY (dataset_id)
        REFERENCES datasets (id) ON DELETE CASCADE
);

-- Every backtest lookup is scoped by owner, then listed newest-first.
CREATE INDEX backtests_user_id_idx ON backtests (user_id);
CREATE INDEX backtests_user_created_at_idx ON backtests (user_id, created_at DESC);
CREATE INDEX backtests_dataset_id_idx ON backtests (dataset_id);
CREATE INDEX backtests_status_idx ON backtests (status);

-- ---------------------------------------------------------------------
-- backtest_trades
-- Executed orders. `price` is the slippage-adjusted execution price.
-- For SELL rows `entry_price` is the average cost basis of the units sold
-- and `pnl` the realized result; BUY rows carry NULL exit/pnl.
-- ---------------------------------------------------------------------
CREATE TABLE backtest_trades (
    id            UUID        NOT NULL DEFAULT gen_random_uuid(),
    backtest_id   UUID        NOT NULL,
    timestamp     TIMESTAMPTZ NOT NULL,
    symbol        TEXT        NOT NULL,
    side          TEXT        NOT NULL CHECK (side IN ('BUY', 'SELL')),
    quantity      NUMERIC     NOT NULL CHECK (quantity > 0),
    price         NUMERIC     NOT NULL CHECK (price > 0),
    entry_price   NUMERIC     CHECK (entry_price IS NULL OR entry_price > 0),
    exit_price    NUMERIC     CHECK (exit_price IS NULL OR exit_price > 0),
    commission    NUMERIC     NOT NULL DEFAULT 0 CHECK (commission >= 0),
    slippage      NUMERIC     NOT NULL DEFAULT 0 CHECK (slippage >= 0),
    pnl           NUMERIC     CHECK (pnl IS NULL OR pnl >= -1000000000000),

    CONSTRAINT backtest_trades_pkey PRIMARY KEY (id),
    CONSTRAINT backtest_trades_backtest_id_fkey FOREIGN KEY (backtest_id)
        REFERENCES backtests (id) ON DELETE CASCADE
);

CREATE INDEX backtest_trades_backtest_id_idx ON backtest_trades (backtest_id);
CREATE INDEX backtest_trades_backtest_id_ts_idx ON backtest_trades (backtest_id, timestamp);

-- ---------------------------------------------------------------------
-- backtest_metrics
-- One row per backtest. All values are decimals (fractions, e.g. 0.1234
-- means 12.34%) except trade counts which are integers.
-- ---------------------------------------------------------------------
CREATE TABLE backtest_metrics (
    id                     UUID        NOT NULL DEFAULT gen_random_uuid(),
    backtest_id            UUID        NOT NULL,
    total_return           NUMERIC,
    annualized_return      NUMERIC,
    cagr                   NUMERIC,
    volatility             NUMERIC,
    sharpe_ratio           NUMERIC,
    sortino_ratio          NUMERIC,
    calmar_ratio           NUMERIC,
    max_drawdown           NUMERIC,
    win_rate               NUMERIC,
    profit_factor          NUMERIC,
    total_trades           INTEGER     NOT NULL DEFAULT 0 CHECK (total_trades >= 0),
    winning_trades         INTEGER     NOT NULL DEFAULT 0 CHECK (winning_trades >= 0),
    losing_trades          INTEGER     NOT NULL DEFAULT 0 CHECK (losing_trades >= 0),
    avg_win                NUMERIC,
    avg_loss               NUMERIC,
    avg_trade              NUMERIC,
    largest_win            NUMERIC,
    largest_loss           NUMERIC,
    final_equity           NUMERIC CHECK (final_equity IS NULL OR final_equity >= 0),
    benchmark_return       NUMERIC,
    benchmark_cagr         NUMERIC,
    benchmark_volatility   NUMERIC,
    benchmark_max_drawdown NUMERIC,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT backtest_metrics_pkey PRIMARY KEY (id),
    CONSTRAINT backtest_metrics_backtest_id_unique UNIQUE (backtest_id),
    CONSTRAINT backtest_metrics_backtest_id_fkey FOREIGN KEY (backtest_id)
        REFERENCES backtests (id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- backtest_equity
-- Portfolio snapshot per processed timestamp. `kind` distinguishes the
-- strategy equity from the Buy & Hold benchmark so both can be charted
-- side by side. `drawdown` is the negative percentage (0 to -100) below
-- the running equity peak.
-- ---------------------------------------------------------------------
CREATE TABLE backtest_equity (
    id             UUID        NOT NULL DEFAULT gen_random_uuid(),
    backtest_id    UUID        NOT NULL,
    kind           TEXT        NOT NULL DEFAULT 'strategy'
                                  CHECK (kind IN ('strategy', 'benchmark')),
    timestamp      TIMESTAMPTZ NOT NULL,
    equity         NUMERIC     NOT NULL CHECK (equity >= 0),
    cash           NUMERIC     NOT NULL CHECK (cash >= 0),
    position_value NUMERIC     NOT NULL CHECK (position_value >= 0),
    daily_return   NUMERIC,
    drawdown       NUMERIC,

    CONSTRAINT backtest_equity_pkey PRIMARY KEY (id),
    CONSTRAINT backtest_equity_backtest_id_fkey FOREIGN KEY (backtest_id)
        REFERENCES backtests (id) ON DELETE CASCADE
);

CREATE INDEX backtest_equity_backtest_id_idx ON backtest_equity (backtest_id);
CREATE INDEX backtest_equity_backtest_id_ts_idx ON backtest_equity (backtest_id, timestamp);

-- ---------------------------------------------------------------------
-- updated_at maintenance trigger for backtests
-- ---------------------------------------------------------------------
CREATE TRIGGER backtests_set_updated_at
    BEFORE UPDATE ON backtests
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- =====================================================================
-- 005_datamart.sql
-- PS-05 Enterprise Intelligence Platform
--
-- Adds the DataMart reusable analytical layer:
--   datamart_analyses          (saved structured queries)
--   datamart_analysis_runs     (execution history/metadata)
--   datamart_metrics           (reusable KPI definitions)
--   datamart_dashboards        (dashboard containers)
--   datamart_dashboard_widgets (widgets bound to analyses/metrics)
--
-- The uploaded dataset remains the source of truth. PostgreSQL stores
-- query CONFIGURATION and METADATA only — never the analytical results.
-- DuckDB executes every query against the original files at run time.
--
-- NOTE: The migration runner wraps each migration file in a transaction.
-- Do not add BEGIN/COMMIT to migration files.
-- =====================================================================

-- ---------------------------------------------------------------------
-- datamart_analyses
-- A saved analytical query. `query_config` is the canonical structured
-- (JSONB) definition used to re-execute against current dataset data.
-- SQL is never stored as the canonical definition.
-- ---------------------------------------------------------------------
CREATE TABLE datamart_analyses (
    id               UUID        NOT NULL DEFAULT gen_random_uuid(),
    user_id          UUID        NOT NULL,
    name             TEXT        NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 200),
    description      TEXT        CHECK (description IS NULL OR char_length(description) <= 1000),
    query_config     JSONB       NOT NULL,
    dataset_ids      JSONB       NOT NULL DEFAULT '[]'::jsonb,
    tags             JSONB       NOT NULL DEFAULT '[]'::jsonb,
    last_executed_at TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT datamart_analyses_pkey PRIMARY KEY (id),
    CONSTRAINT datamart_analyses_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
);

-- Every analysis lookup is scoped by owner, then listed newest-first.
CREATE INDEX datamart_analyses_user_id_idx ON datamart_analyses (user_id);
CREATE INDEX datamart_analyses_user_created_at_idx ON datamart_analyses (user_id, created_at DESC);

-- ---------------------------------------------------------------------
-- datamart_analysis_runs
-- Execution history for saved analyses. Metadata only — result rows are
-- never persisted here (they would go stale the moment the dataset changes).
-- ---------------------------------------------------------------------
CREATE TABLE datamart_analysis_runs (
    id                UUID        NOT NULL DEFAULT gen_random_uuid(),
    analysis_id       UUID        NOT NULL,
    user_id           UUID        NOT NULL,
    status            TEXT        NOT NULL DEFAULT 'SUCCESS'
                        CHECK (status IN ('SUCCESS', 'FAILED')),
    execution_time_ms INTEGER     NOT NULL CHECK (execution_time_ms >= 0),
    rows_returned     INTEGER     NOT NULL DEFAULT 0 CHECK (rows_returned >= 0),
    error_message     TEXT        CHECK (error_message IS NULL OR char_length(error_message) <= 1000),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT datamart_analysis_runs_pkey PRIMARY KEY (id),
    CONSTRAINT datamart_analysis_runs_analysis_id_fkey FOREIGN KEY (analysis_id)
        REFERENCES datamart_analyses (id) ON DELETE CASCADE,
    CONSTRAINT datamart_analysis_runs_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX datamart_analysis_runs_analysis_id_idx ON datamart_analysis_runs (analysis_id);
CREATE INDEX datamart_analysis_runs_user_id_idx ON datamart_analysis_runs (user_id);

-- ---------------------------------------------------------------------
-- datamart_metrics
-- Reusable KPI definitions. `definition` is a JSONB metric built from the
-- safe expression grammar (e.g. { "kind": "formula",
-- "formula": "SUM(profit) / SUM(revenue)" }). `format` is presentation
-- metadata applied client-side; raw analytical values are never altered.
-- ---------------------------------------------------------------------
CREATE TABLE datamart_metrics (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL,
    dataset_id  UUID        NOT NULL,
    name        TEXT        NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
    description TEXT        CHECK (description IS NULL OR char_length(description) <= 1000),
    definition  JSONB       NOT NULL,
    format      TEXT        NOT NULL DEFAULT 'number'
                  CHECK (format IN ('number', 'currency', 'percent', 'decimal', 'compact')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT datamart_metrics_pkey PRIMARY KEY (id),
    CONSTRAINT datamart_metrics_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT datamart_metrics_dataset_id_fkey FOREIGN KEY (dataset_id)
        REFERENCES datasets (id) ON DELETE CASCADE
);

CREATE INDEX datamart_metrics_user_id_idx ON datamart_metrics (user_id);
CREATE INDEX datamart_metrics_dataset_id_idx ON datamart_metrics (dataset_id);

-- ---------------------------------------------------------------------
-- datamart_dashboards
-- Dashboard containers. Layout is a simple responsive column count
-- ('1' | '2' | '3'). Dashboards are private to their owner.
-- ---------------------------------------------------------------------
CREATE TABLE datamart_dashboards (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL,
    name        TEXT        NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 200),
    description TEXT        CHECK (description IS NULL OR char_length(description) <= 1000),
    layout      TEXT        NOT NULL DEFAULT '2'
                  CHECK (layout IN ('1', '2', '3')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT datamart_dashboards_pkey PRIMARY KEY (id),
    CONSTRAINT datamart_dashboards_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX datamart_dashboards_user_id_idx ON datamart_dashboards (user_id);
CREATE INDEX datamart_dashboards_user_created_at_idx ON datamart_dashboards (user_id, created_at DESC);

-- ---------------------------------------------------------------------
-- datamart_dashboard_widgets
-- A widget binds a dashboard to a saved analysis or a saved metric.
-- `configuration` holds chart settings only (type, axes, title, etc.) —
-- never raw analytical results. Results are always freshly executed.
-- ---------------------------------------------------------------------
CREATE TABLE datamart_dashboard_widgets (
    id            UUID        NOT NULL DEFAULT gen_random_uuid(),
    dashboard_id  UUID        NOT NULL,
    type          TEXT        NOT NULL DEFAULT 'table'
                    CHECK (type IN ('kpi', 'table', 'bar', 'line', 'pie', 'scatter', 'area')),
    title         TEXT        NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 200),
    analysis_id   UUID,
    metric_id     UUID,
    configuration JSONB       NOT NULL DEFAULT '{}'::jsonb,
    position      INTEGER     NOT NULL DEFAULT 0 CHECK (position >= 0),
    size          TEXT        NOT NULL DEFAULT 'full'
                    CHECK (size IN ('full', 'half', 'third')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT datamart_dashboard_widgets_pkey PRIMARY KEY (id),
    CONSTRAINT datamart_dashboard_widgets_dashboard_id_fkey FOREIGN KEY (dashboard_id)
        REFERENCES datamart_dashboards (id) ON DELETE CASCADE,
    CONSTRAINT datamart_dashboard_widgets_analysis_id_fkey FOREIGN KEY (analysis_id)
        REFERENCES datamart_analyses (id) ON DELETE SET NULL,
    CONSTRAINT datamart_dashboard_widgets_metric_id_fkey FOREIGN KEY (metric_id)
        REFERENCES datamart_metrics (id) ON DELETE SET NULL,
    CONSTRAINT datamart_dashboard_widgets_source_check CHECK (
        (analysis_id IS NOT NULL) <> (metric_id IS NOT NULL)
    )
);

CREATE INDEX datamart_dashboard_widgets_dashboard_id_idx ON datamart_dashboard_widgets (dashboard_id);
CREATE INDEX datamart_dashboard_widgets_analysis_id_idx ON datamart_dashboard_widgets (analysis_id);
CREATE INDEX datamart_dashboard_widgets_metric_id_idx ON datamart_dashboard_widgets (metric_id);

-- ---------------------------------------------------------------------
-- updated_at maintenance triggers
-- ---------------------------------------------------------------------
CREATE TRIGGER datamart_analyses_set_updated_at
    BEFORE UPDATE ON datamart_analyses
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER datamart_metrics_set_updated_at
    BEFORE UPDATE ON datamart_metrics
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER datamart_dashboards_set_updated_at
    BEFORE UPDATE ON datamart_dashboards
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Record that all migrations are applied so npm run db:status reports
-- the database as fully migrated.
INSERT INTO schema_migrations (version, name, checksum) VALUES
  (1, '001_initial_schema.sql', '37cb0d307380f3b2d324ed81bfb7cde4258449fc4dd930abae39bb4387e884be'),
  (2, '002_add_authentication.sql', '8ee25c28b4e880e96ae816f2b7d085453016b3fee43f40dedd89ab902e987bba'),
  (3, '003_datasets.sql', '9d61cfd0d3fb0d8dcbda9c0362302612e84ee75599a35780d6898383fdae6f37'),
  (4, '004_backtesting.sql', '9bf76b78ec30387d4e980b90961b007f01f505d385050e29843dab8fbd53bc37'),
  (5, '005_datamart.sql', '6a0445154b49bf7e8b26f52cf18739fae4a045d1641ae922c01a3bdd96670a6c')
ON CONFLICT (version) DO NOTHING;

COMMIT;
