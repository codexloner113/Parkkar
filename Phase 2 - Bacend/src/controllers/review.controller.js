// Review creation/listing lives on parking.controller.js since routes are
// nested under /api/parking/:id/reviews — see routes/parking.routes.js.
// This file is kept for structural symmetry with the required layout and
// re-exports for clarity if a standalone /api/reviews surface is added later.
export { createReview as create, listReviews as list } from './parking.controller.js';
