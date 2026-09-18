# Parkkar — Phase 2: Backend

A complete, runnable Node.js + Express + PostgreSQL REST API for Parkkar,
built directly against the locked Phase 1 database (`schema.sql` /
`seed.sql` / `queries.sql`). Razorpay, recommendation, QR verification, and admin parking lifecycle endpoints are included. Google Maps remains an externally configured frontend integration pending the required Google Cloud billing/API-key setup.

> **Schema-sync note:** this backend was updated to match a corrected,
> final revision of the Phase 1 schema (5 fixes: commission moved from
> `parking_locations` to `users`, a composite FK now ties booking vehicle
> ownership to the booking's user, a trigger enforces that a location's
> owner is actually a `PARTNER`, plus a documentation-only fix to the
> global-services limitation and seed timestamp ordering). Every place in
> this backend that touched the old schema shape was found and fixed —
> see "Known Limitations" below for exactly what changed and what
> remains unchanged.

## 1. Project overview

Parkkar connects USERS who need parking, PARTNERS who own parking
properties (hotels, malls, commercial buildings), and platform ADMINS.
This backend exposes:

- Public parking discovery (search, nearby search, availability)
- User auth, vehicle management, booking creation/cancellation, reviews,
  favorites
- Partner CRUD for their own locations/slots, their own bookings, revenue
- Admin read-only platform monitoring

## 2. Tech stack

- Node.js (ES Modules) + Express
- PostgreSQL via `pg` (no ORM — direct parameterized SQL, per the brief)
- `bcrypt` for password hashing
- `jsonwebtoken` for auth
- `zod` for request validation
- `helmet`, `cors`, `express-rate-limit` for baseline security

## 3. Folder structure

```
backend/
  src/
    config/        db.js (pg.Pool + transaction helper), env.js (startup validation)
    controllers/    thin HTTP layer — calls services, formats responses
    middleware/     auth, role, validation, rate limiting, error handling
    routes/         Express routers, one per resource
    services/       business logic (auth, parking, booking, payment, partner)
    repositories/   all raw SQL lives here, one file per table/domain
    utils/          jwt, password, errors, response, pagination, zod schemas
    app.js          Express app wiring
    server.js       process entrypoint, graceful shutdown
  tests/            node:test integration tests (run against a real DB)
  postman/          Postman collection covering every required flow
  .env.example
  package.json
```

Layering is strict: **Routes → Controllers → Services → Repositories →
PostgreSQL**. Repositories are the only files that contain SQL.

## 4. Requirements

- Node.js 18+
- PostgreSQL 14+ with `schema.sql` and `seed.sql` from Phase 1 already
  applied

## 5. Installation

```bash
cd backend
npm install
cp .env.example .env
# edit .env — set DATABASE_URL and JWT_SECRET at minimum
```

## 6. Environment variables

| Variable | Required | Notes |
|---|---|---|
| `PORT` | no (default 4000) | HTTP port |
| `NODE_ENV` | no (default development) | `production` disables verbose error hints |
| `DATABASE_URL` | **yes** | Postgres connection string |
| `JWT_SECRET` | **yes** | long random secret |
| `JWT_EXPIRES_IN` | no (default 7d) | e.g. `7d`, `1h` |
| `CORS_ORIGIN` | no (default `*`) | comma-separated allowed origins |

The server refuses to start (`env.js` throws at import time) if
`DATABASE_URL` or `JWT_SECRET` is missing — it never silently boots with
an invalid configuration.

## 7. Database setup

This backend does **not** create or modify the schema. Run Phase 1's own
files against your Postgres instance first, exactly as its README says:

```bash
psql -d parkkar -f ../database/schema/schema.sql
psql -d parkkar -f ../database/seeds/seed.sql
```

## 8. Seed data

`seed.sql`'s `password_hash` values are fictional placeholders, **not**
real bcrypt hashes (the Phase 1 README says this explicitly). You cannot
log in as `rohan.mehta@example.com` etc. out of the box — either:

- register a fresh user via `POST /api/auth/register` (always creates
  role `USER`), or
- manually `UPDATE users SET password_hash = '<real bcrypt hash>' WHERE
  email = '...'` for a seeded partner/admin account, using
  `utils/password.js`'s `hashPassword()` to generate one.

