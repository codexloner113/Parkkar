// Matches the ACTUAL backend envelope — see:
// Phase 2 - Bacend/src/utils/response.js (sendSuccess/sendError)
// Phase 2 - Bacend/src/middleware/error.middleware.js
//
// meta.total/meta.totalPages are only present on endpoints that use
// utils/pagination.js's paginationMeta() helper. GET /api/parking (search)
// returns only { page, limit } — see parking.controller.js#search — so
// both are optional here rather than assumed present everywhere.
export interface PaginationMeta {
  page: number;
  limit: number;
  total?: number;
  totalPages?: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

// error is the machine-readable code (e.g. "BOOKING_CONFLICT",
// "VEHICLE_NOT_OWNED", "VALIDATION_ERROR") set by utils/errors.js's
// Errors.* helpers / mapPgError. hint only ever appears outside production.
export interface ApiErrorResponse {
  success: false;
  message: string;
  error: string;
  hint?: string;
}
