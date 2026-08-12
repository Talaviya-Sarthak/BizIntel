import { Router } from 'express';
import analyticsRoutes from './analytics.routes';
import authRoutes from './auth.routes';
import backtestingRoutes from './backtesting.routes';
import dashboardRoutes from './dashboard.routes';
import datasetRoutes from './dataset.routes';
import datamartRoutes from './datamart.routes';
import healthRoutes from './health.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/backtesting', backtestingRoutes);
router.use('/datasets', datasetRoutes);
router.use('/datasets', analyticsRoutes);
<<<<<<< HEAD
router.use('/health', healthRoutes);
router.use('/dashboard', dashboardRoutes);
=======
router.use(backtestingRoutes);
router.use(datamartRoutes);
>>>>>>> 50ef85d75a69eea2f7a08a00898025714d3b3ab1

export default router;
