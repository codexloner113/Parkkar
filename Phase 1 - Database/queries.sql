-- ============================================================================
-- PARKKAR — PHASE 1 REQUIRED QUERIES
-- These match schema/schema.sql exactly and run cleanly against
-- seeds/seed.sql. Placeholders like :user_id are psql-style variables —
-- replace them with real values (or bind params in Phase 2's backend code).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1 & 2. Create schema / insert seed data
-- ----------------------------------------------------------------------------
-- See schema/schema.sql and seeds/seed.sql. Run in that order:
--   psql -d parkkar -f database/schema/schema.sql
--   psql -d parkkar -f database/seeds/seed.sql

-- ----------------------------------------------------------------------------
-- 3. Find parking locations near a given latitude/longitude
-- ----------------------------------------------------------------------------
-- Two-step approach: a cheap bounding-box filter first (uses
-- idx_locations_lat_lng), then an exact Haversine distance calculation for
-- ranking. Good enough for Phase 1's scale; see README for when to move to
-- PostGIS.
SELECT
    pl.id,
    pl.name,
    pl.city,
    pl.latitude,
    pl.longitude,
    ROUND(
      ( 6371 * acos(
          cos(radians(:user_lat)) * cos(radians(pl.latitude)) *
          cos(radians(pl.longitude) - radians(:user_lng)) +
          sin(radians(:user_lat)) * sin(radians(pl.latitude))
        )
      )::numeric, 2
    ) AS distance_km
FROM parking_locations pl
WHERE pl.status = 'ACTIVE'
  AND pl.latitude  BETWEEN :user_lat - 0.1 AND :user_lat + 0.1   -- ~11km box, cheap pre-filter
  AND pl.longitude BETWEEN :user_lng - 0.1 AND :user_lng + 0.1
ORDER BY distance_km ASC
LIMIT 20;

-- ----------------------------------------------------------------------------
-- 4. Find available slots for a requested start/end time at a location
-- ----------------------------------------------------------------------------
SELECT ps.id, ps.slot_code, ps.slot_type, ps.price_per_hour
FROM parking_slots ps
WHERE ps.location_id = :location_id
  AND ps.status = 'ACTIVE'
  AND NOT EXISTS (
        SELECT 1
        FROM bookings b
        WHERE b.slot_id = ps.id
          AND b.status IN ('PENDING', 'CONFIRMED', 'ACTIVE')
          AND tstzrange(b.start_time, b.end_time, '[)')
              && tstzrange(:req_start::timestamptz, :req_end::timestamptz, '[)')
      )
ORDER BY ps.price_per_hour ASC;

-- ----------------------------------------------------------------------------
-- 5. Find a user's booking history
-- ----------------------------------------------------------------------------
SELECT
    b.id AS booking_id,
    pl.name AS location_name,
    ps.slot_code,
    b.start_time,
    b.end_time,
    b.status,
    b.total_amount
FROM bookings b
JOIN parking_slots ps     ON ps.id = b.slot_id
JOIN parking_locations pl ON pl.id = ps.location_id
WHERE b.user_id = :user_id
ORDER BY b.start_time DESC;

-- ----------------------------------------------------------------------------
-- 6. Find upcoming bookings for a user
-- ----------------------------------------------------------------------------
SELECT b.id AS booking_id, pl.name AS location_name, ps.slot_code, b.start_time, b.end_time, b.status
FROM bookings b
JOIN parking_slots ps     ON ps.id = b.slot_id
JOIN parking_locations pl ON pl.id = ps.location_id
WHERE b.user_id = :user_id
  AND b.status IN ('PENDING', 'CONFIRMED')
  AND b.start_time > now()
ORDER BY b.start_time ASC;

-- ----------------------------------------------------------------------------
-- 7. Find a partner's bookings (across all of their locations)
-- ----------------------------------------------------------------------------
SELECT
    b.id AS booking_id,
    pl.name AS location_name,
    ps.slot_code,
    u.name AS customer_name,
    b.start_time,
    b.end_time,
    b.status,
    b.total_amount
FROM bookings b
JOIN parking_slots ps     ON ps.id = b.slot_id
JOIN parking_locations pl ON pl.id = ps.location_id
JOIN users u               ON u.id = b.user_id
WHERE pl.partner_id = :partner_id
ORDER BY b.start_time DESC;

-- ----------------------------------------------------------------------------
-- 8. Calculate partner revenue (net, after commission) for a date range
-- ----------------------------------------------------------------------------
SELECT
    pl.partner_id,
    SUM(pay.amount) AS gross_revenue,
    ROUND(SUM(pay.amount * (1 - u.commission_rate_percent / 100.0))::numeric, 2) AS partner_net_revenue
FROM payments pay
JOIN bookings b        ON b.id = pay.booking_id
JOIN parking_slots ps  ON ps.id = b.slot_id
JOIN parking_locations pl ON pl.id = ps.location_id
JOIN users u            ON u.id = pl.partner_id
WHERE pay.status = 'PAID'
  AND pl.partner_id = :partner_id
  AND pay.paid_at BETWEEN :range_start::timestamptz AND :range_end::timestamptz
GROUP BY pl.partner_id;

-- ----------------------------------------------------------------------------
-- 9. Calculate platform commission earned in a date range (all partners)
-- ----------------------------------------------------------------------------
SELECT
    ROUND(SUM(pay.amount * (u.commission_rate_percent / 100.0))::numeric, 2) AS platform_commission
FROM payments pay
JOIN bookings b        ON b.id = pay.booking_id
JOIN parking_slots ps  ON ps.id = b.slot_id
JOIN parking_locations pl ON pl.id = ps.location_id
JOIN users u            ON u.id = pl.partner_id
WHERE pay.status = 'PAID'
  AND pay.paid_at BETWEEN :range_start::timestamptz AND :range_end::timestamptz;

-- ----------------------------------------------------------------------------
-- 10. Calculate parking occupancy for a location over a period
-- ----------------------------------------------------------------------------
-- occupancy% = booked slot-hours / (total active slots * period length in hours)
WITH slot_count AS (
    SELECT COUNT(*) AS total_slots
    FROM parking_slots
    WHERE location_id = :location_id AND status = 'ACTIVE'
),
booked_hours AS (
    SELECT COALESCE(SUM(
        EXTRACT(EPOCH FROM (
          LEAST(b.end_time, :period_end::timestamptz) - GREATEST(b.start_time, :period_start::timestamptz)
        )) / 3600.0
    ), 0) AS hours
    FROM bookings b
    JOIN parking_slots ps ON ps.id = b.slot_id
    WHERE ps.location_id = :location_id
      AND b.status IN ('CONFIRMED', 'ACTIVE', 'COMPLETED')
      AND b.start_time < :period_end::timestamptz
      AND b.end_time   > :period_start::timestamptz
)
SELECT
    bh.hours AS booked_slot_hours,
    sc.total_slots * (EXTRACT(EPOCH FROM (:period_end::timestamptz - :period_start::timestamptz)) / 3600.0) AS available_slot_hours,
    ROUND(
      (bh.hours / NULLIF(sc.total_slots * (EXTRACT(EPOCH FROM (:period_end::timestamptz - :period_start::timestamptz)) / 3600.0), 0)) * 100
    , 2) AS occupancy_percent
FROM slot_count sc, booked_hours bh;

-- ----------------------------------------------------------------------------
-- 11. Find peak booking hours (system-wide, by hour of day)
-- ----------------------------------------------------------------------------
SELECT
    EXTRACT(HOUR FROM start_time) AS hour_of_day,
    COUNT(*) AS bookings_count
FROM bookings
WHERE status IN ('CONFIRMED', 'ACTIVE', 'COMPLETED')
GROUP BY hour_of_day
ORDER BY bookings_count DESC;

-- ----------------------------------------------------------------------------
-- 12. Validate whether a specific slot can be booked for a time window
-- ----------------------------------------------------------------------------
SELECT NOT EXISTS (
    SELECT 1
    FROM bookings b
    WHERE b.slot_id = :slot_id
      AND b.status IN ('PENDING', 'CONFIRMED', 'ACTIVE')
      AND tstzrange(b.start_time, b.end_time, '[)')
          && tstzrange(:req_start::timestamptz, :req_end::timestamptz, '[)')
) AS slot_is_available;

-- ----------------------------------------------------------------------------
-- 13. Find a user's favorite parking locations
-- ----------------------------------------------------------------------------
SELECT pl.id, pl.name, pl.city, pl.property_type
FROM favorites f
JOIN parking_locations pl ON pl.id = f.location_id
WHERE f.user_id = :user_id
ORDER BY f.created_at DESC;

-- ----------------------------------------------------------------------------
-- 14. Find highly rated parking locations
-- ----------------------------------------------------------------------------
SELECT
    pl.id,
    pl.name,
    ROUND(AVG(r.rating)::numeric, 2) AS avg_rating,
    COUNT(r.id) AS review_count
FROM parking_locations pl
JOIN reviews r ON r.location_id = pl.id
GROUP BY pl.id, pl.name
HAVING AVG(r.rating) >= 4
ORDER BY avg_rating DESC, review_count DESC;

-- ----------------------------------------------------------------------------
-- 15. Find bookings that included a specific add-on service
-- ----------------------------------------------------------------------------
SELECT
    b.id AS booking_id,
    u.name AS customer_name,
    pl.name AS location_name,
    bs.price_at_booking
FROM booking_services bs
JOIN bookings b            ON b.id = bs.booking_id
JOIN parking_services psvc ON psvc.id = bs.service_id
JOIN users u                ON u.id = b.user_id
JOIN parking_slots ps      ON ps.id = b.slot_id
JOIN parking_locations pl  ON pl.id = ps.location_id
WHERE psvc.name = :service_name;

-- ============================================================================
-- END OF QUERIES
-- ============================================================================
