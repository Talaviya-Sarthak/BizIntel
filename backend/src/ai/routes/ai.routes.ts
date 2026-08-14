import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';
import * as aiController from '../controllers/ai.controller.js';
import { chatInputSchema } from '../validators/ai.validator.js';

const router = Router();

// Protect all AI routes with JWT authentication
router.use(authenticate);

router.post('/chat', validate(chatInputSchema), aiController.chat);
router.get('/stream', aiController.streamChat);

export default router;
