import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LearningProgressService } from '@quiz/db-tutorial';
import { POST } from '../block-active-time/route';

vi.mock('@quiz/db-tutorial', async original => {
  const actual = await original<typeof import('@quiz/db-tutorial')>();
  return { ...actual, TutorialNavigationProgressRepository: class {}, TutorialSectionRepository: class {}, BlockLearningStateRepository: class {}, BlockTelemetryEventRepository: class {}, db: {} };
});
const previous = process.env.INTERNAL_API_SECRET;
const eventId = '11111111-1111-4111-8111-111111111111';
const body = { navigationNodeId: 'node-1', subtopicId: '22222222-2222-4222-8222-222222222222', blockId: 'block-1', blockVersion: 'D1', eventId, activeTimeSec: 30 };
function request(secret: string, input: unknown = body) { return new NextRequest('http://localhost/api/tutorial/ils/block-active-time', { method: 'POST', headers: { 'x-internal-secret': secret, 'x-user-id': 'learner', 'x-brand': 'skillup', 'content-type': 'application/json' }, body: JSON.stringify(input) }); }
describe('ILS active-time real entry boundary', () => {
  beforeEach(() => { process.env.INTERNAL_API_SECRET = 'disposable-internal-secret'; });
  afterEach(() => { vi.restoreAllMocks(); if (previous === undefined) delete process.env.INTERNAL_API_SECRET; else process.env.INTERNAL_API_SECRET = previous; });
  it('forwards validated principal and immutable event fields and returns acknowledgement', async () => {
    const service = vi.spyOn(LearningProgressService.prototype, 'recordBlockActiveTime').mockResolvedValue({ state: { activeTimeSec: 30 }, wasProcessed: true, wasAlreadyProcessed: false } as never);
    const response = await POST(request('disposable-internal-secret'));
    expect(response.status).toBe(200); expect(await response.json()).toMatchObject({ processed: true, alreadyProcessed: false });
    expect(service).toHaveBeenCalledExactlyOnceWith({ userId: 'learner', brand: 'skillup' }, 'node-1', body.subtopicId, 'block-1', 'D1', eventId, 30);
  });
  it('rejects invalid internal authentication and malformed event before service', async () => {
    const service = vi.spyOn(LearningProgressService.prototype, 'recordBlockActiveTime');
    expect((await POST(request('invalid'))).status).toBe(401);
    expect((await POST(request('disposable-internal-secret', { ...body, eventId: 'bad' }))).status).toBe(400);
    expect(service).not.toHaveBeenCalled();
  });
});
