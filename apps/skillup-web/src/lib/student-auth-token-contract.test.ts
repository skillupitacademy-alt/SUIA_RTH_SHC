import { TokenService } from '@quiz/auth';
import { SignJWT } from 'jose';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { requireStudentAuth } from './student-auth';

const key = new TextEncoder().encode('chg01b-disposable-signature-key-32bytes');
const verifier = new TokenService(key, key, key);
const learnerUserId = '11111111-1111-4111-8111-111111111111';
const peoplePersonId = '22222222-2222-4222-8222-222222222222';

vi.mock('@quiz/db-people', () => ({
  db: { query: { users: { findFirst: () => { throw new Error('PeopleDB must remain unused'); } } } },
}));

beforeEach(() => {
  vi.spyOn(TokenService, 'verifyUserAccessToken').mockImplementation((token, options) => verifier.verifyUserAccessToken(token, options));
});
afterEach(() => vi.restoreAllMocks());

async function request(overrides: Record<string, unknown> = {}, signingKey = key) {
  const token = await new SignJWT({
    userId: learnerUserId, originalUserId: learnerUserId, shadowUserId: peoplePersonId,
    brand: 'skillup', roles: ['student'], tokenType: 'user', ...overrides,
  }).setProtectedHeader({ alg: 'HS256' }).setAudience('user').setIssuedAt().setExpirationTime('5m').sign(signingKey);
  return new NextRequest('http://skillup.localhost:3009/api/tutorial/progress', {
    headers: { cookie: `accessToken=${token}`, 'x-user-id': peoplePersonId, 'x-shadow-user-id': learnerUserId },
  });
}

it('preserves real JWT verification and local ownership without consulting PeopleDB', async () => {
  expect(await requireStudentAuth(await request(), { identity: 'learner' })).toMatchObject({
    ok: true, learnerUserId, peoplePersonId: null,
  });
});
it('preserves the existing mandatory-shadow JWT policy', async () => {
  const response = await requireStudentAuth(await request({ shadowUserId: undefined }), { identity: 'learner' });
  expect(response.ok).toBe(false);
  if (!response.ok) expect(response.response.status).toBe(401);
});
it('denies a forged signature even with plausible identity claims', async () => {
  const otherKey = new TextEncoder().encode('chg01b-other-disposable-signature-32bytes');
  const response = await requireStudentAuth(await request({}, otherKey), { identity: 'learner' });
  expect(response.ok).toBe(false);
  if (!response.ok) expect(response.response.status).toBe(401);
});
it('denies a real signed wrong-brand token', async () => {
  const response = await requireStudentAuth(await request({ brand: 'realtutorialhub' }), { identity: 'learner' });
  expect(response.ok).toBe(false);
  if (!response.ok) expect(response.response.status).toBe(403);
});
