import { pool } from '../../config/database.js';
import { findByIdAndUser as findDatasetByIdAndUser } from '../../repositories/dataset.repository.js';
import { listByDatasetId as listDatasetColumns } from '../../repositories/datasetColumn.repository.js';
import { storageService } from '../../services/storage.service.js';
import { ApiError } from '../../utils/httpError.js';
import { strategyRegistry } from '../strategies/registry.js';
import type { MarketData, Strategy, StrategyParameters } from '../strategies/types.js';
import { runBacktest, type EngineTrade } from '../engines/backtestEngine.js';
import { computeBenchmarkMetrics, computeMetrics } from '../metrics/performanceMetrics.js';
import { marketDataService } from './marketData.service.js';
import { backtestRepository, type CreateBacktestInput } from '../repositories/backtest.repository.js';
import {
  BACKTEST_ERROR_CODES,
  type BacktestSummary,
  type DatasetDateRange,
  type EquitySeriesPoint,
  type MarketCompatibility,
  type TradeRecord,
} from '../types/index.js';
import type { BacktestCreateInput } from '../validators/backtest.validator.js';

/** Bars beyond warmup needed to generate and execute at least one signal. */
const MIN_EXECUTABLE_BARS_AFTER_WARMUP = 2;

function strategyMetadata(strategy: Strategy) {
  return {
    id: strategy.id,
    name: strategy.name,
    description: strategy.description,
    executionModel: strategy.executionModel,
    parameters: strategy.parameters,
    defaults: strategy.defaults,
  };
}

