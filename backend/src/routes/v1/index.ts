import { Router } from 'express';
import { aiRoutes } from '../../ai/index.js';
import { uploadRoutes } from '../../uploads/index.js';
import analyticsRoutes from './analytics.routes.js';
import authRoutes from './auth.routes.js';
import backtestingRoutes from './backtesting.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import datasetRoutes from './dataset.routes.js';
import datamartRoutes from './datamart.routes.js';
import healthRoutes from './health.routes.js';
import ragRoutes from './rag.routes.js';
import systemRoutes from './system.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/health', healthRoutes);
router.use('/system', systemRoutes);
router.use('/uploads', uploadRoutes);
router.use('/ai', aiRoutes);
router.use('/rag', ragRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/datasets', datasetRoutes);
router.use('/datasets', analyticsRoutes);
router.use(backtestingRoutes);
router.use(datamartRoutes);

export default router;
