# Parkkar — Requirement Checklist

Legend: **[PASS]** actually executed here · **[PARTIAL]** verified by reading
real source, not executed · **[NOT VERIFIED]** needs a browser / build / DB /
live credentials, unavailable in this environment.

The audit environment had **no network access**, so no dependency install, no
`next build`, no browser, no PostgreSQL, no Maps key and no Razorpay
credentials. See `FINAL-AUDIT.md` §1 for proof and consequences.

## Discovery + maps
- [PASS] Kanpur remains included.
- [PASS] Indian capital-city directory available in search, plus Kanpur.
- [PASS] Required Kanpur/Lucknow mall directory included — all 9 malls present.
- [PASS] LuLu Mall Lucknow and Wave Mall Lucknow records present with their own
  parking-location rows (the previously reported matching bug).
- [PARTIAL] Verified images used where available; otherwise a labeled fallback.
- [PARTIAL] Home page has a parking map (code present; not rendered).
- [PARTIAL] Parking discovery page has a parking map (code present; not rendered).
- [PARTIAL] Google Maps supported through `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
- [NOT VERIFIED] Fallback map renders correctly without a Google key.
- [NOT VERIFIED] Live Google Maps with a real key — no key available.
- [PASS] Verified building-level info is distinguished from unavailable
  slot-level layouts.
- [PASS] Z Square represented as B1 bikes + B2/B3 cars (18 BIKE / 30 CAR / 30 CAR).

## Slot selection + availability
- [PARTIAL] Users select an actual slot from the visual slot map.
- [PARTIAL] Z Square levels are switchable tabs (B1/B2/B3).
- [PARTIAL] Changing level clears a selection belonging to another level, so a
  stale slot cannot be submitted.
- [PARTIAL] Slot type filter respected by the visual map.
- [PARTIAL] Selected slot is visually distinct.
- [PARTIAL] Available slots selectable; unavailable-for-requested-time orange;
  maintenance/disabled grey; BEST has distinct treatment.
- [PARTIAL] Recommendation factors include exit / lift / cleaning-area metadata.
- [PARTIAL] Cleaning selection affects best-slot scoring (+4 for cleaning bay).
- [PARTIAL] BEST candidates are pre-filtered to ACTIVE and backend-available, so
  a BEST slot is always selectable.
- [PASS] Parkkar's own availability comes from the backend availability endpoint,
  which is authoritative over static frontend colouring.
- [PARTIAL] Booking overlap remains backend/database authoritative via the
  PostgreSQL `EXCLUDE` constraint and `23P01` -> 409 `BOOKING_CONFLICT`.
- [NOT VERIFIED] Real conflicting-booking rejection against a live database.
- [NOT VERIFIED] External mall operator live occupancy — requires operator
  integration/permission. Correctly **not** simulated anywhere.

## Parkkar Care
- [PASS] Parkkar Care is a top-level navigation feature with a dedicated page.
- [PASS] Parkkar Care is integrated into booking.
- [PASS] Car is the default vehicle type; Bike, EV and Other supported.
- [PASS] EV is treated as a car for car-cleaning services.
- [PASS] Bikes are not offered car interior cleaning.
- [PARTIAL] Vehicle changes remove invalid previously selected services.
- [PASS] Car Cleaning 150.
- [PASS] EV Charging 50.
- [PASS] Valet Parking 150.
- [PASS] Interior Cleaning 149 and separately selectable.
- [PASS] Complete Car Clean 299.
- [PASS] Bike Wash 99.
- [PASS] Tubeless Puncture Assistance 199.
- [PASS] Tyre Air Top-up 30.
- [PASS] Polish Finish 249.
- [PASS] Puncture UI states parts/replacement may be quoted separately.
- [NOT VERIFIED] Actual select/deselect clicks and live total updates.

## Booking + payment + QR
- [PASS] **Fixed this pass:** temporal-dead-zone crash on `/bookings/new` that
  would have broken the booking flow at its first step.
- [PASS] Booking request field names match the backend Zod schema exactly
  (`slot_id`, `vehicle_id`, `start_time`, `end_time`, `services[]`).
- [PASS] Vehicle create/update field names match the backend camelCase schema.
- [PARTIAL] Booking page accepts parking, slot and timing data.
- [PARTIAL] Client validates end after start; backend validates authoritatively.
- [PARTIAL] Booking uses a user-owned vehicle (composite FK enforced in DB).
- [PARTIAL] Booking carries selected services to the backend.
- [PARTIAL] Booking summary displays parking, care and estimated total.
- [PARTIAL] Razorpay order creation + server-side HMAC-SHA256 signature
  verification with `timingSafeEqual`; credentials required at startup; secret
  never sent to the client.
- [PASS] Mock payment explicitly labelled development-only in route comment and
  response message.
- [PARTIAL] QR generation present for bookings; verification role-protected
  (`requireRole('PARTNER','ADMIN')`).
- [NOT VERIFIED] Real booking insertion, real totals, real payment transactions,
  real QR scan. No payment success or scan result was faked.

## Auth / workspaces / language
- [PARTIAL] Authentication architecture preserved; JWT payload minimal (`id`,
  `role`), no PII.
- [PASS] `LanguageProvider` mounted once at the true app root, above every
  route tree including all admin and partner pages.
- [PASS] All 4 `useLanguage()` consumers sit beneath that provider — the
  previously reported 12-page crash is structurally resolved.
- [PARTIAL] English, Hindi and Hinglish are a real dictionary, not a label-only
  selector.
- [PARTIAL] Mobile navigation present.
- [PASS] Admin and partner route structure preserved; `requireRole` applied at
  router level.
- [NOT VERIFIED] Live login, role redirects, and admin/partner page rendering.

## API / data integrity
- [PASS] Every frontend API call matches a real backend route, method and body.
- [PASS] No invented endpoints.
- [PASS] Every internal `href` / `router.push` resolves; zero dead links.
- [PASS] Every `@/...` import resolves to a real file.
- [PASS] Seed: no duplicate primary keys; all 10 foreign-key relationships
  intact; all 10 `setval` statements present; roles correct.
- [PASS] Schema enum values match the frontend union types exactly.
- [PASS] Historical price snapshot behaviour is correct by design
  (`booking_services.price_at_booking` = 100.00 vs current catalogue 150.00).
- [PASS] Seed data documented as demo/fresh-database data using explicit IDs.
- [PASS] `review.routes.js` is intentionally unmounted (reviews nested under
  `/api/parking/:id/reviews`) and documented in-file — not a defect.

## UI / runtime resilience
- [PARTIAL] Mobile-first responsive styling retained.
- [PARTIAL] External mall image failure has a graceful fallback.
- [PARTIAL] Google Maps loader is a client component, avoiding the Server
  Component inline event-handler error.
- [PASS] Next.js dev indicator disabled.
- [PASS] Frontend TS/TSX: 0 syntax errors, 0 type-independent errors (84 files).
- [PASS] Backend JS passes `node --check` (51 files).
- [PASS] No landing-page fabricated statistics remain.
- [PASS] No secrets or `.env` files committed.
- [NOT VERIFIED] Full browser E2E verification.
- [NOT VERIFIED] Full `next build` — dependencies could not be installed.
- [NOT VERIFIED] Responsive/visual QA at real viewport widths.
- [NOT VERIFIED] Backend test suite — integration tests; `npm test` run and
  failed with `fetch failed` (no server/database available).