## 9. Start commands

```bash
npm run dev     # node --watch, auto-restarts on file changes
npm start       # production start
```

`GET /api/health` reports service + database status.

## 10. API routes

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | – | Register (always role USER) |
| POST | /api/auth/login | – | Login, returns JWT |
| GET | /api/auth/me | user | Current profile |
| POST/GET/PUT/DELETE | /api/vehicles(/:id) | user | Own vehicles only |
| GET | /api/parking | – | Search (city, propertyType, price, slotType) |
| GET | /api/parking/nearby | – | lat/lng/radius_km Haversine search |
| GET | /api/parking/:id | – | Location + slots |
| GET | /api/parking/:id/availability | – | start_time/end_time/slot_type |
| GET | /api/parking/:id/services | – | Active service catalog (see §14) |
| GET/POST | /api/parking/:id/reviews | –/user | List / create review |
| POST | /api/bookings | user | Create booking (see §12) |
| GET | /api/bookings | user/partner/admin | Own / owned-location / all bookings |
| GET | /api/bookings/:id | owner-checked | Full booking detail |
| PATCH | /api/bookings/:id/cancel | owner-checked | Cancel (status → CANCELLED) |
| POST | /api/bookings/:id/mock-pay | user | **MOCK/DEV ONLY** simulated payment |
| GET | /api/services | – | Global service catalog |
| POST/GET/DELETE | /api/favorites(/:parkingId) | user | Own favorites |
| POST/GET/PUT/DELETE | /api/partner/parking(/:id) | partner | Own locations |
| POST/GET/PUT/DELETE | /api/partner/parking/:id/slots, /api/partner/slots/:id | partner | Own slots |
| GET | /api/partner/bookings | partner | Bookings at own locations |
| GET | /api/partner/revenue | partner | Gross/net/commission for a date range |
| GET | /api/admin/{users,partners,parking,bookings,payments,revenue} | admin | Platform monitoring |
| PATCH | /api/admin/parking/:id/status | admin | Approve / activate / deactivate a parking location |

## 11. Authentication

`POST /api/auth/login` returns a JWT signed with `JWT_SECRET`, payload
`{ id, role }` only — no PII, no password. Send it as
`Authorization: Bearer <token>`. `middleware/auth.middleware.js` verifies
the signature and attaches `req.user = { id, role }`; every handler reads
identity from `req.user`, never from the request body/params/query.

## 12. Authorization

`middleware/role.middleware.js` gates routes by role
(`requireRole('PARTNER')`, etc.). Beyond role checks, ownership is
enforced per-resource:

