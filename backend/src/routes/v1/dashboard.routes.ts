import { Router } from 'express';
import * as dashboardController from '../../controllers/dashboard.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';

const router = Router();

router.get('/summary', authenticate, dashboardController.getDashboardSummary);

export default router;
