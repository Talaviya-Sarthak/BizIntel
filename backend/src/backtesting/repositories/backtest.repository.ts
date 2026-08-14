import type { PoolClient } from 'pg';
import { pool } from '../../config/database.js';
import type {
  BacktestRow,
  BacktestStatus,
  BenchmarkMetrics,
  EquityPoint,
  EquitySeriesPoint,
  PerformanceMetrics,
  TradeRecord,
  BacktestSummary,
} from '../types/index.js';

/** Reusable client/table abstraction: prefer an explicit client for transactions. */
function db(client?: PoolClient): PoolClient | typeof pool {
  return client ?? pool;
}

/**
 * Rows per multi-row INSERT. Kept well under Postgres' 65535 parameter limit
 * (equity = 8 params/row → 200 rows = 1600 params; trades = 11 → 2200) while
 * collapsing thousands of high-latency round-trips (e.g. Neon) into a handful.
 */
const INSERT_BATCH_SIZE = 200;

function chunked<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

interface BacktestWriteRow {
  id: string;
  user_id: string;
  dataset_id: string;
  strategy_id: string;
  name: string;
  symbol: string;
  initial_capital: string;
  commission: string;
  slippage: string;
  parameters: Record<string, unknown>;
  start_date: string | null;
  end_date: string | null;
  status: BacktestStatus;
  error_message: string | null;
  created_at: Date;
  updated_at: Date;
}