- Vehicles: `vehicle.user_id === req.user.id`
- Parking locations/slots: `location.partner_id === req.user.id`
- Bookings: owning user, owning partner (via the slot's location), or
  admin

A mismatch returns `404` (not `403`) for single-resource lookups where
existence itself is private (e.g. someone else's vehicle), so a caller
can't distinguish "doesn't exist" from "exists but isn't yours."

## 13. Booking flow

`POST /api/bookings` (`services/booking.service.js`):

1. Validate `start_time`/`end_time` and `end_time > start_time`.
2. Load the slot; require an `ACTIVE` location and `ACTIVE` slot.
3. If `vehicle_id` given, require it belongs to the caller.
4. Resolve and validate every requested add-on service against the
   catalog.
5. Compute `duration × price_per_hour_snapshot` + service subtotal =
   `total_amount`, using JS numbers rounded to 2dp from Postgres
   `NUMERIC` values — never floating-point money math beyond that final
   rounding, and the snapshot values themselves are stored as-is from the
   DB.
6. `BEGIN` a transaction, `INSERT` the booking, `INSERT` each
   `booking_services` row, `COMMIT`. Any failure `ROLLBACK`s and always
   releases the client.

## 14. Double-booking protection

**The database's `excl_bookings_no_overlap` EXCLUDE constraint is the
only authoritative guard.** The booking `INSERT` is attempted directly;
it is never preceded by a "check availability, then insert" pattern. If
Postgres rejects the insert with error `23P01`, `utils/errors.js`'s
`mapPgError` turns it into:

```json
HTTP 409
{ "success": false, "message": "The selected slot is no longer available for this time.", "error": "BOOKING_CONFLICT" }
```

`GET /api/parking/:id/availability` mirrors the same `[start, end)` /
`PENDING|CONFIRMED|ACTIVE`-blocks semantics as `queries.sql #4`, but it is
a convenience read for the UI — it is not what prevents a race, the
EXCLUDE constraint is.

## 15. Error handling

All errors funnel through `middleware/error.middleware.js`. Known
PostgreSQL codes are mapped:

| Code | Meaning | HTTP | error |
|---|---|---|---|
| 23P01 | exclusion violation | 409 | BOOKING_CONFLICT |
| 23505 | unique violation | 409 | DUPLICATE_RESOURCE |
| 23503 (constraint `fk_bookings_vehicle_owner`, on table `bookings`) | booking's `vehicle_id` doesn't belong to its `user_id` | 400 | VEHICLE_NOT_OWNED |
| 23503 (constraint `fk_bookings_vehicle_owner`, on table `vehicles`) | deleting a vehicle that still has booking history | 409 | VEHICLE_HAS_BOOKINGS |
| 23503 (any other) | foreign key violation | 400 | INVALID_REFERENCE |
| 23514 | check violation | 422 | CHECK_VIOLATION |

`utils/errors.js`'s `mapPgError` distinguishes the two `fk_bookings_vehicle_owner`
cases by `err.table` (Postgres reports the FK error against the table the
statement targeted — `bookings` for an `INSERT`, `vehicles` for a blocked
`DELETE`), so the client gets an accurate message either way instead of a
generic "invalid reference."

A location's `partner_id` failing the `check_partner_role` trigger raises
a plain `RAISE EXCEPTION` (SQLSTATE `P0001`), which isn't in the table
above and falls through to the generic `500 INTERNAL_ERROR` — this is
intentional: every route that can create/update a location is already
`requireRole('PARTNER')`-gated and always sets `partner_id = req.user.id`,
so this trigger should never actually fire in normal use; if it does, it
means an app-layer invariant broke, which deserves a loud 500 and a
server-side log line, not a quiet 400.

Anything else unrecognized becomes a generic `500 INTERNAL_ERROR` — raw
SQL text, stack traces, and driver internals are never sent to the client
(logged server-side only).

## 16. Security

- bcrypt (10 salt rounds), JWTs with minimal payload, role + ownership
  checks on every protected route
- `helmet`, `cors` (configurable origin allowlist), rate limiting
  (stricter on `/api/auth/*`)
- 100% parameterized SQL — no string concatenation anywhere in
  `repositories/`
- `password_hash` is never selected in any "safe" user query and is
  stripped before any response

## 17. Testing

`tests/` contains `node:test` integration tests run against a real
Postgres instance (no mocking of the DB — the point is to exercise the
actual EXCLUDE constraint). See `tests/README.md` for setup; in short:

```bash
createdb parkkar_test
psql -d parkkar_test -f ../database/schema/schema.sql
psql -d parkkar_test -f ../database/seeds/seed.sql
DATABASE_URL=postgres://... JWT_SECRET=test-secret npm test
```

`tests/booking-conflict.test.js` is the **critical test**: first booking
on a slot/time succeeds (201), an overlapping second attempt on the same
slot gets `409 BOOKING_CONFLICT` — driven by the real database
constraint, not application logic.

This sandbox has no network access and cannot install `pg`/`express`/
`zod`/etc. or run PostgreSQL, so these tests were **not executed here**.
Every file was syntax-checked (`node --check`) and every internal
import/export and repository-function reference was cross-checked
programmatically for typos/missing exports — but please run
`npm install && npm test` yourself against a real database before relying
on this.

## 18. Postman usage

Import `postman/Parkkar.postman_collection.json`. Set the `base_url`
variable (default `http://localhost:4000`). Login requests auto-save
their JWT into collection variables (`user_token`, `partner_token`,
`admin_token`) via test scripts, used by subsequent requests. The seed
logins need a real bcrypt hash substituted first — see §8. Requests 9a/9b
are the required overlapping-booking demonstration (expect 201, then
409/`BOOKING_CONFLICT`).

## 19. Known limitations

- **Razorpay, Google Maps, AI, QR, OCR are NOT integrated** — out of
  scope for Phase 2 by design.
- **`POST /api/bookings/:id/mock-pay` is a development-only mock.** It
  writes a `payments` row with a fabricated `transaction_ref` and no real
  money moves. It is clearly labeled as such in code and API responses.
- **No `location_services` table exists in the locked Phase 1 schema —
  and this is intentional, not a gap to fill.** Only a global
  `parking_services` catalog and a `booking_services` junction to a
  specific booking exist — there is no schema-backed concept of "which
  services this location offers." `GET /api/parking/:id/services` and
  `GET /api/services` therefore both return the same full active
  catalog, and any active service can be attached to a booking at any
  location. This is documented as design decision #5 in
  `database/README.md`; Phase 2 does not add its own validation for it
  either, for the same reason Phase 1 doesn't have the table yet (no firm
  requirement exists for how availability should be scoped). Partner-side
  "manage location services" endpoints were **not** implemented.
- Nearby search's bounding box is derived per-request from `radius_km`
  (≈111km/degree), rather than Phase 1's fixed ±0.1° box, since the API
  exposes a variable radius; the exact-distance Haversine ranking and
  final filter match `queries.sql #3`.
- No automated test run was performed in this environment (see §17) —
  including the new `tests/vehicle-ownership.test.js` added in the
  schema-sync.

### Fixed in the schema-sync (previously listed here as limitations)

The items below were listed as limitations in an earlier revision of this
file and are now fixed, matching the corrected Phase 1 schema:

- ~~No composite FK ties `(vehicle_id, user_id)` to a booking's
  `user_id`~~ — **fixed.** The database now has
  `bookings(vehicle_id, user_id) → vehicles(id, user_id)`
  (`fk_bookings_vehicle_owner`, `ON DELETE RESTRICT`). The app-layer
  check in `booking.service.js` still runs first (faster, clearer 403),
  but the database is now the authoritative backstop, consistent with
  how double-booking is handled. One consequence: `DELETE
  /api/vehicles/:id` can now fail with `409 VEHICLE_HAS_BOOKINGS` if the
  vehicle has any booking history — previously this always succeeded
  silently. See §15 for the new error codes.
- ~~No database trigger enforces partner ownership of a location~~ —
  **fixed.** `parking_locations` now has a `BEFORE INSERT OR UPDATE`
  trigger (`check_partner_role`) rejecting any `partner_id` that isn't a
  `role = 'PARTNER'` user. In normal operation this never fires — every
  route that creates/updates a location is `requireRole('PARTNER')`-gated
  and always uses `req.user.id` as `partner_id` — so it's a pure
  defense-in-depth backstop, not a new user-facing behavior.
- ~~`commission_rate_percent` lives on `parking_locations`, not
  `users`~~ — **fixed.** It now lives on `users` (nullable, only valid
  for `role = 'PARTNER'`). `repositories/payment.repository.js`'s
  `partnerRevenue()` and `platformRevenue()` now join `users` instead of
  reading it off `parking_locations`; `repositories/user.repository.js`'s
  `SAFE_COLUMNS` now includes it so a partner's own profile
  (`GET /api/auth/me`) and `GET /api/admin/partners` can show it.

## 20. Phase 3 handoff

The frontend will consume this backend purely over REST:

```
Frontend  →  REST API (this backend)  →  PostgreSQL
             JWT in Authorization header
```

Endpoints the frontend will need most immediately: `POST /api/auth/*`,
`GET /api/parking` + `/nearby` + `/:id` + `/:id/availability`, `POST
/api/bookings`, `GET /api/bookings`, `PATCH /api/bookings/:id/cancel`,
and the partner-side `/api/partner/*` routes for a partner dashboard. All
responses use the `{ success, message, data }` / `{ success, message,
error }` envelope described above, and list endpoints return `meta:
{ page, limit, total, totalPages }` for pagination.

Phase 3 (frontend) is explicitly out of scope here and was not started.


## Phase 6 — QR verification

Apply `../Phase 1 - Database/phase6_qr.sql` after the Phase 1 schema. `GET /api/bookings/:id/qr` returns a signed booking token. `POST /api/bookings/verify/qr` is restricted to PARTNER/ADMIN users and performs entry/exit state transitions.
