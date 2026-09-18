import * as authService from '../services/auth.service.js';
import { sendSuccess } from '../utils/response.js';

export async function register(req, res, next) {
  try {
    const { user, token } = await authService.register(req.body);
    return sendSuccess(res, { message: 'Registered successfully.', data: { user, token }, status: 201 });
  } catch (err) {
    return next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { user, token } = await authService.login(req.body);
    return sendSuccess(res, { message: 'Logged in successfully.', data: { user, token } });
  } catch (err) {
    return next(err);
  }
}

export async function me(req, res, next) {
  try {
    const user = await authService.getProfile(req.user.id);
    return sendSuccess(res, { message: 'Current user.', data: user });
  } catch (err) {
    return next(err);
  }
}
