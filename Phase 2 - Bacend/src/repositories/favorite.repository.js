import { query } from '../config/db.js';

export async function addFavorite(userId, locationId) {
  const { rows } = await query(
    `INSERT INTO favorites (user_id, location_id) VALUES ($1, $2) RETURNING *`,
    [userId, locationId]
  );
  return rows[0];
}

export async function removeFavorite(userId, locationId) {
  const { rowCount } = await query(
    'DELETE FROM favorites WHERE user_id = $1 AND location_id = $2',
    [userId, locationId]
  );
  return rowCount > 0;
}

/** Mirrors queries.sql #13. */
export async function listFavoritesForUser(userId) {
  const { rows } = await query(
    `SELECT pl.id, pl.name, pl.city, pl.property_type, f.created_at AS favorited_at
     FROM favorites f
     JOIN parking_locations pl ON pl.id = f.location_id
     WHERE f.user_id = $1
     ORDER BY f.created_at DESC`,
    [userId]
  );
  return rows;
}