export const backtestingService = {
  listStrategies() {
    return strategyRegistry.list().map(strategyMetadata);
  },

  /** Detects market columns from stored metadata — no DuckDB, so it's cheap. */
  async getCompatibility(userId: string, datasetId: string): Promise<MarketCompatibility> {
    const dataset = await findDatasetByIdAndUser(datasetId, userId);
    if (!dataset) {
      throw ApiError.notFound(
        BACKTEST_ERROR_CODES.DATASET_NOT_FOUND,
        'Dataset not found',
        undefined,
        'Pick a dataset from your library and try again.',
      );
    }
    const columns = await listDatasetColumns(dataset.id);
    const map = marketDataService.detect(columns.map((column) => ({ name: column.columnName, type: column.dataType })));
    return {
      datasetId,
      compatible: map.compatible,
      dateColumn: map.dateColumn,
      openColumn: map.openColumn,
      highColumn: map.highColumn,
      lowColumn: map.lowColumn,
      closeColumn: map.closeColumn,
      volumeColumn: map.volumeColumn,
      issues: map.issues,
    };
  },

  /** Available date span of a backtestable dataset, for bounding date pickers. */
  async getDatasetDateRange(userId: string, datasetId: string): Promise<DatasetDateRange> {
    const dataset = await findDatasetByIdAndUser(datasetId, userId);
    if (!dataset) {
      throw ApiError.notFound(
        BACKTEST_ERROR_CODES.DATASET_NOT_FOUND,
        'Dataset not found',
        undefined,
        'Pick a dataset from your library and try again.',
      );
    }
    if (dataset.status !== 'READY' || !dataset.storagePath) {
      throw ApiError.conflict(
        BACKTEST_ERROR_CODES.NOT_READY,
        'This dataset is not ready for backtesting yet',
        undefined,
        'Wait for the dataset to finish processing, then try again.',
      );
    }
    const columns = await listDatasetColumns(dataset.id);
    const map = marketDataService.detect(
      columns.map((column) => ({ name: column.columnName, type: column.dataType })),
    );
    if (!map.compatible || !map.dateColumn || !map.openColumn || !map.highColumn || !map.lowColumn || !map.closeColumn) {
      throw ApiError.badRequest(
        BACKTEST_ERROR_CODES.DATASET_NOT_COMPATIBLE,
        'This dataset does not expose OHLCV columns required for backtesting',
        { issues: map.issues },
        'Choose a dataset that contains market data columns: date, open, high, low, and close (OHLCV).',
      );
    }

    let filePath: string;
    try {
      filePath = await storageService.absolutePath(dataset.storagePath);
    } catch {
      throw ApiError.conflict(
        BACKTEST_ERROR_CODES.NOT_READY,
        'Dataset file is not available in storage',
        { datasetId: dataset.id },
        'Re-upload the dataset to make it available for backtesting.',
      );
    }

    const range = await marketDataService.range({
      filePath,
      dateColumn: map.dateColumn,
      openColumn: map.openColumn,
      highColumn: map.highColumn,
      lowColumn: map.lowColumn,
      closeColumn: map.closeColumn,
      volumeColumn: map.volumeColumn,
      symbolColumn: map.symbolColumn,
    });

    return {
      datasetId,
      startDate: range.start,
      endDate: range.end,
      totalRows: range.totalRows,
      dateColumn: map.dateColumn,
    };
  },

  async createBacktest(userId: string, input: BacktestCreateInput): Promise<BacktestSummary> {
    const dataset = await findDatasetByIdAndUser(input.datasetId, userId);
    if (!dataset) {
      throw ApiError.notFound(
        BACKTEST_ERROR_CODES.DATASET_NOT_FOUND,
        'Dataset not found',
        undefined,
        'Pick a dataset from your library and try again.',
      );
    }
    if (dataset.status !== 'READY' || !dataset.storagePath) {
      throw ApiError.conflict(
        BACKTEST_ERROR_CODES.NOT_READY,
        'This dataset is not ready for backtesting yet',
        undefined,
        'Wait for the dataset to finish processing, then try again.',
      );
    }

    const strategy = strategyRegistry.get(input.strategyId);
    if (!strategy) {
      throw ApiError.badRequest(
        BACKTEST_ERROR_CODES.INVALID_STRATEGY,
        `Unknown strategy: "${input.strategyId}"`,
        undefined,
        'Choose a strategy from the list and try again.',
      );
    }

    const parameters: StrategyParameters = {};
    for (const def of strategy.parameters) {
      const raw = input.parameters[def.name];
      const fallback = typeof def.default === 'boolean' ? def.default : Number(def.default);
      let value: number | boolean = fallback;
      if (raw !== undefined && raw !== null) {
        if (typeof raw === 'boolean' && def.type === 'boolean') value = raw;
        else if (typeof raw === 'number' && Number.isFinite(raw)) value = raw;
        else if (typeof raw === 'string' && raw.trim() !== '') {
          const parsed = Number(raw);
          if (Number.isFinite(parsed)) value = parsed;
        }
      }
      parameters[def.name] = value;
    }
    const errors = strategy.validate(parameters);
    if (errors.length > 0) {
      throw ApiError.badRequest(
        BACKTEST_ERROR_CODES.INVALID_PARAMETER,
        errors[0]!,
        { errors },
        'Review the highlighted strategy parameters and adjust them.',
      );
    }

    const columns = await listDatasetColumns(dataset.id);
    const map = marketDataService.detect(
      columns.map((column) => ({ name: column.columnName, type: column.dataType })),
    );
    if (!map.compatible || !map.dateColumn || !map.openColumn || !map.highColumn || !map.lowColumn || !map.closeColumn) {
      throw ApiError.badRequest(
        BACKTEST_ERROR_CODES.DATASET_NOT_COMPATIBLE,
        'This dataset does not expose OHLCV columns required for backtesting',
        { issues: map.issues },
        'Choose a dataset that contains market data columns: date, open, high, low, and close (OHLCV).',
      );
    }

    // --- Load + validate market data (DuckDB), then run the engine (pure). ---
    let filePath: string;
    try {
      filePath = await storageService.absolutePath(dataset.storagePath);
    } catch {
      throw ApiError.conflict(
        BACKTEST_ERROR_CODES.NOT_READY,
        'Dataset file is not available in storage',
        { datasetId: dataset.id },
        'Re-upload the dataset to make it available for backtesting.',
      );
    }

    const loaded = await marketDataService.load({
      filePath,
      dateColumn: map.dateColumn,
      openColumn: map.openColumn,
      highColumn: map.highColumn,
      lowColumn: map.lowColumn,
      closeColumn: map.closeColumn,
      volumeColumn: map.volumeColumn,
      symbolColumn: map.symbolColumn,
      startDate: input.startDate,
      endDate: input.endDate,
    });

    const market: MarketData = {
      symbol: loaded.symbol,
      bars: loaded.bars,
      dateColumn: map.dateColumn!,
      ohlcColumns: {
        open: map.openColumn!,
        high: map.highColumn!,
        low: map.lowColumn!,
        close: map.closeColumn!,
      },
      volumeColumn: map.volumeColumn,
      source: dataset.originalFilename,
    };

    const warmup = strategy.warmup(parameters);
    if (market.bars.length < warmup + MIN_EXECUTABLE_BARS_AFTER_WARMUP) {
      throw ApiError.badRequest(
        BACKTEST_ERROR_CODES.INSUFFICIENT_DATA,
        `Not enough bars for the "${strategy.name}" strategy: need at least ${warmup + MIN_EXECUTABLE_BARS_AFTER_WARMUP}, got ${market.bars.length}`,
        undefined,
        'Extend the date range or use a dataset with more history for this strategy.',
      );
    }

    const engine = runBacktest(market, strategy, {
      initialCapital: input.initialCapital,
      commission: input.commission,
      slippage: input.slippage,
      parameters,
    });

    const metrics = computeMetrics(engine.equity, engine.trades, input.initialCapital);
    const benchmark = computeBenchmarkMetrics(engine.benchmarkEquity, input.initialCapital);

    // --- Persist results atomically (computation already succeeded). ---
    const name = input.name?.trim() || `${strategy.name} · ${dataset.name}`;
    const createInput: CreateBacktestInput = {
      userId,
      datasetId: dataset.id,
      strategyId: strategy.id,
      name,
      symbol: market.symbol,
      initialCapital: input.initialCapital,
      commission: input.commission,
      slippage: input.slippage,
      parameters,
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
    };

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const backtest = await backtestRepository.create(client, createInput);

      const trades: TradeRecord[] = engine.trades.map((trade: EngineTrade) => ({
        timestamp: new Date(trade.timestamp).toISOString(),
        symbol: market.symbol,
        side: trade.side,
        quantity: trade.quantity,
        price: trade.price,
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
        commission: trade.commission,
        slippageCost: trade.slippageCost,
        pnl: trade.pnl,
      }));
      await backtestRepository.insertTrades(client, backtest.id, trades);

      const strategyEquity = engine.equity.map((point) => ({
        timestamp: new Date(point.timestamp).toISOString(),
        equity: point.equity,
        cash: point.cash,
        positionValue: point.positionValue,
        dailyReturn: point.dailyReturn,
        drawdown: point.drawdown,
      }));
      const benchmarkEquity = engine.benchmarkEquity.map((point) => ({
        timestamp: new Date(point.timestamp).toISOString(),
        equity: point.equity,
        cash: point.cash,
        positionValue: point.positionValue,
        dailyReturn: point.dailyReturn,
        drawdown: point.drawdown,
      }));

      await backtestRepository.insertMetrics(client, backtest.id, metrics, benchmark, engine.finalEquity);
      await backtestRepository.insertEquity(client, backtest.id, 'strategy', strategyEquity);
      await backtestRepository.insertEquity(client, backtest.id, 'benchmark', benchmarkEquity);
      await client.query('COMMIT');

      return (await backtestRepository.findSummaryByIdAndUser(backtest.id, userId))!;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async listBacktests(userId: string, options: { limit?: number; offset?: number } = {}) {
    const items = await backtestRepository.listByUser(userId, options);
    for (const item of items) {
      item.strategyName = strategyRegistry.get(item.strategyId)?.name ?? item.strategyId;
    }
    return { items, total: await backtestRepository.countByUser(userId) };
  },

  async getBacktest(userId: string, id: string) {
    const summary = await backtestRepository.findSummaryByIdAndUser(id, userId);
    if (!summary) {
      throw ApiError.notFound(BACKTEST_ERROR_CODES.NOT_FOUND, 'Backtest not found', undefined, 'The backtest may have been deleted, or the link is invalid.');
    }
    const strategy = strategyRegistry.get(summary.strategyId);
    summary.strategyName = strategy?.name ?? summary.strategyId;

    const detail = await backtestRepository.findMetricsById(id);
    return {
      backtest: summary,
      metrics: detail?.metrics ?? null,
      benchmark: detail?.benchmark ?? null,
      finalEquity: detail?.finalEquity ?? null,
    };
  },

  async getTrades(userId: string, id: string, options: { limit?: number; offset?: number } = {}) {
    const summary = await backtestRepository.findSummaryByIdAndUser(id, userId);
    if (!summary) {
      throw ApiError.notFound(BACKTEST_ERROR_CODES.NOT_FOUND, 'Backtest not found', undefined, 'The backtest may have been deleted, or the link is invalid.');
    }
    return backtestRepository.listTrades(id, options);
  },

  async getEquitySeries(userId: string, id: string): Promise<EquitySeriesPoint[]> {
    const summary = await backtestRepository.findSummaryByIdAndUser(id, userId);
    if (!summary) {
      throw ApiError.notFound(BACKTEST_ERROR_CODES.NOT_FOUND, 'Backtest not found', undefined, 'The backtest may have been deleted, or the link is invalid.');
    }
    return backtestRepository.equitySeries(id);
  },

  async deleteBacktest(userId: string, id: string): Promise<void> {
    const summary = await backtestRepository.findSummaryByIdAndUser(id, userId);
    if (!summary) {
      throw ApiError.notFound(BACKTEST_ERROR_CODES.NOT_FOUND, 'Backtest not found', undefined, 'The backtest may have been deleted, or the link is invalid.');
    }
    await backtestRepository.deleteById(id);
  },
};
