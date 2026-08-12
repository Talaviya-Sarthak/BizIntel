import { Router } from 'express';
import * as backtestController from '../controllers/backtest.controller';
import { authenticate } from '../../../middlewares/authenticate';
import { validate } from '../../../middlewares/validate';
import { createBacktestSchema, listBacktestsSchema } from '../validators/backtest.validator';

const router = Router();

router.use(authenticate);

router.get('/', validate(listBacktestsSchema), backtestController.list);
router.get('/:id', backtestController.getOne);
router.post('/', validate(createBacktestSchema), backtestController.create);
router.delete('/:id', backtestController.remove);

export default router;
