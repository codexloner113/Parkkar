# Parkkar — Final Audit

Status vocabulary used throughout:

- **PASS** — actually executed/verified in the audit environment.
- **PARTIAL** — verified by reading/analysing the real source, but not executed.
- **NOT VERIFIED** — could not be tested here; requires the owner's machine.

---

## 1. Environment capability (read this first)

The audit environment had **no network access**. This determines which
statuses below can be PASS.

Confirmed by running:

```
npm ping      -> 403 Forbidden (registry.npmjs.org unreachable)
npm install   -> 403 Forbidden
```

Consequences:

- `node_modules` could not be installed for the frontend or the backend.
- `next build`, `next dev`, `next lint` could not be run.
- No browser, headless browser, or screenshots.
- No PostgreSQL server: no live schema/seed load, no live queries.
- No Google Maps API key, no Razorpay credentials.

**Every requirement whose acceptance criterion is "click it in a browser" or
"run a real transaction" is reported NOT VERIFIED**, regardless of how correct
the code looks. Nothing here claims a browser test or production build passed.

What was possible, and was actually run:

| Check | Tool | Result |
|---|---|---|
| Backend JS syntax, all 51 files | `node --check` | **PASS** — all parse cleanly |
| Frontend TS/TSX, all 84 files | `tsc` (global) | **PASS** for syntax and type-independent errors |
| Import-graph resolution (`@/...`) | scripted | **PASS** — every alias resolves |
| Internal route/link integrity | scripted | **PASS** — every target resolves |
| Seed FK + ID integrity | scripted | **PASS** — 10/10 relationships intact |
| Backend test suite | `npm test` | **NOT VERIFIED** — integration tests need live server + DB |

### Note on the TypeScript results

`tsc` was run with the project's real `tsconfig.json` compiler settings.
Because `node_modules` is absent, the run emits many errors that are
**artifacts of missing type packages**, not defects:

- `TS2307` (cannot find module 'react'/'next'/…) — 119
- `TS7026` (no `JSX.IntrinsicElements`) — 1557
- `TS7006` / `TS2875` / `TS18046` / `TS2591` — missing React/Node ambient types
- `TS2741` "children is missing", `TS2322` on `key` — same root cause

These were separated from **type-independent** errors, which are real
regardless of installed packages. Exactly one such defect existed; it was
fixed (§2). A clean `tsc`/`next build` still needs producing on the owner's
machine. This document does not claim one.

---

## 2. Genuine bug found and fixed in this pass

### Temporal-dead-zone crash on the booking page — FIXED

**File:** `phase-3-frontend/src/app/bookings/new/page.tsx`

**Detected by** `tsc`, at two separate call sites:

```
error TS2448: Block-scoped variable 'vehicleType' used before its declaration.
error TS2454: Variable 'vehicleType' is used before being assigned.
```

**What was wrong:** `const vehicleType` was declared *after* two `useEffect`
calls referencing it — including inside their dependency arrays, which are
evaluated eagerly on every render. Under `const` semantics this is a temporal
dead zone access, which throws at runtime:

```
ReferenceError: Cannot access 'vehicleType' before initialization
```

**Impact:** critical path. `/bookings/new` is reached from every parking
detail page, so the whole booking flow — slot -> vehicle -> Care -> summary ->
payment -> QR — would fail at the first step. This is a language-level error,
independent of whether React's types are installed.

**Fix applied:** the derived-value declarations (`vehicle`,
`effectiveVehicleId`, `vehicleType`, `slot`, `hours`) were moved *above* the
two effects that consume them. Pure statement reordering; no logic, behaviour,
or other line changed.

**Verified after fix:** `tsc` reports **0** `TS2448`/`TS2454` errors.

**Still NOT VERIFIED:** that the page renders in a browser. The crash cause is
removed and the reordering is semantically equivalent, but no browser existed
to confirm the page mounts.

---

## 3. Requirement-by-requirement verification

### 3.1 Browser / UI end-to-end journey — NOT VERIFIED

No browser. The journey (Home -> Search -> Location -> Date/Time -> Vehicle ->
Level -> Slot -> Care -> Summary -> Booking -> Payment -> Confirmation -> QR ->
History) could not be exercised.

