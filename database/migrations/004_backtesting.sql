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
