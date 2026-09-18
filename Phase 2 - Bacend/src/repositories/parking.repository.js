import { query } from '../config/db.js';

// ---------------------------------------------------------------------------
// Locations
// ---------------------------------------------------------------------------

export async function createLocation({
  partnerId, name, propertyType, address, city, state, postalCode,
  latitude, longitude, description, contactPhone,
}) {
  const { rows } = await query(
    `INSERT INTO parking_locations
       (partner_id, name, property_type, address, city, state, postal_code,
        latitude, longitude, description, contact_phone)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [partnerId, name, propertyType, address, city, state, postalCode, latitude, longitude, description, contactPhone]
  );
  return rows[0];
}

export async function findLocationById(id) {
  const { rows } = await query('SELECT * FROM parking_locations WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function listLocationsByPartner(partnerId) {
  const { rows } = await query(
    'SELECT * FROM parking_locations WHERE partner_id = $1 ORDER BY created_at DESC',
    [partnerId]
  );
  return rows;
}

export async function updateLocation(id, fields) {
  const {
    name, propertyType, address, city, state, postalCode,
    latitude, longitude, description, contactPhone, status,
  } = fields;
  const { rows } = await query(
    `UPDATE parking_locations SET
       name          = COALESCE($2, name),
       property_type = COALESCE($3, property_type),
       address       = COALESCE($4, address),
       city          = COALESCE($5, city),
       state         = COALESCE($6, state),
       postal_code   = COALESCE($7, postal_code),
       latitude      = COALESCE($8, latitude),
       longitude     = COALESCE($9, longitude),
       description   = COALESCE($10, description),
       contact_phone = COALESCE($11, contact_phone),
       status        = COALESCE($12, status)
     WHERE id = $1
     RETURNING *`,
    [id, name, propertyType, address, city, state, postalCode, latitude, longitude, description, contactPhone, status]
  );
  return rows[0] || null;
}

export async function deleteLocation(id) {
  // parking_slots -> parking_locations is ON DELETE CASCADE, but bookings
  // reference slots with ON DELETE RESTRICT, so this will correctly fail
  // (23503) if any booking history exists for this location's slots —
  // exactly the "don't destroy booking history" rule from Phase 1.
  const { rowCount } = await query('DELETE FROM parking_locations WHERE id = $1', [id]);
  return rowCount > 0;
}

export async function isOwnedByPartner(locationId, partnerId) {
  const { rows } = await query(
    'SELECT 1 FROM parking_locations WHERE id = $1 AND partner_id = $2',
    [locationId, partnerId]
  );
  return rows.length > 0;
}

/** Public search with optional filters. Joins in avg rating for display. */
export async function searchLocations({ city, propertyType, minPrice, maxPrice, slotType, status, includeAllStatuses = false, limit, offset }) {
  const conditions = ['1=1'];
const params = [];
let i = 1;

if (includeAllStatuses) {
  if (status) {
    params.push(status);
    conditions.push(`pl.status = $${i++}::location_status`);
  }
} else {
  conditions.push(`pl.status = 'ACTIVE'`);
}

  if (city) {
    params.push(city);
    conditions.push(`pl.city ILIKE $${i++}`);
  }
  if (propertyType) {
    params.push(propertyType);
    conditions.push(`pl.property_type = $${i++}`);
  }

  // Use EXISTS for slot filters instead of joining parking_slots. A JOIN can
  // produce duplicate parking_location rows, which previously forced SELECT
  // DISTINCT and then conflicted with ORDER BY pl.created_at in PostgreSQL.
  if (minPrice != null || maxPrice != null || slotType) {
    const slotConditions = [`ps_f.location_id = pl.id`, `ps_f.status = 'ACTIVE'`];
    if (minPrice != null) {
      params.push(minPrice);
      slotConditions.push(`ps_f.price_per_hour >= $${i++}`);
    }
    if (maxPrice != null) {
      params.push(maxPrice);
      slotConditions.push(`ps_f.price_per_hour <= $${i++}`);
    }
    if (slotType) {
      params.push(slotType);
      slotConditions.push(`ps_f.slot_type = $${i++}`);
    }
    conditions.push(`EXISTS (SELECT 1 FROM parking_slots ps_f WHERE ${slotConditions.join(' AND ')})`);
  }


  params.push(limit, offset);
  const sql = `
    SELECT
      pl.id, pl.name, pl.property_type, pl.address, pl.city, pl.state,
      pl.latitude, pl.longitude, pl.description, pl.status,
      (SELECT MIN(price_per_hour) FROM parking_slots WHERE location_id = pl.id AND status = 'ACTIVE') AS min_price_per_hour,
      (SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE location_id = pl.id) AS avg_rating,
      (SELECT COUNT(*)::int FROM reviews WHERE location_id = pl.id) AS review_count
    FROM parking_locations pl
    WHERE ${conditions.join(' AND ')}
    ORDER BY pl.created_at DESC
    LIMIT $${i++} OFFSET $${i++}
  `;
  const { rows } = await query(sql, params);
  return rows;
}
export async function updateLocationStatus(id, status) {
  const { rows } = await query(
    `UPDATE parking_locations
     SET status = $2
     WHERE id = $1
     RETURNING *`,
    [id, status]
  );
  return rows[0] || null;
}
export async function countLocations({
  city,
  propertyType,
  minPrice,
  maxPrice,
  slotType,
  status,
  includeAllStatuses = false,
}) {
  const conditions = ['1=1'];
  const params = [];
  let i = 1;

  if (includeAllStatuses) {
    if (status) {
      params.push(status);
      conditions.push(`pl.status = $${i++}::location_status`);
    }
  } else {
    conditions.push(`pl.status = 'ACTIVE'`);
  }

  if (city) {
    params.push(city);
    conditions.push(`pl.city ILIKE $${i++}`);
  }

  if (propertyType) {
    params.push(propertyType);
    conditions.push(`pl.property_type = $${i++}`);
  }

  if (minPrice != null || maxPrice != null || slotType) {
    const slotConditions = [
      `ps_f.location_id = pl.id`,
      `ps_f.status = 'ACTIVE'`,
    ];

    if (minPrice != null) {
      params.push(minPrice);
      slotConditions.push(`ps_f.price_per_hour >= $${i++}`);
    }

    if (maxPrice != null) {
      params.push(maxPrice);
      slotConditions.push(`ps_f.price_per_hour <= $${i++}`);
    }

    if (slotType) {
      params.push(slotType);
      slotConditions.push(`ps_f.slot_type = $${i++}`);
    }

    conditions.push(
      `EXISTS (
        SELECT 1
        FROM parking_slots ps_f
        WHERE ${slotConditions.join(' AND ')}
      )`
    );
  }

  const { rows } = await query(
    `SELECT COUNT(*)::int AS total
     FROM parking_locations pl
     WHERE ${conditions.join(' AND ')}`,
    params
  );

  return rows[0].total;
}

/** Bounding-box + exact Haversine ranking — mirrors queries.sql #3 exactly. */
export async function searchNearby({ lat, lng, radiusKm, limit }) {
  const box = radiusKm / 111; // ~111km per degree latitude, same approximation style as Phase 1's fixed 0.1 box
  const { rows } = await query(
    `SELECT * FROM (
        SELECT
          pl.id, pl.name, pl.property_type, pl.address, pl.city, pl.state,
          pl.latitude, pl.longitude,
          ROUND(
            ( 6371 * acos(
                cos(radians($1)) * cos(radians(pl.latitude)) *
                cos(radians(pl.longitude) - radians($2)) +
                sin(radians($1)) * sin(radians(pl.latitude))
              )
            )::numeric, 2
          ) AS distance_km
        FROM parking_locations pl
        WHERE pl.status = 'ACTIVE'
          AND pl.latitude  BETWEEN $1 - $3 AND $1 + $3
          AND pl.longitude BETWEEN $2 - $3 AND $2 + $3
      ) nearby
      WHERE distance_km <= $4
      ORDER BY distance_km ASC
      LIMIT $5`,
    [lat, lng, box, radiusKm, limit]
  );
  return rows;
}

// ---------------------------------------------------------------------------
// Slots
// ---------------------------------------------------------------------------

export async function createSlot({ locationId, slotCode, slotType, priceHour, status }) {
  const { rows } = await query(
    `INSERT INTO parking_slots (location_id, slot_code, slot_type, price_per_hour, status)
     VALUES ($1, $2, $3, $4, COALESCE($5::slot_status, 'ACTIVE'::slot_status))
     RETURNING *`,
    [locationId, slotCode, slotType, priceHour, status]
  );
  return rows[0];
}

export async function listSlotsByLocation(locationId) {
  const { rows } = await query(
    'SELECT * FROM parking_slots WHERE location_id = $1 ORDER BY slot_code ASC',
    [locationId]
  );
  return rows;
}

export async function findSlotById(id) {
  const { rows } = await query(
    `SELECT ps.*, pl.partner_id, pl.status AS location_status
     FROM parking_slots ps
     JOIN parking_locations pl ON pl.id = ps.location_id
     WHERE ps.id = $1`,
    [id]
  );
  return rows[0] || null;
}

export async function updateSlot(id, { slotType, status, priceHour }) {
  const { rows } = await query(
    `UPDATE parking_slots SET
       slot_type      = COALESCE($2, slot_type),
       status         = COALESCE($3, status),
       price_per_hour = COALESCE($4, price_per_hour)
     WHERE id = $1
     RETURNING *`,
    [id, slotType, status, priceHour]
  );
  return rows[0] || null;
}

export async function deleteSlot(id) {
  // ON DELETE RESTRICT from bookings -> parking_slots protects history here too.
  const { rowCount } = await query('DELETE FROM parking_slots WHERE id = $1', [id]);
  return rowCount > 0;
}

/** Slots at a location that have no overlapping PENDING/CONFIRMED/ACTIVE booking — mirrors queries.sql #4. */
export async function findAvailableSlots({ locationId, startTime, endTime, slotType }) {
  const params = [locationId, startTime, endTime];
  let condition = '';
  if (slotType) {
    params.push(slotType);
    condition = 'AND ps.slot_type = $4';
  }
  const { rows } = await query(
    `SELECT ps.id, ps.slot_code, ps.slot_type, ps.price_per_hour
     FROM parking_slots ps
     WHERE ps.location_id = $1
       AND ps.status = 'ACTIVE'
       ${condition}
       AND NOT EXISTS (
             SELECT 1 FROM bookings b
             WHERE b.slot_id = ps.id
               AND b.status IN ('PENDING', 'CONFIRMED', 'ACTIVE')
               AND tstzrange(b.start_time, b.end_time, '[)')
                   && tstzrange($2::timestamptz, $3::timestamptz, '[)')
           )
     ORDER BY ps.price_per_hour ASC`,
    params
  );
  return rows;
}
export async function getParkingRecommendations({
  lat,
  lng,
  radiusKm,
  limit,
  slotType,
  maxPrice,
  startTime,
  endTime,
}) {
  const box = radiusKm / 111;

  // Fixed base parameters:
  // $1 = latitude, $2 = longitude, $3 = bounding-box size, $4 = radius.
  const params = [lat, lng, box, radiusKm];

  let slotTypeParam = null;
  let maxPriceParam = null;
  let startTimeParam = null;
  let endTimeParam = null;

  if (slotType) {
    slotTypeParam = params.length + 1;
    params.push(slotType);
  }

  if (maxPrice !== undefined) {
    maxPriceParam = params.length + 1;
    params.push(maxPrice);
  }

  if (startTime && endTime) {
    startTimeParam = params.length + 1;
    params.push(startTime);
    endTimeParam = params.length + 1;
    params.push(endTime);
  }

  const conditions = [
    `pl.status = 'ACTIVE'`,
    `pl.latitude BETWEEN $1 - $3 AND $1 + $3`,
    `pl.longitude BETWEEN $2 - $3 AND $2 + $3`,
  ];

  if (slotTypeParam) {
    conditions.push(`
      EXISTS (
        SELECT 1
        FROM parking_slots ps_filter
        WHERE ps_filter.location_id = pl.id
          AND ps_filter.status = 'ACTIVE'
          AND ps_filter.slot_type = $${slotTypeParam}
      )
    `);
  }

  if (maxPriceParam) {
    conditions.push(`
      EXISTS (
        SELECT 1
        FROM parking_slots ps_price
        WHERE ps_price.location_id = pl.id
          AND ps_price.status = 'ACTIVE'
          AND ps_price.price_per_hour <= $${maxPriceParam}
      )
    `);
  }

  const slotTypeCondition = slotTypeParam
    ? `AND ps.slot_type = $${slotTypeParam}`
    : '';

  const availabilityCondition = startTimeParam && endTimeParam
    ? `
        AND NOT EXISTS (
          SELECT 1
          FROM bookings b
          WHERE b.slot_id = ps.id
            AND b.status IN ('PENDING', 'CONFIRMED', 'ACTIVE')
            AND tstzrange(b.start_time, b.end_time, '[)')
                && tstzrange(
                  $${startTimeParam}::timestamptz,
                  $${endTimeParam}::timestamptz,
                  '[)'
                )
        )
      `
    : '';

  const { rows } = await query(
    `
      SELECT
        pl.id,
        pl.name,
        pl.property_type,
        pl.address,
        pl.city,
        pl.state,
        pl.latitude,
        pl.longitude,

        ROUND(
          (
            6371 * acos(
              LEAST(
                1,
                GREATEST(
                  -1,
                  cos(radians($1)) *
                  cos(radians(pl.latitude)) *
                  cos(radians(pl.longitude) - radians($2)) +
                  sin(radians($1)) *
                  sin(radians(pl.latitude))
                )
              )
            )
          )::numeric,
          2
        ) AS distance_km,

        (
          SELECT MIN(ps.price_per_hour)
          FROM parking_slots ps
          WHERE ps.location_id = pl.id
            AND ps.status = 'ACTIVE'
            ${slotTypeCondition}
        ) AS min_price_per_hour,

        (
          SELECT ROUND(AVG(r.rating)::numeric, 2)
          FROM reviews r
          WHERE r.location_id = pl.id
        ) AS avg_rating,

        (
          SELECT COUNT(*)::int
          FROM reviews r
          WHERE r.location_id = pl.id
        ) AS review_count,

        (
          SELECT COUNT(*)::int
          FROM parking_slots ps
          WHERE ps.location_id = pl.id
            AND ps.status = 'ACTIVE'
            ${slotTypeCondition}
        ) AS total_active_slots,

        (
          SELECT COUNT(*)::int
          FROM parking_slots ps
          WHERE ps.location_id = pl.id
            AND ps.status = 'ACTIVE'
            ${slotTypeCondition}
            ${availabilityCondition}
        ) AS available_slots

      FROM parking_locations pl
      WHERE ${conditions.join(' AND ')}
        AND (
          6371 * acos(
            LEAST(
              1,
              GREATEST(
                -1,
                cos(radians($1)) *
                cos(radians(pl.latitude)) *
                cos(radians(pl.longitude) - radians($2)) +
                sin(radians($1)) *
                sin(radians(pl.latitude))
              )
            )
          )
        ) <= $4
    `,
    params
  );

  if (rows.length === 0) {
    return [];
  }

  const allPrices = rows
    .map((row) => Number(row.min_price_per_hour))
    .filter((value) => Number.isFinite(value) && value > 0);

  const lowestPrice = allPrices.length > 0
    ? Math.min(...allPrices)
    : 0;

  const highestPrice = allPrices.length > 0
    ? Math.max(...allPrices)
    : 0;

  const scored = rows.map((row) => {
    const distance = Number(row.distance_km ?? 0);
    const price = Number(row.min_price_per_hour ?? 0);
    const rating = Number(row.avg_rating ?? 0);
    const availableSlots = Number(row.available_slots ?? 0);
    const totalSlots = Number(row.total_active_slots ?? 0);

    const distanceScore = radiusKm > 0
      ? Math.max(0, Math.min(100, 100 - (distance / radiusKm) * 100))
      : 100;

    let priceScore = 50;
    if (highestPrice > lowestPrice) {
      priceScore = ((highestPrice - price) / (highestPrice - lowestPrice)) * 100;
    } else if (price > 0) {
      priceScore = 100;
    }
    priceScore = Math.max(0, Math.min(100, priceScore));

    const availabilityScore = totalSlots > 0
      ? Math.min(100, (availableSlots / totalSlots) * 100)
      : 0;

    const ratingScore = rating > 0
      ? Math.min(100, (rating / 5) * 100)
      : 0;

    let distanceWeight = 0.40;
    let priceWeight = 0.25;
    let availabilityWeight = 0.25;
    let ratingWeight = 0.10;

    if (slotType) {
      distanceWeight = 0.35;
      priceWeight = 0.20;
      availabilityWeight = 0.35;
      ratingWeight = 0.10;
    }

    if (maxPrice !== undefined) {
      distanceWeight = 0.30;
      priceWeight = 0.35;
      availabilityWeight = 0.25;
      ratingWeight = 0.10;
    }

    if (startTime && endTime) {
      distanceWeight = 0.30;
      priceWeight = 0.20;
      availabilityWeight = 0.40;
      ratingWeight = 0.10;
    }

    if (slotType && maxPrice !== undefined && startTime && endTime) {
      distanceWeight = 0.20;
      priceWeight = 0.30;
      availabilityWeight = 0.40;
      ratingWeight = 0.10;
    }

    const recommendationScore =
      distanceScore * distanceWeight +
      priceScore * priceWeight +
      availabilityScore * availabilityWeight +
      ratingScore * ratingWeight;

    const reasons = [];

    if (distanceScore >= 80) reasons.push('Very close');
    else if (distanceScore >= 50) reasons.push('Nearby');

    if (priceScore >= 80) reasons.push('Good price');

    if (availabilityScore >= 75) reasons.push('High availability');
    else if (availabilityScore > 0) reasons.push('Slots available');

    if (rating >= 4.5) reasons.push('Highly rated');
    else if (rating >= 4) reasons.push('Well rated');

    if (slotType && availableSlots > 0) {
      reasons.push(`${slotType} slots available`);
    }

    return {
      ...row,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      distance_km: Number(distance.toFixed(2)),
      min_price_per_hour: row.min_price_per_hour !== null
        ? Number(row.min_price_per_hour)
        : null,
      avg_rating: row.avg_rating !== null
        ? Number(row.avg_rating)
        : null,
      review_count: Number(row.review_count ?? 0),
      total_active_slots: totalSlots,
      available_slots: availableSlots,
      recommendation_score: Number(recommendationScore.toFixed(2)),
      recommendation_reasons: reasons.slice(0, 3),
    };
  });

  scored.sort((a, b) => {
    if (b.recommendation_score !== a.recommendation_score) {
      return b.recommendation_score - a.recommendation_score;
    }
    return a.distance_km - b.distance_km;
  });

  return scored.slice(0, limit);
}
