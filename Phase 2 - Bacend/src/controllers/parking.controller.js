import * as parkingService from '../services/parking.service.js';
import * as reviewRepo from '../repositories/review.repository.js';
import * as serviceRepo from '../repositories/service.repository.js';
import { sendSuccess } from '../utils/response.js';
import { paginationMeta, getPagination } from '../utils/pagination.js';

export async function search(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);

    const results = await parkingService.searchParking({
      ...req.query,
      limit,
      offset,
    });

    return sendSuccess(res, {
      message: 'Parking locations retrieved.',
      data: results,
      meta: { page, limit },
    });
  } catch (err) {
    return next(err);
  }
}

export async function nearby(req, res, next) {
  try {
    const { lat, lng, radius_km, limit } = req.query;

    const results = await parkingService.searchNearbyParking({
      lat: Number(lat),
      lng: Number(lng),
      radiusKm: radius_km ? Number(radius_km) : 5,
      limit: limit ? Number(limit) : 20,
    });

    return sendSuccess(res, {
      message: 'Nearby parking retrieved.',
      data: results,
    });
  } catch (err) {
    return next(err);
  }
}

export async function recommendations(req, res, next) {
  try {
    const {
      lat,
      lng,
      radius_km,
      limit,
      slot_type,
      max_price,
      start_time,
      end_time,
    } = req.query;

    const results =
      await parkingService.getParkingRecommendations({
        lat: Number(lat),
        lng: Number(lng),
        radiusKm: radius_km ? Number(radius_km) : 5,
        limit: limit ? Number(limit) : 10,
        slotType: slot_type,
        maxPrice:
          max_price !== undefined
            ? Number(max_price)
            : undefined,
        startTime: start_time,
        endTime: end_time,
      });

    return sendSuccess(res, {
      message: 'Parking recommendations retrieved.',
      data: results,
    });
  } catch (err) {
    return next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const location = await parkingService.getParkingDetail(
      req.params.id
    );

    return sendSuccess(res, {
      message: 'Parking location retrieved.',
      data: location,
    });
  } catch (err) {
    return next(err);
  }
}

export async function availability(req, res, next) {
  try {
    const {
      start_time,
      end_time,
      slot_type,
    } = req.query;

    const slots = await parkingService.getAvailability({
      locationId: req.params.id,
      startTime: start_time,
      endTime: end_time,
      slotType: slot_type,
    });

    return sendSuccess(res, {
      message: 'Availability retrieved.',
      data: slots,
    });
  } catch (err) {
    return next(err);
  }
}

export async function listReviews(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(
      req.query
    );

    const [rows, total] = await Promise.all([
      reviewRepo.listByLocation(req.params.id, {
        limit,
        offset,
      }),
      reviewRepo.countByLocation(req.params.id),
    ]);

    return sendSuccess(res, {
      message: 'Reviews retrieved.',
      data: rows,
      meta: paginationMeta(page, limit, total),
    });
  } catch (err) {
    return next(err);
  }
}

export async function createReview(req, res, next) {
  try {
    const review = await reviewRepo.createReview({
      userId: req.user.id,
      locationId: req.params.id,
      rating: req.body.rating,
      reviewText: req.body.review_text ?? null,
    });

    return sendSuccess(res, {
      message: 'Review submitted.',
      data: review,
      status: 201,
    });
  } catch (err) {
    return next(err);
  }
}

export async function listLocationServices(req, res, next) {
  try {
    // Phase 1 has no location_services table, so this returns
    // the full active service catalog.
    const services = await serviceRepo.listActiveServices();

    return sendSuccess(res, {
      message: 'Services retrieved.',
      data: services,
    });
  } catch (err) {
    return next(err);
  }
}