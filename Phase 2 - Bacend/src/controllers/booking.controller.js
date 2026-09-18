import * as bookingService from '../services/booking.service.js';
import * as paymentService from '../services/payment.service.js';
import { sendSuccess } from '../utils/response.js';
import { paginationMeta, getPagination } from '../utils/pagination.js';

export async function create(req, res, next) {
  try {
    const booking = await bookingService.createBooking(req.user.id, req.body);

    return sendSuccess(res, {
      message: 'Booking created successfully.',
      data: booking,
      status: 201,
    });
  } catch (err) {
    return next(err);
  }
}

export async function list(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { rows, total } = await bookingService.listBookings(
      req.user,
      { limit, offset }
    );

    return sendSuccess(res, {
      message: 'Bookings retrieved.',
      data: rows,
      meta: paginationMeta(page, limit, total),
    });
  } catch (err) {
    return next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const booking = await bookingService.getBookingWithDetail(req.params.id);

    await bookingService.assertCanViewBooking(booking, req.user);

    return sendSuccess(res, {
      message: 'Booking retrieved.',
      data: booking,
    });
  } catch (err) {
    return next(err);
  }
}

export async function cancel(req, res, next) {
  try {
    const booking = await bookingService.cancelBooking(
      req.params.id,
      req.user,
      req.body?.reason
    );

    return sendSuccess(res, {
      message: 'Booking cancelled.',
      data: booking,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Creates a Razorpay order for a pending booking.
 */
export async function createRazorpayOrder(req, res, next) {
  try {
    const result = await paymentService.createRazorpayOrder(
      req.params.id,
      req.user.id
    );

    return sendSuccess(res, {
      message: 'Razorpay order created successfully.',
      data: result,
      status: 201,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Verifies a Razorpay Checkout payment signature.
 */
export async function verifyRazorpayPayment(req, res, next) {
  try {
    const payment = await paymentService.verifyRazorpayPayment({
      bookingId: req.params.id,
      userId: req.user.id,
      razorpayOrderId: req.body.razorpay_order_id,
      razorpayPaymentId: req.body.razorpay_payment_id,
      razorpaySignature: req.body.razorpay_signature,
    });

    return sendSuccess(res, {
      message: 'Razorpay payment verified successfully.',
      data: payment,
    });
  } catch (err) {
    return next(err);
  }
}

/** MOCK/DEVELOPMENT ONLY — see services/payment.service.js. */
export async function mockPay(req, res, next) {
  try {
    const payment = await paymentService.mockPayBooking(
      req.params.id,
      req.user.id,
      req.body?.method
    );

    return sendSuccess(res, {
      message:
        'MOCK payment recorded (development only — no real gateway was called).',
      data: payment,
    });
  } catch (err) {
    return next(err);
  }
}

export async function getQr(req, res, next) {
  try {
    const result = await bookingService.getBookingQr(
      req.params.id,
      req.user
    );

    return sendSuccess(res, {
      message: 'Booking QR generated.',
      data: result,
    });
  } catch (err) {
    return next(err);
  }
}

export async function verifyQr(req, res, next) {
  try {
    const result = await bookingService.verifyBookingQr({
      token: req.body.token,
      action: req.body.action,
      verifier: req.user,
    });

    return sendSuccess(res, {
      message:
        result.action === 'ENTRY'
          ? 'Booking entry verified successfully.'
          : 'Booking exit verified successfully.',
      data: result,
    });
  } catch (err) {
    return next(err);
  }
}
