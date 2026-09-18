import * as userRepo from '../repositories/user.repository.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { Errors } from '../utils/errors.js';

export async function register({ name, email, phone, password, role }) {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await userRepo.findByEmailWithPassword(normalizedEmail);
  if (existing) {
    throw Errors.conflict('An account with this email already exists.', 'DUPLICATE_EMAIL');
  }

  const passwordHash = await hashPassword(password);
  // Public registration only ever creates USER accounts. PARTNER/ADMIN
  // accounts are provisioned out-of-band (matches Phase 1 seed data,
  // which pre-seeds partners/admin directly) — a public endpoint that let
  // anyone self-register as PARTNER or ADMIN would be a privilege
  // escalation hole.
  const user = await userRepo.createUser({
    name,
    email: normalizedEmail,
    phone,
    passwordHash,
    role: 'USER',
  });

  const token = signToken({ id: user.id, role: user.role });
  return { user, token };
}

export async function login({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await userRepo.findByEmailWithPassword(normalizedEmail);
  if (!user) {
    throw Errors.unauthorized('Invalid email or password.', 'INVALID_CREDENTIALS');
  }

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    throw Errors.unauthorized('Invalid email or password.', 'INVALID_CREDENTIALS');
  }

  if (user.account_status !== 'ACTIVE') {
    throw Errors.forbidden('This account is not active.', 'ACCOUNT_INACTIVE');
  }

  const token = signToken({ id: user.id, role: user.role });
  const { password_hash, ...safeUser } = user;
  return { user: safeUser, token };
}

export async function getProfile(userId) {
  const user = await userRepo.findById(userId);
  if (!user) throw Errors.notFound('User not found.');
  return user;
}
