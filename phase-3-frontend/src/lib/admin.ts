import { api } from "@/lib/api";
import type { ApiSuccessResponse } from "@/types/api";
import type { User } from "@/types/user";
import type { ParkingSearchResult } from "@/types/parking";
import type { Booking } from "@/types/booking";
import type { AdminPayment, PlatformRevenue } from "@/types/payment";

export async function adminUsers(params: Record<string, unknown> = {}) { const r = await api.get<ApiSuccessResponse<User[]>>("/admin/users", { params }); return r.data; }
export async function adminPartners(params: Record<string, unknown> = {}) { const r = await api.get<ApiSuccessResponse<User[]>>("/admin/partners", { params }); return r.data; }
export async function adminParking(params: Record<string, unknown> = {}) { const r = await api.get<ApiSuccessResponse<ParkingSearchResult[]>>("/admin/parking", { params }); return r.data; }
export async function adminBookings(params: Record<string, unknown> = {}) { const r = await api.get<ApiSuccessResponse<Booking[]>>("/admin/bookings", { params }); return r.data; }
export async function adminPayments(params: Record<string, unknown> = {}) { const r = await api.get<ApiSuccessResponse<AdminPayment[]>>("/admin/payments", { params }); return r.data; }
export async function adminRevenue(params: { range_start?: string; range_end?: string } = {}) { const r = await api.get<ApiSuccessResponse<PlatformRevenue>>("/admin/revenue", { params }); return r.data; }


export async function adminUpdateParkingStatus(
  id: string,
  status: "PENDING_APPROVAL" | "ACTIVE" | "INACTIVE",
) {
  const r = await api.patch<ApiSuccessResponse<ParkingSearchResult>>(
    `/admin/parking/${id}/status`,
    { status },
  );
  return r.data;
}