Verified statically along that path:

- Every route in the journey exists as a real `page.tsx`. **PASS**
- Every internal link and `router.push` target resolves, including dynamic
  segments (`/parking/[id]`, `/bookings/[id]`,
  `/partner/parking/[id]/slots`). **PASS**
- Homepage hero search submits to `/parking?city=<encoded>`. **PASS** (static)
- The `/#how` anchor has a matching `id="how"` section. **PASS**
- The one crash blocking this journey was found and fixed (§2). **PASS**

### 3.2 Parkkar Care interaction — PARTIAL

Rules read from `CareServicePicker.tsx`'s explicit `VEHICLE_SERVICE_MAP` (a
table, not a name heuristic):

| Vehicle | Services offered | Correct? |
|---|---|---|
| CAR | Car Cleaning, Interior Cleaning, Complete Car Clean, Valet, Puncture, Air Top-up, Polish | yes |
| EV | all of CAR's **plus** EV Charging | yes — EV treated as a car |
| BIKE | Bike Wash, Puncture, Air Top-up, Polish | yes — **no** interior cleaning |
| OTHER | all services | yes |

Prices cross-checked against `Phase 1 - Database/seed.sql` — **all 9 exact**:

| Service | Required | In seed |
|---|---|---|
| Car Cleaning | 150 | 150.00 |
| EV Charging | 50 | 50.00 |
| Valet Parking | 150 | 150.00 |
| Interior Cleaning | 149 | 149.00 |
| Complete Car Clean | 299 | 299.00 |
| Bike Wash | 99 | 99.00 |
| Tubeless Puncture Assistance | 199 | 199.00 |
| Tyre Air Top-up | 30 | 30.00 |
| Polish Finish | 249 | 249.00 |

Puncture disclaimer present and explicit: parts / non-repairable tyre
replacement are quoted separately before work. **PASS**

Invalid-selection cleanup on vehicle change exists as an effect filtering
`selected` through `isVisibleForVehicle`. **PARTIAL** — logic correct on
reading; actual click/deselect/total-update behaviour NOT VERIFIED.

### 3.3 Booking end-to-end data flow — PARTIAL

Frontend request contracts diffed field-by-field against the backend's real
Zod schemas in `Phase 2 - Bacend/src/utils/schemas.js`:

- `POST /bookings` — frontend sends `slot_id`, `vehicle_id`, `start_time`,
  `end_time`, `services[{service_id, quantity}]`; `createBookingSchema`
  expects exactly these snake_case names. **Match.**
- `POST /vehicles` — frontend sends camelCase `vehicleType`/`plateNumber`;
  `createVehicleSchema` expects camelCase. **Match.** The codebase genuinely
  mixes snake_case and camelCase *per endpoint*; each was checked
  individually rather than assumed consistent.
- `GET /parking/:id/availability` — `start_time`/`end_time`/`slot_type`. **Match.**
- `GET /parking` — `city`, `propertyType`, `minPrice`, `maxPrice`,
  `slotType`, `page`, `limit`. **Match.**
- Every other frontend call matched a real route + method. **No invented
  endpoints, no wrong methods.**

Actual DB insertion, real totals, real overlap rejection: **NOT VERIFIED**.

### 3.4 Slot availability — PARTIAL

- Backend authoritative: `ParkingSlotMap` intersects the slot list with the
  `available` set from the availability endpoint; a slot absent from the
  backend response cannot be selected regardless of styling.
- `status !== "ACTIVE"` (maintenance/disabled) excluded from selectable and
  from BEST candidates.
- Overlap protection remains the PostgreSQL `EXCLUDE` constraint, with
  `23P01` mapped to 409 `BOOKING_CONFLICT`.
- Live behaviour with real conflicting bookings: **NOT VERIFIED**.

### 3.5 Z Square level switcher — PARTIAL

Seed data confirmed by counting actual rows:

- B1 — 18 slots, all `BIKE`, all `ACTIVE`
- B2 — 30 slots, all `CAR`, all `ACTIVE`
- B3 — 30 slots, all `CAR`, all `ACTIVE`

matching required B1=bikes / B2=cars / B3=cars. **PASS** (data).

