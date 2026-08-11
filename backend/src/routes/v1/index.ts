import { Router } from 'express';
import analyticsRoutes from './analytics.routes';
import authRoutes from './auth.routes';
import backtestingRoutes from './backtesting.routes';
import dashboardRoutes from './dashboard.routes';
import datasetRoutes from './dataset.routes';
import healthRoutes from './health.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/health', healthRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/datasets', datasetRoutes);
router.use('/datasets', analyticsRoutes);
router.use(backtestingRoutes);

export default router;
