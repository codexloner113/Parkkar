import { api } from "@/lib/api";
import type { ApiSuccessResponse } from "@/types/api";
import type { AvailableSlot, ParkingLocationDetail, ParkingNearbyResult, ParkingSearchResult, SlotType } from "@/types/parking";
import type { ParkingService } from "@/types/service";
import type { CreateReviewPayload, Review } from "@/types/review";

export type ParkingSearchParams = {
  city?: string; propertyType?: string; minPrice?: number; maxPrice?: number;
  slotType?: SlotType; page?: number; limit?: number;
};

export async function getParking(params: ParkingSearchParams = {}) {
  const response = await api.get<ApiSuccessResponse<ParkingSearchResult[]>>("/parking", { params });
  return response.data;
}
export async function getParkingDetail(id: string) {
  const response = await api.get<ApiSuccessResponse<ParkingLocationDetail>>(`/parking/${id}`); return response.data;
}
export async function getParkingNearby(params: { lat: number; lng: number; radius_km?: number; limit?: number }) {
  const response = await api.get<ApiSuccessResponse<ParkingNearbyResult[]>>("/parking/nearby", { params }); return response.data;
}
export async function getAvailability(id: string, params: { start_time: string; end_time: string; slot_type?: SlotType }) {
  const response = await api.get<ApiSuccessResponse<AvailableSlot[]>>(`/parking/${id}/availability`, { params }); return response.data;
}
export async function getParkingServices(id: string) {
  const response = await api.get<ApiSuccessResponse<ParkingService[]>>(`/parking/${id}/services`); return response.data;
}
export async function getParkingReviews(id: string, params: { page?: number; limit?: number } = {}) {
  const response = await api.get<ApiSuccessResponse<Review[]>>(`/parking/${id}/reviews`, { params }); return response.data;
}
export async function createParkingReview(id: string, payload: CreateReviewPayload) {
  const response = await api.post<ApiSuccessResponse<Review>>(`/parking/${id}/reviews`, payload); return response.data;
}
