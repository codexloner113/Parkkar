import { withTransaction } from '../config/db.js';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import * as bookingRepo from '../repositories/booking.repository.js';
import * as parkingRepo from '../repositories/parking.repository.js';
import * as vehicleRepo from '../repositories/vehicle.repository.js';
import * as serviceRepo from '../repositories/service.repository.js';
import { Errors, isPgError, mapPgError } from '../utils/errors.js';

/**
 * Full booking creation flow (see queries.sql #4/#12 for the semantics
 * this mirrors). All validation below reduces the *likelihood* of a
 * conflict, but the actual overlap protection is the database's
 * excl_bookings_no_overlap EXCLUDE constraint, enforced by the INSERT
 * itself inside this transaction — never by a "check then insert" race.
 */
export async function createBooking(userId, { slotId, vehicleId, startTime, endTime, services = [] }) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw Errors.badRequest('start_time and end_time must be valid timestamps.', 'INVALID_TIME_RANGE');
  }
  if (end <= start) {
    throw Errors.badRequest('end_time must be after start_time.', 'INVALID_TIME_RANGE');
  }

  const slot = await parkingRepo.findSlotById(slotId);
  if (!slot) throw Errors.notFound('Parking slot not found.');
  if (slot.location_status !== 'ACTIVE') {
    throw Errors.badRequest('This parking location is not currently active.', 'LOCATION_INACTIVE');
  }
  if (slot.status !== 'ACTIVE') {
    throw Errors.badRequest('This slot is not currently bookable.', 'SLOT_UNAVAILABLE');
  }

  if (vehicleId != null) {
    const vehicle = await vehicleRepo.findById(vehicleId);
    if (!vehicle) throw Errors.notFound('Vehicle not found.');
    if (vehicle.user_id !== userId) {
      // The database also enforces this — bookings(vehicle_id, user_id)
      // has a composite FK to vehicles(id, user_id), so a mismatched pair
      // would be rejected at INSERT time regardless (23503, mapped to
      // VEHICLE_NOT_OWNED in utils/errors.js). Checking here too gives a
      // faster, clearer 403 before any transaction/insert is attempted,
      // rather than relying solely on the database round-trip.
      throw Errors.forbidden('You can only book with your own vehicle.', 'VEHICLE_NOT_OWNED');
    }
  }

  // Resolve and validate every requested add-on service up front, so a bad
  // service_id fails fast with a clean 400 rather than mid-transaction.
  const resolvedServices = [];
  for (const item of services) {
    const svc = await serviceRepo.findServiceById(item.service_id);
    if (!svc || !svc.is_active) {
      throw Errors.badRequest(`Service ${item.service_id} is not available.`, 'INVALID_SERVICE');
    }
    resolvedServices.push({
      serviceId: svc.id,
      quantity: item.quantity && item.quantity > 0 ? item.quantity : 1,
      priceAtBooking: svc.price,
    });
  }

  // Keep money as decimal strings / integer cents. Never convert PostgreSQL
  // NUMERIC prices to JS Number, because binary floating-point can introduce
  // rounding errors in financial calculations. The final duration calculation
  // and 2-decimal rounding are performed by PostgreSQL NUMERIC in the INSERT.
  const pricePerHourSnapshot = slot.price_per_hour;
  const servicesSubtotalCents = resolvedServices.reduce(
    (sum, s) => sum + decimalToCents(s.priceAtBooking) * BigInt(s.quantity),
    0n
  );
  const servicesSubtotal = centsToDecimal(servicesSubtotalCents);

  try {
    return await withTransaction(async (client) => {
      const booking = await bookingRepo.insertBooking(client, {
        userId,
        slotId,
        vehicleId: vehicleId ?? null,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        pricePerHourSnapshot,
        servicesSubtotal,
      });

      for (const s of resolvedServices) {
        await bookingRepo.insertBookingService(client, {
          bookingId: booking.id,
          serviceId: s.serviceId,
          quantity: s.quantity,
          priceAtBooking: s.priceAtBooking,
        });
      }

      return bookingRepo.findBookingById(booking.id, client);
    });
  } catch (err) {
    // The EXCLUDE constraint (23P01) is the authoritative overlap guard —
    // translate it (and any other constraint violation) to a clean AppError
    // instead of letting a raw driver error escape to the client.
    if (isPgError(err)) throw mapPgError(err);
    throw err;
  }
}

function decimalToCents(value) {
  const text = String(value).trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) {
    throw Errors.internal('Invalid monetary value returned by the database.', 'INVALID_MONEY');
  }
  const [whole, fraction = ''] = text.split('.');
  return BigInt(whole) * 100n + BigInt((fraction + '00').slice(0, 2));
}

function centsToDecimal(cents) {
  const sign = cents < 0n ? '-' : '';
  const absolute = cents < 0n ? -cents : cents;
  return `${sign}${absolute / 100n}.${String(absolute % 100n).padStart(2, '0')}`;
}

export async function getBookingWithDetail(id) {
  const booking = await bookingRepo.findBookingById(id);
  if (!booking) throw Errors.notFound('Booking not found.');
  const services = await bookingRepo.listServicesForBooking(id);
  return { ...booking, services };
}

export async function assertCanViewBooking(booking, user) {
  if (user.role === 'ADMIN') return;
  if (user.role === 'USER' && booking.user_id === user.id) return;
  if (user.role === 'PARTNER' && booking.location_partner_id === user.id) return;
  throw Errors.forbidden('You do not have access to this booking.');
}