Levels derive from the `slot_code` prefix. The tab handler explicitly clears
the selection when the selected slot belongs to a different level, so
switching levels cannot submit a stale slot. **Correct on reading**; click
behaviour and mobile usability **NOT VERIFIED**.

### 3.6 Best-slot recommendation — PARTIAL

`scoreSlot()` weights exit proximity (+3), lift proximity (+2), cleaning-bay
proximity (+4, only when cleaning is selected), with a small penalty for
accessible bays. Candidates are pre-filtered to `status === "ACTIVE"` **and**
presence in the backend availability set, so a BEST slot is always selectable.
Vehicle compatibility applied via the slot-type filter. **Logic verified by
reading.** Rendered outcome **NOT VERIFIED**.

### 3.7 Mall data — PASS (data)

All 9 required malls present in `src/data/parkkarData.ts`:

Kanpur — Z Square Mall, Rave 3 Mall, South X Mall.
Lucknow — LuLu Mall Lucknow, Phoenix Palassio, Phoenix United Mall,
One Awadh Centre, Wave Mall Lucknow, Sahara Ganj Mall.

The two previously-buggy records, **LuLu Mall Lucknow** and **Wave Mall
Lucknow**, are present with their own parking-location rows
(`LuLu Mall Lucknow Parking`, `Wave Mall Lucknow Parking`); the name-matching
fix is documented in-file. Card rendering **NOT VERIFIED**.

### 3.8 Maps — NOT VERIFIED (both cases)

- Without an API key: fallback path exists in code; not rendered or tested.
- With a real key: **no key available.** Live Google Maps is **NOT VERIFIED**.
  No claim that Maps loads or that the Server Component event-handler error is
  absent at runtime.

Script loading is a client component (`GoogleMapsLoader`) mounted from the root
layout, the correct shape for avoiding that error — verified by reading only.

### 3.9 Razorpay — PARTIAL (code path) / NOT VERIFIED (transactions)

Statically verified in `Phase 2 - Bacend/src/services/payment.service.js`:

- Order creation is server-side and tied to a specific booking.
- Signature verification computes HMAC-SHA256 over `order_id|payment_id` using
  the server-held secret and compares with `crypto.timingSafeEqual` (with a
  length pre-check) — correct and timing-safe.
