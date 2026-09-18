-- ============================================================================
-- PARKKAR — PHASE 1 DATABASE SCHEMA
-- Target: PostgreSQL 14+
-- ============================================================================
-- This file creates the full relational foundation for Parkkar:
-- users, vehicles, parking_locations, parking_slots, bookings, payments,
-- reviews, favorites, parking_services, booking_services.
--
-- Run order: this file first, then seeds/seed.sql.
-- ============================================================================

-- Needed for the GiST-based overlap-prevention constraint on bookings
-- (lets a GiST index mix a plain equality column with a range column).
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================================================
-- 1. ENUM TYPES
-- ============================================================================
-- ENUMs are used (instead of a lookup table) for small, rarely-changing
-- vocabularies. Trade-off: adding a new value later needs ALTER TYPE ... ADD
-- VALUE (cheap, non-blocking in PG 12+), but you lose the ability to attach
-- extra metadata to a status (e.g. a description) the way a lookup table
-- would allow. For a fixed, well-understood set of statuses like these,
-- ENUMs are simpler and faster to query/index than a joined lookup table.

CREATE TYPE user_role        AS ENUM ('USER', 'PARTNER', 'ADMIN');
CREATE TYPE account_status   AS ENUM ('ACTIVE', 'SUSPENDED', 'DEACTIVATED');

CREATE TYPE property_type    AS ENUM ('HOTEL', 'MALL', 'COMMERCIAL_BUILDING', 'BANQUET_HALL', 'OTHER');
CREATE TYPE location_status  AS ENUM ('PENDING_APPROVAL', 'ACTIVE', 'INACTIVE');

CREATE TYPE slot_type        AS ENUM ('CAR', 'BIKE', 'EV', 'ACCESSIBLE', 'OTHER');
CREATE TYPE slot_status      AS ENUM ('ACTIVE', 'MAINTENANCE', 'DISABLED');

CREATE TYPE vehicle_type     AS ENUM ('CAR', 'BIKE', 'EV', 'OTHER');

-- Booking lifecycle:
--   PENDING   -> created, payment not yet confirmed
--   CONFIRMED -> payment successful, booking holds the slot for the future
--   ACTIVE    -> current time is within [start_time, end_time) i.e. vehicle is parked
--   COMPLETED -> end_time has passed normally
--   CANCELLED -> user/partner/admin cancelled before completion
--   EXPIRED   -> was never confirmed (e.g. payment failed) and start_time passed
CREATE TYPE booking_status   AS ENUM ('PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- PARTIALLY_REFUNDED added beyond the brief's 4 values because partial
-- cancellations (e.g. late cancellation fee retained) are a realistic
-- Parkkar scenario and are cleanly distinguishable from a full REFUNDED.
CREATE TYPE payment_status   AS ENUM ('PENDING', 'PAID', 'FAILED', 'PARTIALLY_REFUNDED', 'REFUNDED');
CREATE TYPE payment_method   AS ENUM ('CARD', 'UPI', 'NETBANKING', 'WALLET', 'OTHER');
CREATE TYPE refund_status    AS ENUM ('NONE', 'REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED');
CREATE TYPE cancelled_by_type AS ENUM ('USER', 'PARTNER', 'ADMIN', 'SYSTEM');

-- ============================================================================
-- 2. GENERIC updated_at TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. USERS
-- ============================================================================
-- Single table for all three roles (USER / PARTNER / ADMIN) rather than
-- separate tables per role. A partner is simply a user whose role is
-- PARTNER and who owns rows in parking_locations — this keeps auth,
-- login, and password-reset logic identical for everyone, and avoids
-- duplicating name/email/phone/password columns across three tables.
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(120) NOT NULL,
    email           VARCHAR(160) NOT NULL,
    phone           VARCHAR(20)  NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,          -- bcrypt hash only, never plain text
    role            user_role NOT NULL DEFAULT 'USER',
    account_status  account_status NOT NULL DEFAULT 'ACTIVE',
    commission_rate_percent NUMERIC(5,2),
    CONSTRAINT chk_partner_commission_rate CHECK (
      (role = 'PARTNER' AND commission_rate_percent BETWEEN 0 AND 100)
      OR (role <> 'PARTNER' AND commission_rate_percent IS NULL)
    ),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT uq_users_phone UNIQUE (phone)
);

