import type { PropertyType } from "./parking";

// Matches Phase 2 - Bacend/src/repositories/favorite.repository.js.
// NOTE: add and list return DIFFERENT shapes — addFavorite() returns the
// raw favorites row (`RETURNING *`), while listFavoritesForUser() returns
// a joined projection of the favorited location (mirrors queries.sql #13).
// Do not assume one shape for both.

// POST /api/favorites/:parkingId response data.
export interface Favorite {
  id: string;
  user_id: string;
  location_id: string;
  created_at: string;
}

// GET /api/favorites response data (array of these).
export interface FavoriteLocation {
  id: string;
  name: string;
  city: string;
  property_type: PropertyType;
  favorited_at: string;
}
