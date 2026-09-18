import { Router } from 'express';
import * as bookingController from '../controllers/booking.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import {
  idParam,
  createBookingSchema,
  cancelBookingSchema,
  mockPaySchema,
  paginationQuery,
  razorpayPaymentSchema,
  bookingQrVerifySchema,
} from '../utils/schemas.js';

const router = Router();

router.use(requireAuth);

router.post(
  '/',
  validate({ body: createBookingSchema }),
  bookingController.create
);

router.get(
  '/',
  validate({ query: paginationQuery }),
  bookingController.list
);

// Entry/exit verification is restricted to partners and admins.
router.post(
  '/verify/qr',
  requireRole('PARTNER', 'ADMIN'),
  validate({ body: bookingQrVerifySchema }),
  bookingController.verifyQr
);

// Generate a signed booking QR for the booking owner/partner/admin.
router.get(
  '/:id/qr',
  validate({ params: idParam() }),
  bookingController.getQr
);

router.get(
  '/:id',
  validate({ params: idParam() }),
  bookingController.getById
);

router.patch(
  '/:id/cancel',
  validate({
    params: idParam(),
    body: cancelBookingSchema,
  }),
  bookingController.cancel
);

// Create a real Razorpay order for a pending booking.
router.post(
  '/:id/pay',
  validate({ params: idParam() }),
  bookingController.createRazorpayOrder
);

// Verify the Razorpay Checkout payment signature.
router.post(
  '/:id/pay/verify',
  validate({
    params: idParam(),
    body: razorpayPaymentSchema,
  }),
  bookingController.verifyRazorpayPayment
);

// MOCK/DEVELOPMENT ONLY — simulates a successful payment; no real gateway.
router.post(
  '/:id/mock-pay',
  validate({
    params: idParam(),
    body: mockPaySchema,
  }),
  bookingController.mockPay
);

export default router;