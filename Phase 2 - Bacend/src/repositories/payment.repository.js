import { query } from '../config/db.js';

export async function findPaidByBooking(bookingId) {
  const { rows } = await query(
    `SELECT * FROM payments
     WHERE booking_id = $1
       AND status = 'PAID'
     ORDER BY created_at DESC
     LIMIT 1`,
    [bookingId]
  );
  return rows[0] ?? null;
}

/**
 * Development-only mock payment record.
 * Real Razorpay integration uses createRazorpayOrderPayment()
 * and markRazorpayPaymentPaid().
 */
export async function createMockPayment({ bookingId, amount, method }) {
  const mockRef = `MOCK-${bookingId}-${Date.now()}`;

  const { rows } = await query(
    `INSERT INTO payments (
       booking_id,
       amount,
       status,
       method,
       transaction_ref,
       paid_at
     )
     VALUES ($1, $2, 'PAID', $3, $4, now())
     RETURNING *`,
    [bookingId, amount, method, mockRef]
  );

  return rows[0];
}

/**
 * Creates a PENDING payment record for a Razorpay order.
 */
export async function createRazorpayOrderPayment({
  bookingId,
  amount,
  razorpayOrderId,
}) {
  const { rows } = await query(
    `INSERT INTO payments (
       booking_id,
       amount,
       status,
       method,
       razorpay_order_id
     )
     VALUES ($1, $2, 'PENDING', NULL, $3)
     RETURNING *`,
    [bookingId, amount, razorpayOrderId]
  );

  return rows[0];
}

/**
 * Finds a payment using its Razorpay order ID.
 */
export async function findByRazorpayOrderId(razorpayOrderId) {
  const { rows } = await query(
    `SELECT *
     FROM payments
     WHERE razorpay_order_id = $1
     LIMIT 1`,
    [razorpayOrderId]
  );

  return rows[0] ?? null;
}

/**
 * Marks a verified Razorpay payment as PAID.
 *
 * This function should only be called after the Razorpay
 * payment signature has been verified server-side.
 */
export async function markRazorpayPaymentPaid({
  paymentId,
  razorpayPaymentId,
  razorpaySignature,
  method,
}) {
  const { rows } = await query(
    `UPDATE payments
     SET
       status = 'PAID',
       method = $4,
       transaction_ref = $2,
       razorpay_payment_id = $2,
       razorpay_signature = $3,
       paid_at = now()
     WHERE id = $1
       AND status <> 'PAID'
     RETURNING *`,
    [paymentId, razorpayPaymentId, razorpaySignature, method ?? null]
  );

  return rows[0] ?? null;
}

export async function listByBooking(bookingId) {
  const { rows } = await query(
    'SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC',
    [bookingId]
  );

  return rows;
}

export async function listAllPayments({ limit, offset }) {
  const { rows } = await query(
    `SELECT pay.*, b.user_id, pl.name AS location_name
     FROM payments pay
     JOIN bookings b ON b.id = pay.booking_id
     JOIN parking_slots ps ON ps.id = b.slot_id
     JOIN parking_locations pl ON pl.id = ps.location_id
     ORDER BY pay.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return rows;
}

export async function countAllPayments() {
  const { rows } = await query(
    'SELECT COUNT(*)::int AS count FROM payments',
    []
  );

  return rows[0].count;
}

/**
 * Mirrors queries.sql #8 — partner net revenue.
 * commission_rate_percent lives on `users` (the partner), not on
 * `parking_locations` — joined in via pl.partner_id = u.id, matching the
 * final Phase 1 schema (design decision #4 in database/README.md).
 */
export async function partnerRevenue(partnerId, { rangeStart, rangeEnd }) {
  const { rows } = await query(
    `SELECT
        pl.partner_id,
        COALESCE(SUM(pay.amount), 0) AS gross_revenue,
        ROUND(
          COALESCE(
            SUM(pay.amount * (1 - u.commission_rate_percent / 100.0)),
            0
          )::numeric,
          2
        ) AS partner_net_revenue,
        ROUND(
          COALESCE(
            SUM(pay.amount * (u.commission_rate_percent / 100.0)),
            0
          )::numeric,
          2
        ) AS platform_commission
     FROM payments pay
     JOIN bookings b
       ON b.id = pay.booking_id
     JOIN parking_slots ps
       ON ps.id = b.slot_id
     JOIN parking_locations pl
       ON pl.id = ps.location_id
     JOIN users u
       ON u.id = pl.partner_id
     WHERE pay.status = 'PAID'
       AND pl.partner_id = $1
       AND pay.paid_at BETWEEN $2::timestamptz AND $3::timestamptz
     GROUP BY pl.partner_id`,
    [partnerId, rangeStart, rangeEnd]
  );

  return (
    rows[0] || {
      partner_id: partnerId,
      gross_revenue: '0.00',
      partner_net_revenue: '0.00',
      platform_commission: '0.00',
    }
  );
}

/**
 * Mirrors queries.sql #9 — platform-wide commission across all partners.
 * Same users-join as partnerRevenue above.
 */
export async function platformRevenue({ rangeStart, rangeEnd }) {
  const { rows } = await query(
    `SELECT
        COALESCE(SUM(pay.amount), 0) AS gross_revenue,
        ROUND(
          COALESCE(
            SUM(pay.amount * (u.commission_rate_percent / 100.0)),
            0
          )::numeric,
          2
        ) AS platform_commission
     FROM payments pay
     JOIN bookings b
       ON b.id = pay.booking_id
     JOIN parking_slots ps
       ON ps.id = b.slot_id
     JOIN parking_locations pl
       ON pl.id = ps.location_id
     JOIN users u
       ON u.id = pl.partner_id
     WHERE pay.status = 'PAID'
       AND pay.paid_at BETWEEN $1::timestamptz AND $2::timestamptz`,
    [rangeStart, rangeEnd]
  );

  return rows[0];
}