function mapBacktestRow(row: BacktestWriteRow): BacktestRow {
  return {
    id: row.id,
    userId: row.user_id,
    datasetId: row.dataset_id,
    strategyId: row.strategy_id,
    name: row.name,
    symbol: row.symbol,
    initialCapital: Number(row.initial_capital),
    commission: Number(row.commission),
    slippage: Number(row.slippage),
    parameters: row.parameters,
    startDate: row.start_date ? new Date(row.start_date).toISOString() : null,
    endDate: row.end_date ? new Date(row.end_date).toISOString() : null,
    status: row.status,
    errorMessage: row.error_message,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

const BACKTEST_COLUMNS = `
  id, user_id, dataset_id, strategy_id, name, symbol, initial_capital,
  commission, slippage, parameters, start_date, end_date, status,
  error_message, created_at, updated_at
` as const;

export interface CreateBacktestInput {
  userId: string;
  datasetId: string;
  strategyId: string;
  name: string;
  symbol: string;
  initialCapital: number;
  commission: number;
  slippage: number;
  parameters: Record<string, unknown>;
  startDate: string | null;
  endDate: string | null;
}

export interface ListBacktestsOptions {
  limit?: number;
  offset?: number;
}

interface SummaryRow {
  id: string;
  user_id: string;
  dataset_id: string;
  strategy_id: string;
  name: string;
  symbol: string;
  status: BacktestStatus;
  initial_capital: string;
  commission: string;
  slippage: string;
  start_date: Date | null;
  end_date: Date | null;
  error_message: string | null;
  created_at: Date;
  dataset_name: string | null;
  final_equity: string | null;
  total_return: string | null;
  cagr: string | null;
  sharpe_ratio: string | null;
  max_drawdown: string | null;
  total_trades: number | null;
}

const SUMMARY_JOIN = `
  SELECT b.id, b.user_id, b.dataset_id, b.strategy_id, b.name, b.symbol, b.status,
         b.initial_capital, b.commission, b.slippage, b.start_date, b.end_date,
         b.error_message, b.created_at,
         d.name AS dataset_name,
         m.final_equity, m.total_return, m.cagr, m.sharpe_ratio, m.max_drawdown, m.total_trades
  FROM backtests b
  LEFT JOIN datasets d ON d.id = b.dataset_id
  LEFT JOIN backtest_metrics m ON m.backtest_id = b.id`;

function mapSummary(row: SummaryRow): BacktestSummary {
  return {
    id: row.id,
    name: row.name,
    datasetId: row.dataset_id,
    datasetName: row.dataset_name ?? 'Unknown dataset',
    strategyId: row.strategy_id,
    strategyName: row.strategy_id,
    symbol: row.symbol,
    status: row.status,
    initialCapital: Number(row.initial_capital),
    finalEquity: row.final_equity === null || row.final_equity === undefined ? null : Number(row.final_equity),
    totalReturn: row.total_return === null || row.total_return === undefined ? null : Number(row.total_return),
    cagr: row.cagr === null || row.cagr === undefined ? null : Number(row.cagr),
    sharpeRatio: row.sharpe_ratio === null || row.sharpe_ratio === undefined ? null : Number(row.sharpe_ratio),
    maxDrawdown: row.max_drawdown === null || row.max_drawdown === undefined ? null : Number(row.max_drawdown),
    totalTrades: row.total_trades ?? null,
    commission: Number(row.commission),
    slippage: Number(row.slippage),
    startDate: row.start_date ? new Date(row.start_date).toISOString() : null,
    endDate: row.end_date ? new Date(row.end_date).toISOString() : null,
    errorMessage: row.error_message,
    createdAt: row.created_at.toISOString(),
  };
}

export const backtestRepository = {
  /**
   * Creates the backtest row inside the caller's transaction.
   * Computation happens before the transaction, so the row is written straight
   * to `COMPLETED` — there is no async execution phase to flip later.
   */
  async create(client: PoolClient, input: CreateBacktestInput): Promise<BacktestRow> {
    const result = await db(client).query<BacktestWriteRow>(
      `INSERT INTO backtests
         (user_id, dataset_id, strategy_id, name, symbol, initial_capital, commission, slippage,
          parameters, start_date, end_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, 'COMPLETED')
       RETURNING ${BACKTEST_COLUMNS}`,
      [
        input.userId,
        input.datasetId,
        input.strategyId,
        input.name,
        input.symbol,
        input.initialCapital,
        input.commission,
        input.slippage,
        JSON.stringify(input.parameters),
        input.startDate,
        input.endDate,
      ],
    );
    return mapBacktestRow(result.rows[0]!);
  },

  async findById(id: string): Promise<BacktestRow | null> {
    const result = await pool.query<BacktestWriteRow>(
      `SELECT ${BACKTEST_COLUMNS} FROM backtests WHERE id = $1`,
      [id],
    );
    const row = result.rows[0];
    return row ? mapBacktestRow(row) : null;
  },

  async findByIdAndUser(id: string, userId: string): Promise<BacktestRow | null> {
    const result = await pool.query<BacktestWriteRow>(
      `SELECT ${BACKTEST_COLUMNS} FROM backtests WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );
    const row = result.rows[0];
    return row ? mapBacktestRow(row) : null;
  },

  async listByUser(userId: string, options: ListBacktestsOptions = {}): Promise<BacktestSummary[]> {
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
    const offset = Math.max(options.offset ?? 0, 0);
    const result = await pool.query<SummaryRow>(
      `${SUMMARY_JOIN}
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );
    return result.rows.map(mapSummary);
  },

  /** Full summary (with metrics join) for a single backtest the user owns. */
  async findSummaryByIdAndUser(id: string, userId: string): Promise<BacktestSummary | null> {
    const result = await pool.query<SummaryRow>(
      `${SUMMARY_JOIN}
       WHERE b.id = $1 AND b.user_id = $2`,
      [id, userId],
    );
    const row = result.rows[0];
    return row ? mapSummary(row) : null;
  },

  /** Strategy + benchmark metrics for a completed backtest. */
  async findMetricsById(backtestId: string): Promise<{
    metrics: PerformanceMetrics;
    benchmark: BenchmarkMetrics;
    finalEquity: number;
  } | null> {
    const result = await pool.query<MetricsRow>(
      `SELECT total_return, annualized_return, cagr, volatility, sharpe_ratio, sortino_ratio,
              calmar_ratio, max_drawdown, win_rate, profit_factor, total_trades, winning_trades,
              losing_trades, avg_win, avg_loss, avg_trade, largest_win, largest_loss, final_equity,
              benchmark_return, benchmark_cagr, benchmark_volatility, benchmark_max_drawdown
       FROM backtest_metrics
       WHERE backtest_id = $1`,
      [backtestId],
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      metrics: mapMetrics(row),
      benchmark: {
        totalReturn: nullableNumber(row.benchmark_return),
        cagr: nullableNumber(row.benchmark_cagr),
        volatility: nullableNumber(row.benchmark_volatility),
        maxDrawdown: nullableNumber(row.benchmark_max_drawdown),
        finalEquity: null,
      },
      finalEquity: nullableNumber(row.final_equity) ?? 0,
    };
  },

  async updateStatus(
    id: string,
    status: BacktestStatus,
    errorMessage: string | null = null,
  ): Promise<void> {
    await pool.query(
      `UPDATE backtests SET status = $2, error_message = $3 WHERE id = $1`,
      [id, status, errorMessage],
    );
  },

  async countByUser(userId: string): Promise<number> {
    const result = await pool.query<{ total: number }>(
      `SELECT count(*)::int AS total FROM backtests WHERE user_id = $1`,
      [userId],
    );
    return result.rows[0]?.total ?? 0;
  },

  /** Inserts trades inside the caller's transaction (batched for remote DB latency). */
  async insertTrades(client: PoolClient, backtestId: string, trades: TradeRecord[]): Promise<void> {
    if (trades.length === 0) return;
    const columns = '(backtest_id, timestamp, symbol, side, quantity, price, entry_price, exit_price, commission, slippage, pnl)';
    for (const chunk of chunked(trades, INSERT_BATCH_SIZE)) {
      const placeholders: string[] = [];
      const values: unknown[] = [];
      chunk.forEach((trade, index) => {
        const base = index * 11;
        placeholders.push(
          `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11})`,
        );
        values.push(
          backtestId,
          trade.timestamp,
          trade.symbol,
          trade.side,
          trade.quantity,
          trade.price,
          trade.entryPrice,
          trade.exitPrice,
          trade.commission,
          trade.slippageCost,
          trade.pnl,
        );
      });
      await db(client).query(
        `INSERT INTO backtest_trades ${columns} VALUES ${placeholders.join(', ')}`,
        values,
      );
    }
  },

  /** Upserts the strategy + benchmark metrics and final equity inside the transaction. */
  async insertMetrics(
    client: PoolClient,
    backtestId: string,
    metrics: PerformanceMetrics,
    benchmark: BenchmarkMetrics,
    finalEquity: number,
  ): Promise<void> {
    await db(client).query(
      `INSERT INTO backtest_metrics
         (backtest_id, total_return, annualized_return, cagr, volatility, sharpe_ratio, sortino_ratio,
          calmar_ratio, max_drawdown, win_rate, profit_factor, total_trades, winning_trades,
          losing_trades, avg_win, avg_loss, avg_trade, largest_win, largest_loss, final_equity,
          benchmark_return, benchmark_cagr, benchmark_volatility, benchmark_max_drawdown)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)`,
      [
        backtestId,
        metrics.totalReturn,
        metrics.annualizedReturn,
        metrics.cagr,
        metrics.volatility,
        metrics.sharpeRatio,
        metrics.sortinoRatio,
        metrics.calmarRatio,
        metrics.maxDrawdown,
        metrics.winRate,
        metrics.profitFactor,
        metrics.totalTrades,
        metrics.winningTrades,
        metrics.losingTrades,
        metrics.avgWin,
        metrics.avgLoss,
        metrics.avgTrade,
        metrics.largestWin,
        metrics.largestLoss,
        finalEquity,
        benchmark.totalReturn,
        benchmark.cagr,
        benchmark.volatility,
        benchmark.maxDrawdown,
      ],
    );
  },

  /** Inserts a (strategy or benchmark) equity series inside the transaction (batched). */
  async insertEquity(
    client: PoolClient,
    backtestId: string,
    kind: 'strategy' | 'benchmark',
    points: EquityPoint[],
  ): Promise<void> {
    const columns = '(backtest_id, kind, timestamp, equity, cash, position_value, daily_return, drawdown)';
    for (const chunk of chunked(points, INSERT_BATCH_SIZE)) {
      const placeholders: string[] = [];
      const values: unknown[] = [];
      chunk.forEach((point, index) => {
        const base = index * 8;
        placeholders.push(
          `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`,
        );
        values.push(
          backtestId,
          kind,
          point.timestamp,
          point.equity,
          point.cash,
          point.positionValue,
          point.dailyReturn,
          point.drawdown,
        );
      });
      await db(client).query(
        `INSERT INTO backtest_equity ${columns} VALUES ${placeholders.join(', ')}`,
        values,
      );
    }
  },

  async listTrades(
    backtestId: string,
    options: ListBacktestsOptions = {},
  ): Promise<{ trades: TradeRecord[]; total: number }> {
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 500);
    const offset = Math.max(options.offset ?? 0, 0);

    const [rows, count] = await Promise.all([
      pool.query<TradeRow>(
        `SELECT id, timestamp, symbol, side, quantity, price, entry_price, exit_price,
                commission, slippage, pnl
         FROM backtest_trades
         WHERE backtest_id = $1
         ORDER BY timestamp ASC, id ASC
         LIMIT $2 OFFSET $3`,
        [backtestId, limit, offset],
      ),
      pool.query<{ total: number }>(
        `SELECT count(*)::int AS total FROM backtest_trades WHERE backtest_id = $1`,
        [backtestId],
      ),
    ]);

    return {
      trades: rows.rows.map(mapTrade),
      total: count.rows[0]?.total ?? 0,
    };
  },

  /**
   * Merges the strategy and benchmark equity series, downsampled to
   * `maxPoints` evenly-spaced timestamps so charts stay fast on the client.
   */
  async equitySeries(backtestId: string, maxPoints = 3000): Promise<EquitySeriesPoint[]> {
    const result = await pool.query<{ kind: string; timestamp: Date; equity: string }>(
      `SELECT kind, timestamp, equity
       FROM backtest_equity
       WHERE backtest_id = $1
       ORDER BY timestamp ASC`,
      [backtestId],
    );

    const strategy = new Map<string, number>();
    const benchmark = new Map<string, number>();
    for (const row of result.rows) {
      const stamp = row.timestamp.toISOString();
      const value = Number(row.equity);
      if (row.kind === 'strategy') strategy.set(stamp, value);
      else benchmark.set(stamp, value);
    }

    const allTimestamps = [...new Set([...strategy.keys(), ...benchmark.keys()])].sort();
    if (allTimestamps.length === 0) return [];

    const step = Math.max(1, Math.ceil(allTimestamps.length / Math.max(maxPoints, 1)));
    const series: EquitySeriesPoint[] = [];
    for (let i = 0; i < allTimestamps.length; i += step) {
      const stamp = allTimestamps[i]!;
      series.push({
        timestamp: stamp,
        strategy: strategy.get(stamp) ?? null,
        benchmark: benchmark.get(stamp) ?? null,
      });
    }
    return series;
  },

  async deleteById(id: string): Promise<void> {
    // Trades/metrics/equity rows are removed by ON DELETE CASCADE.
    await pool.query(`DELETE FROM backtests WHERE id = $1`, [id]);
  },
};

interface TradeRow {
  id: string;
  timestamp: Date;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: string;
  price: string;
  entry_price: string | null;
  exit_price: string | null;
  commission: string;
  slippage: string;
  pnl: string | null;
}

interface MetricsRow {
  total_return: string | null;
  annualized_return: string | null;
  cagr: string | null;
  volatility: string | null;
  sharpe_ratio: string | null;
  sortino_ratio: string | null;
  calmar_ratio: string | null;
  max_drawdown: string | null;
  win_rate: string | null;
  profit_factor: string | null;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  avg_win: string | null;
  avg_loss: string | null;
  avg_trade: string | null;
  largest_win: string | null;
  largest_loss: string | null;
  final_equity: string | null;
  benchmark_return: string | null;
  benchmark_cagr: string | null;
  benchmark_volatility: string | null;
  benchmark_max_drawdown: string | null;
}

function nullableNumber(value: string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return Number(value);
}

function mapMetrics(row: MetricsRow): PerformanceMetrics {
  return {
    totalReturn: nullableNumber(row.total_return),
    annualizedReturn: nullableNumber(row.annualized_return),
    cagr: nullableNumber(row.cagr),
    volatility: nullableNumber(row.volatility),
    sharpeRatio: nullableNumber(row.sharpe_ratio),
    sortinoRatio: nullableNumber(row.sortino_ratio),
    calmarRatio: nullableNumber(row.calmar_ratio),
    maxDrawdown: nullableNumber(row.max_drawdown),
    winRate: nullableNumber(row.win_rate),
    profitFactor: nullableNumber(row.profit_factor),
    totalTrades: row.total_trades,
    winningTrades: row.winning_trades,
    losingTrades: row.losing_trades,
    avgWin: nullableNumber(row.avg_win),
    avgLoss: nullableNumber(row.avg_loss),
    avgTrade: nullableNumber(row.avg_trade),
    largestWin: nullableNumber(row.largest_win),
    largestLoss: nullableNumber(row.largest_loss),
  };
}

function mapTrade(row: TradeRow): TradeRecord {
  return {
    id: row.id,
    timestamp: row.timestamp.toISOString(),
    symbol: row.symbol,
    side: row.side,
    quantity: Number(row.quantity),
    price: Number(row.price),
    entryPrice: row.entry_price === null ? null : Number(row.entry_price),
    exitPrice: row.exit_price === null ? null : Number(row.exit_price),
    commission: Number(row.commission),
    slippageCost: Number(row.slippage),
    pnl: row.pnl === null ? null : Number(row.pnl),
  };
}
