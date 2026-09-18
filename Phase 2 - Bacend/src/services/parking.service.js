import * as parkingRepo from '../repositories/parking.repository.js';
import { Errors } from '../utils/errors.js';

export async function searchParking(filters) {
  return parkingRepo.searchLocations(filters);
}

export async function searchNearbyParking(params) {
  return parkingRepo.searchNearby(params);
}

export async function getParkingDetail(id) {
  const location = await parkingRepo.findLocationById(id);
  if (!location) throw Errors.notFound('Parking location not found.');
  const slots = await parkingRepo.listSlotsByLocation(id);
  return { ...location, slots };
}

export async function getAvailability({ locationId, startTime, endTime, slotType }) {
  const location = await parkingRepo.findLocationById(locationId);
  if (!location) throw Errors.notFound('Parking location not found.');
  if (location.status !== 'ACTIVE') {
    throw Errors.badRequest('This parking location is not currently active.', 'LOCATION_INACTIVE');
  }
  if (new Date(endTime) <= new Date(startTime)) {
    throw Errors.badRequest('end_time must be after start_time.', 'INVALID_TIME_RANGE');
  }
  return parkingRepo.findAvailableSlots({ locationId, startTime, endTime, slotType });
}

// --- Partner-owned location/slot management -------------------------------

export async function createLocation(partnerId, payload) {
  return parkingRepo.createLocation({ partnerId, ...payload });
}

export async function listOwnLocations(partnerId) {
  return parkingRepo.listLocationsByPartner(partnerId);
}

async function assertOwnership(locationId, partnerId) {
  const owned = await parkingRepo.isOwnedByPartner(locationId, partnerId);
  if (!owned) {
    // 404 rather than 403 to avoid confirming the location exists at all
    // to a partner who doesn't own it.
    throw Errors.notFound('Parking location not found.');
  }
}

export async function getOwnLocation(locationId, partnerId) {
  await assertOwnership(locationId, partnerId);
  return getParkingDetail(locationId);
}

export async function updateOwnLocation(locationId, partnerId, payload) {
  await assertOwnership(locationId, partnerId);
  // Partners may edit listing details, but location lifecycle status is
  // controlled by the platform/admin approval workflow. Never accept a
  // client-supplied status here.
  const { status: _ignoredStatus, ...editableFields } = payload;
  return parkingRepo.updateLocation(locationId, editableFields);
}

export async function deleteOwnLocation(locationId, partnerId) {
  await assertOwnership(locationId, partnerId);
  const deleted = await parkingRepo.deleteLocation(locationId);
  if (!deleted) throw Errors.notFound('Parking location not found.');
}

export async function createSlot(locationId, partnerId, payload) {
  await assertOwnership(locationId, partnerId);
  return parkingRepo.createSlot({ locationId, ...payload });
}

export async function listOwnSlots(locationId, partnerId) {
  await assertOwnership(locationId, partnerId);
  return parkingRepo.listSlotsByLocation(locationId);
}

async function assertSlotOwnership(slotId, partnerId) {
  const slot = await parkingRepo.findSlotById(slotId);
  if (!slot || slot.partner_id !== partnerId) {
    throw Errors.notFound('Parking slot not found.');
  }
  return slot;
}

export async function updateOwnSlot(slotId, partnerId, payload) {
  await assertSlotOwnership(slotId, partnerId);
  return parkingRepo.updateSlot(slotId, payload);
}

export async function deleteOwnSlot(slotId, partnerId) {
  await assertSlotOwnership(slotId, partnerId);
  const deleted = await parkingRepo.deleteSlot(slotId);
  if (!deleted) throw Errors.notFound('Parking slot not found.');
}

export async function getParkingRecommendations(params) {
  return parkingRepo.getParkingRecommendations(params);
}