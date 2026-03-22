import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  publishJSON: vi.fn(),
}));

vi.mock('@upstash/qstash', () => ({
  Client: class Client {
    publishJSON = mocks.publishJSON;

    constructor() {}
  },
}));

import { POST as approveProject } from '../project-reviews/[id]/approve/route';
import { GET as getBatches } from '../batches/route';
import { POST as bulkAttendance } from '../attendance/route';
import { PATCH as patchHelpRequest } from '../help-requests/[id]/route';
import { GET as getHelpRequests } from '../help-requests/route';
import { POST as acceptSessionRequest } from '../session-requests/[id]/accept/route';
import { GET as getSessionRequests } from '../session-requests/route';

const helpRequestId = 'help-req-1';
const sessionRequestId = 'session-req-1';
const projectSubmissionId = 'project-sub-1';

const makeJsonRequest = (url: string, body?: unknown, method = 'GET') =>
  new NextRequest(`http://localhost${url}`, {
    method,
    headers: body !== undefined ? { 'content-type': 'application/json' } : undefined,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

describe('faculty-app routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.QSTASH_TOKEN = 'test-token';
    process.env.INTERNAL_API_URL = '';
    process.env.NEXT_PUBLIC_API_URL = '';
    process.env.NEXT_PUBLIC_APP_URL = '';
  });

  it('lists demo help requests when no upstream is configured', async () => {
    const response = await getHelpRequests(makeJsonRequest('/api/faculty/help-requests'));
    const payload = (await response.json()) as { data: Array<{ id: string }> };

    expect(response.status).toBe(200);
    expect(payload.data).toHaveLength(3);
    expect(payload.data[0]?.id).toBe(helpRequestId);
  });

  it('updates a help request status', async () => {
    const response = await patchHelpRequest(makeJsonRequest('/api/faculty/help-requests/help-req-1', { status: 'resolved' }, 'PATCH'), {
      params: Promise.resolve({ id: helpRequestId }),
    });
    const payload = (await response.json()) as { data: { status: string } };

    expect(response.status).toBe(200);
    expect(payload.data.status).toBe('resolved');
  });

  it('lists session requests and accepts one with a meeting link', async () => {
    const listResponse = await getSessionRequests();
    const listPayload = (await listResponse.json()) as { data: Array<{ id: string }> };

    expect(listResponse.status).toBe(200);
    expect(listPayload.data).toHaveLength(2);

    const response = await acceptSessionRequest(
      makeJsonRequest(`/api/faculty/session-requests/${sessionRequestId}/accept`, { meetingLink: 'https://meet.google.com/abc-defg-hij' }, 'POST'),
      {
        params: Promise.resolve({ id: sessionRequestId }),
      }
    );
    const payload = (await response.json()) as { data: { status: string; meetingLink: string } };

    expect(response.status).toBe(200);
    expect(payload.data.status).toBe('accepted');
    expect(payload.data.meetingLink).toBe('https://meet.google.com/abc-defg-hij');
    expect(mocks.publishJSON).toHaveBeenCalledTimes(1);
  });

  it('lists batches and bulk submits attendance in one payload', async () => {
    const batchResponse = await getBatches();
    const batchPayload = (await batchResponse.json()) as { data: Array<{ id: string }> };

    expect(batchResponse.status).toBe(200);
    expect(batchPayload.data).toHaveLength(4);

    const attendanceRecords = Array.from({ length: 30 }, (_, index) => ({
      studentId: `student-${String(index + 1).padStart(2, '0')}`,
      present: index % 2 === 0,
    }));

    const response = await bulkAttendance(
      makeJsonRequest('/api/faculty/attendance', { batchId: 'batch-react-2026', sessionId: 'session-1', attendanceRecords }, 'POST')
    );
    const payload = (await response.json()) as { data: { saved: number } };

    expect(response.status).toBe(200);
    expect(payload.data.saved).toBe(30);
    expect(mocks.publishJSON).toHaveBeenCalledTimes(1);
  });

  it('approves a project review and publishes a worker event', async () => {
    const response = await approveProject(
      makeJsonRequest(`/api/faculty/project-reviews/${projectSubmissionId}/approve`, { notes: 'Looks good' }, 'POST'),
      {
        params: Promise.resolve({ id: projectSubmissionId }),
      }
    );
    const payload = (await response.json()) as { data: { status: string } };

    expect(response.status).toBe(200);
    expect(payload.data.status).toBe('approved');
    expect(mocks.publishJSON).toHaveBeenCalledTimes(1);
  });
});
