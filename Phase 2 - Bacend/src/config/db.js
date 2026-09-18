// Single shared connection pool. Every query/transaction in the app goes
// through this module — no code anywhere else calls `new Client()` or
// opens a fresh connection per request.
import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  // Handles errors on idle clients (e.g. the DB restarting) so a single
  // bad connection doesn't crash the whole process.
  // eslint-disable-next-line no-console
  console.error('Unexpected error on idle PostgreSQL client', err);
});

/**
 * Run a single parameterized query against the pool.
 * @param {string} text
 * @param {any[]} params
 */
export function query(text, params) {
  return pool.query(text, params);
}

/**
 * Run `fn` inside a BEGIN/COMMIT transaction on a single checked-out
 * client, rolling back on any thrown error and always releasing the
 * client back to the pool.
 * @param {(client: pg.PoolClient) => Promise<any>} fn
 */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      // eslint-disable-next-line no-console
      console.error('Rollback failed', rollbackErr);
    }
    throw err;
  } finally {
    client.release();
  }
}

/** Verifies the pool can actually reach the database (used by /api/health). */
export async function checkDbConnection() {
  await pool.query('SELECT 1');
}

export async function closePool() {
  await pool.end();
}
