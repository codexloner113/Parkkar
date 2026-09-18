// Centralized React Query key factory. Every query key used anywhere in
// the app should come from here instead of an inline array, so cache
// invalidation stays predictable as more resources are wired up in later
// milestones. Resource namespaces below map 1:1 to the actual Phase 2
// route groups confirmed in src/routes/*.js — nothing here is invented.
//
// This file only defines KEYS. It does not perform any API calls and does
// not change what's currently rendered — src/lib/parking.ts's existing
// ["parking", params] key is left as-is for now and can be migrated to
// queryKeys.parking.search(params) in a later milestone.

export const queryKeys = {
  auth: {
    me: () => ["auth", "me"] as const,
  },

  vehicles: {
    all: () => ["vehicles"] as const,
    list: () => ["vehicles", "list"] as const,
    detail: (id: string | number) => ["vehicles", "detail", String(id)] as const,
  },

  parking: {
    all: () => ["parking"] as const,
    search: (params: Record<string, unknown>) => ["parking", "search", params] as const,
    nearby: (params: Record<string, unknown>) => ["parking", "nearby", params] as const,
    recommendations: (params: Record<string, unknown>) =>
  ["parking", "recommendations", params] as const,
    detail: (id: string | number) => ["parking", "detail", String(id)] as const,
    availability: (id: string | number, params: Record<string, unknown>) =>
      ["parking", "detail", String(id), "availability", params] as const,
    services: (id: string | number) => ["parking", "detail", String(id), "services"] as const,
    reviews: (id: string | number, params: Record<string, unknown> = {}) =>
      ["parking", "detail", String(id), "reviews", params] as const,
  },

  services: {
    all: () => ["services"] as const,
    list: () => ["services", "list"] as const,
  },

  bookings: {
    all: () => ["bookings"] as const,
    list: (params: Record<string, unknown> = {}) => ["bookings", "list", params] as const,
    detail: (id: string | number) => ["bookings", "detail", String(id)] as const,
    qr: (id: string | number) => ["bookings", "qr", String(id)] as const,
  },

  favorites: {
    all: () => ["favorites"] as const,
    list: () => ["favorites", "list"] as const,
  },

  partner: {
    all: () => ["partner"] as const,
    locations: () => ["partner", "locations"] as const,
    location: (id: string | number) => ["partner", "locations", String(id)] as const,
    slots: (locationId: string | number) =>
      ["partner", "locations", String(locationId), "slots"] as const,
    bookings: (params: Record<string, unknown> = {}) => ["partner", "bookings", params] as const,
    revenue: (params: Record<string, unknown> = {}) => ["partner", "revenue", params] as const,
  },

  admin: {
    all: () => ["admin"] as const,
    users: (params: Record<string, unknown> = {}) => ["admin", "users", params] as const,
    partners: (params: Record<string, unknown> = {}) => ["admin", "partners", params] as const,
    parking: (params: Record<string, unknown> = {}) => ["admin", "parking", params] as const,
    bookings: (params: Record<string, unknown> = {}) => ["admin", "bookings", params] as const,
    payments: (params: Record<string, unknown> = {}) => ["admin", "payments", params] as const,
    revenue: (params: Record<string, unknown> = {}) => ["admin", "revenue", params] as const,
  },
} as const;
