import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';
const h = vi.hoisted(() => ({ results: [] as unknown[][], calls: [] as Array<{ kind: string; table?: unknown; condition?: unknown }> }));
vi.mock('@quiz/db-people', async () => {
  const schema = await import('../../../../../packages/db-people/src/schema');
  return { ...schema, db: { select: () => {
    const rows = h.results.shift() ?? [];
    const chain = {
      from: (table: unknown) => { h.calls.push({ kind: 'from', table }); return chain; },
      leftJoin: (table: unknown, condition: unknown) => { h.calls.push({ kind: 'join', table, condition }); return chain; },
      innerJoin: (table: unknown, condition: unknown) => { h.calls.push({ kind: 'join', table, condition }); return chain; },
      where: (condition: unknown) => { h.calls.push({ kind: 'where', condition }); return chain; },
      orderBy: () => chain,
      limit: (count: number) => { h.calls.push({ kind: `limit:${count}` }); return Promise.resolve(rows); },
      then: (resolve: (value: unknown[]) => unknown) => Promise.resolve(rows).then(resolve),
    };
    return chain;
  } } };
});
import { getAdminStudentDetail, StudentReportingConflictError } from '../skillup-admin-data';
import { GET } from '../../app/api/admin/students/[id]/route';
import { NextRequest } from 'next/server';
const personId = '22222222-2222-4222-8222-222222222222';
const enquiryId = '33333333-3333-4333-8333-333333333333';
const row = { userId: personId, email: 'same@example.test', name: 'SUIA fixture', enquiryId, batchId: null, batchName: null, admissionStatus: 'approved' };
const compile = (condition: unknown) => new PgDialect().sqlToQuery(condition as SQL);

beforeEach(() => { h.results = []; h.calls = []; });
describe('SUIA person/admission/enquiry identity association', () => {
  it('rejects a caller without administrative admission before querying a person UUID', async () => {
    const response = await GET(new NextRequest('http://skillup.localhost:3010/api/admin/students/fixture'), { params: Promise.resolve({ id: personId }) });
    expect(response.status).toBe(403);
    expect(h.calls).toHaveLength(0);
  });

  it('returns a safe conflict to an admitted administrator for ambiguous associations', async () => {
    h.results = [[row, row]];
    const response = await GET(new NextRequest('http://skillup.localhost:3010/api/admin/students/fixture', { headers: { 'x-user-roles': 'admin' } }), { params: Promise.resolve({ id: personId }) });
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'Student association requires review' });
  });

  it('returns the UUID-associated report to the existing admitted SUIA administrator boundary', async () => {
    h.results = [[row], [{ name: 'Assigned counsellor' }], [], [], []];
    const response = await GET(new NextRequest('http://skillup.localhost:3010/api/admin/students/fixture', { headers: { 'x-user-roles': 'admin' } }), { params: Promise.resolve({ id: personId }) });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ data: { userId: personId, enquiryId, counselor: 'Assigned counsellor' } });
  });
  it('joins the selected person to its admission/enquiry UUID and resolves assigned counsellor UUID', async () => {
    // Operational dependencies return controlled empty rows and have no live adapters.
    h.results = [[row], [{ name: 'Assigned counsellor' }], [], [], []];
    const detail = await getAdminStudentDetail(personId);
    expect(detail).toMatchObject({ id: personId, email: 'same@example.test', enquiryId, counselor: 'Assigned counsellor' });
    const joins = h.calls.filter(c => c.kind === 'join').map(c => compile(c.condition).sql);
    expect(joins).toContainEqual(expect.stringContaining('"admissions"."student_user_id" = "users"."id"'));
    expect(joins).toContainEqual(expect.stringContaining('"enquiries"."id" = "admissions"."enquiry_id"'));
    expect(joins).toContainEqual(expect.stringContaining('"users"."id" = "enquiries"."assigned_counsellor_id"'));
    expect(joins.some(s => s.includes('"email"'))).toBe(false);
    const predicates = h.calls.filter(c => c.kind === 'where').map(c => compile(c.condition));
    expect(predicates[0].params).toEqual([personId, 'skillup']);
    expect(predicates[0].sql).toContain('"users"."deleted_at" is null');
    expect(predicates[1].params).toEqual([enquiryId]);
    expect(h.calls.some(c => c.kind === 'limit:2')).toBe(true);
  });

  it('does not resolve an unrelated same-email enquiry as a fallback', async () => {
    h.results = [[{ ...row, enquiryId: null, admissionStatus: null }], [], [], []];
    const result = await getAdminStudentDetail(personId);
    expect(result?.enquiryId).toBeNull();
    expect(result?.counselor).toBe('Unassigned');
    const predicates = h.calls.filter(c => c.kind === 'where').map(c => compile(c.condition));
    expect(predicates.some(p => p.params.includes('same@example.test'))).toBe(false);
  });

  it('rejects multiple eligible associations before consuming operational dependencies', async () => {
    h.results = [[row, { ...row, enquiryId: '44444444-4444-4444-8444-444444444444' }]];
    await expect(getAdminStudentDetail(personId)).rejects.toBeInstanceOf(StudentReportingConflictError);
    expect(h.calls.filter(c => c.kind === 'from')).toHaveLength(1);
  });

  it('returns absent for a foreign or missing person and fixes the query scope to SUIA', async () => {
    h.results = [[]];
    expect(await getAdminStudentDetail('44444444-4444-4444-8444-444444444444')).toBeUndefined();
    const predicate = compile(h.calls.find(c => c.kind === 'where')?.condition);
    expect(predicate.params).toEqual(['44444444-4444-4444-8444-444444444444', 'skillup']);
    expect(h.calls.filter(c => c.kind === 'from')).toHaveLength(1);
  });
});
