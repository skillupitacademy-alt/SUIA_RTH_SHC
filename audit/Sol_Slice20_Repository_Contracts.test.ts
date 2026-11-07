import { afterAll, describe, expect, it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { StudentInvitationRepository, hashInvitationToken } from '../packages/db-people/src/repositories/student-invitation.repository';
import { EventOutboxRepository, deriveOutboxDeterministicUuid } from '../packages/db-tutorial/src/repositories/event-outbox.repository';
import { controlledSql, type QueryEvidence } from './Sol_Controlled_SQL_Executor';
import { commitStudentInvitationInTransaction } from '../apps/skillup-admin/src/lib/student-invitation';

const now = new Date('2026-11-07T05:00:00.000Z');
const iso = (delta = 0) => new Date(now.getTime() + delta).toISOString();
const rawToken = 'sku_inv_disposable_repository_fixture';
const evidence: Record<string, QueryEvidence[]> = {};
afterAll(() => writeFileSync('audit/Sol_Slice20_SQL_Evidence.json', JSON.stringify(evidence, null, 2) + '\n'));
function invitation(overrides: Record<string, unknown> = {}) {
  const f = controlledSql([{
    id: '10000000-0000-4000-8000-000000000001', user_id: '20000000-0000-4000-8000-000000000002',
    email: 'fixture@example.invalid', platform: 'skillup', token_hash: hashInvitationToken(rawToken),
    status: 'pending', claim_owner_token: null, claim_expires_at: null,
    issued_at: iso(-1000), expires_at: iso(60_000), redeemed_at: null, created_at: iso(-1000), updated_at: iso(-1000),
    ...overrides,
  }]);
  return { ...f, repo: new StudentInvitationRepository(f.db as never), id: f.state.rows[0].id };
}
const claim = (f: ReturnType<typeof invitation>, extra: Record<string, unknown> = {}) => f.repo.claimForRedemption({ invitationToken: rawToken, email: 'fixture@example.invalid', platform: 'skillup', now, ...extra });
const input = { tenantId: 'realtutorialhub', eventType: 'certificate.issued', aggregateId: 'fixture-certificate', payload: { certificateId: 'fixture-certificate' } };
const envelopeA = { id: 'fixture-event', data: { a: 1, b: 2 } };
const envelopeB = { id: 'fixture-event', data: { a: 9, b: 2 } };
function outbox(overrides: Record<string, unknown> = {}) {
  const f = controlledSql([{
    id: 'outbox-row', tenant_id: input.tenantId, event_type: input.eventType, aggregate_id: input.aggregateId,
    event_id: deriveOutboxDeterministicUuid(`${input.tenantId}:${input.eventType}:${input.aggregateId}`),
    payload: JSON.stringify(input.payload), envelope: null, status: 'pending', attempt_count: 0,
    owner_token: null, lease_expires_at: null, published_at: null, last_error: null, created_at: iso(), updated_at: iso(),
    ...overrides,
  }]);
  return { ...f, repo: new EventOutboxRepository(f.db) };
}

describe('Actual invitation repository and generated UPDATE predicates', () => {
  it.each([-1, 0])('expiry boundary delta %s is expired, and UPDATE contains status/time guards', async delta => {
    const f = invitation({ expires_at: iso(delta) });
    expect(await claim(f)).toMatchObject({ ok: false, reason: 'expired' });
    expect(f.state.rows[0].status).toBe('expired');
    const update = f.state.queries.find(q => q.sql.startsWith('update'))!;
    expect(update.sql).toContain('<='); expect(update.params).toContain('pending'); expect(update.params).toContain('claiming');
    evidence[`expiry-${delta}`] = f.state.queries;
  });
  it('positive expiry and claim TTL yield a claim with the expected lease', async () => {
    const f = invitation(); expect((await claim(f, { claimTtlMs: 1234 })).ok).toBe(true);
    expect(f.state.rows[0].claim_expires_at).toBe(iso(1234));
    evidence.claim = f.state.queries;
  });
  it.each([0, -1, NaN, Infinity, -Infinity])('invalid claim TTL %s rejects before mutation', async claimTtlMs => {
    const f = invitation(); await expect(claim(f, { claimTtlMs })).rejects.toThrow('TTL'); expect(f.state.rows[0].status).toBe('pending');
  });
  it.each(['pending', 'claiming'])('expired %s can transition to expired', async status => {
    const f = invitation({ status, expires_at: iso(-1) }); await claim(f); expect(f.state.rows[0].status).toBe('expired');
  });
  it.each(['redeemed', 'revoked'])('terminal %s is never expired by a stale request', async status => {
    const f = invitation({ status, expires_at: iso(-1) }); await claim(f); expect(f.state.rows[0].status).toBe(status);
  });
  it('two application repositories cannot both acquire the same pending row', async () => {
    const f = invitation(); const second = new StudentInvitationRepository(f.db as never);
    const results = await Promise.all([claim(f), second.claimForRedemption({ invitationToken: rawToken, now })]);
    expect(results.filter(r => r.ok)).toHaveLength(1);
  });
  it.each(['wrong-owner', 'expired-claim', 'expired-invitation', 'redeemed-status'])('%s cannot redeem', async scenario => {
    const f = invitation({ status: scenario === 'redeemed-status' ? 'redeemed' : 'claiming', claim_owner_token: 'owner', claim_expires_at: iso(scenario === 'expired-claim' ? 0 : 10000), expires_at: iso(scenario === 'expired-invitation' ? 0 : 10000) });
    await expect(f.repo.redeemAtomic({ invitationId: f.id, claimToken: scenario === 'wrong-owner' ? 'wrong' : 'owner', now })).rejects.toThrow();
    expect(f.state.rows[0].status).toBe(scenario === 'redeemed-status' ? 'redeemed' : 'claiming');
  });
  it('valid owner/unexpired claim redeems with both expiry predicates in UPDATE', async () => {
    const f = invitation({ status: 'claiming', claim_owner_token: 'owner', claim_expires_at: iso(1000) });
    expect(await f.repo.redeemAtomic({ invitationId: f.id, claimToken: 'owner', now })).toMatchObject({ status: 'redeemed' });
    const sql = f.state.queries[0].sql;
    expect(sql).toMatch(/"claim_expires_at" > /); expect(sql).toMatch(/"expires_at" > /);
    evidence.redemption = f.state.queries;
  });
  it('expiry prevents a later redemption', async () => {
    const f = invitation({ status: 'claiming', claim_owner_token: 'owner', claim_expires_at: iso(1000), expires_at: iso() });
    await claim(f); await expect(f.repo.redeemAtomic({ invitationId: f.id, claimToken: 'owner', now })).rejects.toThrow();
  });
  it('zero-row expiry after another actor redeems reports actual terminal state', async () => {
    const f = invitation({ expires_at: iso() });
    evidence.zeroRowExpiryRace = f.state.queries;
    f.state.beforeUpdate = () => { f.state.rows[0].status = 'redeemed'; f.state.beforeUpdate = undefined; };
    const result = await claim(f);
    expect(f.state.rows[0].status).toBe('redeemed');
    expect(result).toMatchObject({ ok: false, reason: 'already-redeemed', record: { status: 'redeemed' } });
  });
  it('controlled invitation transaction abort restores claiming status', async () => {
    const f = invitation({ status: 'claiming', claim_owner_token: 'owner', claim_expires_at: iso(1000) });
    await expect(f.transaction(async tx => {
      await new StudentInvitationRepository(tx as never).redeemAtomic({ invitationId: f.id, claimToken: 'owner', now });
      throw new Error('abort');
    })).rejects.toThrow('abort');
    expect(f.state.rows[0].status).toBe('claiming');
  });
  it.each(['expired-claim', 'expired-invitation'])('actual application commit helper rejects %s', async scenario => {
    const f = invitation({ status: 'claiming', claim_owner_token: 'owner', claim_expires_at: iso(scenario === 'expired-claim' ? 0 : 1000), expires_at: iso(scenario === 'expired-invitation' ? 0 : 1000) });
    evidence[`application-${scenario}`] = f.state.queries;
    await expect(commitStudentInvitationInTransaction({ invitationId: f.id, claimToken: 'owner', now }, f.db)).rejects.toThrow();
    expect(f.state.rows[0].status).toBe('claiming');
  });
  it('actual application commit helper preserves legitimate unexpired redemption', async () => {
    const f = invitation({ status: 'claiming', claim_owner_token: 'owner', claim_expires_at: iso(1000) });
    expect(await commitStudentInvitationInTransaction({ invitationId: f.id, claimToken: 'owner', now }, f.db)).toMatchObject({ status: 'redeemed' });
    evidence.applicationCommit = f.state.queries;
  });
});

describe('Actual outbox repository and SQL envelope immutability', () => {
  it('new intent persists a deterministic event identity', async () => {
    const f = outbox(); f.state.rows.length = 0;
    const inserted = await f.repo.upsertIntent(input);
    expect(inserted.eventId).toBe(deriveOutboxDeterministicUuid(`${input.tenantId}:${input.eventType}:${input.aggregateId}`));
  });
  it('NULL envelope installs once with an IS NULL mutation guard', async () => {
    const f = outbox(); expect((await f.repo.upsertIntent({ ...input, envelope: envelopeA })).envelope).toEqual(envelopeA);
    expect(f.state.queries.find(q => q.sql.startsWith('update'))!.sql).toContain('"envelope" is null');
    evidence.envelopeInstall = f.state.queries;
  });
  it('installed envelope rejects different content', async () => {
    const f = outbox({ envelope: JSON.stringify(envelopeA) }); await expect(f.repo.upsertIntent({ ...input, envelope: envelopeB })).rejects.toThrow('Conflicting');
  });
  it('exact replay and different property order are equivalent', async () => {
    const f = outbox({ envelope: JSON.stringify(envelopeA) });
    expect((await f.repo.upsertIntent({ ...input, envelope: { data: { b: 2, a: 1 }, id: 'fixture-event' } })).envelope).toEqual(envelopeA);
  });
  it.each([false, true])('concurrent first install with identical=%s preserves winner', async identical => {
    const f = outbox();
    f.state.beforeUpdate = () => { f.state.rows[0].envelope = JSON.stringify(envelopeA); f.state.beforeUpdate = undefined; };
    if (identical) expect((await f.repo.upsertIntent({ ...input, envelope: envelopeA })).envelope).toEqual(envelopeA);
    else await expect(f.repo.upsertIntent({ ...input, envelope: envelopeB })).rejects.toThrow('Conflicting');
    expect(JSON.parse(f.state.rows[0].envelope)).toEqual(envelopeA);
  });
  it.each(['', 'wrong'])('missing/wrong owner %s fails completion', async ownerToken => {
    const f = outbox({ status: 'publishing', owner_token: 'owner', envelope: JSON.stringify(envelopeA) });
    await expect(f.repo.markPublished({ ...input, ownerToken, envelope: envelopeA, now })).rejects.toThrow();
    expect(f.state.rows[0].status).toBe('publishing');
  });
  it('same owner/envelope completes using JSONB equality in the UPDATE', async () => {
    const f = outbox({ status: 'publishing', owner_token: 'owner', envelope: JSON.stringify(envelopeA) });
    expect(await f.repo.markPublished({ ...input, ownerToken: 'owner', envelope: envelopeA, now })).toMatchObject({ status: 'published', envelope: envelopeA });
    expect(f.state.queries[0].sql).toContain('::jsonb'); evidence.completion = f.state.queries;
  });
  it('same owner but different envelope cannot complete or mutate envelope', async () => {
    const f = outbox({ status: 'publishing', owner_token: 'owner', envelope: JSON.stringify(envelopeA) });
    await expect(f.repo.markPublished({ ...input, ownerToken: 'owner', envelope: envelopeB, now })).rejects.toThrow();
    expect(JSON.parse(f.state.rows[0].envelope)).toEqual(envelopeA);
  });
  it('completion without supplied envelope retains persisted envelope', async () => {
    const f = outbox({ status: 'publishing', owner_token: 'owner', envelope: JSON.stringify(envelopeA) });
    expect((await f.repo.markPublished({ ...input, ownerToken: 'owner', now })).envelope).toEqual(envelopeA);
  });
  it.each([true, false])('already published replay equal=%s', async equal => {
    const f = outbox({ status: 'published', owner_token: 'owner', envelope: JSON.stringify(envelopeA) });
    const promise = f.repo.markPublished({ ...input, ownerToken: 'owner', envelope: equal ? envelopeA : envelopeB, now });
    if (equal) expect((await promise).status).toBe('published'); else await expect(promise).rejects.toThrow();
  });
  it('replacement dispatcher owner prevents completion', async () => {
    const f = outbox({ status: 'publishing', owner_token: 'owner', envelope: JSON.stringify(envelopeA) });
    f.state.beforeUpdate = () => { f.state.rows[0].owner_token = 'replacement'; f.state.beforeUpdate = undefined; };
    await expect(f.repo.markPublished({ ...input, ownerToken: 'owner', envelope: envelopeA, now })).rejects.toThrow();
    expect(f.state.rows[0].owner_token).toBe('replacement');
  });
  it('controlled transaction abort rolls back intent changes', async () => {
    const f = outbox();
    await expect(f.transaction(async tx => { await new EventOutboxRepository(tx).upsertIntent({ ...input, envelope: envelopeA }); throw new Error('abort'); })).rejects.toThrow('abort');
    expect(f.state.rows[0].envelope).toBe(null);
  });
  it('two dispatcher repositories have only one successful claim', async () => {
    const f = outbox();
    const requests = { ...input, now, leaseDurationMs: 1000 };
    const results = await Promise.all([
      f.repo.claimIntent({ ...requests, ownerToken: 'first' }),
      new EventOutboxRepository(f.db).claimIntent({ ...requests, ownerToken: 'second' }),
    ]);
    expect(results.filter(result => result.kind === 'claimed')).toHaveLength(1);
  });
});
