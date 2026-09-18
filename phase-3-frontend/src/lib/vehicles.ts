import { api } from "@/lib/api";
import type { ApiSuccessResponse } from "@/types/api";
import type { Vehicle, VehicleType } from "@/types/vehicle";

export interface CreateVehiclePayload { vehicleType?: VehicleType; plateNumber: string; make?: string; model?: string; }
export interface UpdateVehiclePayload { vehicleType?: VehicleType; plateNumber?: string; make?: string; model?: string; }

export async function listVehicles() {
  const r = await api.get<ApiSuccessResponse<Vehicle[]>>("/vehicles"); return r.data;
}
export async function createVehicle(payload: CreateVehiclePayload) {
  const r = await api.post<ApiSuccessResponse<Vehicle>>("/vehicles", payload); return r.data;
}
export async function updateVehicle(id: string, payload: UpdateVehiclePayload) {
  const r = await api.put<ApiSuccessResponse<Vehicle>>(`/vehicles/${id}`, payload); return r.data;
}
export async function deleteVehicle(id: string) {
  const r = await api.delete<ApiSuccessResponse<null>>(`/vehicles/${id}`); return r.data;
}
