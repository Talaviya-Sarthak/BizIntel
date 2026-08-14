import { Router } from 'express';
import * as authController from '../../controllers/auth.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authLimiter } from '../../middlewares/rateLimiter.js';
import { validate } from '../../middlewares/validate.js';
import { loginSchema, registerSchema } from '../../validators/auth.validator.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
