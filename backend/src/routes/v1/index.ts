import { Router } from 'express';
import { aiRoutes } from '../../ai';
import analyticsRoutes from './analytics.routes';
import authRoutes from './auth.routes';
import backtestingRoutes from './backtesting.routes';
import dashboardRoutes from './dashboard.routes';
import datasetRoutes from './dataset.routes';
import datamartRoutes from './datamart.routes';
import healthRoutes from './health.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/health', healthRoutes);
router.use('/ai', aiRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/datasets', datasetRoutes);
router.use('/datasets', analyticsRoutes);
router.use(backtestingRoutes);
router.use(datamartRoutes);

export default router;
