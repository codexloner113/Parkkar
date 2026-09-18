import { Router } from 'express';
import * as favoriteController from '../controllers/favorite.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { idParam } from '../utils/schemas.js';

const router = Router();
router.use(requireAuth);

router.post('/:parkingId', validate({ params: idParam('parkingId') }), favoriteController.add);
router.get('/', favoriteController.list);
router.delete('/:parkingId', validate({ params: idParam('parkingId') }), favoriteController.remove);

export default router;
