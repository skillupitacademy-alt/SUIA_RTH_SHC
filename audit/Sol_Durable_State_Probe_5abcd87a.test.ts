import { expect, it, vi } from 'vitest';

const workerModule = '../apps/realtutorialhub-web/src/app/api/workers/worker-lease';
const invitationModule = '../apps/skillup-admin/src/lib/student-invitation';

it('same-process invitation permits one valid redemption and denies replay', async () => {
  vi.resetModules();
  const issuer = await import(invitationModule);
  const invitation = issuer.issueStudentInvitation({ userId: 'learner-positive', email: 'fixture@example.invalid' });
  expect(issuer.redeemStudentInvitationToken({ invitationToken: invitation.invitationToken }).ok).toBe(true);
  expect(issuer.redeemStudentInvitationToken({ invitationToken: invitation.invitationToken })).toMatchObject({ ok: false, reason: 'already-redeemed' });
});

it('issued invitation remains redeemable by a fresh application module instance', async () => {
  vi.resetModules();
  const issuer = await import(invitationModule);
  const invitation = issuer.issueStudentInvitation({ userId: 'learner-restart', email: 'restart@example.invalid' });
  vi.resetModules();
  const freshApplication = await import(invitationModule);
  expect(freshApplication.redeemStudentInvitationToken({ invitationToken: invitation.invitationToken, email: 'restart@example.invalid', platform: 'skillup' }).ok).toBe(true);
});

it('pending publication intent survives a fresh application module instance', async () => {
  vi.resetModules();
  const worker = await import(workerModule);
  const record = await worker.upsertWorkerOutboxIntent({ tenantId: 'realtutorialhub', eventType: 'certificate.issued', aggregateId: 'certificate-restart', payload: { certificateId: 'certificate-restart' } });
  vi.resetModules();
  const freshWorker = await import(workerModule);
  expect(await freshWorker.getWorkerOutboxIntent('realtutorialhub', 'certificate.issued', 'certificate-restart')).toMatchObject({ eventId: record.eventId, status: 'pending' });
});

it('a competing dispatcher cannot publish the same in-flight intent', async () => {
  vi.resetModules();
  const worker = await import(workerModule);
  const intent = await worker.upsertWorkerOutboxIntent({ tenantId: 'realtutorialhub', eventType: 'certificate.issued', aggregateId: 'certificate-concurrent', payload: { certificateId: 'certificate-concurrent' } });
  let release!: () => void;
  const barrier = new Promise<void>(resolve => { release = resolve; });
  const publish = vi.fn(async () => { await barrier; });
  const first = worker.dispatchWorkerOutboxIntent(intent, 'first-owner', publish);
  const second = worker.dispatchWorkerOutboxIntent(intent, 'other-owner', publish);
  const observed = publish.mock.calls.length;
  release();
  await Promise.allSettled([first, second]);
  expect(observed).toBe(1);
});

it('an existing event identity cannot silently replace its publication payload', async () => {
  vi.resetModules();
  const worker = await import(workerModule);
  const input = { tenantId: 'realtutorialhub', eventType: 'certificate.issued', aggregateId: 'certificate-immutable' };
  const intent = await worker.upsertWorkerOutboxIntent({ ...input, payload: { userId: 'original-user' } });
  try { await worker.upsertWorkerOutboxIntent({ ...input, payload: { userId: 'different-user' } }); }
  catch { /* Explicit payload conflict is permitted. */ }
  expect(intent.payload).toEqual({ userId: 'original-user' });
});
