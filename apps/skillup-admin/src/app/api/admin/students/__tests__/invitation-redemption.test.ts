import { beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';

import {
  clearStudentInvitationsForTests,
  issueStudentInvitation,
  normalizeStudentEmail,
  STUDENT_INVITATION_TTL_HOURS,
  STUDENT_INVITATION_TTL_MS,
} from '@/lib/student-invitation';

interface MockUser {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  platform: string;
  isActive: boolean;
  deletedAt: Date | null;
}

const mockUsers: MockUser[] = [];
const mockAdmissions: any[] = [];
const mockProfiles: any[] = [];
const mockEnquiries: any[] = [];

vi.mock('@quiz/events', () => ({
  PlatformEventTypes: {
    STUDENT_ENROLLED: 'student.enrolled',
    ADMISSION_COMPLETED: 'admission.completed',
    PAYMENT_RECEIVED: 'payment.received',
    PAYMENT_OVERDUE: 'payment.overdue',
  },
  publishEvent: vi.fn().mockResolvedValue({ messageId: 'msg-1', envelope: {} }),
}));

vi.mock('@upstash/redis', () => ({
  Redis: class {
    hgetall = vi.fn().mockResolvedValue({ capacity: 50, enrolled: 10 });
    hset = vi.fn().mockResolvedValue(1);
    hincrby = vi.fn().mockResolvedValue(11);
    expire = vi.fn().mockResolvedValue(1);
    eval = vi.fn().mockResolvedValue(1);
    get = vi.fn().mockResolvedValue(null);
    set = vi.fn().mockResolvedValue('OK');
    del = vi.fn().mockResolvedValue(1);
    constructor() {}
  },
}));

vi.mock('@quiz/db-people', () => ({
  users: {},
  admissions: {},
  enquiries: {},
  userProfiles: {},
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn((_whereClause: any) => ({
          limit: vi.fn(async (_n: number) => {
            // Find existing skillup user by normalized email
            return mockUsers
              .filter((u) => u.platform === 'skillup' && u.deletedAt === null)
              .map((u) => ({ id: u.id, email: u.email }));
          }),
        })),
      })),
    })),
    insert: vi.fn((table: any) => ({
      values: vi.fn((vals: any) => ({
        returning: vi.fn(async () => {
          if (vals.email && vals.passwordHash) {
            const newUser: MockUser = {
              id: crypto.randomUUID(),
              email: vals.email,
              passwordHash: vals.passwordHash,
              role: vals.role ?? 'student',
              platform: vals.platform ?? 'skillup',
              isActive: vals.isActive ?? true,
              deletedAt: vals.deletedAt ?? null,
            };
            mockUsers.push(newUser);
            return [{ id: newUser.id }];
          }
          if (vals.fullName) {
            const enq = { id: crypto.randomUUID(), ...vals };
            mockEnquiries.push(enq);
            return [{ id: enq.id }];
          }
          if (vals.enquiryId && vals.studentUserId) {
            const adm = { id: crypto.randomUUID(), ...vals };
            mockAdmissions.push(adm);
            return [adm];
          }
          if (vals.userId && vals.name) {
            mockProfiles.push(vals);
            return [vals];
          }
          return [{ id: crypto.randomUUID() }];
        }),
      })),
    })),
    update: vi.fn((table: any) => ({
      set: vi.fn((updateVals: any) => ({
        where: vi.fn(async () => {
          if (updateVals.passwordHash) {
            for (const user of mockUsers) {
              user.passwordHash = updateVals.passwordHash;
              if (updateVals.isActive !== undefined) {
                user.isActive = updateVals.isActive;
              }
            }
          }
          if (updateVals.documents) {
            for (const adm of mockAdmissions) {
              adm.documents = updateVals.documents;
            }
          }
        }),
      })),
    })),
  },
}));

import { POST as postCreateStudent } from '../route';
import { POST as postRedeemInvitation } from '../invite/redeem/route';

