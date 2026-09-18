import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { checkDbConnection } from './config/db.js';
import { generalRateLimiter } from './middleware/rateLimit.middleware.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';

import authRoutes from './routes/auth.routes.js';
import vehicleRoutes from './routes/vehicle.routes.js';
import parkingRoutes from './routes/parking.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import serviceRoutes from './routes/service.routes.js';
import favoriteRoutes from './routes/favorite.routes.js';
import partnerRoutes from './routes/partner.routes.js';
import adminRoutes from './routes/admin.routes.js';

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',').map((o) => o.trim()),
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(generalRateLimiter);

// Simple request logging — useful during development, safe (no bodies/secrets logged).
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    // eslint-disable-next-line no-console
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

app.get('/api/health', async (req, res) => {
  let dbStatus = 'up';
  try {
    await checkDbConnection();
  } catch (err) {
    dbStatus = 'down';
  }
  const status = dbStatus === 'up' ? 200 : 503;
  res.status(status).json({
    success: dbStatus === 'up',
    message: dbStatus === 'up' ? 'Parkkar backend is healthy.' : 'Parkkar backend is degraded.',
    data: {
      service: 'up',
      database: dbStatus,
      timestamp: new Date().toISOString(),
      environment: env.nodeEnv,
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/partner', partnerRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
