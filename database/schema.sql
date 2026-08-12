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

-- =====================================================================
-- 004_backtesting.sql
-- PS-05 Enterprise Intelligence Platform
--
-- Creates backtesting tables: backtests, backtest_trades,
-- backtest_metrics, backtest_equity.
--
-- NOTE: The migration runner wraps each migration file in a transaction.
-- Do not add BEGIN/COMMIT to migration files.
-- =====================================================================

-- ---------------------------------------------------------------------
-- backtests
-- Master record for each backtest execution.
-- ---------------------------------------------------------------------
CREATE TABLE backtests (
    id              UUID        NOT NULL DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL,
    dataset_id      UUID        NOT NULL,
    strategy_id     TEXT        NOT NULL,
    name            TEXT        NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 200),
    parameters      JSONB       NOT NULL DEFAULT '{}'::jsonb,
    initial_capital NUMERIC(18,2) NOT NULL DEFAULT 100000.00,
    commission      NUMERIC(10,6) NOT NULL DEFAULT 0.001,
    slippage        NUMERIC(10,6) NOT NULL DEFAULT 0.0005,
    start_date      TIMESTAMPTZ,
    end_date        TIMESTAMPTZ,
    status          TEXT        NOT NULL DEFAULT 'pending',
    error_message   TEXT,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT backtests_pkey PRIMARY KEY (id),
    CONSTRAINT backtests_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT backtests_dataset_id_fkey FOREIGN KEY (dataset_id)
        REFERENCES datasets (id) ON DELETE CASCADE,
    CONSTRAINT backtests_status_check
        CHECK (status IN ('pending', 'running', 'completed', 'failed'))
);

CREATE INDEX backtests_user_id_idx ON backtests (user_id);
CREATE INDEX backtests_dataset_id_idx ON backtests (dataset_id);
CREATE INDEX backtests_status_idx ON backtests (status);
CREATE INDEX backtests_created_at_idx ON backtests (created_at DESC);

CREATE TRIGGER backtests_set_updated_at
    BEFORE UPDATE ON backtests
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- backtest_trades
-- Individual simulated trade records from backtest runs.
-- ---------------------------------------------------------------------
CREATE TABLE backtest_trades (
    id              UUID        NOT NULL DEFAULT gen_random_uuid(),
    backtest_id     UUID        NOT NULL,
    timestamp       TIMESTAMPTZ NOT NULL,
    side            TEXT        NOT NULL,
    quantity        NUMERIC(18,8) NOT NULL,
    price           NUMERIC(18,8) NOT NULL,
    execution_price NUMERIC(18,8) NOT NULL,
    commission      NUMERIC(18,8) NOT NULL DEFAULT 0,
    slippage_amount NUMERIC(18,8) NOT NULL DEFAULT 0,
    pnl             NUMERIC(18,8),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT backtest_trades_pkey PRIMARY KEY (id),
    CONSTRAINT backtest_trades_backtest_id_fkey FOREIGN KEY (backtest_id)
        REFERENCES backtests (id) ON DELETE CASCADE,
    CONSTRAINT backtest_trades_side_check
        CHECK (side IN ('BUY', 'SELL'))
);

CREATE INDEX backtest_trades_backtest_id_idx ON backtest_trades (backtest_id);
CREATE INDEX backtest_trades_timestamp_idx ON backtest_trades (backtest_id, timestamp);

-- ---------------------------------------------------------------------
-- backtest_metrics
-- Computed performance metrics for a completed backtest.
-- ---------------------------------------------------------------------
CREATE TABLE backtest_metrics (
    id                  UUID        NOT NULL DEFAULT gen_random_uuid(),
    backtest_id         UUID        NOT NULL,
    total_return        NUMERIC(18,8),
    annualized_return   NUMERIC(18,8),
    volatility          NUMERIC(18,8),
    sharpe_ratio        NUMERIC(18,8),
    sortino_ratio       NUMERIC(18,8),
    max_drawdown        NUMERIC(18,8),
    calmar_ratio        NUMERIC(18,8),
    win_rate            NUMERIC(18,8),
    profit_factor       NUMERIC(18,8),
    total_trades        INTEGER,
    winning_trades      INTEGER,
    losing_trades       INTEGER,
    avg_winning_trade   NUMERIC(18,8),
    avg_losing_trade    NUMERIC(18,8),
    largest_winning_trade NUMERIC(18,8),
    largest_losing_trade  NUMERIC(18,8),
    avg_trade           NUMERIC(18,8),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT backtest_metrics_pkey PRIMARY KEY (id),
    CONSTRAINT backtest_metrics_backtest_id_fkey FOREIGN KEY (backtest_id)
        REFERENCES backtests (id) ON DELETE CASCADE
);

CREATE INDEX backtest_metrics_backtest_id_idx ON backtest_metrics (backtest_id);

-- ---------------------------------------------------------------------
-- backtest_equity
-- Equity curve data points recorded at each processed timestamp.
-- ---------------------------------------------------------------------
CREATE TABLE backtest_equity (
    id              UUID        NOT NULL DEFAULT gen_random_uuid(),
    backtest_id     UUID        NOT NULL,
    timestamp       TIMESTAMPTZ NOT NULL,
    equity          NUMERIC(18,8) NOT NULL,
    cash            NUMERIC(18,8) NOT NULL,
    position_value  NUMERIC(18,8) NOT NULL,
    daily_return    NUMERIC(18,8),
    drawdown        NUMERIC(18,8),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT backtest_equity_pkey PRIMARY KEY (id),
    CONSTRAINT backtest_equity_backtest_id_fkey FOREIGN KEY (backtest_id)
        REFERENCES backtests (id) ON DELETE CASCADE
);

CREATE INDEX backtest_equity_backtest_id_idx ON backtest_equity (backtest_id);
CREATE INDEX backtest_equity_timestamp_idx ON backtest_equity (backtest_id, timestamp);

-- Record that all migrations are applied so npm run db:status reports
-- the database as fully migrated.
INSERT INTO schema_migrations (version, name, checksum) VALUES
  (1, '001_initial_schema.sql', '37cb0d307380f3b2d324ed81bfb7cde4258449fc4dd930abae39bb4387e884be'),
  (2, '002_add_authentication.sql', '8ee25c28b4e880e96ae816f2b7d085453016b3fee43f40dedd89ab902e987bba'),
  (3, '003_datasets.sql', 'placeholder_checksum_003'),
  (4, '004_backtesting.sql', 'placeholder_checksum_004')
ON CONFLICT (version) DO NOTHING;

COMMIT;
