import type { SlotType } from "./parking";
import type { VehicleType } from "./vehicle";
import type { PaymentStatus } from "./payment";

// Matches Phase 2 - Bacend/src/repositories/booking.repository.js's
// JOINED_SELECT exactly (used by findBookingById / listBookingsFor* /
// listAllBookings) — bookings joined to its slot, location, and vehicle.
export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED";

export type CancelledByType = "USER" | "PARTNER" | "ADMIN" | "SYSTEM";

// booking.repository.js#listServicesForBooking — only present on the
// GET /api/bookings/:id detail response (booking.service.js#getBookingWithDetail
// adds `services` to the joined row).
export interface BookingServiceLine {
  id: string;
  service_id: string;
  service_name: string;
  quantity: number;
  price_at_booking: string;
}

export interface Booking {
  id: string;
  user_id: string;
  slot_id: string;
  vehicle_id: string | null;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  price_per_hour_snapshot: string;
  total_amount: string;
  cancelled_at: string | null;
  cancelled_by: CancelledByType | null;
  cancellation_reason: string | null;
  entry_verified_at: string | null;
  exit_verified_at: string | null;
  created_at: string;
  updated_at: string;

  location_id: string;
  location_name: string;
  location_city: string;
  location_partner_id: string;

  slot_code: string;
  slot_type: SlotType;

  // LEFT JOIN vehicles — null when the booking has no vehicle attached.
  plate_number: string | null;
  vehicle_type: VehicleType | null;

  // Correlated subquery in JOINED_SELECT; null if no payment row exists yet.
  latest_payment_status: PaymentStatus | null;

  // Only present on GET /api/bookings/:id, not on list endpoints.
  services?: BookingServiceLine[];
}

// POST /api/bookings request body — matches utils/schemas.js's
// createBookingSchema exactly (snake_case on the wire; the schema's
// .transform() is server-side only and does not change what the client sends).
export interface CreateBookingPayload {
  slot_id: number;
  vehicle_id?: number | null;
  start_time: string;
  end_time: string;
  services?: { service_id: number; quantity?: number }[];
}

// PATCH /api/bookings/:id/cancel request body — cancelBookingSchema.
export interface CancelBookingPayload {
  reason?: string;
}
