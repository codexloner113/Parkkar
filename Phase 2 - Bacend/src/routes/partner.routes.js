import { Router } from 'express';
import * as partnerController from '../controllers/partner.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import {
  idParam, createLocationSchema, updateLocationSchema,
  createSlotSchema, updateSlotSchema, paginationQuery, revenueQuerySchema,
} from '../utils/schemas.js';

const router = Router();
router.use(requireAuth, requireRole('PARTNER'));

router.post('/parking', validate({ body: createLocationSchema }), partnerController.createLocation);
router.get('/parking', partnerController.listOwnLocations);
router.get('/parking/:id', validate({ params: idParam() }), partnerController.getOwnLocation);
router.put('/parking/:id', validate({ params: idParam(), body: updateLocationSchema }), partnerController.updateOwnLocation);
router.delete('/parking/:id', validate({ params: idParam() }), partnerController.deleteOwnLocation);

router.post(
  '/parking/:parkingId/slots',
  validate({ params: idParam('parkingId'), body: createSlotSchema }),
  partnerController.createSlot
);
router.get('/parking/:parkingId/slots', validate({ params: idParam('parkingId') }), partnerController.listSlots);
router.put('/slots/:slotId', validate({ params: idParam('slotId'), body: updateSlotSchema }), partnerController.updateSlot);
router.delete('/slots/:slotId', validate({ params: idParam('slotId') }), partnerController.deleteSlot);

// NOTE: Phase 1 has no location_services table (see service.repository.js),
// so per-location service management endpoints from the brief are not
// implemented — there is no schema-backed relationship to manage. The
// service catalog is global and read via GET /api/services and
// GET /api/parking/:id/services.

router.get('/bookings', validate({ query: paginationQuery }), partnerController.ownBookings);
router.get('/revenue', validate({ query: revenueQuerySchema }), partnerController.revenue);

export default router;
