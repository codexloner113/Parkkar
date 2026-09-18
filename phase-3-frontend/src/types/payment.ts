// Matches Phase 2 - Bacend/src/repositories/payment.repository.js
// (payments `SELECT *` / `RETURNING *`). Enum values copied verbatim from
// Phase 1 - Database/schema.sql.
//
// IMPORTANT: Phase 2 has NO Razorpay integration. The only way a payment
// row is created client-side is POST /api/bookings/:id/mock-pay, which the
// backend itself labels MOCK/DEVELOPMENT ONLY — see
// booking.controller.js#mockPay and services/payment.service.js.
export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED";

export type PaymentMethod = "CARD" | "UPI" | "NETBANKING" | "WALLET" | "OTHER";
export type RefundStatus =
  | "NONE"
  | "REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED";

export interface Payment {
  id: string;
  booking_id: string;
  amount: string;
  status: PaymentStatus;
  method: PaymentMethod;
  transaction_ref: string | null;
  paid_at: string | null;
  refund_status: RefundStatus;
  refund_amount: string | null;
  refunded_at: string | null;
  created_at: string;
  updated_at: string;
}

// GET /api/admin/payments — payment.repository.js#listAllPayments joins in
// a couple of extra display fields beyond the plain Payment row.
export interface AdminPayment extends Payment {
  user_id: string;
  location_name: string;
}

// POST /api/bookings/:id/mock-pay request body — utils/schemas.js's
// mockPaySchema.
export interface MockPayPayload {
  method?: PaymentMethod;
}

export interface PlatformRevenue {
  gross_revenue: string;
  platform_commission: string;
}
