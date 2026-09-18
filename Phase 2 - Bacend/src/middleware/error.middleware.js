// Centralized error handler — the ONLY place that turns an Error into an
// HTTP response. Never leaks stack traces, SQL text, or driver internals.
import { AppError, isPgError, mapPgError } from '../utils/errors.js';
import { env } from '../config/env.js';

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    error: 'NOT_FOUND',
  });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let appError = err;

  if (!(err instanceof AppError)) {
    appError = isPgError(err) ? mapPgError(err) : null;
  }

  if (!appError) {
    // Unrecognized error — log full detail server-side only.
    // eslint-disable-next-line no-console
    console.error('Unhandled error:', err);
    appError = new AppError('An unexpected error occurred.', 500, 'INTERNAL_ERROR');
  } else if (!(err instanceof AppError)) {
    // eslint-disable-next-line no-console
    console.error('Mapped PostgreSQL error:', err.code, err.message);
  } else if (appError.status >= 500) {
    // Keep server-side diagnostics for application errors that reach a 5xx
    // response without exposing internals to the client.
    // eslint-disable-next-line no-console
    console.error('Application error:', appError.code, appError.message);
  }

  const body = {
    success: false,
    message: appError.message,
    error: appError.code,
  };

  if (!env.isProduction && !(err instanceof AppError)) {
    // Extra debugging aid in non-production only — still no SQL text/stack.
    body.hint = 'See server logs for the underlying database error code.';
  }

  res.status(appError.status).json(body);
}
