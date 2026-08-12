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
