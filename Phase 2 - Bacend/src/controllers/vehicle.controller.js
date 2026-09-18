import * as vehicleRepo from '../repositories/vehicle.repository.js';
import { sendSuccess } from '../utils/response.js';
import { Errors } from '../utils/errors.js';

export async function create(req, res, next) {
  try {
    const vehicle = await vehicleRepo.createVehicle({ userId: req.user.id, ...req.body });
    return sendSuccess(res, { message: 'Vehicle registered.', data: vehicle, status: 201 });
  } catch (err) {
    return next(err);
  }
}

export async function list(req, res, next) {
  try {
    const vehicles = await vehicleRepo.listByUser(req.user.id);
    return sendSuccess(res, { message: 'Vehicles retrieved.', data: vehicles });
  } catch (err) {
    return next(err);
  }
}

export async function getOne(req, res, next) {
  try {
    const vehicle = await vehicleRepo.findById(req.params.id);
    if (!vehicle || vehicle.user_id !== req.user.id) throw Errors.notFound('Vehicle not found.');
    return sendSuccess(res, { message: 'Vehicle retrieved.', data: vehicle });
  } catch (err) {
    return next(err);
  }
}

export async function update(req, res, next) {
  try {
    const owned = await vehicleRepo.isOwnedByUser(req.params.id, req.user.id);
    if (!owned) throw Errors.notFound('Vehicle not found.');
    const vehicle = await vehicleRepo.updateVehicle(req.params.id, req.body);
    return sendSuccess(res, { message: 'Vehicle updated.', data: vehicle });
  } catch (err) {
    return next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const owned = await vehicleRepo.isOwnedByUser(req.params.id, req.user.id);
    if (!owned) throw Errors.notFound('Vehicle not found.');
    await vehicleRepo.deleteVehicle(req.params.id);
    return sendSuccess(res, { message: 'Vehicle deleted.', data: null });
  } catch (err) {
    return next(err);
  }
}
