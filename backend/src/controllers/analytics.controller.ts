import type { Request, Response } from 'express';
import * as datasetColumnRepository from '../repositories/datasetColumn.repository';
import { analyticsService } from '../services/analytics.service';
import { asyncHandler } from '../utils/asyncHandler';
import type {
  AnalyticsGroupByInput,
  AnalyticsTimeSeriesInput,
} from '../validators/analytics.validator';

/**
 * Thin HTTP layer for the Dataset Intelligence Workspace. Every handler
 * resolves columns from PostgreSQL metadata, delegates the analytical
 * computation to AnalyticsService → DuckDB, and never touches SQL itself.
 */

export const getOverview = asyncHandler(async (req: Request, res: Response) => {
  const dataset = req.dataset!;
  const columns = await datasetColumnRepository.listByDatasetId(dataset.id);
  res.status(200).json({ success: true, data: await analyticsService.getOverview(dataset, columns) });
});

export const getQuality = asyncHandler(async (req: Request, res: Response) => {
  const dataset = req.dataset!;
  const columns = await datasetColumnRepository.listByDatasetId(dataset.id);
  res.status(200).json({ success: true, data: await analyticsService.getQuality(dataset, columns) });
});

export const getColumns = asyncHandler(async (req: Request, res: Response) => {
  const dataset = req.dataset!;
  const columns = await datasetColumnRepository.listByDatasetId(dataset.id);
  res.status(200).json({ success: true, data: await analyticsService.getColumns(dataset, columns) });
});

export const getColumnStatistics = asyncHandler(async (req: Request, res: Response) => {
  const dataset = req.dataset!;
  const { column } = req.params;
  const columns = await datasetColumnRepository.listByDatasetId(dataset.id);
  res.status(200).json({
    success: true,
    data: await analyticsService.getColumnStatistics(dataset, columns, column!),
  });
});

export const getColumnDistribution = asyncHandler(async (req: Request, res: Response) => {
  const dataset = req.dataset!;
  const { column } = req.params;
  const columns = await datasetColumnRepository.listByDatasetId(dataset.id);
  const buckets = (req.query.buckets as string | undefined)
    ? Number(req.query.buckets)
    : undefined;
  res.status(200).json({
    success: true,
    data: await analyticsService.getColumnDistribution(dataset, columns, column!, buckets),
  });
});

export const getColumnTopValues = asyncHandler(async (req: Request, res: Response) => {
  const dataset = req.dataset!;
  const { column } = req.params;
  const columns = await datasetColumnRepository.listByDatasetId(dataset.id);
  const top = (req.query.top as string | undefined) ? Number(req.query.top) : undefined;
  res.status(200).json({
    success: true,
    data: await analyticsService.getColumnTopValues(dataset, columns, column!, top),
  });
});

export const getColumnOutliers = asyncHandler(async (req: Request, res: Response) => {
  const dataset = req.dataset!;
  const { column } = req.params;
  const columns = await datasetColumnRepository.listByDatasetId(dataset.id);
  res.status(200).json({
    success: true,
    data: await analyticsService.getColumnOutliers(dataset, columns, column!),
  });
});

export const getCorrelation = asyncHandler(async (req: Request, res: Response) => {
  const dataset = req.dataset!;
  const columns = await datasetColumnRepository.listByDatasetId(dataset.id);
  const body = (req.body ?? {}) as { columns?: string[] };
  res.status(200).json({
    success: true,
    data: await analyticsService.getCorrelation(dataset, columns, body.columns),
  });
});

export const getGroupBy = asyncHandler(async (req: Request, res: Response) => {
  const dataset = req.dataset!;
  const columns = await datasetColumnRepository.listByDatasetId(dataset.id);
  const body = req.body as AnalyticsGroupByInput;
  res.status(200).json({
    success: true,
    data: await analyticsService.getGroupBy(dataset, columns, body),
  });
});

export const getScatter = asyncHandler(async (req: Request, res: Response) => {
  const dataset = req.dataset!;
  const columns = await datasetColumnRepository.listByDatasetId(dataset.id);
  const body = req.body as { x: string; y: string; sample?: number };
  res.status(200).json({
    success: true,
    data: await analyticsService.getScatter(dataset, columns, body),
  });
});

export const getTimeSeries = asyncHandler(async (req: Request, res: Response) => {
  const dataset = req.dataset!;
  const columns = await datasetColumnRepository.listByDatasetId(dataset.id);
  const body = req.body as AnalyticsTimeSeriesInput;
  res.status(200).json({
    success: true,
    data: await analyticsService.getTimeSeries(dataset, columns, body),
  });
});

export const getFilteredRows = asyncHandler(async (req: Request, res: Response) => {
  const dataset = req.dataset!;
  const columns = await datasetColumnRepository.listByDatasetId(dataset.id);
  const body = req.body as Parameters<typeof analyticsService.getFilteredRows>[2];
  res.status(200).json({
    success: true,
    data: await analyticsService.getFilteredRows(dataset, columns, body),
  });
});

export const getInsights = asyncHandler(async (req: Request, res: Response) => {
  const dataset = req.dataset!;
  const columns = await datasetColumnRepository.listByDatasetId(dataset.id);
  res.status(200).json({
    success: true,
    data: await analyticsService.getInsights(dataset, columns),
  });
});

export const getFullStatistics = asyncHandler(async (req: Request, res: Response) => {
  const dataset = req.dataset!;
  const columns = await datasetColumnRepository.listByDatasetId(dataset.id);
  res.status(200).json({
    success: true,
    data: await analyticsService.getFullStatistics(dataset, columns),
  });
});

export const getMissingValueAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const dataset = req.dataset!;
  const columns = await datasetColumnRepository.listByDatasetId(dataset.id);
  res.status(200).json({
    success: true,
    data: await analyticsService.getMissingValueAnalysis(dataset, columns),
  });
});

export const getOutlierAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const dataset = req.dataset!;
  const columns = await datasetColumnRepository.listByDatasetId(dataset.id);
  res.status(200).json({
    success: true,
    data: await analyticsService.getOutlierAnalysis(dataset, columns),
  });
});

export const getBusinessInsights = asyncHandler(async (req: Request, res: Response) => {
  const dataset = req.dataset!;
  const columns = await datasetColumnRepository.listByDatasetId(dataset.id);
  res.status(200).json({
    success: true,
    data: await analyticsService.getBusinessInsights(dataset, columns),
  });
});

export const getAISummary = asyncHandler(async (req: Request, res: Response) => {
  const dataset = req.dataset!;
  const columns = await datasetColumnRepository.listByDatasetId(dataset.id);
  res.status(200).json({
    success: true,
    data: await analyticsService.getAISummary(dataset, columns),
  });
});
