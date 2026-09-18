import { Router } from 'express';
import * as vehicleController from '../controllers/vehicle.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { idParam, createVehicleSchema, updateVehicleSchema } from '../utils/schemas.js';

const router = Router();
router.use(requireAuth);

router.post('/', validate({ body: createVehicleSchema }), vehicleController.create);
router.get('/', vehicleController.list);
router.get('/:id', validate({ params: idParam() }), vehicleController.getOne);
router.put('/:id', validate({ params: idParam(), body: updateVehicleSchema }), vehicleController.update);
router.delete('/:id', validate({ params: idParam() }), vehicleController.remove);

export default router;
