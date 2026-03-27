import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  relayMock: vi.fn(),
  listFacultyBatchesMock: vi.fn(),
}));

vi.mock('@/lib/faculty-api', () => ({
  relayFacultyUpstreamResponse: mocks.relayMock,
}));

vi.mock('@/lib/faculty-live-data', () => ({
  listFacultyBatches: mocks.listFacultyBatchesMock,
}));

import { GET as getBatches } from '../batches/route';
import { POST as bulkAttendance, GET as getAttendance } from '../attendance/route';
import { PATCH as patchHelpRequest } from '../help-requests/[id]/route';
import { GET as getHelpRequests } from '../help-requests/route';
import { POST as approveProject } from '../project-reviews/[id]/approve/route';
import { POST as requestRevision } from '../project-reviews/[id]/request-revision/route';
import { GET as getProjectReviews } from '../project-reviews/route';
import { POST as acceptSessionRequest } from '../session-requests/[id]/accept/route';
import { GET as getSessionRequests } from '../session-requests/route';
import { GET as getFacultyAssignments } from '../../assignments/route';
import { GET as getFacultyHelpRequests } from '../../help-requests/route';
import { GET as getFacultyReviewQueue } from '../../review-queue/route';

const facultyUserId = 'faculty-1';

const makeRequest = (url: string, method = 'GET', body?: unknown) =>
  new NextRequest(`http://localhost${url}`, {
    method,
    headers: body === undefined ? { 'x-user-id': facultyUserId } : { 'content-type': 'application/json', 'x-user-id': facultyUserId },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('faculty-app routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.listFacultyBatchesMock.mockResolvedValue([
      {
        id: 'batch-1',
        name: 'React Full Stack - March 2026',
        facultyName: 'Asha Iyer',
        nextSessionId: 'session-1',
        nextSessionAt: '2026-03-22T09:30:00.000Z',
        studentCount: 1,
        presentCount: 1,
        attendanceRate: 100,
      },
    ]);

    mocks.relayMock.mockImplementation(async (_headers: Headers | HeadersInit, path: string, init?: RequestInit) => {
      if (path.startsWith('/api/tutorial/faculty/help-requests/') && init?.method === 'PATCH') {
        return jsonResponse({
          data: { id: path.split('/').at(-1), status: 'resolved', resolvedAt: new Date().toISOString() },
        });
      }

      if (path === '/api/tutorial/faculty/help-requests') {
        return jsonResponse({
          data: [
            {
              id: 'help-req-1',
              studentId: 'student-1',
              studentName: 'Aarav Shah',
              subtopic: 'Promises and async flow',
              question: 'I cannot tell when to use Promise.all vs await in sequence.',
              status: 'open',
              requestedAt: '2026-03-22T08:10:00+05:30',
              resolvedAt: null,
            },
          ],
        });
      }

      if (path === '/api/tutorial/faculty/assignments') {
        return jsonResponse({
          data: [
            {
              id: 'assignment-1',
              title: 'Build an async quiz flow',
              question: 'Implement a quiz builder that preserves answer order.',
              subtopic: 'Promises and async flow',
              difficulty: 'medium',
              questionType: 'coding',
              points: 10,
              isPublished: true,
              helpRequestCount: 2,
              createdAt: '2026-03-22T07:40:00+05:30',
              updatedAt: '2026-03-22T08:00:00+05:30',
            },
          ],
        });
      }

      if (path === '/api/tutorial/faculty/review-queue') {
        return jsonResponse({
          data: [
            {
              id: 'review-1',
              studentId: 'student-1',
              studentName: 'Aarav Shah',
              projectName: 'Quiz Builder Dashboard',
              status: 'needs_review',
              submittedAt: '2026-03-22T07:50:00+05:30',
              aiFeedback: 'AI flagged the workflow as promising but needs a manual review for approval.',
              checklist: [{ label: 'Uses repository pattern', passed: true }],
            },
          ],
        });
      }

      if (path.startsWith('/api/tutorial/faculty/project-reviews/') && path.endsWith('/approve')) {
        return jsonResponse({ data: { id: path.split('/').at(-2), status: 'approved' } });
      }

      if (path.startsWith('/api/tutorial/faculty/project-reviews/') && path.endsWith('/request-revision')) {
        return jsonResponse({ data: { id: path.split('/').at(-2), status: 'revision-requested' } });
      }

      if (path === '/api/tutorial/faculty/project-reviews') {
        return jsonResponse({
          data: [
            {
              id: 'project-sub-1',
              studentId: 'student-1',
              studentName: 'Aarav Shah',
              projectName: 'Quiz Builder Dashboard',
              status: 'needs_review',
              submittedAt: '2026-03-22T07:50:00+05:30',
              aiFeedback: 'AI flagged the workflow as promising but needs a manual review for approval.',
              checklist: [{ label: 'Uses repository pattern', passed: true }],
            },
          ],
        });
      }

      if (path === '/api/tutorial/faculty/live-sessions') {
        return jsonResponse({
          data: [
            {
              id: 'session-req-1',
              studentId: 'student-1',
              studentName: 'Aarav Shah',
              subtopic: 'Promises and async flow',
              doubtText: 'Can we go over Promise.all error handling in real code?',
              status: 'pending',
              scheduledAt: '2026-03-22T17:30:00+05:30',
              batchName: 'React Full Stack - March 2026',
            },
          ],
        });
      }

      if (path.startsWith('/api/attendance') && init?.method === 'GET') {
        return jsonResponse({
          data: {
            batchId: 'batch-1',
            batchName: 'React Full Stack - March 2026',
            sessionId: 'session-1',
            sessionAt: '2026-03-22T09:30:00.000Z',
            roster: [
              { id: 'student-1', name: 'Aarav Shah', rollNumber: 'SK001', avatarUrl: 'avatar', present: true },
            ],
          },
        });
      }

      if (path.startsWith('/api/attendance') && init?.method === 'POST') {
        return jsonResponse({ data: { saved: 1 } });
      }

      if (path.startsWith('/api/tutorial/faculty/live-sessions/') && path.endsWith('/accept')) {
        return jsonResponse({
          data: {
            id: path.split('/').at(-2),
            studentId: 'student-1',
            status: 'accepted',
            meetingLink: 'https://meet.google.com/abc-defg-hij',
            scheduledAt: '2026-03-22T17:30:00+05:30',
            doubtText: 'Can we go over Promise.all error handling in real code?',
            subtopicId: 'subtopic-1',
          },
        });
      }

      return jsonResponse({ data: [] });
    });
  });

  it('lists help requests and can patch one', async () => {
    const response = await getHelpRequests(makeRequest('/api/faculty/help-requests'));
    const payload = (await response.json()) as { data: Array<{ id: string }> };

    expect(response.status).toBe(200);
    expect(payload.data).toHaveLength(1);

    const patchResponse = await patchHelpRequest(makeRequest('/api/faculty/help-requests/help-req-1', 'PATCH', { status: 'resolved' }), {
      params: Promise.resolve({ id: 'help-req-1' }),
    });
    const patchPayload = (await patchResponse.json()) as { data: { status: string } };

    expect(patchResponse.status).toBe(200);
    expect(patchPayload.data.status).toBe('resolved');
  });

  it('relays faculty help requests through the BFF route', async () => {
    const response = await getFacultyHelpRequests(makeRequest('/api/help-requests'));
    const payload = (await response.json()) as { data: Array<{ id: string }> };

    expect(response.status).toBe(200);
    expect(payload.data).toHaveLength(1);
  });

  it('relays faculty review queue through the BFF route', async () => {
    const response = await getFacultyReviewQueue(makeRequest('/api/review-queue'));
    const payload = (await response.json()) as { data: Array<{ id: string }> };

    expect(response.status).toBe(200);
    expect(payload.data).toHaveLength(1);
  });

  it('relays faculty assignments through the BFF route', async () => {
    const response = await getFacultyAssignments(makeRequest('/api/assignments'));
    const payload = (await response.json()) as { data: Array<{ id: string }> };

    expect(response.status).toBe(200);
    expect(payload.data).toHaveLength(1);
  });

  it('lists session requests and accepts one with a meeting link', async () => {
    const listResponse = await getSessionRequests(makeRequest('/api/faculty/session-requests'));
    const listPayload = (await listResponse.json()) as { data: Array<{ id: string }> };

    expect(listResponse.status).toBe(200);
    expect(listPayload.data.length).toBeGreaterThan(0);

    const requestId = listPayload.data[0]?.id;
    expect(requestId).toBeDefined();

    const response = await acceptSessionRequest(
      makeRequest(`/api/faculty/session-requests/${requestId}/accept`, 'POST', { meetingLink: 'https://meet.google.com/abc-defg-hij' }),
      {
        params: Promise.resolve({ id: requestId ?? '' }),
      }
    );
    const payload = (await response.json()) as { data: { status: string; meetingLink: string } };

    expect(response.status).toBe(200);
    expect(payload.data.status).toBe('accepted');
    expect(payload.data.meetingLink).toBe('https://meet.google.com/abc-defg-hij');
  });

  it('lists batches and bulk submits attendance in one payload', async () => {
    const batchResponse = await getBatches(makeRequest('/api/faculty/batches'));
    const batchPayload = (await batchResponse.json()) as { data: Array<{ id: string; nextSessionId: string }> };

    expect(batchResponse.status).toBe(200);
    expect(batchPayload.data.length).toBeGreaterThan(0);

    const batchId = batchPayload.data[0]?.id;
    const sessionId = batchPayload.data[0]?.nextSessionId;
    expect(batchId).toBeDefined();
    expect(sessionId).toBeDefined();

    const attendanceResponse = await getAttendance(makeRequest(`/api/faculty/attendance?batchId=${batchId}&sessionId=${sessionId}`));
    const attendancePayload = (await attendanceResponse.json()) as { data: { roster: Array<{ id: string; present: boolean }> } };

    expect(attendanceResponse.status).toBe(200);
    expect(attendancePayload.data.roster.length).toBeGreaterThan(0);

    const attendanceRecords = attendancePayload.data.roster.map((student, index) => ({
      studentId: student.id,
      present: index % 2 === 0,
    }));

    const response = await bulkAttendance(
      makeRequest('/api/faculty/attendance', 'POST', { batchId, sessionId, attendanceRecords })
    );
    const payload = (await response.json()) as { data: { saved: number } };

    expect(response.status).toBe(200);
    expect(payload.data.saved).toBe(attendanceRecords.length);
  });

  it('approves and requests revision for project reviews', async () => {
    const approveResponse = await approveProject(
      makeRequest('/api/faculty/project-reviews/project-sub-1/approve', 'POST', { notes: 'Looks good' }),
      {
        params: Promise.resolve({ id: 'project-sub-1' }),
      }
    );
    const approvePayload = (await approveResponse.json()) as { data: { status: string } };

    expect(approveResponse.status).toBe(200);
    expect(approvePayload.data.status).toBe('approved');

    const revisionResponse = await requestRevision(
      makeRequest('/api/faculty/project-reviews/project-sub-1/request-revision', 'POST', { notes: 'Please revise' }),
      {
        params: Promise.resolve({ id: 'project-sub-1' }),
      }
    );
    const revisionPayload = (await revisionResponse.json()) as { data: { status: string } };

    expect(revisionResponse.status).toBe(200);
    expect(revisionPayload.data.status).toBe('revision-requested');
  });

  it('lists live project reviews', async () => {
    const response = await getProjectReviews(makeRequest('/api/faculty/project-reviews'));
    const payload = (await response.json()) as { data: Array<{ id: string }> };

    expect(response.status).toBe(200);
    expect(payload.data).toHaveLength(1);
  });
});
