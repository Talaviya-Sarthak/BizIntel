import { Router } from 'express';
import * as analyticsController from '../../controllers/analytics.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { requireDatasetOwner } from '../../middlewares/requireDatasetOwner.js';
import { validate } from '../../middlewares/validate.js';
import {
  analyticsBucketsQuerySchema,
  analyticsColumnParamsSchema,
  analyticsExplorerSchema,
  analyticsGroupBySchema,
  analyticsScatterSchema,
  analyticsTimeSeriesSchema,
  analyticsTopValuesQuerySchema,
} from '../../validators/analytics.validator.js';

/**
 * Dataset Intelligence Workspace analytics API. Every route is protected by
 * `authenticate` + `requireDatasetOwner` (ownership 404). Analytics run in
 * DuckDB; PostgreSQL only supplies column metadata.
 */
const router = Router();

router.use(authenticate);

router.get('/:id/analytics/overview', requireDatasetOwner, analyticsController.getOverview);
router.get('/:id/analytics/quality', requireDatasetOwner, analyticsController.getQuality);
router.get('/:id/analytics/columns', requireDatasetOwner, analyticsController.getColumns);
router.get('/:id/analytics/insights', requireDatasetOwner, analyticsController.getInsights);

router.get(
  '/:id/analytics/columns/:column/statistics',
  requireDatasetOwner,
  validate(analyticsColumnParamsSchema, { target: 'params' }),
  analyticsController.getColumnStatistics,
);
router.get(
  '/:id/analytics/columns/:column/distribution',
  requireDatasetOwner,
  validate(analyticsColumnParamsSchema, { target: 'params' }),
  validate(analyticsBucketsQuerySchema, { target: 'query' }),
  analyticsController.getColumnDistribution,
);
router.get(
  '/:id/analytics/columns/:column/top-values',
  requireDatasetOwner,
  validate(analyticsColumnParamsSchema, { target: 'params' }),
  validate(analyticsTopValuesQuerySchema, { target: 'query' }),
  analyticsController.getColumnTopValues,
);
router.get(
  '/:id/analytics/columns/:column/outliers',
  requireDatasetOwner,
  validate(analyticsColumnParamsSchema, { target: 'params' }),
  analyticsController.getColumnOutliers,
);

router.post(
  '/:id/analytics/group-by',
  requireDatasetOwner,
  validate(analyticsGroupBySchema),
  analyticsController.getGroupBy,
);
router.post(
  '/:id/analytics/scatter',
  requireDatasetOwner,
  validate(analyticsScatterSchema),
  analyticsController.getScatter,
);
router.post(
  '/:id/analytics/time-series',
  requireDatasetOwner,
  validate(analyticsTimeSeriesSchema),
  analyticsController.getTimeSeries,
);
router.post('/:id/analytics/correlation', requireDatasetOwner, analyticsController.getCorrelation);
router.post(
  '/:id/analytics/filter',
  requireDatasetOwner,
  validate(analyticsExplorerSchema),
  analyticsController.getFilteredRows,
);

// Extended analytics for Analysis Dashboard
router.get('/:id/analytics/full-statistics', requireDatasetOwner, analyticsController.getFullStatistics);
router.get('/:id/analytics/missing-values', requireDatasetOwner, analyticsController.getMissingValueAnalysis);
router.get('/:id/analytics/outliers', requireDatasetOwner, analyticsController.getOutlierAnalysis);
router.get('/:id/analytics/business-insights', requireDatasetOwner, analyticsController.getBusinessInsights);
router.get('/:id/analytics/ai-summary', requireDatasetOwner, analyticsController.getAISummary);

export default router;
