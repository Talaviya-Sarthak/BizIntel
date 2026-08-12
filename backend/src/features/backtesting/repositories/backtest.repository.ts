import { pool } from '../../../config/database';
import type {
  Backtest,
  BacktestStatus,
  BacktestEquityPoint,
  BacktestMetrics,
  BacktestTrade,
} from '../types';

const BACKTEST_COLUMNS = `
  id,
  user_id,
  dataset_id,
  strategy_id,
  name,
  parameters,
  initial_capital,
  commission,
  slippage,
  start_date,
  end_date,
  status,
  error_message,
  started_at,
  completed_at,
  created_at,
  updated_at
` as const;

const TRADE_COLUMNS = `
  id,
  backtest_id,
  timestamp,
  side,
  quantity,
  price,
  execution_price,
  commission,
  slippage_amount,
  pnl,
  created_at
` as const;

const METRICS_COLUMNS = `
  id,
  backtest_id,
  total_return,
  annualized_return,
  volatility,
  sharpe_ratio,
  sortino_ratio,
  max_drawdown,
  calmar_ratio,
  win_rate,
  profit_factor,
  total_trades,
  winning_trades,
  losing_trades,
  avg_winning_trade,
  avg_losing_trade,
  largest_winning_trade,
  largest_losing_trade,
  avg_trade,
  created_at
` as const;

const EQUITY_COLUMNS = `
  id,
  backtest_id,
  timestamp,
  equity,
  cash,
  position_value,
  daily_return,
  drawdown,
  created_at
` as const;

// ---------------------------------------------------------------------------
// Backtests
// ---------------------------------------------------------------------------

function mapBacktest(row: Record<string, unknown>): Backtest {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    dataset_id: row.dataset_id as string,
    strategy_id: row.strategy_id as string,
    name: row.name as string,
    parameters: row.parameters as Record<string, number>,
    initial_capital: row.initial_capital as number,
    commission: row.commission as number,
    slippage: row.slippage as number,
    start_date: row.start_date ? new Date(row.start_date as string) : null,
    end_date: row.end_date ? new Date(row.end_date as string) : null,
    status: row.status as BacktestStatus,
    error_message: row.error_message as string | null,
    started_at: row.started_at ? new Date(row.started_at as string) : null,
    completed_at: row.completed_at ? new Date(row.completed_at as string) : null,
    created_at: new Date(row.created_at as string),
    updated_at: new Date(row.updated_at as string),
  };
}

const selectBacktest = `SELECT ${BACKTEST_COLUMNS} FROM backtests`;

export interface CreateBacktestInput {
  userId: string;
  datasetId: string;
  strategyId: string;
  name: string;
  parameters: Record<string, number>;
  initialCapital: number;
  commission: number;
  slippage: number;
  startDate?: string;
  endDate?: string;
}

export async function createBacktest(input: CreateBacktestInput): Promise<Backtest> {
  const result = await pool.query(
    `INSERT INTO backtests
       (user_id, dataset_id, strategy_id, name, parameters, initial_capital, commission, slippage, start_date, end_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING ${BACKTEST_COLUMNS}`,
    [
      input.userId,
      input.datasetId,
      input.strategyId,
      input.name,
      JSON.stringify(input.parameters),
      input.initialCapital,
      input.commission,
      input.slippage,
      input.startDate ?? null,
      input.endDate ?? null,
    ],
  );
  return mapBacktest(result.rows[0]!);
}

export async function findBacktestById(id: string): Promise<Backtest | null> {
  const result = await pool.query(`${selectBacktest} WHERE id = $1`, [id]);
  const row = result.rows[0];
  return row ? mapBacktest(row) : null;
}

