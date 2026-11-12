/** @vitest-environment node */
import { createHash } from 'node:crypto';
import { SignJWT } from 'jose';
import { z } from 'zod';
import { createInMemoryEventLeaseStore, createQStashHandler, PlatformEventTypes } from '@quiz/events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { verifyQStashRequest } from '../qstash';

const currentKey = 'isolated-qstash-signing-key-current-32';
const nextKey = 'isolated-qstash-signing-key-next-32';
const destination = 'https://user.realtutorialhub.com/api/workers/notify-session-requested';
const body = JSON.stringify({ fixture: true });

async function sign(overrides: Record<string, unknown> = {}, key = currentKey, content = body) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    iss: 'Upstash', sub: destination,
    body: createHash('sha256').update(content).digest('base64url'),
    iat: now, nbf: now - 1, exp: now + 120, ...overrides,
  }).setProtectedHeader({ alg: 'HS256' }).sign(new TextEncoder().encode(key));
}
function request(signature?: string, content = body, url = destination) {
  return new Request(url, { method: 'POST', body: content,
    headers: signature ? { 'upstash-signature': signature } : {},
  });
}
beforeEach(() => {
  vi.stubEnv('QSTASH_CURRENT_SIGNING_KEY', currentKey);
  vi.stubEnv('QSTASH_NEXT_SIGNING_KEY', nextKey);
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('External network forbidden in signature tests'); }));
});

describe('shared event consumer with real signature verification', () => {
  const event = { type: 'project.submitted', id: 'fixture-event', tenantId: 'realtutorialhub' };
  const schema = z.object({ type: z.string(), id: z.string(), tenantId: z.string() });
  function consumer(effect = vi.fn()) {
    return { effect, handler: createQStashHandler(PlatformEventTypes.PROJECT_SUBMITTED, effect, {
      schema, tenantScope: 'realtutorialhub', idempotencyStore: createInMemoryEventLeaseStore(),
    }) };
  }
  async function signedEvent(value = event, url = destination) {
    const content = JSON.stringify(value);
    return request(await sign({}, currentKey, content), content, url);
  }
  it('processes an authorized event and suppresses its sequential replay', async () => {
    const { effect, handler } = consumer();
    expect((await handler(await signedEvent())).status).toBe(200);
    expect((await handler(await signedEvent())).status).toBe(200);
    expect(effect).toHaveBeenCalledTimes(1);
  });
  it('rejects a signed event for the other tenant before effects', async () => {
    const { effect, handler } = consumer();
    await expect(handler(await signedEvent({ ...event, tenantId: 'skillup' }))).rejects.toThrow('tenant');
    expect(effect).not.toHaveBeenCalled();
  });
  it('rejects a different signed event type before effects', async () => {
    const { effect, handler } = consumer();
    await expect(handler(await signedEvent({ ...event, type: 'project.approved' }))).rejects.toThrow('type mismatch');
    expect(effect).not.toHaveBeenCalled();
  });
  it('rejects cross-worker replay before effects', async () => {
    const { effect, handler } = consumer();
    await expect(handler(await signedEvent(event, destination.replace('requested', 'accepted'))))
      .rejects.toMatchObject({ name: 'SignatureError' });
    expect(effect).not.toHaveBeenCalled();
  });
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('real QStash signature boundary', () => {
  it('accepts a current signed body', async () => {
    await expect(verifyQStashRequest(request(await sign()))).resolves.toBe(body);
  });
  it('accepts the rotation key', async () => {
    await expect(verifyQStashRequest(request(await sign({}, nextKey)))).resolves.toBe(body);
  });
  it('rejects missing signatures', async () => {
    await expect(verifyQStashRequest(request())).rejects.toMatchObject({ name: 'SignatureError' });
  });
  it('rejects a forged signature', async () => {
    await expect(verifyQStashRequest(request(await sign({}, 'wrong-signing-key')))).rejects.toMatchObject({ name: 'SignatureError' });
  });
  it('rejects a tampered body', async () => {
    await expect(verifyQStashRequest(request(await sign(), '{}'))).rejects.toMatchObject({ name: 'SignatureError' });
  });
  it.each([
    { exp: Math.floor(Date.now() / 1000) - 120 },
    { nbf: Math.floor(Date.now() / 1000) + 120 },
    { iss: 'forged-issuer' },
  ])('rejects invalid temporal/issuer claims %j', async claims => {
    await expect(verifyQStashRequest(request(await sign(claims)))).rejects.toMatchObject({ name: 'SignatureError' });
  });
  it('rejects replay onto a different worker', async () => {
    await expect(verifyQStashRequest(request(await sign(), body, destination.replace('requested', 'accepted'))))
      .rejects.toMatchObject({ name: 'SignatureError' });
  });
  it('rejects changed query parameters', async () => {
    await expect(verifyQStashRequest(request(await sign(), body, `${destination}?override=true`)))
      .rejects.toMatchObject({ name: 'SignatureError' });
  });
  it('supports the same worker behind an internal origin', async () => {
    await expect(verifyQStashRequest(request(await sign(), body, 'http://localhost:3003/api/workers/notify-session-requested')))
      .resolves.toBe(body);
  });
  it('fails closed when signing keys are absent', async () => {
    vi.stubEnv('QSTASH_CURRENT_SIGNING_KEY', '');
    await expect(verifyQStashRequest(request(await sign()))).rejects.toThrow('signing keys are required');
  });
});
