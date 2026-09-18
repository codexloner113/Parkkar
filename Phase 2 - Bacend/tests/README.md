# Tests

These are integration-style tests using Node's built-in `node:test` runner
(no extra devDependency needed) and Node's built-in `http` client against a
running instance of the app, pointed at a real (test) Postgres database
that already has `schema.sql` + `seed.sql` applied.

## Running

```bash
# 1. Create a throwaway test database and load Phase 1 into it
createdb parkkar_test
psql -d parkkar_test -f ../database/schema/schema.sql
psql -d parkkar_test -f ../database/seeds/seed.sql

# 2. Point the backend at it and run the tests
DATABASE_URL=postgres://user:password@localhost:5432/parkkar_test \
JWT_SECRET=test-secret \
npm test
```

Tests are intentionally NOT run as part of this sandbox response, because
this environment has no network access and cannot install `pg`/`express`/
`zod`/etc., let alone run a real PostgreSQL server. They are written to run
against your own Postgres instance once you `npm install`.

## Test files

- `auth.test.js` — register → login → me happy path.
- `authorization.test.js` — role/ownership checks (admin routes, another
  user's vehicle).
- `booking-conflict.test.js` — the required overlapping-booking
  demonstration (201, then 409 `BOOKING_CONFLICT`), driven by the
  database's `excl_bookings_no_overlap` EXCLUDE constraint.
- `vehicle-ownership.test.js` — the schema's composite FK,
  `bookings(vehicle_id, user_id) -> vehicles(id, user_id)`: booking with
  someone else's vehicle (403 `VEHICLE_NOT_OWNED`) and deleting a vehicle
  that has a booking (409 `VEHICLE_HAS_BOOKINGS`, from `ON DELETE
  RESTRICT`).