export async function findBacktestsByUserId(
  userId: string,
  options: { limit: number; offset: number },
): Promise<Backtest[]> {
  const result = await pool.query(
    `${selectBacktest} WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [userId, options.limit, options.offset],
  );
  return result.rows.map(mapBacktest);
}

export async function countBacktestsByUserId(userId: string): Promise<number> {
  const result = await pool.query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM backtests WHERE user_id = $1',
    [userId],
  );
  return parseInt(result.rows[0]!.count, 10);
}

export async function updateBacktestStatus(
  id: string,
  status: BacktestStatus,
  extra?: { errorMessage?: string; startedAt?: boolean; completedAt?: boolean },
): Promise<Backtest | null> {
  const sets: string[] = ['status = $2', 'updated_at = NOW()'];
  const params: unknown[] = [id, status];
  let idx = 3;

  if (extra?.errorMessage !== undefined) {
    sets.push(`error_message = $${idx++}`);
    params.push(extra.errorMessage);
  }
  if (extra?.startedAt) {
    sets.push('started_at = NOW()');
  }
  if (extra?.completedAt) {
    sets.push('completed_at = NOW()');
  }

  const result = await pool.query(
    `UPDATE backtests SET ${sets.join(', ')} WHERE id = $1 RETURNING ${BACKTEST_COLUMNS}`,
    params,
  );
  const row = result.rows[0];
  return row ? mapBacktest(row) : null;
}

export async function deleteBacktestById(id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM backtests WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

// ---------------------------------------------------------------------------
// Trades
// ---------------------------------------------------------------------------

function mapTrade(row: Record<string, unknown>): BacktestTrade {
  return {
    id: row.id as string,
    backtest_id: row.backtest_id as string,
    timestamp: new Date(row.timestamp as string),
    side: row.side as 'BUY' | 'SELL',
    quantity: row.quantity as number,
    price: row.price as number,
    execution_price: row.execution_price as number,
    commission: row.commission as number,
    slippage_amount: row.slippage_amount as number,
    pnl: row.pnl as number | null,
    created_at: new Date(row.created_at as string),
  };
}

export interface CreateTradeInput {
  backtestId: string;
  timestamp: Date;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  executionPrice: number;
  commission: number;
  slippageAmount: number;
  pnl: number | null;
}

export async function createManyTrades(trades: CreateTradeInput[]): Promise<void> {
  if (trades.length === 0) return;

  const values: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  for (const t of trades) {
    values.push(
      `($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`,
    );
    params.push(
      t.backtestId,
      t.timestamp,
      t.side,
      t.quantity,
      t.price,
      t.executionPrice,
      t.commission,
      t.slippageAmount,
      t.pnl,
    );
  }

  await pool.query(
    `INSERT INTO backtest_trades
       (backtest_id, timestamp, side, quantity, price, execution_price, commission, slippage_amount, pnl)
     VALUES ${values.join(', ')}`,
    params,
  );
}

export async function findTradesByBacktestId(
  backtestId: string,
  options: { limit: number; offset: number },
): Promise<BacktestTrade[]> {
  const result = await pool.query(
    `SELECT ${TRADE_COLUMNS} FROM backtest_trades WHERE backtest_id = $1 ORDER BY timestamp ASC LIMIT $2 OFFSET $3`,
    [backtestId, options.limit, options.offset],
  );
  return result.rows.map(mapTrade);
}

export async function countTradesByBacktestId(backtestId: string): Promise<number> {
  const result = await pool.query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM backtest_trades WHERE backtest_id = $1',
    [backtestId],
  );
  return parseInt(result.rows[0]!.count, 10);
}

export async function deleteTradesByBacktestId(backtestId: string): Promise<void> {
  await pool.query('DELETE FROM backtest_trades WHERE backtest_id = $1', [backtestId]);
}

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

function mapMetrics(row: Record<string, unknown>): BacktestMetrics {
  return {
    id: row.id as string,
    backtest_id: row.backtest_id as string,
    total_return: row.total_return as number | null,
    annualized_return: row.annualized_return as number | null,
    volatility: row.volatility as number | null,
    sharpe_ratio: row.sharpe_ratio as number | null,
    sortino_ratio: row.sortino_ratio as number | null,
    max_drawdown: row.max_drawdown as number | null,
    calmar_ratio: row.calmar_ratio as number | null,
    win_rate: row.win_rate as number | null,
    profit_factor: row.profit_factor as number | null,
    total_trades: row.total_trades as number | null,
    winning_trades: row.winning_trades as number | null,
    losing_trades: row.losing_trades as number | null,
    avg_winning_trade: row.avg_winning_trade as number | null,
    avg_losing_trade: row.avg_losing_trade as number | null,
    largest_winning_trade: row.largest_winning_trade as number | null,
    largest_losing_trade: row.largest_losing_trade as number | null,
    avg_trade: row.avg_trade as number | null,
    created_at: new Date(row.created_at as string),
  };
}

export interface CreateMetricsInput {
  backtestId: string;
  totalReturn: number | null;
  annualizedReturn: number | null;
  volatility: number | null;
  sharpeRatio: number | null;
  sortinoRatio: number | null;
  maxDrawdown: number | null;
  calmarRatio: number | null;
  winRate: number | null;
  profitFactor: number | null;
  totalTrades: number | null;
  winningTrades: number | null;
  losingTrades: number | null;
  avgWinningTrade: number | null;
  avgLosingTrade: number | null;
  largestWinningTrade: number | null;
  largestLosingTrade: number | null;
  avgTrade: number | null;
}

export async function createMetrics(input: CreateMetricsInput): Promise<BacktestMetrics> {
  const result = await pool.query(
    `INSERT INTO backtest_metrics
       (backtest_id, total_return, annualized_return, volatility, sharpe_ratio, sortino_ratio,
        max_drawdown, calmar_ratio, win_rate, profit_factor, total_trades, winning_trades,
        losing_trades, avg_winning_trade, avg_losing_trade, largest_winning_trade, largest_losing_trade, avg_trade)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     RETURNING ${METRICS_COLUMNS}`,
    [
      input.backtestId,
      input.totalReturn,
      input.annualizedReturn,
      input.volatility,
      input.sharpeRatio,
      input.sortinoRatio,
      input.maxDrawdown,
      input.calmarRatio,
      input.winRate,
      input.profitFactor,
      input.totalTrades,
      input.winningTrades,
      input.losingTrades,
      input.avgWinningTrade,
      input.avgLosingTrade,
      input.largestWinningTrade,
      input.largestLosingTrade,
      input.avgTrade,
    ],
  );
  return mapMetrics(result.rows[0]!);
}

export async function findMetricsByBacktestId(backtestId: string): Promise<BacktestMetrics | null> {
  const result = await pool.query(
    `SELECT ${METRICS_COLUMNS} FROM backtest_metrics WHERE backtest_id = $1`,
    [backtestId],
  );
  const row = result.rows[0];
  return row ? mapMetrics(row) : null;
}

export async function deleteMetricsByBacktestId(backtestId: string): Promise<void> {
  await pool.query('DELETE FROM backtest_metrics WHERE backtest_id = $1', [backtestId]);
}

// ---------------------------------------------------------------------------
// Equity
// ---------------------------------------------------------------------------

function mapEquity(row: Record<string, unknown>): BacktestEquityPoint {
  return {
    id: row.id as string,
    backtest_id: row.backtest_id as string,
    timestamp: new Date(row.timestamp as string),
    equity: row.equity as number,
    cash: row.cash as number,
    position_value: row.position_value as number,
    daily_return: row.daily_return as number | null,
    drawdown: row.drawdown as number | null,
    created_at: new Date(row.created_at as string),
  };
}

export interface CreateEquityInput {
  backtestId: string;
  timestamp: Date;
  equity: number;
  cash: number;
  positionValue: number;
  dailyReturn: number | null;
  drawdown: number | null;
}

export async function createManyEquityPoints(points: CreateEquityInput[]): Promise<void> {
  if (points.length === 0) return;

  const values: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  for (const p of points) {
    values.push(
      `($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`,
    );
    params.push(
      p.backtestId,
      p.timestamp,
      p.equity,
      p.cash,
      p.positionValue,
      p.dailyReturn,
      p.drawdown,
    );
  }

  await pool.query(
    `INSERT INTO backtest_equity
       (backtest_id, timestamp, equity, cash, position_value, daily_return, drawdown)
     VALUES ${values.join(', ')}`,
    params,
  );
}

export async function findEquityByBacktestId(backtestId: string): Promise<BacktestEquityPoint[]> {
  const result = await pool.query(
    `SELECT ${EQUITY_COLUMNS} FROM backtest_equity WHERE backtest_id = $1 ORDER BY timestamp ASC`,
    [backtestId],
  );
  return result.rows.map(mapEquity);
}

export async function deleteEquityByBacktestId(backtestId: string): Promise<void> {
  await pool.query('DELETE FROM backtest_equity WHERE backtest_id = $1', [backtestId]);
}
