import { api } from "@/lib/api";
import type { ApiSuccessResponse } from "@/types/api";
import type { ParkingLocation, ParkingSlot, SlotType, SlotStatus } from "@/types/parking";
import type { Booking } from "@/types/booking";

export interface LocationPayload {
  name: string; propertyType: ParkingLocation["property_type"]; address: string; city: string; state: string; postalCode: string;
  latitude: number; longitude: number; description?: string; contactPhone?: string;
}
export interface SlotPayload { slotCode: string; slotType?: SlotType; priceHour: number; status?: SlotStatus; }
export interface RevenueData { partner_id: string; gross_revenue: string; partner_net_revenue: string; platform_commission: string; }

export async function listOwnLocations() { const r = await api.get<ApiSuccessResponse<ParkingLocation[]>>("/partner/parking"); return r.data; }
export async function getOwnLocation(id: string) { const r = await api.get<ApiSuccessResponse<ParkingLocation & { slots: ParkingSlot[] }>>(`/partner/parking/${id}`); return r.data; }
export async function createLocation(payload: LocationPayload) { const r = await api.post<ApiSuccessResponse<ParkingLocation>>("/partner/parking", payload); return r.data; }
export async function updateLocation(id: string, payload: Partial<LocationPayload>) { const r = await api.put<ApiSuccessResponse<ParkingLocation>>(`/partner/parking/${id}`, payload); return r.data; }
export async function deleteLocation(id: string) { const r = await api.delete<ApiSuccessResponse<null>>(`/partner/parking/${id}`); return r.data; }
export async function listSlots(locationId: string) { const r = await api.get<ApiSuccessResponse<ParkingSlot[]>>(`/partner/parking/${locationId}/slots`); return r.data; }
export async function createSlot(locationId: string, payload: SlotPayload) { const r = await api.post<ApiSuccessResponse<ParkingSlot>>(`/partner/parking/${locationId}/slots`, payload); return r.data; }
export async function updateSlot(id: string, payload: Partial<SlotPayload>) { const r = await api.put<ApiSuccessResponse<ParkingSlot>>(`/partner/slots/${id}`, payload); return r.data; }
export async function deleteSlot(id: string) { const r = await api.delete<ApiSuccessResponse<null>>(`/partner/slots/${id}`); return r.data; }
export async function listPartnerBookings(params: { page?: number; limit?: number } = {}) { const r = await api.get<ApiSuccessResponse<Booking[]>>(`/partner/bookings`, { params }); return r.data; }
export async function getPartnerRevenue(params: { range_start?: string; range_end?: string } = {}) { const r = await api.get<ApiSuccessResponse<RevenueData>>(`/partner/revenue`, { params }); return r.data; }
