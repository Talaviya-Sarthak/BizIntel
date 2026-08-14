import type { Request, Response } from 'express';
import { datamartService } from '../services/datamart.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

/**
 * Thin HTTP layer for the DataMart module. Handlers stay in the service;
 * controllers only translate requests/responses and never touch SQL or the
 * compiler directly.
 */

// --- Query execution -------------------------------------------------------

export const executeQuery = asyncHandler(async (req: Request, res: Response) => {
  const data = await datamartService.executeQuery(req.auth!.userId, req.body.query);
  res.status(200).json({ success: true, data });
});

export const getOverview = asyncHandler(async (req: Request, res: Response) => {
  const data = await datamartService.getOverview(req.auth!.userId);
  res.status(200).json({ success: true, data });
});

export const getComparison = asyncHandler(async (req: Request, res: Response) => {
  const data = await datamartService.getComparison(
    req.auth!.userId,
    String(req.query.datasetA),
    String(req.query.datasetB),
  );
  res.status(200).json({ success: true, data });
});

// --- Analyses --------------------------------------------------------------

export const createAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const data = await datamartService.createAnalysis(req.auth!.userId, req.body);
  res.status(201).json({ success: true, data });
});

export const listAnalyses = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit === undefined ? undefined : Number(req.query.limit);
  const offset = req.query.offset === undefined ? undefined : Number(req.query.offset);
  const data = await datamartService.listAnalyses(req.auth!.userId, { limit, offset });
  res.status(200).json({ success: true, data });
});

export const getAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const data = await datamartService.getAnalysis(req.auth!.userId, req.params.id!);
  res.status(200).json({ success: true, data });
});

export const executeAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const data = await datamartService.executeAnalysis(req.auth!.userId, req.params.id!);
  res.status(200).json({ success: true, data });
});

export const listAnalysisRuns = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit === undefined ? undefined : Number(req.query.limit);
  const offset = req.query.offset === undefined ? undefined : Number(req.query.offset);
  const data = await datamartService.listAnalysisRuns(req.auth!.userId, req.params.id!, { limit, offset });
  res.status(200).json({ success: true, data });
});

export const updateAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const data = await datamartService.updateAnalysis(req.auth!.userId, req.params.id!, req.body);
  res.status(200).json({ success: true, data });
});

export const deleteAnalysis = asyncHandler(async (req: Request, res: Response) => {
  await datamartService.deleteAnalysis(req.auth!.userId, req.params.id!);
  res.status(200).json({ success: true, data: null });
});

// --- Metrics ---------------------------------------------------------------

export const createMetric = asyncHandler(async (req: Request, res: Response) => {
  const data = await datamartService.createMetric(req.auth!.userId, req.body);
  res.status(201).json({ success: true, data });
});

export const listMetrics = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit === undefined ? undefined : Number(req.query.limit);
  const offset = req.query.offset === undefined ? undefined : Number(req.query.offset);
  const datasetId = req.query.datasetId === undefined ? undefined : String(req.query.datasetId);
  const data = await datamartService.listMetrics(req.auth!.userId, { limit, offset, datasetId });
  res.status(200).json({ success: true, data });
});

export const getMetric = asyncHandler(async (req: Request, res: Response) => {
  const data = await datamartService.getMetric(req.auth!.userId, req.params.id!);
  res.status(200).json({ success: true, data });
});

export const executeMetric = asyncHandler(async (req: Request, res: Response) => {
  const data = await datamartService.executeMetric(req.auth!.userId, req.params.id!);
  res.status(200).json({ success: true, data });
});

export const updateMetric = asyncHandler(async (req: Request, res: Response) => {
  const data = await datamartService.updateMetric(req.auth!.userId, req.params.id!, req.body);
  res.status(200).json({ success: true, data });
});

export const deleteMetric = asyncHandler(async (req: Request, res: Response) => {
  await datamartService.deleteMetric(req.auth!.userId, req.params.id!);
  res.status(200).json({ success: true, data: null });
});

// --- Dashboards ------------------------------------------------------------

export const createDashboard = asyncHandler(async (req: Request, res: Response) => {
  const data = await datamartService.createDashboard(req.auth!.userId, req.body);
  res.status(201).json({ success: true, data });
});

export const listDashboards = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit === undefined ? undefined : Number(req.query.limit);
  const offset = req.query.offset === undefined ? undefined : Number(req.query.offset);
  const data = await datamartService.listDashboards(req.auth!.userId, { limit, offset });
  res.status(200).json({ success: true, data });
});

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const data = await datamartService.getDashboard(req.auth!.userId, req.params.id!);
  res.status(200).json({ success: true, data });
});

export const updateDashboard = asyncHandler(async (req: Request, res: Response) => {
  const data = await datamartService.updateDashboard(req.auth!.userId, req.params.id!, req.body);
  res.status(200).json({ success: true, data });
});

export const deleteDashboard = asyncHandler(async (req: Request, res: Response) => {
  await datamartService.deleteDashboard(req.auth!.userId, req.params.id!);
  res.status(200).json({ success: true, data: null });
});

export const createWidget = asyncHandler(async (req: Request, res: Response) => {
  const data = await datamartService.createWidget(req.auth!.userId, req.params.id!, req.body);
  res.status(201).json({ success: true, data });
});

export const updateWidget = asyncHandler(async (req: Request, res: Response) => {
  const data = await datamartService.updateWidget(
    req.auth!.userId,
    req.params.id!,
    req.params.widgetId!,
    req.body,
  );
  res.status(200).json({ success: true, data });
});

export const deleteWidget = asyncHandler(async (req: Request, res: Response) => {
  await datamartService.deleteWidget(req.auth!.userId, req.params.id!, req.params.widgetId!);
  res.status(200).json({ success: true, data: null });
});

export const reorderWidgets = asyncHandler(async (req: Request, res: Response) => {
  await datamartService.reorderWidgets(req.auth!.userId, req.params.id!, req.body.orderedIds);
  res.status(200).json({ success: true, data: null });
});