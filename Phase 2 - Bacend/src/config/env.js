// Loads and validates required environment variables. The server refuses
// to start if anything required is missing — we never silently fall back
// to an invalid/default database, JWT, or Razorpay configuration.
import 'dotenv/config';

const REQUIRED_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
];

function assertRequiredEnv() {
  const missing = REQUIRED_VARS.filter(
    (key) => !process.env[key] || process.env[key].trim() === ''
  );

  if (missing.length > 0) {
    // Intentionally thrown synchronously at import time— this must stop
    // the process before app.js/server.js ever try to use these values.
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
        'Copy .env.example to .env and fill these in before starting the server.'
    );
  }
}

assertRequiredEnv();

export const env = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
  isProduction: process.env.NODE_ENV === 'production',
};