import { NextRequest, NextResponse } from 'next/server';
import { describe, expect, it, vi, beforeEach } from 'vitest';

interface MockPredicateMetadata {
  op: string;
  col?: string;
  val?: unknown;
}

type MockPredicate = ((row: Record<string, unknown>) => boolean) & {
  meta?: MockPredicateMetadata;
  preds?: MockPredicateMetadata[];
};

interface MockTable {
  __table: string;
}

interface MockUserRow extends Record<string, unknown> {
  id: string;
  email: string;
  platform: string;
  isActive: boolean;
  deletedAt: Date | null;
}

const f = vi.hoisted(() => ({
  enquiryEmail: 'same@example.test',
  enquiryProgramId: 'prog-1',
  users: [] as MockUserRow[],
  batches: [{ id: 'batch-1', programId: 'prog-1', isActive: true, startDate: new Date('2026-01-01') }],
  lastUserPredicates: [] as Array<{ op: string; col?: string; val?: unknown }>,
  lastUserLimit: 0,
  txWrites: vi.fn(),
  insertedProfiles: [] as Array<Record<string, unknown>>,
  insertedAdmissions: [] as Array<Record<string, unknown>>,
  insertedEnrollments: [] as Array<Record<string, unknown>>,
  updatedEnquiries: [] as Array<Record<string, unknown>>,
  event: vi.fn(),
}));

vi.mock('bcryptjs', () => ({ default: { hash: vi.fn(async () => 'inert-fixture') } }));

vi.mock('drizzle-orm', () => ({
  eq: (col: { col: string }, val: unknown) => {
    const fn = (row: Record<string, unknown>) => row[col.col] === val;
    fn.meta = { op: 'eq', col: col.col, val };
    return fn;
  },
  isNull: (col: { col: string }) => {
    const fn = (row: Record<string, unknown>) => row[col.col] === null || row[col.col] === undefined;
    fn.meta = { op: 'isNull', col: col.col };
    return fn;
  },
  sql: (strings: TemplateStringsArray, ...values: Array<{ col: string } | string>) => {
    const raw = strings.join('');
    const colObj = typeof values[0] === 'object' ? values[0] : undefined;
    const targetVal = values[1];
    const fn = (row: Record<string, unknown>) => {
      if (raw.includes('lower(trim(') && colObj?.col) {
        return String(row[colObj.col] ?? '').trim().toLowerCase() === targetVal;
      }
      return false;
    };
    fn.meta = { op: 'lower_trim_eq', col: colObj?.col, val: targetVal };
    return fn;
  },
  and: (...preds: Array<MockPredicate | undefined>) => {
    const validPreds = preds.filter((predicate): predicate is MockPredicate => Boolean(predicate));
    const fn = (row: Record<string, unknown>) => validPreds.every((p) => p(row));
    fn.preds = validPreds.map((p) => p.meta ?? { op: 'unknown' });
    return fn;
  },
  desc: (col: { col: string }) => col,
}));

vi.mock('@quiz/events', () => ({
  PlatformEventTypes: { ADMISSION_COMPLETED: 'ADMISSION_COMPLETED' },
  publishEvent: f.event,
}));

vi.mock('@/lib/admin-bff', () => ({
  requireAdminOrForbidden: async () => null,
  jsonError: (error: string, status: number) => NextResponse.json({ error }, { status }),
  jsonData: (data: unknown, status: number = 200) => NextResponse.json(data, { status }),
}));

vi.mock('@/lib/skillup-admin-data', () => ({
  getAdminEnquiryDetail: async () => ({
    email: f.enquiryEmail,
    studentName: 'Fixture Student',
    programId: f.enquiryProgramId,
  }),
}));

