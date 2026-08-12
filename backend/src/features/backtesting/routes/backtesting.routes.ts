import { Router } from 'express';
import * as backtestController from '../controllers/backtest.controller';
import { authenticate } from '../../../middlewares/authenticate';

const router = Router();

router.use(authenticate);

router.get('/strategies', backtestController.getStrategies);

export default router;