CREATE INDEX idx_users_role ON users(role);
-- Rationale: Phase 2 will frequently query "all partners" (for admin
-- screens) and "is this user an admin" (for auth middleware).

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- 4. VEHICLES
-- ============================================================================
-- A user may register multiple vehicles. plate_number is globally UNIQUE
-- (not per-user) because in the real world a registration plate identifies
-- exactly one physical vehicle — two different Parkkar accounts should not
-- be able to register the same plate. This also directly supports the
-- future Number-Plate-OCR feature: OCR reads a plate and looks it up
-- globally to find the matching booking, so the plate must be unique.
CREATE TABLE vehicles (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vehicle_type    vehicle_type NOT NULL DEFAULT 'CAR',
    plate_number    VARCHAR(20) NOT NULL,
    make            VARCHAR(60),
    model           VARCHAR(60),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_vehicles_plate UNIQUE (plate_number),
    CONSTRAINT uq_vehicles_id_user UNIQUE (id, user_id)
);

CREATE INDEX idx_vehicles_user ON vehicles(user_id);

CREATE TRIGGER trg_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- 5. PARKING_LOCATIONS
-- ============================================================================
-- commission_rate_percent belongs to the PARTNER user, not the parking
-- location. A partner can own multiple locations and should have one
-- commission rate across them unless a future requirement explicitly
-- introduces location-specific overrides.
CREATE TABLE parking_locations (
    id                       BIGSERIAL PRIMARY KEY,
    partner_id               BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    name                     VARCHAR(150) NOT NULL,
    property_type            property_type NOT NULL,
    address                  VARCHAR(255) NOT NULL,
    city                     VARCHAR(80)  NOT NULL,
    state                    VARCHAR(80)  NOT NULL,
    postal_code              VARCHAR(12)  NOT NULL,
    latitude                 NUMERIC(9,6) NOT NULL,
    longitude                NUMERIC(9,6) NOT NULL,
    description               TEXT,
    contact_phone            VARCHAR(20),
    status                   location_status NOT NULL DEFAULT 'PENDING_APPROVAL',
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_latitude        CHECK (latitude  BETWEEN -90 AND 90),
    CONSTRAINT chk_longitude       CHECK (longitude BETWEEN -180 AND 180)
);

-- ON DELETE RESTRICT on partner_id: a partner account must not be
-- deletable while it still owns listings — the application should force
-- de-listing or reassignment first. This protects historical bookings
-- from ever pointing at a vanished owner.

CREATE OR REPLACE FUNCTION check_partner_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = NEW.partner_id
      AND role = 'PARTNER'
      AND account_status <> 'DEACTIVATED'
  ) THEN
    RAISE EXCEPTION 'partner_id % must reference an active PARTNER user', NEW.partner_id
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_locations_partner_role
  BEFORE INSERT OR UPDATE OF partner_id ON parking_locations
  FOR EACH ROW EXECUTE FUNCTION check_partner_role();