vi.mock('@quiz/db-people', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@quiz/db-people')>();
  const makeTable = (tableName: string) =>
    new Proxy(
      { __table: tableName },
      {
        get: (target, prop) => {
          if (prop === '__table') return target.__table;
          return { table: tableName, col: String(prop) };
        },
      },
    );

  const createQueryBuilder = () => {
    let currentTable = '';
    let currentWhere: MockPredicate | null = null;
    const builder = {
      from: (table: MockTable) => {
        currentTable = table?.__table ?? '';
        return builder;
      },
      where: (pred: MockPredicate) => {
        currentWhere = pred;
        if (currentTable === 'users' && pred?.preds) {
          f.lastUserPredicates = pred.preds;
        }
        return builder;
      },
      orderBy: () => builder,
      limit: async (n: number) => {
        const dataset = currentTable === 'batches' ? f.batches : currentTable === 'users' ? f.users : [];
        if (currentTable === 'users') {
          f.lastUserLimit = n;
        }
        const predicate = currentWhere;
        const filtered = predicate ? dataset.filter((row) => predicate(row)) : dataset;
        return filtered.slice(0, n);
      },
    };
    return builder;
  };

  const insert = (table: MockTable) => ({
    values: (val: Record<string, unknown>) => {
      const tableName = table?.__table;
      if (tableName === 'userProfiles') f.insertedProfiles.push(val);
      if (tableName === 'admissions') f.insertedAdmissions.push(val);
      if (tableName === 'batchEnrollments') f.insertedEnrollments.push(val);
      return {
        onConflictDoNothing: async () => undefined,
        returning: () => ({
          then: async (resolve: (rows: Array<Record<string, unknown>>) => unknown) => resolve([{ id: `${tableName}-new-id`, ...val }]),
        }),
      };
    },
  });

  const update = (table: MockTable) => ({
    set: (val: Record<string, unknown>) => ({
      where: async () => {
        if (table?.__table === 'enquiries') f.updatedEnquiries.push(val);
      },
    }),
  });

  return {
    ...actual,
    normalizeEmail: actual.normalizeEmail,
    db: {
      select: () => createQueryBuilder(),
      insert,
      update,
      transaction: async <T>(fn: (tx: { select: typeof createQueryBuilder; insert: typeof insert; update: typeof update }) => Promise<T>) => {
        f.txWrites();
        return await fn({
          select: () => createQueryBuilder(),
          insert,
          update,
        });
      },
    },
    admissions: makeTable('admissions'),
    batchEnrollments: makeTable('batchEnrollments'),
    batches: makeTable('batches'),
    enquiries: makeTable('enquiries'),
    userProfiles: makeTable('userProfiles'),
    users: makeTable('users'),
  };
});

import { POST } from '../route';

