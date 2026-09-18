import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:4000';

async function api(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

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
test('a USER cannot access the admin routes', async () => {
  const token = await registerAndLogin('user-role-test');
  const res = await api('GET', '/api/admin/users', { token });
  assert.equal(res.status, 403);
});

test('a USER cannot access another user\'s vehicle', async () => {
  const tokenA = await registerAndLogin('vehicle-owner');
  const tokenB = await registerAndLogin('vehicle-intruder');

  const created = await api('POST', '/api/vehicles', {
    token: tokenA,
    body: { plateNumber: `TEST${Date.now()}`, vehicleType: 'CAR' },
  });
  assert.equal(created.status, 201);
  const vehicleId = created.json.data.id;

  const intrusion = await api('GET', `/api/vehicles/${vehicleId}`, { token: tokenB });
  assert.equal(intrusion.status, 404); // not leaked as 403 — see vehicle.controller.js
});
