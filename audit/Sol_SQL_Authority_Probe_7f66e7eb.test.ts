import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({
  claimCalls: 0,
  failSql: false,
  record: {
    invitationId: 'sql-only-invitation', userId: 'sql-only-user', email: 'fixture@example.invalid',
    platform: 'skillup', tokenHash: 'a'.repeat(64), status: 'claiming',
    claimOwnerToken: 'sql-owner', issuedAt: '2026-11-07T00:00:00.000Z',
    expiresAt: '2099-11-10T00:00:00.000Z', redeemedAt: null,
  },
}));
vi.mock('@quiz/db-people', () => ({
  db: {},
  studentInvitations: { id: 'id', status: 'status', claimOwnerToken: 'claimOwnerToken' },
  StudentInvitationRepository: class {
    async claimForRedemption() {
      fixture.claimCalls++;
      if (fixture.failSql) throw new Error('synthetic authoritative SQL unavailable');
      return { ok: true, claimToken: 'sql-owner', record: fixture.record };
    }
  },
}));

const workerModule = '../apps/realtutorialhub-web/src/app/api/workers/worker-lease';
const inviteModule = '../apps/skillup-admin/src/lib/student-invitation';
const outboxInput = (id: string) => ({ tenantId: 'realtutorialhub', eventType: 'certificate.issued', aggregateId: id, payload: { certificateId: id } });
beforeEach(() => { fixture.claimCalls = 0; fixture.failSql = false; });
afterEach(() => vi.unstubAllEnvs());

it('explicitly injected durable outbox repository is invoked', async () => {
  const worker = await import(workerModule);
  const repo = { upsertIntent: vi.fn(async () => ({ ...outboxInput('supported-port'), id: 'row', eventId: 'event', status: 'pending', attemptCount: 0, ownerToken: null, publishedAt: null, lastError: null })) };
  await worker.upsertTransactionalOutboxIntent(outboxInput('supported-port'), repo);
  expect(repo.upsertIntent).toHaveBeenCalledOnce();
});

it('a valid injected SQL executor is used without inspecting connection-string environment variables', async () => {
  const worker = await import(workerModule);
  const select = vi.fn(() => { throw new Error('synthetic SQL failure'); });
  const tx = { select, insert: vi.fn(), update: vi.fn() };
  try { await worker.upsertTransactionalOutboxIntent(outboxInput('sql-required'), tx); } catch { /* SQL failure must propagate. */ }
  expect(select).toHaveBeenCalled();
});

it('incomplete transaction capabilities cannot report a persisted outbox intent', async () => {
  const worker = await import(workerModule);
  await expect(worker.upsertTransactionalOutboxIntent(outboxInput('unsupported-transaction'), {})).rejects.toThrow();
});

it('outbox dispatch without a durable repository rejects before publication', async () => {
  const worker = await import(workerModule);
  const intent = worker.upsertWorkerOutboxIntent(outboxInput('no-dispatch-repository'));
  const publish = vi.fn(async () => undefined);
  try { await worker.dispatchWorkerOutboxIntent(intent, 'owner', publish); } catch { /* Unsupported dependency must deny effects. */ }
  expect(publish).not.toHaveBeenCalled();
});

it('fresh application memory cannot substitute for an authoritative outbox read', async () => {
  const worker = await import(workerModule);
  const intent = worker.upsertWorkerOutboxIntent(outboxInput('new-process'));
  // A new process does not retain the previous process's global symbols.
  Reflect.deleteProperty(globalThis, Symbol.for('quiz.worker.outbox.test.adapter'));
  vi.resetModules();
  const freshWorker = await import(workerModule);
  expect(await freshWorker.getWorkerOutboxIntent('realtutorialhub', 'certificate.issued', 'new-process')).toMatchObject({ eventId: intent.eventId });
});

it('invitation DB claim always uses the injected repository rather than falling back to a memory token', async () => {
  const invitation = await import(inviteModule);
  const issued = invitation.issueStudentInvitation({ userId: 'memory-only-user', email: 'fixture@example.invalid' });
  fixture.failSql = true;
  let sqlError = false;
  try { await invitation.claimStudentInvitationInDb({ invitationToken: issued.invitationToken, email: 'fixture@example.invalid', platform: 'skillup' }, {}); }
  catch { sqlError = true; }
  expect(fixture.claimCalls).toBe(1);
  expect(sqlError).toBe(true);
});

it('a SQL-claimed invitation can commit without a matching process-global record', async () => {
  vi.stubEnv('DATABASE_URL_PEOPLE', 'postgres://fixture.invalid/disposable');
  const invitation = await import(inviteModule);
  const claim = await invitation.claimStudentInvitationInDb({ invitationToken: 'disposable-sql-token', email: 'fixture@example.invalid', platform: 'skillup' }, {});
  expect(claim.ok).toBe(true);
  const tx = { update: () => ({ set: () => ({ where: () => ({ returning: async () => [{ ...fixture.record, id: fixture.record.invitationId, status: 'redeemed' }] }) }) }) };
  await expect(invitation.commitStudentInvitationInTransaction({ invitationId: fixture.record.invitationId, claimToken: 'sql-owner' }, tx)).resolves.toMatchObject({ invitationId: fixture.record.invitationId });
});

it('invitation transaction wrapper rejects a nontransactional executor before account effects', async () => {
  const invitation = await import(inviteModule);
  const accountEffect = vi.fn(async () => 'activated');
  try { await invitation.runInInvitationTransaction({}, accountEffect); } catch { /* Required transaction unavailable. */ }
  expect(accountEffect).not.toHaveBeenCalled();
});
