import crypto from 'node:crypto';
import { razorpay } from '../config/razorpay.js';
import { env } from '../config/env.js';
import * as paymentRepo from '../repositories/payment.repository.js';
import * as bookingRepo from '../repositories/booking.repository.js';
import { Errors } from '../utils/errors.js';

/**
 * Creates a Razorpay order for a pending booking.
 *
 * The booking amount comes from the database and is never accepted
 * from the client.
 */
export async function createRazorpayOrder(bookingId, userId) {
  const booking = await bookingRepo.findBookingById(bookingId);

  if (!booking) {
    throw Errors.notFound('Booking not found.');
  }

  if (booking.user_id !== userId) {
    throw Errors.forbidden('You do not have access to this booking.');
  }

  if (booking.status !== 'PENDING') {
    throw Errors.badRequest(
      `Booking is in status ${booking.status}; only PENDING bookings can be paid.`,
      'INVALID_BOOKING_STATE'
    );
  }

  const existingPayment = await paymentRepo.findPaidByBooking(bookingId);

  if (existingPayment) {
    throw Errors.badRequest(
      'This booking has already been paid.',
      'PAYMENT_ALREADY_PAID'
    );
  }

  const amount = Number(booking.total_amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw Errors.badRequest(
      'Booking has an invalid payment amount.',
      'INVALID_PAYMENT_AMOUNT'
    );
  }

  const amountInPaise = Math.round(amount * 100);

  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: `booking_${bookingId}`,
    notes: {
      booking_id: String(bookingId),
      user_id: String(userId),
    },
  });

  const payment = await paymentRepo.createRazorpayOrderPayment({
    bookingId,
    amount,
    razorpayOrderId: razorpayOrder.id,
  });

  return {
    payment,
    order: {
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    },
    keyId: env.razorpayKeyId,
  };
}

/**
 * Verifies the Razorpay Checkout signature and marks the payment as PAID.
 *
 * After successful payment verification, the related booking is
 * automatically moved from PENDING to CONFIRMED.
 *
 * Signature verification must happen on the server using the Razorpay
 * secret. Never trust a payment as successful based only on frontend data.
 */
