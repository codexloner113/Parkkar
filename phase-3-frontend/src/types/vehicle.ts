// Matches Phase 2 - Bacend/src/repositories/vehicle.repository.js
// (createVehicle/findById/listByUser all `SELECT *` / `RETURNING *`).
export type VehicleType = "CAR" | "BIKE" | "EV" | "OTHER";

export interface Vehicle {
  id: string;
  user_id: string;
  vehicle_type: VehicleType;
  plate_number: string;
  make: string | null;
  model: string | null;
  created_at: string;
  updated_at: string;
}
