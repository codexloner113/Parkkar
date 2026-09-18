// Matches Phase 2 - Bacend/src/repositories/user.repository.js SAFE_COLUMNS
// exactly: id, name, email, phone, role, account_status,
// commission_rate_percent, created_at, updated_at. password_hash is never
// returned by any endpoint (see auth.service.js login()).
//
// Enum values copied verbatim from Phase 1 - Database/schema.sql.
export type UserRole = "USER" | "PARTNER" | "ADMIN";
export type AccountStatus = "ACTIVE" | "SUSPENDED" | "DEACTIVATED";

export interface User {
  // bigint columns are returned by `pg` as strings, not numbers — kept
  // consistent with the existing ParkingLocation.id typing in lib/parking.ts.
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  account_status: AccountStatus;
  // NUMERIC(5,2), NULL for USER/ADMIN, only ever set for PARTNER rows
  // (schema CHECK chk_partner_commission_rate).
  commission_rate_percent: string | null;
  created_at: string;
  updated_at: string;
}
