// Demonstrates the CRITICAL TEST required by the brief: two overlapping
// booking attempts for the same slot — the first succeeds, the second
// must be rejected with 409 BOOKING_CONFLICT, driven entirely by the real
// PostgreSQL EXCLUDE constraint (not application-level pre-checking).

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

test(
  'overlapping bookings on the same slot: second attempt gets 409 BOOKING_CONFLICT',
  async () => {
    const unique = `${Date.now()}${process.pid}`;
    const email = `booking-conflict-${unique}@example.com`;
    const phone = `9${unique.slice(-9)}`;
    const password = 'TestPass123!';

    const reg = await api('POST', '/api/auth/register', {
      body: {
        name: 'Test User',
        email,
        phone,
        password,
      },
    });

    assert.equal(reg.status, 201);
    assert.equal(reg.json.data.user.role, 'USER');

    const token = reg.json.data.token;

    const start = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ).toISOString();

    const end = new Date(
      Date.now() + 26 * 60 * 60 * 1000
    ).toISOString();

    // slot_id 2 (A2, hotel) from seed.sql — free in seed data.
    const first = await api('POST', '/api/bookings', {
      token,
      body: {
        slot_id: 2,
        start_time: start,
        end_time: end,
      },
    });

    assert.equal(first.status, 201);
    assert.equal(first.json.success, true);

    // Overlapping window on the SAME slot.
    const overlapStart = new Date(
      Date.parse(start) + 60 * 60 * 1000
    ).toISOString();

    const overlapEnd = new Date(
      Date.parse(end) + 60 * 60 * 1000
    ).toISOString();

    const second = await api('POST', '/api/bookings', {
      token,
      body: {
        slot_id: 2,
        start_time: overlapStart,
        end_time: overlapEnd,
      },
    });

    assert.equal(second.status, 409);
    assert.equal(second.json.error, 'BOOKING_CONFLICT');
  }
);