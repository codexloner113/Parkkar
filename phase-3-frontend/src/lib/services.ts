import { api } from "@/lib/api";
import type { ApiSuccessResponse } from "@/types/api";
import type { ParkingService } from "@/types/service";
export async function listServices() { const r = await api.get<ApiSuccessResponse<ParkingService[]>>("/services"); return r.data; }
