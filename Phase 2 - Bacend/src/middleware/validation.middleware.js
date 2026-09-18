// Wraps a Zod schema to validate/coerce body, params, and query in one
// middleware. On failure, produces a clean 422 rather than an exception.
import { Errors } from '../utils/errors.js';

/**
 * @param {{ body?: import('zod').ZodTypeAny, params?: import('zod').ZodTypeAny, query?: import('zod').ZodTypeAny }} schemas
 */
export function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      return next();
    } catch (err) {
      const detail = err?.errors?.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ') || 'Invalid input.';
      return next(Errors.unprocessable(detail, 'VALIDATION_ERROR'));
    }
  };
}
