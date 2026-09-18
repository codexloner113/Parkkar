import { query } from '../config/db.js';

/**
 * Inserts a booking within an existing transaction client. Relies on the
 * database's excl_bookings_no_overlap EXCLUDE constraint as the
 * authoritative overlap guard — this INSERT is attempted directly, not
 * gated behind a prior "is it free" SELECT. A 23P01 from this call is
 * caught by the caller (booking.service.js) and mapped to 409 BOOKING_CONFLICT.
 */
export async function insertBooking(client, {
  userId, slotId, vehicleId, startTime, endTime, pricePerHourSnapshot, servicesSubtotal,
}) {
  const { rows } = await client.query(
    `INSERT INTO bookings
       (user_id, slot_id, vehicle_id, start_time, end_time, status,
        price_per_hour_snapshot, total_amount)
     VALUES (
       $1, $2, $3, $4, $5, 'PENDING', $6,
       ROUND((
         EXTRACT(EPOCH FROM ($5::timestamptz - $4::timestamptz)) / 3600
         * $6::numeric
         + $7::numeric
       )::numeric, 2)
     )
     RETURNING *`,
    [userId, slotId, vehicleId, startTime, endTime, pricePerHourSnapshot, servicesSubtotal]
  );
  return rows[0];
}

export async function insertBookingService(client, { bookingId, serviceId, quantity, priceAtBooking }) {
  const { rows } = await client.query(
    `INSERT INTO booking_services (booking_id, service_id, quantity, price_at_booking)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [bookingId, serviceId, quantity, priceAtBooking]
  );
  return rows[0];
}

const JOINED_SELECT = `
  SELECT
    b.id, b.user_id, b.slot_id, b.vehicle_id, b.start_time, b.end_time, b.status,
    b.price_per_hour_snapshot, b.total_amount, b.cancelled_at, b.cancelled_by,
    b.cancellation_reason, b.entry_verified_at, b.exit_verified_at,
    b.created_at, b.updated_at,
    pl.id AS location_id, pl.name AS location_name, pl.city AS location_city,
    pl.partner_id AS location_partner_id,
    ps.slot_code, ps.slot_type,
    v.plate_number, v.vehicle_type,
    (SELECT status FROM payments WHERE booking_id = b.id ORDER BY created_at DESC LIMIT 1) AS latest_payment_status
  FROM bookings b
  JOIN parking_slots ps      ON ps.id = b.slot_id
  JOIN parking_locations pl  ON pl.id = ps.location_id
  LEFT JOIN vehicles v       ON v.id = b.vehicle_id
`;

export async function findBookingById(id, client = null) {
  const executor = client ?? { query };
  const { rows } = await executor.query(`${JOINED_SELECT} WHERE b.id = $1`, [id]);
  return rows[0] || null;
}

export async function listServicesForBooking(bookingId) {
  const { rows } = await query(
    `SELECT bs.id, bs.service_id, psvc.name AS service_name, bs.quantity, bs.price_at_booking
     FROM booking_services bs
     JOIN parking_services psvc ON psvc.id = bs.service_id
     WHERE bs.booking_id = $1`,
    [bookingId]
  );
  return rows;
}

export async function listBookingsForUser(userId, { limit, offset }) {
  const { rows } = await query(
    `${JOINED_SELECT} WHERE b.user_id = $1 ORDER BY b.start_time DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return rows;
}

export async function countBookingsForUser(userId) {
  const { rows } = await query('SELECT COUNT(*)::int AS count FROM bookings WHERE user_id = $1', [userId]);
  return rows[0].count;
}

export async function listBookingsForPartner(partnerId, { limit, offset }) {
  const { rows } = await query(
    `${JOINED_SELECT} WHERE pl.partner_id = $1 ORDER BY b.start_time DESC LIMIT $2 OFFSET $3`,
    [partnerId, limit, offset]
  );
  return rows;
}

export async function countBookingsForPartner(partnerId) {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS count
     FROM bookings b
     JOIN parking_slots ps ON ps.id = b.slot_id
     JOIN parking_locations pl ON pl.id = ps.location_id
     WHERE pl.partner_id = $1`,
    [partnerId]
  );
  return rows[0].count;
}

export async function listAllBookings({ limit, offset }) {
  const { rows } = await query(`${JOINED_SELECT} ORDER BY b.start_time DESC LIMIT $1 OFFSET $2`, [limit, offset]);
  return rows;
}

export async function countAllBookings() {
  const { rows } = await query('SELECT COUNT(*)::int AS count FROM bookings');
  return rows[0].count;
}

export async function cancelBooking(id, { cancelledBy, reason }) {
  const { rows } = await query(
    `UPDATE bookings
     SET status = 'CANCELLED', cancelled_at = now(), cancelled_by = $2, cancellation_reason = $3
     WHERE id = $1
     RETURNING *`,
    [id, cancelledBy, reason]
  );
  return rows[0] || null;
}
export async function confirmBookingAfterPayment(id) {
  const { rows } = await query(
    `UPDATE bookings
     SET status = 'CONFIRMED'
     WHERE id = $1
       AND status = 'PENDING'
     RETURNING *`,
    [id]
  );

  return rows[0] || null;
}

/**
 * Marks a confirmed booking as entered.
 */
export async function verifyBookingEntry(id) {
  const { rows } = await query(
    `UPDATE bookings
     SET status = 'ACTIVE',
         entry_verified_at = COALESCE(entry_verified_at, now())
     WHERE id = $1
       AND status = 'CONFIRMED'
     RETURNING *`,
    [id]
  );

  return rows[0] || null;
}

/**
 * Marks an active booking as exited/completed.
 */
export async function verifyBookingExit(id) {
  const { rows } = await query(
    `UPDATE bookings
     SET status = 'COMPLETED',
         exit_verified_at = COALESCE(exit_verified_at, now())
     WHERE id = $1
       AND status = 'ACTIVE'
     RETURNING *`,
    [id]
  );

  return rows[0] || null;
}
