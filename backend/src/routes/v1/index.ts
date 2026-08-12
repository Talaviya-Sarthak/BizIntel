import { Router } from 'express';
import authRoutes from './auth.routes';
import backtestRoutes from '../../features/backtesting/routes/backtest.routes';
import backtestingRoutes from '../../features/backtesting/routes/backtesting.routes';
import datasetRoutes from '../../features/datasets/routes/dataset.routes';
import healthRoutes from './health.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/backtests', backtestRoutes);
router.use('/backtesting', backtestingRoutes);
router.use('/datasets', datasetRoutes);
router.use('/health', healthRoutes);

export default router;
