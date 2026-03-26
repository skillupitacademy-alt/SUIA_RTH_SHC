import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { db, faculty as facultyTable, users } from '@quiz/db-people';

const mocks = vi.hoisted(() => ({
  relayMock: vi.fn(),
}));

vi.mock('@/lib/faculty-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/faculty-api')>('@/lib/faculty-api');
  return {
    ...actual,
    relayFacultyUpstreamResponse: mocks.relayMock,
  };
});

import { GET as getBatches } from '../batches/route';
import { POST as bulkAttendance, GET as getAttendance } from '../attendance/route';
import { PATCH as patchHelpRequest } from '../help-requests/[id]/route';
import { GET as getHelpRequests } from '../help-requests/route';
import { POST as approveProject } from '../project-reviews/[id]/approve/route';
import { POST as requestRevision } from '../project-reviews/[id]/request-revision/route';
import { GET as getProjectReviews } from '../project-reviews/route';
import { POST as acceptSessionRequest } from '../session-requests/[id]/accept/route';
import { GET as getSessionRequests } from '../session-requests/route';

const makeJsonRequest = (url: string, body?: unknown, method = 'GET') =>
  new NextRequest(`http://localhost${url}`, {
    method,
    headers: body !== undefined ? { 'content-type': 'application/json', 'x-user-id': facultyUserId } : { 'x-user-id': facultyUserId },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

let facultyUserId = '';

describe('faculty-app routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.relayMock.mockImplementation(async (_headers: Headers | HeadersInit, path: string, init?: RequestInit) => {
      if (path.startsWith('/api/tutorial/faculty/help-requests/') && init?.method === 'PATCH') {
        return NextResponse.json({
          data: { id: path.split('/').at(-1), status: 'resolved', resolvedAt: new Date().toISOString() },
        });
      }

      if (path === '/api/tutorial/faculty/help-requests') {
        return NextResponse.json({
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

      if (path.startsWith('/api/tutorial/faculty/project-reviews/') && path.endsWith('/approve')) {
        return NextResponse.json({ data: { id: path.split('/').at(-2), status: 'approved' } });
      }

      if (path.startsWith('/api/tutorial/faculty/project-reviews/') && path.endsWith('/request-revision')) {
        return NextResponse.json({ data: { id: path.split('/').at(-2), status: 'revision-requested' } });
      }

      if (path === '/api/tutorial/faculty/project-reviews') {
        return NextResponse.json({
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
        return NextResponse.json({
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
        return NextResponse.json({
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
        return NextResponse.json({ data: { saved: 1 } });
      }

      if (path.startsWith('/api/tutorial/faculty/live-sessions/') && path.endsWith('/accept')) {
        return NextResponse.json({
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

      return NextResponse.json({ data: [] });
    });
    process.env.INTERNAL_API_URL = '';
    process.env.NEXT_PUBLIC_API_URL = '';
    process.env.NEXT_PUBLIC_APP_URL = '';
  });

  beforeAll(async () => {
    const [row] = await db
      .select({ id: facultyTable.userId })
      .from(facultyTable)
      .innerJoin(users, eq(users.id, facultyTable.userId))
      .where(eq(users.email, 'faculty@skillupitacademy.com'))
      .limit(1);

    facultyUserId = row?.id ?? '';
    expect(facultyUserId).not.toBe('');
  });

  it('lists help requests and can patch one', async () => {
    const response = await getHelpRequests(makeJsonRequest('/api/faculty/help-requests'));
    const payload = (await response.json()) as { data: Array<{ id: string }> };

    expect(response.status).toBe(200);
    expect(payload.data).toHaveLength(1);

    const patchResponse = await patchHelpRequest(makeJsonRequest('/api/faculty/help-requests/help-req-1', { status: 'resolved' }, 'PATCH'), {
      params: Promise.resolve({ id: 'help-req-1' }),
    });
    const patchPayload = (await patchResponse.json()) as { data: { status: string } };

    expect(patchResponse.status).toBe(200);
    expect(patchPayload.data.status).toBe('resolved');
  });

  it('lists session requests and accepts one with a meeting link', async () => {
    const listResponse = await getSessionRequests(makeJsonRequest('/api/faculty/session-requests'));
    const listPayload = (await listResponse.json()) as { data: Array<{ id: string }> };

    expect(listResponse.status).toBe(200);
    expect(listPayload.data.length).toBeGreaterThan(0);

    const requestId = listPayload.data[0]?.id;
    expect(requestId).toBeDefined();

    const response = await acceptSessionRequest(
      makeJsonRequest(`/api/faculty/session-requests/${requestId}/accept`, { meetingLink: 'https://meet.google.com/abc-defg-hij' }, 'POST'),
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
    const batchResponse = await getBatches(makeJsonRequest('/api/faculty/batches'));
    const batchPayload = (await batchResponse.json()) as { data: Array<{ id: string; nextSessionId: string }> };

    expect(batchResponse.status).toBe(200);
    expect(batchPayload.data.length).toBeGreaterThan(0);

    const batchId = batchPayload.data[0]?.id;
    const sessionId = batchPayload.data[0]?.nextSessionId;
    expect(batchId).toBeDefined();
    expect(sessionId).toBeDefined();

    const attendanceResponse = await getAttendance(
      makeJsonRequest(`/api/faculty/attendance?batchId=${batchId}&sessionId=${sessionId}`)
    );
    const attendancePayload = (await attendanceResponse.json()) as { data: { roster: Array<{ id: string; present: boolean }> } };

    expect(attendanceResponse.status).toBe(200);
    expect(attendancePayload.data.roster.length).toBeGreaterThan(0);

    const attendanceRecords = attendancePayload.data.roster.map((student, index) => ({
      studentId: student.id,
      present: index % 2 === 0,
    }));

    const response = await bulkAttendance(
      makeJsonRequest('/api/faculty/attendance', { batchId, sessionId, attendanceRecords }, 'POST')
    );
    const payload = (await response.json()) as { data: { saved: number } };

    expect(response.status).toBe(200);
    expect(payload.data.saved).toBe(attendanceRecords.length);
  });

  it('approves and requests revision for project reviews', async () => {
    const approveResponse = await approveProject(
      makeJsonRequest('/api/faculty/project-reviews/project-sub-1/approve', { notes: 'Looks good' }, 'POST'),
      {
        params: Promise.resolve({ id: 'project-sub-1' }),
      }
    );
    const approvePayload = (await approveResponse.json()) as { data: { status: string } };

    expect(approveResponse.status).toBe(200);
    expect(approvePayload.data.status).toBe('approved');

    const revisionResponse = await requestRevision(
      makeJsonRequest('/api/faculty/project-reviews/project-sub-1/request-revision', { notes: 'Please revise' }, 'POST'),
      {
        params: Promise.resolve({ id: 'project-sub-1' }),
      }
    );
    const revisionPayload = (await revisionResponse.json()) as { data: { status: string } };

    expect(revisionResponse.status).toBe(200);
    expect(revisionPayload.data.status).toBe('revision-requested');
  });

  it('lists live project reviews', async () => {
    const response = await getProjectReviews(makeJsonRequest('/api/faculty/project-reviews'));
    const payload = (await response.json()) as { data: Array<{ id: string }> };

    expect(response.status).toBe(200);
    expect(payload.data).toHaveLength(1);
  });
});
