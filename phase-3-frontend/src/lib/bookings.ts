import { api } from "@/lib/api";
import type { ApiSuccessResponse } from "@/types/api";
import type { Booking, CancelBookingPayload, CreateBookingPayload } from "@/types/booking";
import type { Payment, MockPayPayload } from "@/types/payment";

export async function listBookings(params: { page?: number; limit?: number } = {}) {
  const r = await api.get<ApiSuccessResponse<Booking[]>>("/bookings", { params }); return r.data;
}
export async function getBooking(id: string) {
  const r = await api.get<ApiSuccessResponse<Booking>>(`/bookings/${id}`); return r.data;
}
export async function createBooking(payload: CreateBookingPayload) {
  const r = await api.post<ApiSuccessResponse<Booking>>("/bookings", payload); return r.data;
}
export async function cancelBooking(id: string, payload: CancelBookingPayload = {}) {
  const r = await api.patch<ApiSuccessResponse<Booking>>(`/bookings/${id}/cancel`, payload); return r.data;
}
export async function mockPayBooking(id: string, payload: MockPayPayload = {}) {
  const r = await api.post<ApiSuccessResponse<Payment>>(`/bookings/${id}/mock-pay`, payload); return r.data;
}


export async function getBookingQr(id: string) {
  const response = await api.get<ApiSuccessResponse<{
    booking_id: string;
    status: string;
    token: string;
    expires_at: string;
  }>>(`/bookings/${id}/qr`);

  return response.data;
}

export async function verifyBookingQr(payload: {
  token: string;
  action: "ENTRY" | "EXIT";
}) {
  const response = await api.post<ApiSuccessResponse<{
    action: "ENTRY" | "EXIT";
    booking: Booking;
  }>>("/bookings/verify/qr", payload);

  return response.data;
}
