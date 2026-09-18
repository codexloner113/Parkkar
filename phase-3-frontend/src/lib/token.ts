// JWT persistence. Plain localStorage is the right fit here: this is a
// client-only Bearer token (see Phase 2 - Bacend/src/utils/jwt.js —
// signToken({ id, role }), no refresh token, no server session/cookie to
// coordinate with), and Next.js App Router pages that need the current
// user already have to handle the "not yet loaded on the client" case via
// AuthContext regardless. No new dependency introduced.
const TOKEN_KEY = "parkkar_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}
