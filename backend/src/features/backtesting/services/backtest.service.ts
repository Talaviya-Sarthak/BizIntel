import { duckdbService } from '../../../config/duckdb';
import { ApiError } from '../../../utils/httpError';
import * as backtestRepository from '../repositories/backtest.repository';
import type { CreateBacktestInput } from '../repositories/backtest.repository';
import { getStrategy, getAllStrategies } from '../strategies';
import type { BacktestConfig, MarketBar, Backtest } from '../types';
import * as datasetRepository from '../../datasets/repositories/dataset.repository';
import { MarketDataValidationService } from './market-data-validation.service';
import { BacktestEngine } from '../engines/backtest.engine';
import { MetricsEngine } from '../metrics/metrics.engine';
import { BenchmarkCalculator } from '../utils/benchmark';

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function getTableName(datasetId: string): string {
  return `dataset_${datasetId.replace(/-/g, '_')}`;
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export async function listBacktests(
  userId: string,
  options: { page: number; limit: number; sort: string },
): Promise<PaginatedResult<Backtest>> {
  const offset = (options.page - 1) * options.limit;
  const [backtests, total] = await Promise.all([
    backtestRepository.findBacktestsByUserId(userId, { limit: options.limit, offset }),
    backtestRepository.countBacktestsByUserId(userId),
  ]);

  return {
    items: backtests,
    total,
    page: options.page,
    limit: options.limit,
    totalPages: Math.ceil(total / options.limit),
  };
}

// ---------------------------------------------------------------------------
// Get One
// ---------------------------------------------------------------------------

export async function getBacktest(
  userId: string,
  backtestId: string,
): Promise<{
  backtest: Backtest;
  metrics: Awaited<ReturnType<typeof backtestRepository.findMetricsByBacktestId>>;
  equity: Awaited<ReturnType<typeof backtestRepository.findEquityByBacktestId>>;
}> {
  const backtest = await backtestRepository.findBacktestById(backtestId);

  if (!backtest) {
    throw ApiError.notFound('BACKTEST_NOT_FOUND', 'Backtest not found');
  }

  if (backtest.user_id !== userId) {
    throw ApiError.forbidden('BACKTEST_ACCESS_DENIED', 'You do not have access to this backtest');
  }

  const [metrics, equity] = await Promise.all([
    backtestRepository.findMetricsByBacktestId(backtestId),
    backtestRepository.findEquityByBacktestId(backtestId),
  ]);

  return { backtest, metrics, equity };
}

// ---------------------------------------------------------------------------
// Create & Run
// ---------------------------------------------------------------------------

export async function createAndRunBacktest(
  userId: string,
  config: BacktestConfig,
): Promise<Backtest> {
  // 1. Validate dataset exists and user owns it
  const dataset = await datasetRepository.findById(config.datasetId);

  if (!dataset) {
    throw ApiError.notFound('DATASET_NOT_FOUND', 'Dataset not found');
  }

  if (dataset.user_id !== userId) {
    throw ApiError.forbidden('DATASET_ACCESS_DENIED', 'You do not have access to this dataset');
  }

  if (dataset.status !== 'ready') {
    throw ApiError.badRequest('DATASET_NOT_READY', 'Dataset is not ready for backtesting');
  }

  // 2. Get market data from DuckDB
  const tableName = getTableName(config.datasetId);
  const rawData = await duckdbService.getData(tableName, { limit: 100_000, offset: 0 });

  if (rawData.length === 0) {
    throw ApiError.badRequest('DATASET_EMPTY', 'Dataset contains no market data');
  }

  // 3. Validate market data
  const validator = new MarketDataValidationService();
  const validation = validator.validate(rawData);

  if (!validation.isValid) {
    throw ApiError.badRequest('MARKET_DATA_INVALID', validation.errors.join('; '));
  }

  // 4. Map raw rows to MarketBar[]
  const tsCol = validation.detectedColumns.timestamp;
  const openCol = validation.detectedColumns.open;
  const highCol = validation.detectedColumns.high;
  const lowCol = validation.detectedColumns.low;
  const closeCol = validation.detectedColumns.close;
  const volCol = validation.detectedColumns.volume;

  const bars: MarketBar[] = rawData.map((row) => ({
    timestamp: new Date(row[tsCol!] as string),
    open: Number(row[openCol!]),
    high: Number(row[highCol!]),
    low: Number(row[lowCol!]),
    close: Number(row[closeCol!]),
    ...(volCol ? { volume: Number(row[volCol]) } : {}),
  }));

  // 4. Get strategy from registry
  const strategy = getStrategy(config.strategyId);

  if (!strategy) {
    throw ApiError.badRequest('STRATEGY_NOT_FOUND', `Strategy '${config.strategyId}' not found`);
  }

  // 5. Create backtest record with status 'pending'
  const backtestName = `${strategy.config.name} - ${dataset.name}`;
  const createInput: CreateBacktestInput = {
    userId,
    datasetId: config.datasetId,
    strategyId: config.strategyId,
    name: backtestName,
    parameters: config.parameters,
    initialCapital: config.initialCapital,
    commission: config.commission,
    slippage: config.slippage,
    startDate: config.startDate,
    endDate: config.endDate,
  };

  const backtest = await backtestRepository.createBacktest(createInput);

  try {
    // 6. Update status to 'running'
    await backtestRepository.updateBacktestStatus(backtest.id, 'running', { startedAt: true });

    // 7. Run BacktestEngine
    const engine = new BacktestEngine({
      initialCapital: config.initialCapital,
      commission: config.commission,
      slippage: config.slippage,
    });
    const engineResult = engine.run(bars, strategy);

    // 8. Calculate metrics
    const metricsEngine = new MetricsEngine();
    const metrics = metricsEngine.calculate({
      equityCurve: engineResult.equityCurve,
      trades: engineResult.trades,
      initialCapital: config.initialCapital,
    });

    // 9. Calculate benchmark
    const benchmarkCalculator = new BenchmarkCalculator(config.initialCapital);
    benchmarkCalculator.calculate(bars);

    // 10. Store trades, equity, metrics
    const tradeInserts = engineResult.trades.map((t) => ({
      backtestId: backtest.id,
      timestamp: t.timestamp,
      side: t.side,
      quantity: t.quantity,
      price: t.price,
      executionPrice: t.execution_price,
      commission: t.commission,
      slippageAmount: t.slippage_amount,
      pnl: t.pnl,
    }));

    const equityInserts = engineResult.equityCurve.map((e) => ({
      backtestId: backtest.id,
      timestamp: e.timestamp,
      equity: e.equity,
      cash: e.cash,
      positionValue: e.position_value,
      dailyReturn: e.daily_return,
      drawdown: e.drawdown,
    }));

    await Promise.all([
      backtestRepository.createManyTrades(tradeInserts),
      backtestRepository.createManyEquityPoints(equityInserts),
      backtestRepository.createMetrics({
        backtestId: backtest.id,
        totalReturn: metrics.total_return,
        annualizedReturn: metrics.annualized_return,
        volatility: metrics.volatility,
        sharpeRatio: metrics.sharpe_ratio,
        sortinoRatio: metrics.sortino_ratio,
        maxDrawdown: metrics.max_drawdown,
        calmarRatio: metrics.calmar_ratio,
        winRate: metrics.win_rate,
        profitFactor: metrics.profit_factor,
        totalTrades: metrics.total_trades,
        winningTrades: metrics.winning_trades,
        losingTrades: metrics.losing_trades,
        avgWinningTrade: metrics.avg_winning_trade,
        avgLosingTrade: metrics.avg_losing_trade,
        largestWinningTrade: metrics.largest_winning_trade,
        largestLosingTrade: metrics.largest_losing_trade,
        avgTrade: metrics.avg_trade,
      }),
    ]);

    // 11. Update status to 'completed'
    const completed = await backtestRepository.updateBacktestStatus(backtest.id, 'completed', {
      completedAt: true,
    });

    // 12. Return backtest with results
    return completed!;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Backtest execution failed';
    await backtestRepository.updateBacktestStatus(backtest.id, 'failed', { errorMessage: message });
    throw ApiError.badRequest('BACKTEST_FAILED', message);
  }
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteBacktest(
  userId: string,
  backtestId: string,
): Promise<void> {
  const backtest = await backtestRepository.findBacktestById(backtestId);

  if (!backtest) {
    throw ApiError.notFound('BACKTEST_NOT_FOUND', 'Backtest not found');
  }

  if (backtest.user_id !== userId) {
    throw ApiError.forbidden('BACKTEST_ACCESS_DENIED', 'You do not have access to this backtest');
  }

  // Delete all associated data explicitly (safety net beyond DB CASCADE)
  await Promise.all([
    backtestRepository.deleteTradesByBacktestId(backtestId),
    backtestRepository.deleteMetricsByBacktestId(backtestId),
    backtestRepository.deleteEquityByBacktestId(backtestId),
  ]);

  await backtestRepository.deleteBacktestById(backtestId);
}

// ---------------------------------------------------------------------------
// Strategies
// ---------------------------------------------------------------------------

export function listStrategies() {
  return getAllStrategies();
}
