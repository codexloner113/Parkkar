import axios from "axios";
import { getStoredToken, clearStoredToken } from "@/lib/token";

export const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the JWT (see Phase 2 - Bacend/src/middleware/auth.middleware.js —
// requireAuth expects exactly `Authorization: Bearer <token>`) to every
// request when one is stored. Public endpoints simply ignore the header,
// so it's safe to always attempt this rather than tracking per-request
// whether auth is required.
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A 401 from the backend only ever means "missing or malformed
// Authorization header" or "invalid/expired token" — see
// auth.middleware.js. There is no refresh-token endpoint (confirmed
// absent from src/routes/auth.routes.js), so the only safe response is to
// drop the stale token and let AuthContext reset to a logged-out state.
// This module stays framework-agnostic (no React here), so it just
// notifies whoever registered interest via registerUnauthorizedHandler.
type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function registerUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearStoredToken();
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);