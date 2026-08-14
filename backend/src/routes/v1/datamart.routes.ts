import { Router } from 'express';
import * as datamartController from '../../datamart/controllers/datamart.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';
import {
  comparisonQuerySchema,
  createAnalysisSchema,
  createDashboardSchema,
  createMetricSchema,
  createWidgetSchema,
  datamartExecuteSchema,
  datamartIdParamsSchema,
  datamartListQuerySchema,
  datamartMetricDatasetQuerySchema,
  datamartRunsQuerySchema,
  datamartWidgetParamsSchema,
  reorderWidgetsSchema,
  updateAnalysisSchema,
  updateDashboardSchema,
  updateMetricSchema,
  updateWidgetSchema,
} from '../../datamart/validators/datamart.validator.js';

/**
 * DataMart API — the reusable analytical layer.
 *
 *   GET    /datamart/overview                       — activity + entity counts
 *   GET    /datamart/comparison                     — schema comparison (2 datasets)
 *   POST   /datamart/execute                        — run a structured query (ad-hoc)
 *   POST   /datamart/analyses                       — save a structured query
 *   GET    /datamart/analyses                       — list saved analyses
 *   GET    /datamart/analyses/:id                   — a saved analysis
 *   PATCH  /datamart/analyses/:id                   — update a saved analysis
 *   DELETE /datamart/analyses/:id                   — delete an analysis
 *   POST   /datamart/analyses/:id/execute           — run a saved analysis
 *   GET    /datamart/analyses/:id/runs              — execution history
 *   POST   /datamart/metrics                        — create a reusable KPI
 *   GET    /datamart/metrics                        — list KPIs (filter by ?datasetId)
 *   GET    /datamart/metrics/:id                    — a KPI
 *   POST   /datamart/metrics/:id/execute            — evaluate a KPI
 *   PATCH  /datamart/metrics/:id                    — update a KPI
 *   DELETE /datamart/metrics/:id                    — delete a KPI
 *   POST   /datamart/dashboards                     — create a dashboard
 *   GET    /datamart/dashboards                     — list dashboards
 *   GET    /datamart/dashboards/:id                 — dashboard + widgets
 *   PATCH  /datamart/dashboards/:id                 — update a dashboard
 *   DELETE /datamart/dashboards/:id                 — delete a dashboard
 *   POST   /datamart/dashboards/:id/widgets         — add a widget
 *   PATCH  /datamart/dashboards/:id/widgets/:widgetId
 *   DELETE /datamart/dashboards/:id/widgets/:widgetId
 *   POST   /datamart/dashboards/:id/widgets/reorder
 *
 * Every route is authenticated; ownership is enforced with a 404 so foreign
 * resources are never leaked.
 */
const router = Router();

router.use(authenticate);

// --- Query execution & overview --------------------------------------------

router.post('/datamart/execute', validate(datamartExecuteSchema), datamartController.executeQuery);

router.get('/datamart/overview', datamartController.getOverview);

router.get(
  '/datamart/comparison',
  validate(comparisonQuerySchema, { target: 'query' }),
  datamartController.getComparison,
);

// --- Analyses --------------------------------------------------------------

router.post('/datamart/analyses', validate(createAnalysisSchema), datamartController.createAnalysis);

router.get(
  '/datamart/analyses',
  validate(datamartListQuerySchema, { target: 'query' }),
  datamartController.listAnalyses,
);

router.get(
  '/datamart/analyses/:id',
  validate(datamartIdParamsSchema, { target: 'params' }),
  datamartController.getAnalysis,
);

router.post(
  '/datamart/analyses/:id/execute',
  validate(datamartIdParamsSchema, { target: 'params' }),
  datamartController.executeAnalysis,
);

router.get(
  '/datamart/analyses/:id/runs',
  validate(datamartIdParamsSchema, { target: 'params' }),
  validate(datamartRunsQuerySchema, { target: 'query' }),
  datamartController.listAnalysisRuns,
);

router.patch(
  '/datamart/analyses/:id',
  validate(datamartIdParamsSchema, { target: 'params' }),
  validate(updateAnalysisSchema),
  datamartController.updateAnalysis,
);

router.delete(
  '/datamart/analyses/:id',
  validate(datamartIdParamsSchema, { target: 'params' }),
  datamartController.deleteAnalysis,
);

// --- Metrics ---------------------------------------------------------------

router.post('/datamart/metrics', validate(createMetricSchema), datamartController.createMetric);

router.get(
  '/datamart/metrics',
  validate(datamartMetricDatasetQuerySchema, { target: 'query' }),
  validate(datamartListQuerySchema, { target: 'query' }),
  datamartController.listMetrics,
);

router.get(
  '/datamart/metrics/:id',
  validate(datamartIdParamsSchema, { target: 'params' }),
  datamartController.getMetric,
);

router.post(
  '/datamart/metrics/:id/execute',
  validate(datamartIdParamsSchema, { target: 'params' }),
  datamartController.executeMetric,
);

router.patch(
  '/datamart/metrics/:id',
  validate(datamartIdParamsSchema, { target: 'params' }),
  validate(updateMetricSchema),
  datamartController.updateMetric,
);

router.delete(
  '/datamart/metrics/:id',
  validate(datamartIdParamsSchema, { target: 'params' }),
  datamartController.deleteMetric,
);

// --- Dashboards ------------------------------------------------------------

router.post('/datamart/dashboards', validate(createDashboardSchema), datamartController.createDashboard);

router.get(
  '/datamart/dashboards',
  validate(datamartListQuerySchema, { target: 'query' }),
  datamartController.listDashboards,
);

router.get(
  '/datamart/dashboards/:id',
  validate(datamartIdParamsSchema, { target: 'params' }),
  datamartController.getDashboard,
);

router.patch(
  '/datamart/dashboards/:id',
  validate(datamartIdParamsSchema, { target: 'params' }),
  validate(updateDashboardSchema),
  datamartController.updateDashboard,
);

router.delete(
  '/datamart/dashboards/:id',
  validate(datamartIdParamsSchema, { target: 'params' }),
  datamartController.deleteDashboard,
);

router.post(
  '/datamart/dashboards/:id/widgets',
  validate(datamartIdParamsSchema, { target: 'params' }),
  validate(createWidgetSchema),
  datamartController.createWidget,
);

router.post(
  '/datamart/dashboards/:id/widgets/reorder',
  validate(datamartIdParamsSchema, { target: 'params' }),
  validate(reorderWidgetsSchema),
  datamartController.reorderWidgets,
);

router.patch(
  '/datamart/dashboards/:id/widgets/:widgetId',
  validate(datamartWidgetParamsSchema, { target: 'params' }),
  validate(updateWidgetSchema),
  datamartController.updateWidget,
);

router.delete(
  '/datamart/dashboards/:id/widgets/:widgetId',
  validate(datamartWidgetParamsSchema, { target: 'params' }),
  datamartController.deleteWidget,
);

export default router;