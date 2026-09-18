// A single typed error class used throughout services/repositories so the
// error middleware can map it to a clean HTTP response without ever
// leaking SQL, stack traces, or driver internals to the client.
export class AppError extends Error {
  /**
   * @param {string} message  human-readable, safe to show to the client
   * @param {number} status   HTTP status code
   * @param {string} code     machine-readable error code (e.g. BOOKING_CONFLICT)
   */
  constructor(message, status = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
  }
}

export const Errors = {
  badRequest: (msg = 'Malformed request', code = 'BAD_REQUEST') => new AppError(msg, 400, code),
  unauthorized: (msg = 'Authentication required', code = 'UNAUTHORIZED') => new AppError(msg, 401, code),
  forbidden: (msg = 'You do not have permission to do this', code = 'FORBIDDEN') => new AppError(msg, 403, code),
  notFound: (msg = 'Resource not found', code = 'NOT_FOUND') => new AppError(msg, 404, code),
  conflict: (msg = 'Conflicting resource', code = 'CONFLICT') => new AppError(msg, 409, code),
  unprocessable: (msg = 'Validation failed', code = 'VALIDATION_ERROR') => new AppError(msg, 422, code),
  internal: (msg = 'Internal server error', code = 'INTERNAL_ERROR') => new AppError(msg, 500, code),
};

/**
 * Translates a raw PostgreSQL driver error into a safe AppError.
 * See queries.sql / schema.sql for which constraints raise which codes.
 */
export function mapPgError(err) {
  switch (err.code) {
    case '23P01': // exclusion constraint — booking overlap (excl_bookings_no_overlap)
      return Errors.conflict(
        'The selected slot is no longer available for this time.',
        'BOOKING_CONFLICT'
      );
    case '23505': // unique_violation
      return Errors.conflict('This resource already exists.', 'DUPLICATE_RESOURCE');
    case '23503': // foreign_key_violation
      // fk_bookings_vehicle_owner is a composite FK — bookings(vehicle_id, user_id)
      // references vehicles(id, user_id) — so it fires in two different
      // situations that deserve different messages:
      if (err.constraint === 'fk_bookings_vehicle_owner') {
        if (err.table === 'bookings') {
          // DELETE on vehicles blocked by ON DELETE RESTRICT: this vehicle
          // still has booking history pointing at it.
          return Errors.conflict(
            'This vehicle cannot be deleted because it has existing bookings.',
            'VEHICLE_HAS_BOOKINGS'
          );
        }
        // INSERT/UPDATE on bookings: the given vehicle_id does not belong
        // to this booking's user_id. The service layer already checks this
        // before every insert, so this is a defense-in-depth backstop, not
        // an expected path.
        return Errors.badRequest(
          'The selected vehicle does not belong to this user.',
          'VEHICLE_NOT_OWNED'
        );
      }
      return Errors.badRequest('This request references a resource that does not exist.', 'INVALID_REFERENCE');
    case '23514': // check_violation
      return Errors.unprocessable('This request violates a data rule.', 'CHECK_VIOLATION');
    default:
      return Errors.internal();
  }
}

export function isPgError(err) {
  return typeof err?.code === 'string' && /^[0-9A-Z]{5}$/.test(err.code);
}
