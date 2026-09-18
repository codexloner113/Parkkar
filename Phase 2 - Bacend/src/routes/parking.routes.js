import { Router } from 'express';

import * as parkingController from '../controllers/parking.controller.js';

import { requireAuth } from '../middleware/auth.middleware.js';

import { validate } from '../middleware/validation.middleware.js';

import {
  idParam,
  searchQuerySchema,
  nearbyQuerySchema,
  availabilityQuerySchema,
  recommendationQuerySchema,
  createReviewSchema,
  paginationQuery,
} from '../utils/schemas.js';

const router = Router();

// Public

router.get(
  '/',
  validate({ query: searchQuerySchema }),
  parkingController.search
);

router.get(
  '/nearby',
  validate({ query: nearbyQuerySchema }),
  parkingController.nearby
);

router.get(
  '/recommendations',
  validate({ query: recommendationQuerySchema }),
  parkingController.recommendations
);

router.get(
  '/:id',
  validate({ params: idParam() }),
  parkingController.getById
);

router.get(
  '/:id/availability',
  validate({
    params: idParam(),
    query: availabilityQuerySchema,
  }),
  parkingController.availability
);

router.get(
  '/:id/services',
  validate({ params: idParam() }),
  parkingController.listLocationServices
);

router.get(
  '/:id/reviews',
  validate({
    params: idParam(),
    query: paginationQuery,
  }),
  parkingController.listReviews
);

// Authenticated (any role)

router.post(
  '/:id/reviews',
  requireAuth,
  validate({
    params: idParam(),
    body: createReviewSchema,
  }),
  parkingController.createReview
);

export default router;