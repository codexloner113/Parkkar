import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { paginationQuery, adminParkingQuerySchema, adminParkingStatusSchema, revenueQuerySchema, idParam } from '../utils/schemas.js';

const router = Router();
router.use(requireAuth, requireRole('ADMIN'));

router.get('/users', validate({ query: paginationQuery }), adminController.listUsers);
router.get('/partners', validate({ query: paginationQuery }), adminController.listPartners);
router.get('/parking', validate({ query: adminParkingQuerySchema }), adminController.listParking);
router.patch('/parking/:id/status', validate({ params: idParam(), body: adminParkingStatusSchema }), adminController.updateParkingStatus);
router.get('/bookings', validate({ query: paginationQuery }), adminController.listBookings);
router.get('/payments', validate({ query: paginationQuery }), adminController.listPayments);
router.get('/revenue', validate({ query: revenueQuerySchema }), adminController.revenue);

export default router;
