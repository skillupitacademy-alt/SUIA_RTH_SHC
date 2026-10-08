import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  verifyQStashRequest: vi.fn(),
  loggerInfo: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock('../qstash', () => ({
  verifyQStashRequest: mocks.verifyQStashRequest,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: mocks.loggerInfo,
    error: mocks.loggerError,
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import { POST as notifyAccepted } from '../notify-session-accepted/route';
import { POST as notifyRequested } from '../notify-session-requested/route';
import { POST as notifyScheduled } from '../notify-session-scheduled/route';

const requestId = crypto.randomUUID();
const studentId = crypto.randomUUID();
const facultyId = crypto.randomUUID();
const subtopicId = crypto.randomUUID();

const makeRequest = (path: string) =>
  new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'upstash-signature': 'signature',
    },
  });

const makePayload = (extra: Record<string, unknown>) =>
  JSON.stringify({
    requestId,
    studentId,
    facultyId,
    subtopicId,
    ...extra,
  });

describe('session notification workers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyQStashRequest.mockResolvedValue(makePayload({
      meetingLink: 'https://meet.example.com/session',
      scheduledAt: new Date('2026-03-23T10:00:00.000Z').toISOString(),
    }));
  });

  it('notifies on session requested payloads', async () => {
    mocks.verifyQStashRequest.mockResolvedValueOnce(JSON.stringify({
      requestId,
      studentId,
      subtopicId,
      doubtText: 'Need help',
    }));

    const response = await notifyRequested(makeRequest('/api/workers/notify-session-requested'));

    expect(response.status).toBe(200);
    expect(mocks.loggerInfo).toHaveBeenCalledWith(expect.objectContaining({
      event: 'session.requested.notify',
      studentId,
      subtopicId,
      requestId,
    }));
  });

  it('returns 401 when the requested worker signature is invalid', async () => {
    mocks.verifyQStashRequest.mockRejectedValueOnce(Object.assign(new Error('bad signature'), { name: 'SignatureError' }));

    const response = await notifyRequested(makeRequest('/api/workers/notify-session-requested'));

    expect(response.status).toBe(401);
  });

  it('returns 400 when the requested worker payload is invalid', async () => {
    mocks.verifyQStashRequest.mockResolvedValueOnce(JSON.stringify({ requestId, studentId }));

    const response = await notifyRequested(makeRequest('/api/workers/notify-session-requested'));

    expect(response.status).toBe(400);
  });

  it('notifies on session accepted payloads', async () => {
    mocks.verifyQStashRequest.mockResolvedValueOnce(JSON.stringify({
      requestId,
      studentId,
      facultyId,
      subtopicId,
    }));

    const response = await notifyAccepted(makeRequest('/api/workers/notify-session-accepted'));

    expect(response.status).toBe(200);
    expect(mocks.loggerInfo).toHaveBeenCalledWith(expect.objectContaining({
      event: 'session.accepted.notify',
      studentId,
      requestId,
      facultyId,
      subtopicId,
    }));
  });

  it('returns 401 when the accepted worker signature is invalid', async () => {
    mocks.verifyQStashRequest.mockRejectedValueOnce(Object.assign(new Error('bad signature'), { name: 'SignatureError' }));

    const response = await notifyAccepted(makeRequest('/api/workers/notify-session-accepted'));

    expect(response.status).toBe(401);
  });

  it('returns 400 when the accepted worker payload is invalid', async () => {
    mocks.verifyQStashRequest.mockResolvedValueOnce(JSON.stringify({ requestId, studentId }));

    const response = await notifyAccepted(makeRequest('/api/workers/notify-session-accepted'));

    expect(response.status).toBe(400);
  });

  it('notifies on session scheduled payloads', async () => {
    mocks.verifyQStashRequest.mockResolvedValueOnce(JSON.stringify({
      requestId,
      studentId,
      facultyId,
      subtopicId,
      meetingLink: 'https://meet.example.com/session',
      scheduledAt: new Date('2026-03-23T10:00:00.000Z').toISOString(),
    }));

    const response = await notifyScheduled(makeRequest('/api/workers/notify-session-scheduled'));

    expect(response.status).toBe(200);
    expect(mocks.loggerInfo).toHaveBeenCalledWith(expect.objectContaining({
      event: 'session.scheduled.notify',
      studentId,
      requestId,
      meetingLink: 'https://meet.example.com/session',
    }));
  });

  it('returns 401 when the scheduled worker signature is invalid', async () => {
    mocks.verifyQStashRequest.mockRejectedValueOnce(Object.assign(new Error('bad signature'), { name: 'SignatureError' }));

    const response = await notifyScheduled(makeRequest('/api/workers/notify-session-scheduled'));

    expect(response.status).toBe(401);
  });

  it('returns 400 when the scheduled worker payload is invalid', async () => {
    mocks.verifyQStashRequest.mockResolvedValueOnce(JSON.stringify({ requestId, studentId }));

    const response = await notifyScheduled(makeRequest('/api/workers/notify-session-scheduled'));

    expect(response.status).toBe(400);
  });
});
