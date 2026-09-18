# Parkkar — Phase 1: Database

Production-quality PostgreSQL foundation for Parkkar. This phase covers
**only** the database — no backend, frontend, or integrations.

## Folder structure

```
database/
  schema/
    schema.sql       -- tables, types, constraints, indexes, triggers
  seeds/
    seed.sql          -- fictional demo data for development
  queries/
    queries.sql        -- the 15 required operational queries
  migrations/           -- reserved for Phase 2+ (empty for now; see below)
  README.md              -- this file
```

`migrations/` is created but intentionally empty in Phase 1. `schema.sql` is
the single source of truth for a fresh database. Once Phase 2 development
starts and the schema needs to evolve incrementally against a database that
already has data, individual dated migration files (e.g.
`0001_add_slot_tags.sql`) belong here instead of hand-editing `schema.sql`.

## Run order

```bash
psql -d parkkar -f database/schema/schema.sql
psql -d parkkar -f database/seeds/seed.sql
```

`queries/queries.sql` is a reference file of hand-runnable queries (with
`:placeholder` variables), not something you execute top-to-bottom.

> **A note on validation:** this sandbox has no network access, so I
> couldn't install PostgreSQL here to actually execute the script end to
> end. I reviewed every statement by hand against Postgres 14+ syntax and
> cross-checked every foreign key, enum value, and column name used in
> `seed.sql` and `queries.sql` against `schema.sql`. Please run it in your
> own Postgres (or a free sandbox like db-fiddle.com) before you build on
> top of it — if anything errors, paste it back to me and I'll fix it
> immediately.

## Why PostgreSQL

- **Relational integrity** — Parkkar's data is inherently relational
  (users → locations → slots → bookings → payments), and foreign keys/
  constraints keep that integrity at the database level, not just in
  application code.
- **Transactions** — a booking + payment record must succeed or fail
  together; Postgres's ACID transactions guarantee that.
- **EXCLUDE constraints + GiST indexes** — this is the deciding feature.
  Postgres can enforce "no two overlapping bookings for the same slot" as
  a database-level constraint using range types, which most other
  relational databases (MySQL included) cannot do natively. This is core
  to Parkkar's booking correctness (see below).
- **Indexing flexibility** — B-tree for normal lookups now, with a clean
  upgrade path to PostGIS (GiST-based geospatial indexing) later without
  changing database engines.

## Entities (10 tables)

| Table | Purpose |
|---|---|
| `users` | All accounts — customers, partners, and admins, distinguished by `role` |
| `vehicles` | Vehicles registered by users |
| `parking_locations` | A partner's property (hotel/mall/building/etc.) |
| `parking_slots` | Individual bookable slots within a location |
| `bookings` | The core reservation record |
| `payments` | Payment attempts/records tied to a booking |
| `reviews` | User ratings/reviews of a location |
| `favorites` | Saved locations per user |
| `parking_services` | Catalog of add-ons (car cleaning, EV charging, valet) |
| `booking_services` | Which add-ons were purchased with which booking |

No speculative tables were added beyond this list — see "Future-Feature
Readiness" below for how upcoming features map onto this same schema
without new tables.

## Relationships (textual ER diagram)

```
users (1) ───< parking_locations (partner_id)
users (1) ───< vehicles
users (1) ───< bookings
users (1) ───< reviews
users (1) ───< favorites

parking_locations (1) ───< parking_slots
parking_locations (1) ───< reviews
parking_locations (1) ───< favorites

parking_slots (1) ───< bookings

vehicles (1) ───< bookings   (nullable — a booking may not specify a vehicle yet)

bookings (1) ───< payments
bookings (1) ───< booking_services

parking_services (1) ───< booking_services
```

Read `(1) ───< (many)` as "one row here relates to many rows there."

## Key integrity decisions

### Partner commission belongs to the partner user

`users.commission_rate_percent` stores the commission negotiated for each partner account. It is intentionally nullable for `USER`/`ADMIN` rows and required (0–100) for `PARTNER` rows via a role-linked `CHECK` constraint. It is not stored on `parking_locations`, because one partner may own multiple locations and should have one authoritative partner-level rate in this Phase 1 model.

### Parking locations must belong to PARTNER accounts

A database trigger validates that `parking_locations.partner_id` references a non-deactivated user whose role is `PARTNER`. This prevents application-layer mistakes from creating a location owned by a normal customer or admin.

### Booking vehicles must belong to the booking user

`bookings(vehicle_id, user_id)` has a composite foreign key to `vehicles(id, user_id)`. This makes vehicle ownership a database invariant, not just an application check. A vehicle with existing bookings cannot be deleted because the composite booking FK uses `ON DELETE RESTRICT`.

## Key design decisions

### 1. Preventing double-booking (database-enforced, not app-enforced)

A slot must never have two overlapping bookings. This is enforced with a
PostgreSQL **exclusion constraint**:

```sql
EXCLUDE USING gist (
  slot_id WITH =,
  tstzrange(start_time, end_time, '[)') WITH &&
) WHERE (status IN ('PENDING','CONFIRMED','ACTIVE'))
```

- `tstzrange(start_time, end_time, '[)')` is a **half-open interval** —
  inclusive of the start, exclusive of the end. So `10:00–12:00` and
  `12:00–14:00` do **not** overlap (one ends exactly when the other
  starts), but `10:00–12:00` and `11:00–13:00` **do** overlap and are
  rejected — matching the brief's example exactly.
