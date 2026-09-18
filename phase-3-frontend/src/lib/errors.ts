import axios from "axios";
import type { ApiErrorResponse } from "@/types/api";

export function getApiError(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const payload = error.response?.data;
    return {
      message: payload?.message || (error.code === "ERR_NETWORK" ? "Unable to reach Parkkar right now." : fallback),
      code: payload?.error || (error.response ? `HTTP_${error.response.status}` : "NETWORK_ERROR"),
      status: error.response?.status,
    };
  }

  if (error instanceof Error) return { message: error.message || fallback, code: "CLIENT_ERROR" };
  return { message: fallback, code: "UNKNOWN_ERROR" };
}

export function isApiErrorCode(error: unknown, code: string) {
  return getApiError(error).code === code;
}
