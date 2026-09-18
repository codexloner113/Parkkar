// Matches Phase 2 - Bacend/src/repositories/review.repository.js
// (reviews joined to users for display name).
export interface Review {
  id: string;
  user_id: string;
  location_id: string;
  // SMALLINT 1-5 — returned by `pg` as a native number, unlike NUMERIC columns.
  rating: number;
  review_text: string | null;
  created_at: string;
  updated_at: string;
  user_name: string;
}

// POST /api/parking/:id/reviews request body — utils/schemas.js's
// createReviewSchema.
export interface CreateReviewPayload {
  rating: number;
  review_text?: string;
}
