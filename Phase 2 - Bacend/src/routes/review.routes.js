// Reviews are exposed as nested routes under /api/parking/:id/reviews —
// see routes/parking.routes.js. This file intentionally has no top-level
// mount; kept for structural symmetry with the required file layout.
import { Router } from 'express';

const router = Router();
export default router;
