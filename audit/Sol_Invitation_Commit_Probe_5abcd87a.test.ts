import { expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ failUpdate: false, affected: 1 }));
vi.mock('@quiz/db-people', () => ({
  users: { id: 'id', platform: 'platform', deletedAt: 'deletedAt' },
  admissions: { studentUserId: 'studentUserId' },
  db: { update: () => ({ set: () => ({ where: async () => {
    if (state.failUpdate) throw new Error('synthetic DB failure');
    return { rowCount: state.affected };
  } }) }) },
}));
vi.mock('drizzle-orm', () => ({ and: (...values: unknown[]) => values, eq: (...values: unknown[]) => values, isNull: (value: unknown) => value }));
vi.mock('@/lib/admin-bff', () => ({
  parseJsonOrFormBody: async (request: Request) => ({ ok: true, data: await request.json() }),
  jsonData: (data: unknown, status: number) => Response.json({ data }, { status }),
  jsonError: (error: string, status: number) => Response.json({ error }, { status }),
}));

import { issueStudentInvitation } from '../apps/skillup-admin/src/lib/student-invitation';
import { POST } from '../apps/skillup-admin/src/app/api/admin/students/invite/redeem/route';

function request(token: string) {
  return new Request('https://fixture.invalid/api/admin/students/invite/redeem', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ invitationToken: token, email: 'learner@example.invalid', newPassword: 'Fixture-Password-2026!', platform: 'skillup' }),
  }) as Parameters<typeof POST>[0];
}

it('a valid invitation with a successful account update returns activation', async () => {
  const invitation = issueStudentInvitation({ userId: 'positive-learner', email: 'learner@example.invalid' });
  state.failUpdate = false;
  state.affected = 1;
  expect((await POST(request(invitation.invitationToken))).status).toBe(200);
});

it('a failed password persistence does not irreversibly consume the invitation', async () => {
  const invitation = issueStudentInvitation({ userId: 'retry-learner', email: 'learner@example.invalid' });
  state.failUpdate = true;
  try { await POST(request(invitation.invitationToken)); } catch { /* Retryable DB failure expected. */ }
  state.failUpdate = false;
  state.affected = 1;
  expect((await POST(request(invitation.invitationToken))).status).toBe(200);
});

it('zero affected account rows cannot be reported as successful activation', async () => {
  const invitation = issueStudentInvitation({ userId: 'absent-learner', email: 'learner@example.invalid' });
  state.failUpdate = false;
  state.affected = 0;
  expect((await POST(request(invitation.invitationToken))).status).not.toBe(200);
});
