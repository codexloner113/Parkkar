import * as serviceRepo from '../repositories/service.repository.js';
import { sendSuccess } from '../utils/response.js';

export async function list(req, res, next) {
  try {
    const services = await serviceRepo.listActiveServices();
    return sendSuccess(res, { message: 'Services retrieved.', data: services });
  } catch (err) {
    return next(err);
  }
}
