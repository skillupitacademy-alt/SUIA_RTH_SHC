import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  usersFindFirstMock,
  rolesFindFirstMock,
  verificationTokensFindFirstMock,
  passwordResetTokensFindFirstMock,
  insertReturningMock,
  insertValuesMock,
  insertMock,
  updateWhereMock,
  updateSetMock,
  updateMock,
  deleteWhereMock,
  deleteMock,
} = vi.hoisted(() => {
  const _insertReturningMock = vi.fn();
  const _insertValuesMock = vi.fn(() => ({ returning: _insertReturningMock }));
  const _updateWhereMock = vi.fn();
  const _updateSetMock = vi.fn(() => ({ where: _updateWhereMock }));
  const _deleteWhereMock = vi.fn();
  return {
    usersFindFirstMock: vi.fn(),
    rolesFindFirstMock: vi.fn(),
    verificationTokensFindFirstMock: vi.fn(),
    passwordResetTokensFindFirstMock: vi.fn(),
    insertReturningMock: _insertReturningMock,
    insertValuesMock: _insertValuesMock,
    insertMock: vi.fn(() => ({ values: _insertValuesMock })),
    updateWhereMock: _updateWhereMock,
    updateSetMock: _updateSetMock,
    updateMock: vi.fn(() => ({ set: _updateSetMock })),
    deleteWhereMock: _deleteWhereMock,
    deleteMock: vi.fn(() => ({ where: _deleteWhereMock })),
  };
});

vi.mock('@quiz/db', () => ({
  db: {
    query: {
      users: { findFirst: usersFindFirstMock },
      roles: { findFirst: rolesFindFirstMock },
      verificationTokens: { findFirst: verificationTokensFindFirstMock },
      passwordResetTokens: { findFirst: passwordResetTokensFindFirstMock },
    },
    insert: insertMock,
    update: updateMock,
    delete: deleteMock,
  },
  users: { id: 'users.id', email: 'users.email' },
  roles: { id: 'roles.id', name: 'roles.name' },
  userProfiles: { userId: 'userProfiles.userId', name: 'userProfiles.name' },
  userRoles: { userId: 'userRoles.userId', roleId: 'userRoles.roleId' },
  verificationTokens: { id: 'verificationTokens.id', token: 'verificationTokens.token' },
  passwordResetTokens: { id: 'passwordResetTokens.id', token: 'passwordResetTokens.token', expiresAt: 'passwordResetTokens.expiresAt' },
}));

import { UserRepository } from '../user.repository';

describe('UserRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usersFindFirstMock.mockResolvedValue({ id: 'u1', email: 'a@b.com' });
    rolesFindFirstMock.mockResolvedValue({ id: 'r1' });
    verificationTokensFindFirstMock.mockResolvedValue({ id: 'v1' });
    passwordResetTokensFindFirstMock.mockResolvedValue({ id: 'pr1' });
    insertReturningMock.mockResolvedValue([{ id: 'u1', email: 'a@b.com' }]);
  });

  it('covers all user repository methods', async () => {
    const repo = new UserRepository();
    await expect(repo.findByEmail('a@b.com')).resolves.toEqual({ id: 'u1', email: 'a@b.com' });
    await expect(repo.findWithDetails('a@b.com')).resolves.toEqual({ id: 'u1', email: 'a@b.com' });
    await expect(repo.findByIdWithDetails('u1')).resolves.toEqual({ id: 'u1', email: 'a@b.com' });
    await expect(repo.updateLastActive('u1', new Date())).resolves.toBeUndefined();
    await expect(repo.create({ email: 'a@b.com', passwordHash: 'h', name: 'John' })).resolves.toEqual({ id: 'u1', email: 'a@b.com' });
    await expect(repo.assignRole('u1', 'ADMIN')).resolves.toBeUndefined();

    rolesFindFirstMock.mockResolvedValueOnce(undefined);
    await expect(repo.assignRole('u1', 'MISSING')).resolves.toBeUndefined();

    await expect(repo.verifyEmail('u1')).resolves.toBeUndefined();
    await expect(repo.findToken('tok')).resolves.toEqual({ id: 'v1' });
    await expect(repo.deleteToken('v1')).resolves.toBeUndefined();
    await expect(repo.createToken('u1', 'tok', new Date())).resolves.toBeUndefined();
    await expect(repo.createResetToken('u1', 'rtok', new Date())).resolves.toBeUndefined();
    await expect(repo.findResetToken('rtok')).resolves.toEqual({ id: 'pr1' });
    await expect(repo.deleteResetToken('pr1')).resolves.toBeUndefined();
    await expect(repo.updatePassword('u1', 'h2')).resolves.toBeUndefined();
  });
});