const makeAdminRequest = (url: string, body: unknown) =>
  new Request(`http://localhost${url}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-user-roles': 'admin',
    },
    body: JSON.stringify(body),
  });

const makePublicRequest = (url: string, body: unknown) =>
  new Request(`http://localhost${url}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

describe('TC08 / FND11 / FND16 — Student Invitation Provisioning & Single-Use Redemption Probes', () => {
  beforeEach(() => {
    clearStudentInvitationsForTests();
    mockUsers.length = 0;
    mockAdmissions.length = 0;
    mockProfiles.length = 0;
    mockEnquiries.length = 0;
    vi.clearAllMocks();
  });

  it('prohibits static default passwords and generates random bootstrap hashes with 72h token expiry', async () => {
    const rawEmail = 'NewStudent.Probe@SkillUp.Org';
    const req = makeAdminRequest('/api/admin/students', {
      name: 'Alice Learner',
      email: rawEmail,
      batchId: 'batch-2026-a',
      batchName: 'Batch 2026 A',
    });

    const res = await postCreateStudent(req as any);
    expect(res.status).toBe(201);
    const { data: body } = await res.json();

    // 1. Verify normalized email
    const expectedEmail = 'newstudent.probe@skillup.org';
    expect(body.email).toBe(expectedEmail);

    // 2. Verify student was created in DB
    expect(mockUsers).toHaveLength(1);
    const createdUser = mockUsers[0]!;
    expect(createdUser.email).toBe(expectedEmail);
    expect(createdUser.platform).toBe('skillup');

    // 3. Verify bootstrap password is NOT 'SkillUp@2025' or plain text
    expect(createdUser.passwordHash).not.toBe('SkillUp@2025');
    const isStaticSkillupPassword = await bcrypt.compare('SkillUp@2025', createdUser.passwordHash);
    expect(isStaticSkillupPassword).toBe(false);

    // 4. Verify invitation token and 72h TTL
    expect(body.invitation).toBeDefined();
    expect(body.invitation.invitationToken).toMatch(/^sku_inv_/);
    const expiresAt = new Date(body.invitation.expiresAt).getTime();
    const now = Date.now();
    const diffHours = (expiresAt - now) / (1000 * 60 * 60);
    expect(Math.round(diffHours)).toBe(STUDENT_INVITATION_TTL_HOURS);
  });

  it('enforces platform-scoped email uniqueness (409 on duplicate active SkillUp account)', async () => {
    // Seed an existing active SkillUp account
    mockUsers.push({
      id: crypto.randomUUID(),
      email: 'existing.student@skillup.org',
      passwordHash: 'hash',
      role: 'student',
      platform: 'skillup',
      isActive: true,
      deletedAt: null,
    });

    const req = makeAdminRequest('/api/admin/students', {
      name: 'Duplicate Student',
      email: 'EXISTING.STUDENT@skillup.org',
      batchId: 'batch-2026-b',
      batchName: 'Batch 2026 B',
    });

    const res = await postCreateStudent(req as any);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain('active SkillUp account already exists');
  });

  it('rejects attempt to set newPassword to static default SkillUp@2025 with 400', async () => {
    const issued = issueStudentInvitation({
      userId: 'usr-1',
      email: 'student.test@skillup.org',
    });

    const req = makePublicRequest('/api/admin/students/invite/redeem', {
      invitationToken: issued.invitationToken,
      email: 'student.test@skillup.org',
      newPassword: 'SkillUp@2025', // Prohibited static default password
    });

    const res = await postRedeemInvitation(req as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(JSON.stringify(body)).toContain('Static default passwords are prohibited');
  });

  it('rejects weak passwords shorter than 10 characters with 400', async () => {
    const issued = issueStudentInvitation({
      userId: 'usr-2',
      email: 'student2.test@skillup.org',
    });

    const req = makePublicRequest('/api/admin/students/invite/redeem', {
      invitationToken: issued.invitationToken,
      email: 'student2.test@skillup.org',
      newPassword: 'Short1!',
    });

    const res = await postRedeemInvitation(req as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(JSON.stringify(body)).toContain('at least 10 characters');
  });

  it('redeems token successfully and activates student account with status 200', async () => {
    mockUsers.push({
      id: 'usr-active-3',
      email: 'student3.test@skillup.org',
      passwordHash: 'old-random-hash',
      role: 'student',
      platform: 'skillup',
      isActive: false,
      deletedAt: null,
    });

    const issued = issueStudentInvitation({
      userId: 'usr-active-3',
      email: 'student3.test@skillup.org',
    });

    const strongPassword = 'Strong-User-Password-2026!';
    const req = makePublicRequest('/api/admin/students/invite/redeem', {
      invitationToken: issued.invitationToken,
      email: 'student3.test@skillup.org',
      newPassword: strongPassword,
    });

    const res = await postRedeemInvitation(req as any);
    expect(res.status).toBe(200);
    const { data: body } = await res.json();
    expect(body.status).toBe('activated');
    expect(body.userId).toBe('usr-active-3');

    // Verify user in DB has new password hash and isActive: true
    const updatedUser = mockUsers.find((u) => u.id === 'usr-active-3')!;
    expect(updatedUser.isActive).toBe(true);
    const passwordMatches = await bcrypt.compare(strongPassword, updatedUser.passwordHash);
    expect(passwordMatches).toBe(true);
  });

  it('rejects replay attack (already-redeemed token) with 409', async () => {
    const issued = issueStudentInvitation({
      userId: 'usr-replay-4',
      email: 'student4.test@skillup.org',
    });

    const strongPassword = 'Strong-User-Password-2026!';

    // First redemption succeeds
    const req1 = makePublicRequest('/api/admin/students/invite/redeem', {
      invitationToken: issued.invitationToken,
      email: 'student4.test@skillup.org',
      newPassword: strongPassword,
    });
    const res1 = await postRedeemInvitation(req1 as any);
    expect(res1.status).toBe(200);

    // Second redemption attempt with same token must be rejected with 409
    const req2 = makePublicRequest('/api/admin/students/invite/redeem', {
      invitationToken: issued.invitationToken,
      email: 'student4.test@skillup.org',
      newPassword: 'AnotherStrongPassword2026!',
    });
    const res2 = await postRedeemInvitation(req2 as any);
    expect(res2.status).toBe(409);
    const body2 = await res2.json();
    expect(body2.error).toContain('already-redeemed');
  });

  it('rejects expired invitation token with 410', async () => {
    // Issue token with past timestamp (expired)
    const issued = issueStudentInvitation({
      userId: 'usr-exp-5',
      email: 'student5.test@skillup.org',
      now: new Date(Date.now() - STUDENT_INVITATION_TTL_MS - 60_000), // 72h + 1m in the past
    });

    const req = makePublicRequest('/api/admin/students/invite/redeem', {
      invitationToken: issued.invitationToken,
      email: 'student5.test@skillup.org',
      newPassword: 'Strong-User-Password-2026!',
    });

    const res = await postRedeemInvitation(req as any);
    expect(res.status).toBe(410);
    const body = await res.json();
    expect(body.error).toContain('expired');
  });

  it('rejects invalid or tampered token with 401', async () => {
    const req = makePublicRequest('/api/admin/students/invite/redeem', {
      invitationToken: 'sku_inv_invalid_tampered_token_sequence_12345',
      email: 'student6.test@skillup.org',
      newPassword: 'Strong-User-Password-2026!',
    });

    const res = await postRedeemInvitation(req as any);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('invalid-token');
  });

  it('denies cross-tenant redemption attempts with 403', async () => {
    const issued = issueStudentInvitation({
      userId: 'usr-tenant-7',
      email: 'student7.test@skillup.org',
    });

    const req = makePublicRequest('/api/admin/students/invite/redeem', {
      invitationToken: issued.invitationToken,
      email: 'student7.test@skillup.org',
      newPassword: 'Strong-User-Password-2026!',
      platform: 'realtutorialhub', // Cross-tenant attempt
    });

    const res = await postRedeemInvitation(req as any);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('Cross-tenant');
  });
});
