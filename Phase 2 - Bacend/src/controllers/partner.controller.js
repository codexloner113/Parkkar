import * as parkingService from '../services/parking.service.js';
import * as bookingRepo from '../repositories/booking.repository.js';
import * as partnerService from '../services/partner.service.js';
import { sendSuccess } from '../utils/response.js';
import { paginationMeta, getPagination } from '../utils/pagination.js';

export async function createLocation(req, res, next) {
  try {
    const location = await parkingService.createLocation(req.user.id, req.body);
    return sendSuccess(res, { message: 'Parking location created.', data: location, status: 201 });
  } catch (err) {
    return next(err);
  }
}

export async function listOwnLocations(req, res, next) {
  try {
    const locations = await parkingService.listOwnLocations(req.user.id);
    return sendSuccess(res, { message: 'Locations retrieved.', data: locations });
  } catch (err) {
    return next(err);
  }
}

export async function getOwnLocation(req, res, next) {
  try {
    const location = await parkingService.getOwnLocation(req.params.id, req.user.id);
    return sendSuccess(res, { message: 'Location retrieved.', data: location });
  } catch (err) {
    return next(err);
  }
}

export async function updateOwnLocation(req, res, next) {
  try {
    const location = await parkingService.updateOwnLocation(req.params.id, req.user.id, req.body);
    return sendSuccess(res, { message: 'Location updated.', data: location });
  } catch (err) {
    return next(err);
  }
}

export async function deleteOwnLocation(req, res, next) {
  try {
    await parkingService.deleteOwnLocation(req.params.id, req.user.id);
    return sendSuccess(res, { message: 'Location deleted.', data: null });
  } catch (err) {
    return next(err);
  }
}

export async function createSlot(req, res, next) {
  try {
    const slot = await parkingService.createSlot(req.params.parkingId, req.user.id, req.body);
    return sendSuccess(res, { message: 'Slot created.', data: slot, status: 201 });
  } catch (err) {
    return next(err);
  }
}

export async function listSlots(req, res, next) {
  try {
    const slots = await parkingService.listOwnSlots(req.params.parkingId, req.user.id);
    return sendSuccess(res, { message: 'Slots retrieved.', data: slots });
  } catch (err) {
    return next(err);
  }
}

export async function updateSlot(req, res, next) {
  try {
    const slot = await parkingService.updateOwnSlot(req.params.slotId, req.user.id, req.body);
    return sendSuccess(res, { message: 'Slot updated.', data: slot });
  } catch (err) {
    return next(err);
  }
}

export async function deleteSlot(req, res, next) {
  try {
    await parkingService.deleteOwnSlot(req.params.slotId, req.user.id);
    return sendSuccess(res, { message: 'Slot deleted.', data: null });
  } catch (err) {
    return next(err);
  }
}

export async function ownBookings(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const rows = await bookingRepo.listBookingsForPartner(req.user.id, { limit, offset });
    const total = await bookingRepo.countBookingsForPartner(req.user.id);
    return sendSuccess(res, { message: 'Bookings retrieved.', data: rows, meta: paginationMeta(page, limit, total) });
  } catch (err) {
    return next(err);
  }
}

export async function revenue(req, res, next) {
  try {
    const result = await partnerService.getRevenue(req.user.id, req.query);
    return sendSuccess(res, { message: 'Revenue retrieved.', data: result });
  } catch (err) {
    return next(err);
  }
}