- The `WHERE` clause makes it a **partial** exclusion constraint: only
  `PENDING`/`CONFIRMED`/`ACTIVE` bookings block new ones. A `CANCELLED` or
  `EXPIRED` booking frees up that time slot again.
- Because this lives in the database and runs inside the same transaction
  as the `INSERT`, two simultaneous booking requests for the same
  slot/time **cannot both succeed** — the second one fails with a
  constraint-violation error. Application-level checks (e.g. "check then
  insert" in Node.js) have a race condition between the check and the
  insert; a database constraint doesn't.

### 2. Historical price snapshot

`parking_slots.price_per_hour` can change any time a partner edits
pricing. To keep past bookings/receipts accurate:

- `bookings.price_per_hour_snapshot` copies the slot's price **at the
  moment of booking** and is never updated afterwards.
- `booking_services.price_at_booking` does the same for add-on services.
- `bookings.total_amount` is computed once by the application from those
  snapshots (duration × price + service add-ons) and stored, so
  historical receipts/analytics never silently change if today's prices
  (or even AI-recommended prices, later) change.

### 3. GPS / location readiness — plain lat/lng, not PostGIS (yet)

`parking_locations.latitude` / `longitude` are stored as `NUMERIC(9,6)`
with a composite B-tree index. This is enough for Phase 1's scale:
"nearby search" does a cheap bounding-box filter (using the index) and
then ranks by exact Haversine distance in the query itself (see
`queries.sql #3`).

**Why not PostGIS now:** PostGIS adds real geospatial indexing
(`geography`/`geometry` types, true nearest-neighbor `<->` queries) but
is extra infrastructure that only pays off once Parkkar has a large
number of locations per city and needs sub-second nearest-neighbor
search at scale. Introducing it now would be over-engineering for an
MVP. The column types chosen today (`NUMERIC` lat/lng) can be migrated to
PostGIS `geography` columns later without touching any other table.

### 4. AI / analytics readiness

Nothing here is deleted or overwritten in ways that would destroy
history: every booking keeps its `start_time`, `end_time`, `status`,
`price_per_hour_snapshot`, and location/slot reference forever (rows are
never hard-deleted, only status-transitioned to `CANCELLED`/`EXPIRED`/
`COMPLETED`). That's exactly the raw material Phase 5 (AI demand
prediction, dynamic pricing, smart recommendation) will query against —
no schema change needed to start building those models later.

### 5. Time zones

All timestamps use `TIMESTAMPTZ` (timestamp with time zone), which
Postgres always stores internally in UTC and converts on the way in/out.
For Parkkar's current India-only scope this mostly means "don't use naive
timestamps" — IST is a single fixed offset so a per-location timezone
column isn't needed yet. If Parkkar expands outside India in the future,
add a `timezone` column (IANA name, e.g. `Asia/Kolkata`) to
`parking_locations` at that point — `TIMESTAMPTZ` columns don't need to
change, only how the app formats them for display.

### 6. Normalization vs. intentional snapshots

The schema is normalized (no repeated/duplicated data) **except** for two
deliberate snapshots explained above (`price_per_hour_snapshot`,
`price_at_booking`) — these aren't denormalization mistakes, they're
required for correct historical records, so they're called out here
explicitly.

## Future-feature readiness (no redesign needed later)

| Future feature | How today's schema supports it |
|---|---|
| AI Smart Slot Recommendation / Demand Prediction / Dynamic Pricing | Reads existing `bookings` + `parking_slots` history — no new tables |
| Google Maps integration | `latitude`/`longitude` already stored |
| Razorpay integration | `payments.transaction_ref`/`method` already shaped for a gateway response |
| QR-based verification | Can be generated from `bookings.id` at request time — no new column needed |
| Number Plate OCR | `vehicles.plate_number` is already globally unique, ready to be looked up from an OCR read |
| FASTag auto entry/exit | Would reuse `vehicles` + `bookings`; deferred entirely (pending NHAI/IHMCL partnership, as discussed) |
| EV charging / car cleaning / valet | Already modeled generically via `parking_services` + `booking_services` |
| Multi-city expansion | `city`/`state` already on `parking_locations`; no structural change needed |
| Parkkar Pass / subscription | Would add one new `subscriptions` table later (user_id, plan, valid_until) — deliberately not built now since no requirements exist yet to design it correctly |

## How Phase 2 (Backend) will use this database

- Connect via `pg` (node-postgres) or an ORM (Prisma/Sequelize) — the
  schema is plain relational SQL, compatible with either.
- **Signup/login:** hash passwords with bcrypt before inserting into
  `users.password_hash`; issue a JWT containing `id` and `role` after
  login; use `role` for route-level authorization (`USER`/`PARTNER`/
  `ADMIN`).
- **Search:** Phase 2's "nearby parking" endpoint runs `queries.sql #3`
  with the user's GPS coordinates from the frontend.
- **Booking creation:** Phase 2 should attempt the `INSERT INTO bookings`
  directly and catch the exclusion-constraint error (Postgres error code
  `23P01`) to return a friendly "slot no longer available" response,
  rather than pre-checking availability and hoping nothing books it in
  between (see design decision #1).
- **Payments:** Phase 2 will call Razorpay, then insert/update a
  `payments` row with the real `transaction_ref` and `status` once the
  gateway confirms.
- All money fields are `NUMERIC`, not `FLOAT` — Phase 2 should keep
  amounts as strings/decimals in JS (not native floats) to avoid
  rounding errors when reading them back out.
