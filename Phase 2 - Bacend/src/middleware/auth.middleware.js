// Verifies the JWT on incoming requests and attaches the authenticated
// identity (id, role) to req.user. Every downstream handler MUST read the
// user id from req.user.id — never from req.body/req.params/req.query.
import { verifyToken } from '../utils/jwt.js';
import { Errors } from '../utils/errors.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(Errors.unauthorized('Missing or malformed Authorization header.'));
  }

  try {
    const payload = verifyToken(token);
    // payload only ever contains { id, role } — see utils/jwt.js
    req.user = { id: payload.id, role: payload.role };
    return next();
  } catch (err) {
    return next(Errors.unauthorized('Invalid or expired token.'));
  }
}
