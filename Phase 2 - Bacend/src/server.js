import { app } from './app.js';
import { env } from './config/env.js';
import { pool, closePool } from './config/db.js';

const server = app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Parkkar backend listening on port ${env.port} [${env.nodeEnv}]`);
});

// Fail loudly if the pool cannot reach Postgres at all on startup, rather
// than silently accepting requests against a broken DB connection.
pool
  .query('SELECT 1')
  .then(() => {
    // eslint-disable-next-line no-console
    console.log('Database connection verified.');
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('FATAL: could not connect to the database on startup.', err.message);
    process.exit(1);
  });

async function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    try {
      await closePool();
      // eslint-disable-next-line no-console
      console.log('Database pool closed. Exiting.');
      process.exit(0);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error while closing database pool.', err);
      process.exit(1);
    }
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
