// Covers behavior introduced by the FINAL Phase 1 schema's composite FK:
// bookings(vehicle_id, user_id) -> vehicles(id, user_id).
//   1. A booking cannot be created with someone else's vehicle_id
//      (app-layer 403 VEHICLE_NOT_OWNED — backed by the DB constraint too).
//   2. A vehicle that has an existing booking cannot be hard-deleted
//      (DB-level ON DELETE RESTRICT -> 409 VEHICLE_HAS_BOOKINGS).

import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:4000';

async function api(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

// Counter prevents two back-to-back registrations from generating
// the same phone number from Date.now().
let testCounter = 0;

async function registerAndLogin(prefix) {
  testCounter += 1;

  const unique = `${Date.now()}${testCounter}`;
  const email = `${prefix}-${unique}@example.com`;
  const password = 'TestPass123!';

  const register = await api('POST', '/api/auth/register', {
    body: {
      name: prefix,
      email,
      phone: `9${unique.slice(-9)}`,
      password,
    },
  });

  if (register.status !== 201) {
    throw new Error(
      `Registration failed for ${email}: ${register.status} ${JSON.stringify(register.json)}`
    );
  }

  const login = await api('POST', '/api/auth/login', {
    body: { email, password },
  });

  if (login.status !== 200) {
    throw new Error(
      `Login failed for ${email}: ${login.status} ${JSON.stringify(login.json)}`
    );
  }

  return login.json.data.token;
}

test('a booking cannot use a vehicle owned by a different user', async () => {
  const ownerToken = await registerAndLogin('vfk-owner');
  const attackerToken = await registerAndLogin('vfk-attacker');

  const vehicle = await api('POST', '/api/vehicles', {
    token: ownerToken,
    body: {
      plateNumber: `VFK${Date.now()}`,
      vehicleType: 'CAR',
    },
  });

  assert.equal(vehicle.status, 201);

  const vehicleId = vehicle.json.data.id;

  const start = new Date(
    Date.now() + 48 * 60 * 60 * 1000
  ).toISOString();

  const end = new Date(
    Date.now() + 50 * 60 * 60 * 1000
  ).toISOString();

  // slot_id 3 (B1, hotel bike slot) from seed.sql — a slot this test suite
  // hasn't already booked in booking-conflict.test.js (which uses slot 2).
  const attempt = await api('POST', '/api/bookings', {
    token: attackerToken,
    body: {
      slot_id: 3,
      start_time: start,
      end_time: end,
      vehicle_id: vehicleId,
    },
  });

  assert.equal(attempt.status, 403);
  assert.equal(attempt.json.error, 'VEHICLE_NOT_OWNED');
});

test('a vehicle with an existing booking cannot be deleted (ON DELETE RESTRICT)', async () => {
  const token = await registerAndLogin('vfk-delete');

  const vehicle = await api('POST', '/api/vehicles', {
    token,
    body: {
      plateNumber: `VFKDEL${Date.now()}`,
      vehicleType: 'CAR',
    },
  });

  assert.equal(vehicle.status, 201);

  const vehicleId = vehicle.json.data.id;

  const start = new Date(
    Date.now() + 72 * 60 * 60 * 1000
  ).toISOString();

  const end = new Date(
    Date.now() + 74 * 60 * 60 * 1000
  ).toISOString();

  // slot_id 7 (M3, mall accessible slot) — free in seed data.
  const booking = await api('POST', '/api/bookings', {
    token,
    body: {
      slot_id: 7,
      start_time: start,
      end_time: end,
      vehicle_id: vehicleId,
    },
  });

  assert.equal(booking.status, 201);

  const del = await api('DELETE', `/api/vehicles/${vehicleId}`, {
    token,
  });

  assert.equal(del.status, 409);
  assert.equal(del.json.error, 'VEHICLE_HAS_BOOKINGS');
});