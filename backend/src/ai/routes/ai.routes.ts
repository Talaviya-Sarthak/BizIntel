import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import * as aiController from '../controllers/ai.controller';
import { chatInputSchema } from '../validators/ai.validator';

const router = Router();

// Protect all AI routes with JWT authentication
router.use(authenticate);

router.post('/chat', validate(chatInputSchema), aiController.chat);
router.get('/stream', aiController.streamChat);

export default router;
