import * as userRepo from '../repositories/user.repository.js';
import * as parkingRepo from '../repositories/parking.repository.js';
import * as bookingRepo from '../repositories/booking.repository.js';
import * as paymentRepo from '../repositories/payment.repository.js';
import { sendSuccess } from '../utils/response.js';
import { paginationMeta, getPagination } from '../utils/pagination.js';
import { Errors } from '../utils/errors.js';

export async function listUsers(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const [rows, total] = await Promise.all([
      userRepo.listAll({ limit, offset }),
      userRepo.countAll(),
    ]);
    return sendSuccess(res, { message: 'Users retrieved.', data: rows, meta: paginationMeta(page, limit, total) });
  } catch (err) {
    return next(err);
  }
}

export async function listPartners(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const [rows, total] = await Promise.all([
      userRepo.listByRole('PARTNER', { limit, offset }),
      userRepo.countByRole('PARTNER'),
    ]);
    return sendSuccess(res, { message: 'Partners retrieved.', data: rows, meta: paginationMeta(page, limit, total) });
  } catch (err) {
    return next(err);
  }
}

export async function listParking(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const filters = { ...req.query, limit, offset, includeAllStatuses: true };
    const [rows, total] = await Promise.all([
      parkingRepo.searchLocations(filters),
      parkingRepo.countLocations(filters),
    ]);
    return sendSuccess(res, { message: 'Parking locations retrieved.', data: rows, meta: paginationMeta(page, limit, total) });
  } catch (err) {
    return next(err);
  }
}

export async function listBookings(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const [rows, total] = await Promise.all([
      bookingRepo.listAllBookings({ limit, offset }),
      bookingRepo.countAllBookings(),
    ]);
    return sendSuccess(res, { message: 'Bookings retrieved.', data: rows, meta: paginationMeta(page, limit, total) });
  } catch (err) {
    return next(err);
  }
}

export async function listPayments(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const [rows, total] = await Promise.all([
      paymentRepo.listAllPayments({ limit, offset }),
      paymentRepo.countAllPayments(),
    ]);
    return sendSuccess(res, { message: 'Payments retrieved.', data: rows, meta: paginationMeta(page, limit, total) });
  } catch (err) {
    return next(err);
  }
}

export async function revenue(req, res, next) {
  try {
    const { range_start, range_end } = req.query;
    const start = range_start ? new Date(range_start) : new Date(0);
    const end = range_end ? new Date(range_end) : new Date();
    const result = await paymentRepo.platformRevenue({
      rangeStart: start.toISOString(),
      rangeEnd: end.toISOString(),
    });
    return sendSuccess(res, { message: 'Platform revenue retrieved.', data: result });
  } catch (err) {
    return next(err);
  }
}


export async function updateParkingStatus(req, res, next) {
  try {
    const location = await parkingRepo.updateLocationStatus(req.params.id, req.body.status);
    if (!location) throw Errors.notFound('Parking location not found.');
    return sendSuccess(res, { message: 'Parking location status updated.', data: location });
  } catch (err) {
    return next(err);
  }
}
