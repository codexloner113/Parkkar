// Stricter rate limiting for auth endpoints in production.
// During automated tests, auth requests are not rate-limited so that
// integration tests can create multiple users without false failures.
import rateLimit from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  // Keep production protection strict.
  // Disable the auth limiter during tests.
  limit: isTest ? 1000 : 20,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
    error: 'RATE_LIMITED',
  },
});

export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  // Keep the existing API-wide limit unchanged.
  limit: 300,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
    error: 'RATE_LIMITED',
  },
});