- After signature validity, gateway state is re-fetched and only captured
  payments are treated as paid.
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` are in the required-env list, so
  the server refuses to start misconfigured.
- The secret is never sent to the client; only `keyId` is returned.

**No live transaction was performed. No payment success was simulated or
faked.** Real checkout, success, failure and signature-rejection paths are
**NOT VERIFIED**.

`POST /bookings/:id/mock-pay` remains explicitly labelled MOCK/DEVELOPMENT
ONLY in both its route comment and response message. It is not presented as
real payment integration.

### 3.10 QR — PARTIAL

- `GET /bookings/:id/qr` issues a signed, expiring token for the booking.
- `POST /bookings/verify/qr` is gated by `requireRole('PARTNER','ADMIN')`, so
  role protection on verification is present.
- Token-to-booking association exists in the service layer.

No scan was performed and **no successful scan result is claimed**. Runtime QR
generation/verification is **NOT VERIFIED**.

### 3.11 Auth / User / Admin / Partner — PARTIAL

- JWT payload is minimal (`{id, role}`); no PII, no password.
- `requireAuth` + `requireRole` applied at router level for `/partner/*` and
  `/admin/*`.
- **LanguageProvider regression check — verified:** `LanguageProvider` is
  mounted once in `src/app/providers.tsx`, which wraps `{children}` from the
  root layout, i.e. above *every* route tree including all admin and partner
  pages. Only 4 files call `useLanguage()` (`page.tsx`, `care/page.tsx`,
  `Navbar.tsx`, and the context itself), all beneath that provider. The
  previously-reported 12-page `useLanguage` crash is structurally resolved.
  **PASS (static)** — no browser confirmation.

### 3.12 Navbar / mobile navigation — PARTIAL

All navbar destinations (Find Parking, How It Works, Parkkar Care, Bookings,
Login/Profile) resolve to real routes. Mobile menu open/close, clipping and
overlay behaviour **NOT VERIFIED**.

### 3.13 Language switcher — PARTIAL

`LanguageContext` holds a real per-language dictionary (en/hi/hinglish) and
consuming components read translated keys (`t.location`, `t.search`, …) rather
than only swapping a label. Not a fake selector. Actual on-screen text change
**NOT VERIFIED**.

### 3.14 Responsive / visual QA — NOT VERIFIED

Requires a browser at multiple viewport widths. No rendering was possible, so
no claim about overflow, clipping, or slot-map usability on mobile.

### 3.15 Dead buttons / broken routes — PASS (static)

Every `href`, `router.push` and `router.replace` target in `src/` was extracted
and resolved against the actual route tree. **Zero broken internal links.**
Dynamic segments were normalised and matched literally. Whether each control
*does something useful* when clicked is **NOT VERIFIED**.

### 3.16 API / backend contract audit — PASS (static)

Full route inventory extracted from `src/routes/*.js` and diffed against every
`api.get/post/put/patch/delete` call in the frontend. All routes, methods and
request bodies match. No invented endpoints. Response handling matches the
`{success, message, data, meta}` envelope.

`src/routes/review.routes.js` exports an empty router and is deliberately not
mounted — reviews are nested under `/api/parking/:id/reviews`. Documented in
the file itself; **not** a defect.

### 3.17 Database consistency — PASS (static)

Scripted integrity check over `Phase 1 - Database/seed.sql`:

- Row counts: users 7, parking_locations 12, parking_slots 183, vehicles 4,
  parking_services 9, bookings 5, payments 4, reviews 2, favorites 2,
  booking_services 1.
- **No duplicate primary keys in any table.**
- **All 10 foreign-key relationships intact** (slots->locations,
  bookings->users, bookings->slots, payments->bookings,
  booking_services->bookings, booking_services->services, locations->users,
  vehicles->users, reviews->locations, favorites->locations).
- All 10 `setval(...)` sequence-sync statements present, so explicit IDs do
  not collide with future inserts.
- Seed roles correct: user 1 ADMIN, users 2-4 PARTNER, users 5-7 USER —
  satisfying the partner-ownership constraint on `parking_locations`.
- Enum values in `schema.sql` match the frontend union types exactly.

Note: `booking_services` row 1 stores `price_at_booking = 100.00` while the
current `Car Cleaning` catalogue price is `150.00`. This is **correct by
design** — it is the historical price snapshot, and usefully demonstrates that
snapshots do not track catalogue changes.

Seed data is **demo/fresh-database data**. It uses explicit IDs and targets a
clean development database, not a production database holding real user data.

### 3.18 Build / production verification — NOT VERIFIED

Cannot install dependencies (no network). `next build` was **not** run and no
build result is claimed. Static checks were performed instead (§1).

### 3.19 External mall live occupancy — PASS (correctly not faked)

The distinction is maintained honestly:

- **Parkkar booking availability** comes from Parkkar's own database and is
  authoritative for Parkkar-controlled slots.
- **External mall operator live occupancy** is *not* claimed anywhere.
  Location descriptions state that live floor/slot occupancy "requires
  operator integration"; the homepage says "Live availability when integrated"
  rather than asserting a live feed.

No simulated occupancy numbers were added. This remains a documented future
integration requirement, contingent on an actual operator API/SDK/feed and
authorisation.

### 3.20 Fabricated statistics — PASS

No fabricated platform metrics remain on the landing page (the earlier
hardcoded "50K+ / 120+ / 4.8 / 24-7" trust strip is gone). Trust indicators are
qualitative rather than invented figures.

---

## 4. Honest summary

**Fixed this pass:** 1 genuine, booking-flow-blocking runtime crash (§2).

**Verified by execution:** backend syntax (51 files), frontend syntax and
type-independent errors (84 files), import resolution, internal link
integrity, seed FK/ID integrity, service prices, mall records, Z Square level
data, role data.

**Not verified, and not claimed:** anything requiring a browser, a production
build, a live PostgreSQL instance, a Google Maps key, or Razorpay credentials.

The most valuable next step on the owner's machine:

```bash
cd phase-3-frontend && npm install && npx tsc --noEmit && npm run build
```

then walk the booking journey in a browser with the backend and database
running — exactly the checks this environment could not perform.
