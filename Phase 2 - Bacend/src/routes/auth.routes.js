import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { authRateLimiter } from '../middleware/rateLimit.middleware.js';
import { registerSchema, loginSchema } from '../utils/schemas.js';

const router = Router();

router.post('/register', authRateLimiter, validate({ body: registerSchema }), authController.register);
router.post('/login', authRateLimiter, validate({ body: loginSchema }), authController.login);
router.get('/me', requireAuth, authController.me);

export default router;
