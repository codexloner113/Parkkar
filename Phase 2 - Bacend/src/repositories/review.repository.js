import { query } from '../config/db.js';

export async function createReview({ userId, locationId, rating, reviewText }) {
  const { rows } = await query(
    `INSERT INTO reviews (user_id, location_id, rating, review_text)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, locationId, rating, reviewText]
  );
  return rows[0];
}

export async function listByLocation(locationId, { limit, offset }) {
  const { rows } = await query(
    `SELECT r.*, u.name AS user_name
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     WHERE r.location_id = $1
     ORDER BY r.created_at DESC
     LIMIT $2 OFFSET $3`,
    [locationId, limit, offset]
  );
  return rows;
}

export async function countByLocation(locationId) {
  const { rows } = await query('SELECT COUNT(*)::int AS count FROM reviews WHERE location_id = $1', [locationId]);
  return rows[0].count;
}
