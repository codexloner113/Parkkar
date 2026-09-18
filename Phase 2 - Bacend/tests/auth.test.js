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

test('register -> login -> me happy path', async () => {
  const email = `auth-test-${Date.now()}@example.com`;
  const password = 'TestPass123!';

  const reg = await api('POST', '/api/auth/register', {
    body: { name: 'Auth Test', email, phone: `9${Date.now()}`.slice(0, 10), password },
  });
  assert.equal(reg.status, 201);
  assert.equal(reg.json.data.user.role, 'USER');
  assert.equal(reg.json.data.user.password_hash, undefined);

  const dup = await api('POST', '/api/auth/register', {
    body: { name: 'Auth Test', email, phone: '9000000099', password },
  });
  assert.equal(dup.status, 409);
  assert.equal(dup.json.error, 'DUPLICATE_EMAIL');

  const login = await api('POST', '/api/auth/login', { body: { email, password } });
  assert.equal(login.status, 200);
  const token = login.json.data.token;

  const badLogin = await api('POST', '/api/auth/login', { body: { email, password: 'wrong' } });
  assert.equal(badLogin.status, 401);

  const me = await api('GET', '/api/auth/me', { token });
  assert.equal(me.status, 200);
  assert.equal(me.json.data.email, email);

  const noToken = await api('GET', '/api/auth/me');
  assert.equal(noToken.status, 401);
});
