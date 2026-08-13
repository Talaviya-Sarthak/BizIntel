import { Router } from 'express';
import * as backtestController from '../../backtesting/controllers/backtest.controller';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import {
  backtestCreateSchema,
  backtestIdParamsSchema,
  backtestListQuerySchema,
  backtestTradesQuerySchema,
  datasetIdParamsSchema,
} from '../../backtesting/validators/backtest.validator';

/**
 * Backtesting API.
 *
 *   GET    /backtesting/strategies         — available strategies + parameters
 *   GET    /backtesting/datasets/:id       — market-data compatibility of a dataset
 *   GET    /backtesting/datasets/:id/range — available date span of a compatible dataset
 *   POST   /backtests                      — run a backtest (synchronous)
 *   GET    /backtests                      — list owned backtests
 *   GET    /backtests/:id                  — summary + full metrics
 *   GET    /backtests/:id/trades           — paginated executed trades
 *   GET    /backtests/:id/equity           — merged strategy/benchmark equity series
 *   DELETE /backtests/:id                  — delete a backtest (cascades)
 *
 * Every route is authenticated; ownership is enforced with a 404 so foreign
 * resources are never leaked.
 */
const router = Router();

router.use(authenticate);

router.get('/backtesting/strategies', backtestController.listStrategies);

router.get(
  '/backtesting/datasets/:id',
  validate(datasetIdParamsSchema, { target: 'params' }),
  backtestController.getCompatibility,
);

router.get(
  '/backtesting/datasets/:id/range',
  validate(datasetIdParamsSchema, { target: 'params' }),
  backtestController.getDateRange,
);

router.post('/backtests', validate(backtestCreateSchema), backtestController.createBacktest);

router.get(
  '/backtests',
  validate(backtestListQuerySchema, { target: 'query' }),
  backtestController.listBacktests,
);

router.get(
  '/backtests/:id',
  validate(backtestIdParamsSchema, { target: 'params' }),
  backtestController.getBacktest,
);

router.get(
  '/backtests/:id/trades',
  validate(backtestIdParamsSchema, { target: 'params' }),
  validate(backtestTradesQuerySchema, { target: 'query' }),
  backtestController.getTrades,
);

router.get(
  '/backtests/:id/equity',
  validate(backtestIdParamsSchema, { target: 'params' }),
  backtestController.getEquitySeries,
);

router.delete(
  '/backtests/:id',
  validate(backtestIdParamsSchema, { target: 'params' }),
  backtestController.deleteBacktest,
);

export default router;