describe('SkillUp admission tenant-scoped email & predicate controls (GM06 / FND11)', () => {
  beforeEach(() => {
    f.enquiryEmail = 'same@example.test';
    f.enquiryProgramId = 'prog-1';
    f.users = [];
    f.lastUserPredicates = [];
    f.lastUserLimit = 0;
    f.txWrites.mockClear();
    f.insertedProfiles = [];
    f.insertedAdmissions = [];
    f.insertedEnrollments = [];
    f.updatedEnquiries = [];
    f.event.mockReset().mockResolvedValue({});
  });

  it('rejects foreign-platform-only email match with 409 and zero writes/events', async () => {
    f.users = [
      {
        id: 'rth-user-1',
        email: 'same@example.test',
        platform: 'realtutorialhub',
        isActive: true,
        deletedAt: null,
      },
    ];

    const response = await POST(
      new NextRequest('http://localhost/api/admin/crm/enquiries/e/admit', { method: 'POST' }),
      { params: Promise.resolve({ id: 'e' }) },
    );

    expect(response.status).toBe(409);
    expect(f.lastUserPredicates).toEqual([
      { op: 'lower_trim_eq', col: 'email', val: 'same@example.test' },
      { op: 'eq', col: 'platform', val: 'skillup' },
      { op: 'eq', col: 'isActive', val: true },
      { op: 'isNull', col: 'deletedAt' },
    ]);
    expect(f.lastUserLimit).toBeGreaterThanOrEqual(2);
    expect(f.txWrites).not.toHaveBeenCalled();
    expect(f.insertedAdmissions).toHaveLength(0);
    expect(f.event).not.toHaveBeenCalled();
  });

  it('admits when a unique active SkillUp account exists (with mixed-case/whitespace email normalization)', async () => {
    f.enquiryEmail = '  Same.User@Example.TEST  ';
    f.users = [
      {
        id: 'skillup-user-1',
        email: 'same.user@example.test',
        platform: 'skillup',
        isActive: true,
        deletedAt: null,
      },
    ];

    const response = await POST(
      new NextRequest('http://localhost/api/admin/crm/enquiries/e/admit', { method: 'POST' }),
      { params: Promise.resolve({ id: 'e' }) },
    );

    expect(response.status).toBe(200);
    expect(f.lastUserPredicates).toContainEqual({
      op: 'lower_trim_eq',
      col: 'email',
      val: 'same.user@example.test',
    });
    expect(f.txWrites).toHaveBeenCalledTimes(1);
    expect(f.insertedProfiles[0]).toMatchObject({ userId: 'skillup-user-1' });
    expect(f.insertedAdmissions[0]).toMatchObject({ studentUserId: 'skillup-user-1' });
    expect(f.insertedEnrollments[0]).toMatchObject({ studentUserId: 'skillup-user-1' });
    expect(f.event).toHaveBeenCalledTimes(1);
  });

  it('selects only the SkillUp account when independent equal-email accounts exist on both RTH and SkillUp', async () => {
    f.users = [
      {
        id: 'rth-foreign-user',
        email: 'same@example.test',
        platform: 'realtutorialhub',
        isActive: true,
        deletedAt: null,
      },
      {
        id: 'skillup-local-user',
        email: 'same@example.test',
        platform: 'skillup',
        isActive: true,
        deletedAt: null,
      },
    ];

    const response = await POST(
      new NextRequest('http://localhost/api/admin/crm/enquiries/e/admit', { method: 'POST' }),
      { params: Promise.resolve({ id: 'e' }) },
    );

    expect(response.status).toBe(200);
    expect(f.insertedAdmissions).toHaveLength(1);
    expect(f.insertedAdmissions[0].studentUserId).toBe('skillup-local-user');
    expect(f.insertedAdmissions[0].studentUserId).not.toBe('rth-foreign-user');
    expect(f.event).toHaveBeenCalledTimes(1);
  });

  it('rejects soft-deleted or inactive SkillUp accounts with 409 and zero writes/events', async () => {
    f.users = [
      {
        id: 'skillup-deleted-user',
        email: 'same@example.test',
        platform: 'skillup',
        isActive: true,
        deletedAt: new Date('2026-02-01T00:00:00Z'),
      },
      {
        id: 'skillup-inactive-user',
        email: 'same@example.test',
        platform: 'skillup',
        isActive: false,
        deletedAt: null,
      },
    ];

    const response = await POST(
      new NextRequest('http://localhost/api/admin/crm/enquiries/e/admit', { method: 'POST' }),
      { params: Promise.resolve({ id: 'e' }) },
    );

    expect(response.status).toBe(409);
    expect(f.txWrites).not.toHaveBeenCalled();
    expect(f.insertedAdmissions).toHaveLength(0);
    expect(f.event).not.toHaveBeenCalled();
  });

  it('rejects ambiguous duplicate active SkillUp accounts with 409 and zero writes/events', async () => {
    f.users = [
      {
        id: 'skillup-dup-1',
        email: 'same@example.test',
        platform: 'skillup',
        isActive: true,
        deletedAt: null,
      },
      {
        id: 'skillup-dup-2',
        email: 'same@example.test',
        platform: 'skillup',
        isActive: true,
        deletedAt: null,
      },
    ];

    const response = await POST(
      new NextRequest('http://localhost/api/admin/crm/enquiries/e/admit', { method: 'POST' }),
      { params: Promise.resolve({ id: 'e' }) },
    );

    expect(response.status).toBe(409);
    expect(f.txWrites).not.toHaveBeenCalled();
    expect(f.insertedAdmissions).toHaveLength(0);
    expect(f.event).not.toHaveBeenCalled();
  });
});
