import { query } from '../config/db.js';

// NOTE: Phase 1's schema has no `location_services` table — only a global
// `parking_services` catalog and the `booking_services` junction to a
// specific booking. There is no DB-level mapping of "which services does
// this location offer", so /api/parking/:parkingId/services simply
// returns the full active catalog, and any active service can be
// attached to a booking at any location. This is documented as a known
// limitation in README.md rather than invented here.

export async function listActiveServices() {
  const { rows } = await query('SELECT * FROM parking_services WHERE is_active = TRUE ORDER BY name ASC', []);
  return rows;
}

export async function findServiceById(id) {
  const { rows } = await query('SELECT * FROM parking_services WHERE id = $1', [id]);
  return rows[0] || null;
}
