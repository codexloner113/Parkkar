import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/** JWT payload is minimal on purpose — id and role only, never password/PII. */
export function signToken({ id, role }) {
  return jwt.sign({ id, role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}
