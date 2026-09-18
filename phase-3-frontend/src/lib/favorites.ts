import { api } from "@/lib/api";
import type { ApiSuccessResponse } from "@/types/api";
import type { Favorite, FavoriteLocation } from "@/types/favorite";
export async function listFavorites() { const r = await api.get<ApiSuccessResponse<FavoriteLocation[]>>("/favorites"); return r.data; }
export async function addFavorite(parkingId: string) { const r = await api.post<ApiSuccessResponse<Favorite>>(`/favorites/${parkingId}`); return r.data; }
export async function removeFavorite(parkingId: string) { const r = await api.delete<ApiSuccessResponse<null>>(`/favorites/${parkingId}`); return r.data; }