CREATE INDEX idx_locations_partner   ON parking_locations(partner_id);
CREATE INDEX idx_locations_city      ON parking_locations(city);
CREATE INDEX idx_locations_lat_lng   ON parking_locations(latitude, longitude);
-- Rationale: "find nearby parking" filters by a lat/lng bounding box before
-- ranking by exact distance (see queries.sql #3). A plain composite B-tree
-- index accelerates that bounding-box filter. It is NOT a true geospatial
-- index — see README "GPS / Location Readiness" for why PostGIS is
-- deliberately deferred to a future phase.

CREATE TRIGGER trg_locations_updated_at
  BEFORE UPDATE ON parking_locations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- 6. PARKING_SLOTS
-- ============================================================================
-- Deliberately NO "is_booked" boolean here (see brief, section 10).
-- A slot's booked/free status always depends on a requested time window,
-- which can only be answered by checking the bookings table for overlaps
-- (see queries.sql #4 and #12). Storing a boolean would immediately go
-- stale the moment a booking ends, and cannot represent "free 2-4pm but
-- booked 4-6pm" at all.
CREATE TABLE parking_slots (
    id              BIGSERIAL PRIMARY KEY,
    location_id     BIGINT NOT NULL REFERENCES parking_locations(id) ON DELETE CASCADE,
    slot_code       VARCHAR(20) NOT NULL,          -- e.g. "A1", "B12" — partner-facing label
    slot_type       slot_type NOT NULL DEFAULT 'CAR',
    status          slot_status NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE/MAINTENANCE/DISABLED = is this slot offered at all right now
    price_per_hour  NUMERIC(8,2) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_slot_code_per_location UNIQUE (location_id, slot_code),
    CONSTRAINT chk_price_positive CHECK (price_per_hour > 0)
);

CREATE INDEX idx_slots_location ON parking_slots(location_id);

CREATE TRIGGER trg_slots_updated_at
  BEFORE UPDATE ON parking_slots
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- 7. BOOKINGS  (the core of Parkkar)
-- ============================================================================
CREATE TABLE bookings (
    id                        BIGSERIAL PRIMARY KEY,
    user_id                   BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    slot_id                   BIGINT NOT NULL REFERENCES parking_slots(id) ON DELETE RESTRICT,
    vehicle_id                BIGINT,
    start_time                TIMESTAMPTZ NOT NULL,
    end_time                  TIMESTAMPTZ NOT NULL,
    status                    booking_status NOT NULL DEFAULT 'PENDING',

    -- Historical price snapshot (see README "Historical Pricing"):
    -- copied from parking_slots.price_per_hour at booking time and never
    -- updated afterwards, so a partner changing prices later cannot alter
    -- what a past booking is recorded as having cost.
    price_per_hour_snapshot   NUMERIC(8,2) NOT NULL,
    total_amount              NUMERIC(10,2) NOT NULL,   -- computed by the app: duration * snapshot + service add-ons

    cancelled_at              TIMESTAMPTZ,
    cancelled_by              cancelled_by_type,
    cancellation_reason       VARCHAR(255),

    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_bookings_vehicle_owner
      FOREIGN KEY (vehicle_id, user_id)
      REFERENCES vehicles(id, user_id)
      ON DELETE RESTRICT,
    CONSTRAINT chk_time_order          CHECK (end_time > start_time),
    CONSTRAINT chk_total_amount_valid  CHECK (total_amount >= 0),
    CONSTRAINT chk_cancel_fields_together CHECK (
        (status = 'CANCELLED' AND cancelled_at IS NOT NULL AND cancelled_by IS NOT NULL)
        OR (status <> 'CANCELLED')
    )
);

-- ----------------------------------------------------------------------------
-- DOUBLE-BOOKING PREVENTION — enforced by the database, not just the app.
-- ----------------------------------------------------------------------------
-- tstzrange(start_time, end_time, '[)') creates a half-open interval:
-- inclusive of start_time, exclusive of end_time. Two bookings 10:00–12:00
-- and 12:00–14:00 therefore do NOT overlap (the first ends exactly where
-- the second begins), matching the brief's example. 10:00–12:00 and
-- 11:00–13:00 DO overlap and are rejected.
--
-- The EXCLUDE constraint only applies to bookings in PENDING/CONFIRMED/
-- ACTIVE status (via the WHERE clause) — a CANCELLED or EXPIRED booking
-- must not block a new booking for the same time window. This runs
-- inside the same transaction as the INSERT, so even two simultaneous
-- booking requests for the same slot/time cannot both succeed — the
-- second one gets a constraint-violation error at the database level,
-- which is stronger than any amount of application-level checking.
ALTER TABLE bookings
  ADD CONSTRAINT excl_bookings_no_overlap
  EXCLUDE USING gist (
    slot_id WITH =,
    tstzrange(start_time, end_time, '[)') WITH &&
  )
  WHERE (status IN ('PENDING', 'CONFIRMED', 'ACTIVE'));

CREATE INDEX idx_bookings_user       ON bookings(user_id);
CREATE INDEX idx_bookings_status     ON bookings(status);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
-- Note: idx_bookings_slot is not created separately — the GiST index
-- backing excl_bookings_no_overlap already indexes (slot_id, time range)
-- together and Postgres can use it for slot-based availability lookups.

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- 8. PAYMENTS
-- ============================================================================
-- One booking can have MORE THAN ONE payment row over time (a failed
-- attempt followed by a successful one), so booking_id is indexed but not
-- unique. Razorpay (or any gateway) is NOT integrated in Phase 1 — this
-- table only stores the shape needed for Phase 4 to plug into later.
CREATE TABLE payments (
    id               BIGSERIAL PRIMARY KEY,
    booking_id       BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount           NUMERIC(10,2) NOT NULL,
    status           payment_status NOT NULL DEFAULT 'PENDING',
    method           payment_method,
    transaction_ref  VARCHAR(100),          -- gateway's transaction id, NOT a card/account number
    paid_at          TIMESTAMPTZ,
    refund_status    refund_status NOT NULL DEFAULT 'NONE',
    refund_amount    NUMERIC(10,2),
    refunded_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_amount_valid   CHECK (amount >= 0),
    CONSTRAINT chk_refund_valid   CHECK (refund_amount IS NULL OR refund_amount <= amount)
);

CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE UNIQUE INDEX uq_payments_txn_ref ON payments(transaction_ref) WHERE transaction_ref IS NOT NULL;
CREATE UNIQUE INDEX uq_one_paid_payment_per_booking
ON payments(booking_id)
WHERE status = 'PAID';
-- Partial unique index: NULL transaction_ref is allowed for PENDING
-- payments not yet sent to a gateway, but once a real gateway reference
-- exists it must be unique (prevents accidental double-processing).

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- 9. REVIEWS
-- ============================================================================
-- One review per (user, location): a user can update their existing
-- review instead of stacking multiple reviews for the same place. This
-- mirrors how Google/Amazon-style review systems behave and keeps the
-- average-rating calculation simple and not gameable by review-spamming.
CREATE TABLE reviews (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location_id   BIGINT NOT NULL REFERENCES parking_locations(id) ON DELETE CASCADE,
    rating        SMALLINT NOT NULL,
    review_text   TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_rating_range CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT uq_review_user_location UNIQUE (user_id, location_id)
);

CREATE INDEX idx_reviews_location ON reviews(location_id);

CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- 10. FAVORITES
-- ============================================================================
CREATE TABLE favorites (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location_id   BIGINT NOT NULL REFERENCES parking_locations(id) ON DELETE CASCADE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_favorite_user_location UNIQUE (user_id, location_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);

-- ============================================================================
-- 11. PARKING_SERVICES  (catalog: car cleaning, EV charging, valet, ...)
-- ============================================================================
CREATE TABLE parking_services (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    description   VARCHAR(255),
    price         NUMERIC(8,2) NOT NULL,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_service_price_valid CHECK (price >= 0)
);

CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON parking_services
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- 12. BOOKING_SERVICES  (junction: which add-ons were bought with a booking)
-- ============================================================================
-- price_at_booking preserves the service price at purchase time, for the
-- same reason bookings.price_per_hour_snapshot does — parking_services.price
-- may change later without rewriting historical transactions.
CREATE TABLE booking_services (
    id                BIGSERIAL PRIMARY KEY,
    booking_id        BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    service_id        BIGINT NOT NULL REFERENCES parking_services(id) ON DELETE RESTRICT,
    quantity          SMALLINT NOT NULL DEFAULT 1,
    price_at_booking  NUMERIC(8,2) NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_quantity_positive CHECK (quantity > 0)
);

CREATE INDEX idx_booking_services_booking ON booking_services(booking_id);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
