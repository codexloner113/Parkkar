// Matches Phase 2 - Bacend/src/repositories/parking.repository.js and
// services/parking.service.js. Enum values copied verbatim from
// Phase 1 - Database/schema.sql.
//
// NOTE: src/lib/parking.ts (existing, preserved) already defines its own
// local `ParkingLocation` type for the GET /api/parking search-result
// shape specifically. That file is left untouched in this milestone.
// The types below are the canonical, full-row domain models for later
// milestones; `ParkingSearchResult` here mirrors lib/parking.ts's existing
// shape 1:1 so a future migration is a pure rename, not a data-shape change.
export type PropertyType =
  | "HOTEL"
  | "MALL"
  | "COMMERCIAL_BUILDING"
  | "BANQUET_HALL"
  | "OTHER";

export type LocationStatus = "PENDING_APPROVAL" | "ACTIVE" | "INACTIVE";

export type SlotType = "CAR" | "BIKE" | "EV" | "ACCESSIBLE" | "OTHER";
export type SlotStatus = "ACTIVE" | "MAINTENANCE" | "DISABLED";

// Full row — parking_locations `SELECT *` (createLocation, findLocationById,
// updateLocation, listLocationsByPartner).
export interface ParkingLocation {
  id: string;
  partner_id: string;
  name: string;
  property_type: PropertyType;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  latitude: string;
  longitude: string;
  description: string | null;
  contact_phone: string | null;
  status: LocationStatus;
  created_at: string;
  updated_at: string;
}

// GET /api/parking/:id — parking.service.js#getParkingDetail
export interface ParkingLocationDetail extends ParkingLocation {
  slots: ParkingSlot[];
}

// GET /api/parking (search) — parking.repository.js#searchLocations.
// A curated projection, not the full row: no partner_id/postal_code/
// contact_phone/timestamps, plus derived min_price_per_hour/avg_rating/
// review_count.
export interface ParkingSearchResult {
  id: string;
  name: string;
  property_type: PropertyType;
  address: string;
  city: string;
  state: string;
  latitude: string;
  longitude: string;
  description: string | null;
  status: LocationStatus;
  min_price_per_hour: string | null;
  avg_rating: string | null;
  review_count: number;
}

// GET /api/parking/nearby — parking.repository.js#searchNearby
export interface ParkingNearbyResult {
  id: string;
  name: string;
  property_type: PropertyType;
  address: string;
  city: string;
  state: string;
  latitude: string;
  longitude: string;
  distance_km: string;
}

// parking_slots `SELECT *` (createSlot, listSlotsByLocation, updateSlot).
export interface ParkingSlot {
  id: string;
  location_id: string;
  slot_code: string;
  slot_type: SlotType;
  status: SlotStatus;
  price_per_hour: string;
  created_at: string;
  updated_at: string;
}

// GET /api/parking/:id/availability — parking.repository.js#findAvailableSlots.
// A narrower projection than ParkingSlot (no location_id/status/timestamps).
export interface AvailableSlot {
  id: string;
  slot_code: string;
  slot_type: SlotType;
  price_per_hour: string;
}


export interface ParkingRecommendationResult
  extends Omit<ParkingSearchResult, "min_price_per_hour" | "avg_rating"> {
  distance_km: number;
  min_price_per_hour: number | null;
  avg_rating: number | null;
  review_count: number;
  total_active_slots: number;
  available_slots: number;
  recommendation_score: number;
  recommendation_reasons: string[];
}
