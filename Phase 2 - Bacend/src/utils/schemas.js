// Central Zod schemas shared across route files. Enum values below are
// copied verbatim from schema.sql's CREATE TYPE statements — nothing here
// invents a value Phase 1 doesn't already define.
import { z } from 'zod';

export const idParam = (name = 'id') =>
  z.object({ [name]: z.coerce.number().int().positive() });

export const paginationQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
}).passthrough();

// --- auth -------------------------------------------------------------
export const registerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().min(6).max(20),
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

// --- vehicles -----------------------------------------------------------
export const vehicleTypeEnum = z.enum(['CAR', 'BIKE', 'EV', 'OTHER']);

export const createVehicleSchema = z.object({
  vehicleType: vehicleTypeEnum.optional(),
  plateNumber: z.string().trim().min(2).max(20),
  make: z.string().trim().max(60).optional(),
  model: z.string().trim().max(60).optional(),
}).transform((v) => ({
  vehicleType: v.vehicleType,
  plateNumber: v.plateNumber,
  make: v.make ?? null,
  model: v.model ?? null,
}));

export const updateVehicleSchema = z.object({
  vehicleType: vehicleTypeEnum.optional(),
  plateNumber: z.string().trim().min(2).max(20).optional(),
  make: z.string().trim().max(60).optional(),
  model: z.string().trim().max(60).optional(),
});

// --- parking locations ----------------------------------------------------
export const propertyTypeEnum = z.enum([
  'HOTEL',
  'MALL',
  'COMMERCIAL_BUILDING',
  'BANQUET_HALL',
  'OTHER',
]);

export const locationStatusEnum = z.enum([
  'PENDING_APPROVAL',
  'ACTIVE',
  'INACTIVE',
]);

export const createLocationSchema = z.object({
  name: z.string().trim().min(1).max(150),
  propertyType: propertyTypeEnum,
  address: z.string().trim().min(1).max(255),
  city: z.string().trim().min(1).max(80),
  state: z.string().trim().min(1).max(80),
  postalCode: z.string().trim().min(1).max(12),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  description: z.string().optional(),
  contactPhone: z.string().trim().max(20).optional(),
});

export const updateLocationSchema = createLocationSchema.partial();

export const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius_km: z.coerce.number().positive().max(100).optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
});

/**
 * Query parameters used by the parking recommendation endpoint.
 *
 * lat/lng are required so recommendations can be ranked by distance.
 * radius_km and limit control the search range/result count.
 * slot_type and max_price allow the user to add parking preferences.
 * start_time/end_time are optional and will be used for real slot
 * availability ranking when supplied.
 */
export const recommendationQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius_km: z.coerce.number().positive().max(100).optional(),
  limit: z.coerce.number().int().positive().max(20).optional(),

  slot_type: z.enum([
    'CAR',
    'BIKE',
    'EV',
    'ACCESSIBLE',
    'OTHER',
  ]).optional(),

  max_price: z.coerce.number().nonnegative().optional(),

  start_time: z.string().min(1).optional(),
  end_time: z.string().min(1).optional(),
}).superRefine((value, ctx) => {
  if (Boolean(value.start_time) !== Boolean(value.end_time)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['start_time'],
      message: 'start_time and end_time must be provided together.',
    });
    return;
  }

  if (value.start_time && value.end_time) {
    const start = new Date(value.start_time);
    const end = new Date(value.end_time);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['start_time'],
        message: 'start_time and end_time must be valid timestamps.',
      });
    } else if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end_time'],
        message: 'end_time must be after start_time.',
      });
    }
  }
});

export const searchQuerySchema = z.object({
  city: z.string().trim().optional(),
  propertyType: propertyTypeEnum.optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  slotType: z.enum(['CAR', 'BIKE', 'EV', 'ACCESSIBLE', 'OTHER']).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const adminParkingQuerySchema = searchQuerySchema.extend({
  status: locationStatusEnum.optional(),
});

export const adminParkingStatusSchema = z.object({
  status: locationStatusEnum,
});

// --- slots ----------------------------------------------------------------
export const slotTypeEnum = z.enum([
  'CAR',
  'BIKE',
  'EV',
  'ACCESSIBLE',
  'OTHER',
]);

export const slotStatusEnum = z.enum([
  'ACTIVE',
  'MAINTENANCE',
  'DISABLED',
]);

export const createSlotSchema = z.object({
  slotCode: z.string().trim().min(1).max(20),
  slotType: slotTypeEnum.optional(),
  priceHour: z.coerce.number().positive(),
  status: slotStatusEnum.optional(),
});

export const updateSlotSchema = z.object({
  slotType: slotTypeEnum.optional(),
  status: slotStatusEnum.optional(),
  priceHour: z.coerce.number().positive().optional(),
});

export const availabilityQuerySchema = z.object({
  start_time: z.string().datetime({ offset: true }).or(z.string().min(1)),
  end_time: z.string().datetime({ offset: true }).or(z.string().min(1)),
  slot_type: slotTypeEnum.optional(),
});

// --- bookings ---------------------------------------------------------
export const createBookingSchema = z.object({
  slot_id: z.coerce.number().int().positive(),
  vehicle_id: z.coerce.number().int().positive().nullable().optional(),
  start_time: z.string().min(1),
  end_time: z.string().min(1),
  services: z
    .array(
      z.object({
        service_id: z.coerce.number().int().positive(),
        quantity: z.coerce.number().int().positive().optional(),
      })
    )
    .optional(),
}).transform((b) => ({
  slotId: b.slot_id,
  vehicleId: b.vehicle_id ?? null,
  startTime: b.start_time,
  endTime: b.end_time,
  services: b.services ?? [],
}));

export const cancelBookingSchema = z.object({
  reason: z.string().trim().max(255).optional(),
});

// --- reviews ------------------------------------------------------------
export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  review_text: z.string().trim().max(2000).optional(),
});

// --- mock payment ---------------------------------------------------------
export const mockPaySchema = z.object({
  method: z.enum([
    'CARD',
    'UPI',
    'NETBANKING',
    'WALLET',
    'OTHER',
  ]).optional(),
});

// --- Razorpay payment -----------------------------------------------------

/**
 * Data returned by Razorpay Checkout after a successful payment.
 *
 * These values are sent to the backend, where the signature is verified
 * using the Razorpay secret before the payment is marked as PAID.
 */
export const razorpayPaymentSchema = z.object({
  razorpay_order_id: z.string().trim().min(1).max(100),
  razorpay_payment_id: z.string().trim().min(1).max(100),
  razorpay_signature: z.string().trim().min(1).max(128),
});

// --- revenue query ----------------------------------------------------
export const revenueQuerySchema = z.object({
  range_start: z.string().optional(),
  range_end: z.string().optional(),
});

// --- QR verification ------------------------------------------------------
export const bookingQrVerifySchema = z.object({
  token: z.string().trim().min(1),
  action: z.enum(['ENTRY', 'EXIT']),
});
