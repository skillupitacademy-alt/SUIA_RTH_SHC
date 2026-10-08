import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  certificateRows: [] as Array<Record<string, unknown>>,
  profileRows: [] as Array<Record<string, unknown>>,
  certificatesTable: {},
  userProfilesTable: {},
}));

vi.mock('@quiz/db-tutorial', () => ({
  certificates: state.certificatesTable,
  db: {
    select: vi.fn(() => ({
      from: vi.fn((table: unknown) => ({
        where: vi.fn(async () => (table === state.certificatesTable ? state.certificateRows : [])),
      })),
    })),
  },
}));

vi.mock('@quiz/db', () => ({
  userProfiles: state.userProfilesTable,
  db: {
    select: vi.fn(() => ({
      from: vi.fn((table: unknown) => ({
        where: vi.fn(async () => (table === state.userProfilesTable ? state.profileRows : [])),
      })),
    })),
  },
}));

import { GET } from '../route';

const verificationCode = crypto.randomUUID();

const makeRequest = () =>
  new NextRequest(`http://localhost/api/certificates/verify/${verificationCode}`, { method: 'GET' });

describe('certificate verify route', () => {
  beforeEach(() => {
    state.certificateRows = [];
    state.profileRows = [];
  });

  it('returns certificate data for a valid verification code', async () => {
    state.certificateRows = [
      {
        id: 'certificate-1',
        userId: 'user-1',
        scope: 'topic',
        parentName: 'Topic One',
        verificationCode,
        issuedAt: new Date('2026-01-01T00:00:00.000Z'),
        deletedAt: null,
      },
    ];
    state.profileRows = [{ name: 'Student One' }];

    const response = await GET(makeRequest(), { params: Promise.resolve({ verificationCode }) });

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=86400');
    await expect(response.json()).resolves.toMatchObject({
      studentName: 'Student One',
      courseName: 'Topic One',
      scope: 'topic',
      valid: true,
    });
  });

  it('returns 404 for unknown verification codes', async () => {
    const response = await GET(makeRequest(), { params: Promise.resolve({ verificationCode }) });

    expect(response.status).toBe(404);
  });

  it('returns 400 for invalid verification codes', async () => {
    const response = await GET(new NextRequest('http://localhost/api/certificates/verify/not-a-code', { method: 'GET' }), {
      params: Promise.resolve({ verificationCode: '' }),
    });

    expect(response.status).toBe(400);
  });
});
