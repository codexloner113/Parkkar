import { query } from '../config/db.js';

// commission_rate_percent is included here (safe to expose): it's a plain
// business figure, not a secret, and it's NULL for USER/ADMIN rows and
// only ever set for PARTNER rows (enforced by a schema CHECK constraint).
// Needed so a partner's own profile (`GET /api/auth/me`) and the admin
// partner listing can show their commission rate.
const SAFE_COLUMNS = 'id, name, email, phone, role, account_status, commission_rate_percent, created_at, updated_at';

export async function createUser({ name, email, phone, passwordHash, role = 'USER' }) {
  const { rows } = await query(
    `INSERT INTO users (name, email, phone, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${SAFE_COLUMNS}`,
    [name, email, phone, passwordHash, role]
  );
  return rows[0];
}

/** Includes password_hash — for internal auth use (login) only, never returned to a client. */
export async function findByEmailWithPassword(email) {
  const { rows } = await query(
    `SELECT id, name, email, phone, password_hash, role, account_status, commission_rate_percent, created_at, updated_at
     FROM users WHERE email = $1`,
    [email]
  );
  return rows[0] || null;
}

export async function findById(id) {
  const { rows } = await query(`SELECT ${SAFE_COLUMNS} FROM users WHERE id = $1`, [id]);
  return rows[0] || null;
}

export async function listByRole(role, { limit, offset }) {
  const { rows } = await query(
    `SELECT ${SAFE_COLUMNS} FROM users WHERE role = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [role, limit, offset]
  );
  return rows;
}

export async function countByRole(role) {
  const { rows } = await query('SELECT COUNT(*)::int AS count FROM users WHERE role = $1', [role]);
  return rows[0].count;
}

export async function listAll({ limit, offset }) {
  const { rows } = await query(
    `SELECT ${SAFE_COLUMNS} FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}

export async function countAll() {
  const { rows } = await query('SELECT COUNT(*)::int AS count FROM users');
  return rows[0].count;
}