export async function listBookings(user, { limit, offset }) {
  if (user.role === 'ADMIN') {
    const [rows, total] = await Promise.all([
      bookingRepo.listAllBookings({ limit, offset }),
      bookingRepo.countAllBookings(),
    ]);
    return { rows, total };
  }
  if (user.role === 'PARTNER') {
    const [rows, total] = await Promise.all([
      bookingRepo.listBookingsForPartner(user.id, { limit, offset }),
      bookingRepo.countBookingsForPartner(user.id),
    ]);
    return { rows, total };
  }
  const [rows, total] = await Promise.all([
    bookingRepo.listBookingsForUser(user.id, { limit, offset }),
    bookingRepo.countBookingsForUser(user.id),
  ]);
  return { rows, total };
}

const NON_CANCELLABLE = ['COMPLETED', 'CANCELLED', 'EXPIRED'];

export async function cancelBooking(bookingId, user, reason) {
  const booking = await bookingRepo.findBookingById(bookingId);
  if (!booking) throw Errors.notFound('Booking not found.');

  const isOwner = user.role === 'USER' && booking.user_id === user.id;
  const isOwningPartner = user.role === 'PARTNER' && booking.location_partner_id === user.id;
  const isAdmin = user.role === 'ADMIN';
  if (!isOwner && !isOwningPartner && !isAdmin) {
    throw Errors.forbidden('You do not have access to this booking.');
  }

  if (NON_CANCELLABLE.includes(booking.status)) {
    throw Errors.badRequest(`A booking with status ${booking.status} cannot be cancelled.`, 'NOT_CANCELLABLE');
  }
  if (new Date(booking.start_time) <= new Date()) {
    throw Errors.badRequest('This booking has already started and can no longer be cancelled.', 'NOT_CANCELLABLE');
  }

  const cancelledBy = isAdmin ? 'ADMIN' : isOwningPartner ? 'PARTNER' : 'USER';
  return bookingRepo.cancelBooking(bookingId, { cancelledBy, reason: reason || null });
}


/**
 * Generates a signed booking QR token for the booking owner/partner/admin.
 * Only a booking id and an explicit token type are embedded.
 */
export async function getBookingQr(bookingId, user) {
  const booking = await bookingRepo.findBookingById(bookingId);

  if (!booking) {
    throw Errors.notFound('Booking not found.');
  }

  await assertCanViewBooking(booking, user);

  if (!['CONFIRMED', 'ACTIVE'].includes(booking.status)) {
    throw Errors.badRequest(
      `A QR code is available only for CONFIRMED or ACTIVE bookings, not ${booking.status}.`,
      'QR_NOT_AVAILABLE'
    );
  }

  const endEpoch = Math.floor(
    new Date(booking.end_time).getTime() / 1000
  );

  // Keep the QR valid through the booking end and for a short operational
  // grace period so a partner can still verify checkout after end_time.
  const expiryEpoch = endEpoch + 6 * 60 * 60;
  const remainingSeconds = expiryEpoch - Math.floor(Date.now() / 1000);

  const token = jwt.sign(
    {
      type: 'PARKKAR_BOOKING_QR',
      bookingId: String(booking.id),
    },
    env.jwtSecret,
    {
      expiresIn: Math.max(60, remainingSeconds),
    }
  );

  return {
    booking_id: String(booking.id),
    status: booking.status,
    token,
    expires_at: new Date(expiryEpoch * 1000).toISOString(),
  };
}

/**
 * Verifies booking QR entry/exit. Route-level authorization restricts this
 * operation to PARTNER and ADMIN accounts.
 */
export async function verifyBookingQr({ token, action, verifier }) {
  let payload;

  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw Errors.badRequest(
      'This QR code is invalid or expired.',
      'QR_INVALID'
    );
  }

  if (
    payload?.type !== 'PARKKAR_BOOKING_QR' ||
    !payload?.bookingId
  ) {
    throw Errors.badRequest(
      'Invalid Parkkar booking QR code.',
      'QR_INVALID'
    );
  }

  const booking = await bookingRepo.findBookingById(
    Number(payload.bookingId)
  );

  if (!booking) {
    throw Errors.notFound('Booking not found.');
  }

  if (
    verifier.role === 'PARTNER' &&
    String(booking.location_partner_id) !== String(verifier.id)
  ) {
    throw Errors.forbidden(
      'You can only verify bookings for your own parking locations.'
    );
  }

  if (action === 'ENTRY') {
    if (booking.status !== 'CONFIRMED') {
      throw Errors.badRequest(
        `Entry verification requires a CONFIRMED booking. Current status: ${booking.status}.`,
        'QR_ENTRY_NOT_ALLOWED'
      );
    }

    const updated = await bookingRepo.verifyBookingEntry(booking.id);

    if (!updated) {
      throw Errors.conflict(
        'This booking could not be checked in.',
        'QR_ENTRY_CONFLICT'
      );
    }

    return {
      action: 'ENTRY',
      booking: await bookingRepo.findBookingById(booking.id),
    };
  }

  if (action === 'EXIT') {
    if (booking.status !== 'ACTIVE') {
      throw Errors.badRequest(
        `Exit verification requires an ACTIVE booking. Current status: ${booking.status}.`,
        'QR_EXIT_NOT_ALLOWED'
      );
    }

    const updated = await bookingRepo.verifyBookingExit(booking.id);

    if (!updated) {
      throw Errors.conflict(
        'This booking could not be checked out.',
        'QR_EXIT_CONFLICT'
      );
    }

    return {
      action: 'EXIT',
      booking: await bookingRepo.findBookingById(booking.id),
    };
  }

  throw Errors.badRequest(
    'action must be ENTRY or EXIT.',
    'INVALID_QR_ACTION'
  );
}
