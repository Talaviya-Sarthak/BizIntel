import { Router } from 'express';
import * as dashboardController from '../../controllers/dashboard.controller';
import { authenticate } from '../../middlewares/authenticate';

const router = Router();

router.get('/summary', authenticate, dashboardController.getDashboardSummary);

export default router;
