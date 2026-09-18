// Matches Phase 2 - Bacend/src/repositories/service.repository.js
// (parking_services `SELECT *`).
//
// NOTE: Phase 1 has no location_services table — GET /api/services and
// GET /api/parking/:id/services both return the same global active
// catalog (see service.repository.js's own comment). There is no
// per-location filtering to model here yet.
export interface ParkingService {
  id: string;
  name: string;
  description: string | null;
  // NUMERIC(8,2)
  price: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
