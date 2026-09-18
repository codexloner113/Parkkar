import { query } from '../config/db.js';

export async function createVehicle({ userId, vehicleType, plateNumber, make, model }) {
  const { rows } = await query(
    `INSERT INTO vehicles (user_id, vehicle_type, plate_number, make, model)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, vehicleType, plateNumber, make, model]
  );
  return rows[0];
}

export async function findById(id) {
  const { rows } = await query('SELECT * FROM vehicles WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function listByUser(userId) {
  const { rows } = await query('SELECT * FROM vehicles WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  return rows;
}

export async function updateVehicle(id, { vehicleType, plateNumber, make, model }) {
  const { rows } = await query(
    `UPDATE vehicles
     SET vehicle_type = COALESCE($2, vehicle_type),
         plate_number  = COALESCE($3, plate_number),
         make          = COALESCE($4, make),
         model         = COALESCE($5, model)
     WHERE id = $1
     RETURNING *`,
    [id, vehicleType, plateNumber, make, model]
  );
  return rows[0] || null;
}

/**
 * bookings(vehicle_id, user_id) has a composite FK to vehicles(id, user_id)
 * with ON DELETE RESTRICT (see database/schema.sql) — a vehicle that still
 * has any booking referencing it (past or future) CANNOT be hard-deleted;
 * Postgres rejects the DELETE with a foreign-key-violation (23503), which
 * `mapPgError` in utils/errors.js turns into a 409 VEHICLE_HAS_BOOKINGS.
 * The controller/service layer does not need to pre-check this — the
 * database is the single source of truth for whether the delete is safe.
 */
export async function deleteVehicle(id) {
  const { rowCount } = await query('DELETE FROM vehicles WHERE id = $1', [id]);
  return rowCount > 0;
}

export async function isOwnedByUser(vehicleId, userId) {
  const { rows } = await query('SELECT 1 FROM vehicles WHERE id = $1 AND user_id = $2', [vehicleId, userId]);
  return rows.length > 0;
}
