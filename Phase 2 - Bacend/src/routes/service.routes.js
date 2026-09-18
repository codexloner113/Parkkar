import { Router } from 'express';
import * as serviceController from '../controllers/service.controller.js';

const router = Router();

router.get('/', serviceController.list);

export default router;
