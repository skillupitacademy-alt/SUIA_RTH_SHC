import { beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

import {
  clearStudentInvitationsForTests,
  issueStudentInvitation,
  STUDENT_INVITATION_TTL_HOURS,
  STUDENT_INVITATION_TTL_MS,
} from '@/lib/student-invitation';

type InvitationPort = import('@/lib/student-invitation').IsolatedTestInvitationRepositoryPort;

interface MockWriteValues {
  email?: string;
  passwordHash?: string;
  role?: string;
  platform?: string;
  isActive?: boolean;
  fullName?: string;
  enquiryId?: string;
  studentUserId?: string;
  userId?: string;
  name?: string;
  documents?: unknown;
}

interface MockUser {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  platform: string;
  isActive: boolean;
  deletedAt: Date | null;
}

const mocks = vi.hoisted(() => {
  const mockUsers: MockUser[] = [];
  const mockAdmissions: Array<MockWriteValues & { id: string }> = [];
  const mockEnquiries: Array<MockWriteValues & { id: string }> = [];
  const mockProfiles: MockWriteValues[] = [];
  const flags = {
    nextUserUpdateShouldThrow: false,
    nextUserUpdateZeroRows: false,
  };

  const mockDb = {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => mockUsers.filter((u) => u.platform === 'skillup' && !u.deletedAt)),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn((vals: MockWriteValues) => ({
        returning: vi.fn(async () => {
          if (vals.email && vals.passwordHash) {
            const newUser: MockUser = {
              id: crypto.randomUUID(),
              email: vals.email,
              passwordHash: vals.passwordHash,
              role: vals.role ?? 'student',
              platform: vals.platform ?? 'skillup',
              isActive: vals.isActive ?? true,
              deletedAt: null,
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
    update: vi.fn(() => ({
      set: vi.fn((updateVals: MockWriteValues) => ({
        where: vi.fn(() => ({
          returning: vi.fn(async () => {
            if (updateVals.passwordHash) {
              if (flags.nextUserUpdateShouldThrow) {
                flags.nextUserUpdateShouldThrow = false;
                throw new Error('Simulated DB password update failure');
              }
              if (flags.nextUserUpdateZeroRows) {
                flags.nextUserUpdateZeroRows = false;
                return [];
              }
              for (const user of mockUsers) {
                user.passwordHash = updateVals.passwordHash;
                if (updateVals.isActive !== undefined) {
                  user.isActive = updateVals.isActive;
                }
              }
              return mockUsers.length > 0 ? mockUsers.map((u) => ({ id: u.id })) : [{ id: 'user-id' }];
            }
            if (updateVals.documents) {
              for (const adm of mockAdmissions) {
                adm.documents = updateVals.documents;
              }
            }
            return [{ id: 'updated' }];
          }),
        })),
      })),
    })),
    createInvitation: vi.fn(async (input: Parameters<InvitationPort['createInvitation']>[0]) => {
      const { issueStudentInvitation } = await import('@/lib/student-invitation');
      return issueStudentInvitation(input);
    }),
    claimForRedemption: vi.fn(async (input: Parameters<InvitationPort['claimForRedemption']>[0]) => {
      const { claimStudentInvitationForRedemption } = await import('@/lib/student-invitation');
      return claimStudentInvitationForRedemption(input);
    }),
    redeemAtomic: vi.fn(async (input: Parameters<InvitationPort['redeemAtomic']>[0]) => {
      const { commitStudentInvitationRedemption } = await import('@/lib/student-invitation');
      return commitStudentInvitationRedemption(input);
    }),
    releaseClaim: vi.fn(async (input: Parameters<InvitationPort['releaseClaim']>[0]) => {
      const { releaseStudentInvitationClaim } = await import('@/lib/student-invitation');
      return releaseStudentInvitationClaim(input);
    }),
    transaction: vi.fn(async <T>(cb: (tx: object) => Promise<T>): Promise<T> => cb(mockDb)),
  };

  return { mockUsers, mockAdmissions, mockEnquiries, mockProfiles, flags, mockDb };
});

const { mockUsers, mockAdmissions, mockEnquiries, mockProfiles, flags } = mocks;

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
  studentInvitations: { id: 'id', status: 'status', claimOwnerToken: 'claimOwnerToken' },
  db: mocks.mockDb,
}));

import { POST as postCreateStudent } from '../route';
import { POST as postRedeemInvitation } from '../invite/redeem/route';

const makeAdminRequest = (url: string, body: unknown) =>
  new NextRequest(`http://localhost${url}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-user-roles': 'admin',
    },
    body: JSON.stringify(body),
  });

const makePublicRequest = (url: string, body: unknown) =>
  new NextRequest(`http://localhost${url}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

describe('TC08 / FND11 / FND16 — Student Invitation Provisioning & Single-Use Redemption Probes', () => {
  beforeEach(() => {
    clearStudentInvitationsForTests();
    flags.nextUserUpdateShouldThrow = false;
    flags.nextUserUpdateZeroRows = false;
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

    const res = await postCreateStudent(req);
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

    const res = await postCreateStudent(req);
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

    const res = await postRedeemInvitation(req);
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

    const res = await postRedeemInvitation(req);
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

    const res = await postRedeemInvitation(req);
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
    const res1 = await postRedeemInvitation(req1);
    expect(res1.status).toBe(200);

    // Second redemption attempt with same token must be rejected with 409
    const req2 = makePublicRequest('/api/admin/students/invite/redeem', {
      invitationToken: issued.invitationToken,
      email: 'student4.test@skillup.org',
      newPassword: 'AnotherStrongPassword2026!',
    });
    const res2 = await postRedeemInvitation(req2);
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

    const res = await postRedeemInvitation(req);
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

    const res = await postRedeemInvitation(req);
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

    const res = await postRedeemInvitation(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('Cross-tenant');
  });

  it('S3: survives fresh module instances (vi.resetModules), releases claim when password update throws so retry succeeds (200), and rejects 0 affected rows with 404', async () => {
    mockUsers.push({
      id: 'usr-s3-atomic',
      email: 'atomic.student@skillup.org',
      passwordHash: 'old-hash',
      role: 'student',
      platform: 'skillup',
      isActive: false,
      deletedAt: null,
    });

    const issued = issueStudentInvitation({
      userId: 'usr-s3-atomic',
      email: 'atomic.student@skillup.org',
    });

    // 1. Verify issued invitation survives fresh module instance (vi.resetModules)
    vi.resetModules();
    const freshInvitationLib = await import('@/lib/student-invitation');
    const persistedRecord = freshInvitationLib.getStudentInvitationById(issued.record.invitationId);
    expect(persistedRecord).toBeDefined();
    expect(persistedRecord?.status).toBe('pending');

    // 2. Zero affected account rows must fail closed (404) and NOT consume the invitation
    flags.nextUserUpdateZeroRows = true;
    const zeroRowReq = makePublicRequest('/api/admin/students/invite/redeem', {
      invitationToken: issued.invitationToken,
      email: 'atomic.student@skillup.org',
      newPassword: 'Strong-User-Password-2026!',
    });
    const zeroRowRes = await postRedeemInvitation(zeroRowReq);
    expect(zeroRowRes.status).toBe(404);
    expect(freshInvitationLib.getStudentInvitationById(issued.record.invitationId)?.status).toBe('pending');

    // 3. Transient DB throw during password update must release claim so subsequent retry succeeds (200)
    flags.nextUserUpdateShouldThrow = true;
    const throwReq = makePublicRequest('/api/admin/students/invite/redeem', {
      invitationToken: issued.invitationToken,
      email: 'atomic.student@skillup.org',
      newPassword: 'Strong-User-Password-2026!',
    });
    await expect(postRedeemInvitation(throwReq)).rejects.toThrow('Simulated DB password update failure');
    expect(freshInvitationLib.getStudentInvitationById(issued.record.invitationId)?.status).toBe('pending');

    // 4. Subsequent retry succeeds with 200 and commits status = 'redeemed'
    const retryReq = makePublicRequest('/api/admin/students/invite/redeem', {
      invitationToken: issued.invitationToken,
      email: 'atomic.student@skillup.org',
      newPassword: 'Strong-User-Password-2026!',
    });
    const retryRes = await postRedeemInvitation(retryReq);
    expect(retryRes.status).toBe(200);
    expect(freshInvitationLib.getStudentInvitationById(issued.record.invitationId)?.status).toBe('redeemed');
  });
});
