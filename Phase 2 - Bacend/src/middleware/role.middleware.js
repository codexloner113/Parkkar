// Reusable role gate. Usage: requireRole('PARTNER') or requireRole('ADMIN', 'PARTNER').
// Must run AFTER requireAuth so req.user is populated.
import { Errors } from '../utils/errors.js';

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(Errors.unauthorized());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(Errors.forbidden('Your role does not permit this action.'));
    }
    return next();
  };
}