export async function verifyRazorpayPayment({
  bookingId,
  userId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) {
  const booking = await bookingRepo.findBookingById(bookingId);

  if (!booking) {
    throw Errors.notFound('Booking not found.');
  }

  if (booking.user_id !== userId) {
    throw Errors.forbidden('You do not have access to this booking.');
  }

  const payment = await paymentRepo.findByRazorpayOrderId(
    razorpayOrderId
  );

  if (!payment) {
    throw Errors.notFound('Razorpay order not found.');
  }

  if (String(payment.booking_id) !== String(bookingId)) {
    throw Errors.badRequest(
      'Razorpay order does not belong to this booking.',
      'PAYMENT_ORDER_MISMATCH'
    );
  }

  /*
   * If this payment was already processed, return it.
   * This makes repeated verification requests safe.
   */
  if (payment.status === 'PAID') {
    return payment;
  }

  const expectedSignature = crypto
    .createHmac('sha256', env.razorpayKeySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  const expectedSignatureBuffer = Buffer.from(
    expectedSignature,
    'utf8'
  );

  const receivedSignatureBuffer = Buffer.from(
    razorpaySignature || '',
    'utf8'
  );

  /*
   * timingSafeEqual throws if the two buffers have different lengths.
   * Check the length first so invalid signatures return a normal
   * application error instead of crashing.
   */
  const signaturesMatch =
    expectedSignatureBuffer.length === receivedSignatureBuffer.length &&
    crypto.timingSafeEqual(
      expectedSignatureBuffer,
      receivedSignatureBuffer
    );

  if (!signaturesMatch) {
    throw Errors.badRequest(
      'Razorpay payment signature verification failed.',
      'PAYMENT_SIGNATURE_INVALID'
    );
  }

  /*
   * Signature is valid. Cross-check the gateway state before fulfilling
   * the booking. Razorpay recommends checking the payment status after
   * signature verification and only treating captured payments as paid.
   */
  let gatewayPayment;
  let gatewayOrder;

  try {
    [gatewayPayment, gatewayOrder] = await Promise.all([
      razorpay.payments.fetch(razorpayPaymentId),
      razorpay.orders.fetch(razorpayOrderId),
    ]);
  } catch {
    throw Errors.badRequest(
      'Unable to verify the Razorpay payment with the gateway.',
      'PAYMENT_GATEWAY_VERIFICATION_FAILED'
    );
  }

  if (String(gatewayPayment.order_id) !== String(razorpayOrderId)) {
    throw Errors.badRequest(
      'Razorpay payment does not belong to the supplied order.',
      'PAYMENT_ORDER_MISMATCH'
    );
  }

  const expectedAmountInPaise = Math.round(Number(booking.total_amount) * 100);

  if (Number(gatewayOrder.amount) !== expectedAmountInPaise) {
    throw Errors.badRequest(
      'Razorpay order amount does not match the booking amount.',
      'PAYMENT_AMOUNT_MISMATCH'
    );
  }

  if (gatewayOrder.currency !== 'INR' || gatewayPayment.currency !== 'INR') {
    throw Errors.badRequest(
      'Razorpay payment currency is invalid.',
      'PAYMENT_CURRENCY_INVALID'
    );
  }

  if (gatewayPayment.status !== 'captured') {
    throw Errors.badRequest(
      `Razorpay payment is not captured yet (status: ${gatewayPayment.status}).`,
      'PAYMENT_NOT_CAPTURED'
    );
  }

  const gatewayMethod = String(gatewayPayment.method || '').toUpperCase();
  const allowedMethods = new Set([
    'CARD',
    'UPI',
    'NETBANKING',
    'WALLET',
    'OTHER',
  ]);

  const paymentMethod = allowedMethods.has(gatewayMethod)
    ? gatewayMethod
    : 'OTHER';

  const updatedPayment = await paymentRepo.markRazorpayPaymentPaid({
    paymentId: payment.id,
    razorpayPaymentId,
    razorpaySignature,
    method: paymentMethod,
  });

  if (!updatedPayment) {
    throw Errors.badRequest(
      'Payment could not be completed.',
      'PAYMENT_UPDATE_FAILED'
    );
  }

  /*
   * Payment is successfully verified.
   * Automatically confirm the booking.
   */
  const confirmedBooking =
    await bookingRepo.confirmBookingAfterPayment(bookingId);

  if (!confirmedBooking) {
    throw Errors.badRequest(
      'Payment was successful, but the booking could not be confirmed.',
      'BOOKING_CONFIRMATION_FAILED'
    );
  }

  return {
    payment: updatedPayment,
    booking: confirmedBooking,
  };
}

/**
 * MOCK/DEVELOPMENT ONLY.
 */
export async function mockPayBooking(
  bookingId,
  userId,
  method = 'UPI'
) {
  const booking = await bookingRepo.findBookingById(bookingId);

  if (!booking) {
    throw Errors.notFound('Booking not found.');
  }

  if (booking.user_id !== userId) {
    throw Errors.forbidden(
      'You do not have access to this booking.'
    );
  }

  const existingPayment = await paymentRepo.findPaidByBooking(
    bookingId
  );

  if (existingPayment) {
    throw Errors.badRequest(
      'This booking has already been paid.',
      'PAYMENT_ALREADY_PAID'
    );
  }

  if (booking.status !== 'PENDING') {
    throw Errors.badRequest(
      `Booking is in status ${booking.status}; only PENDING bookings can be mock-paid.`,
      'INVALID_BOOKING_STATE'
    );
  }

  const payment = await paymentRepo.createMockPayment({
    bookingId,
    amount: booking.total_amount,
    method,
  });

  const confirmedBooking = await bookingRepo.confirmBookingAfterPayment(
    bookingId
  );

  if (!confirmedBooking) {
    throw Errors.badRequest(
      'Mock payment was recorded, but the booking could not be confirmed.',
      'BOOKING_CONFIRMATION_FAILED'
    );
  }

  return {
    payment,
    booking: confirmedBooking,
  };
}

export async function listPaymentsForBooking(bookingId) {
  return paymentRepo.listByBooking(bookingId);
}