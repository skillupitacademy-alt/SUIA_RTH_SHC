import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import crypto from 'node:crypto';

describe('Gemini Flash Independent SQL-Authority & Adversarial Invariant Probes', () => {
  const workerModulePath = '../apps/realtutorialhub-web/src/app/api/workers/worker-lease';
  const inviteModulePath = '../apps/skillup-admin/src/lib/student-invitation';

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('Outbox Authority: Generalized Missing-Repository and Partial-Executor Invariants', () => {
    it('rejects dispatchWorkerOutboxIntent for arbitrary aggregate IDs and randomized owner tokens when repository is omitted', async () => {
      const worker = await import(workerModulePath);
      const publishMock = vi.fn(async () => undefined);

      // Probe multiple randomized aggregate IDs and owner tokens
      for (let i = 0; i < 5; i++) {
        const randomAggregateId = `agg-${crypto.randomUUID()}`;
        const randomOwnerToken = `owner-token-${crypto.randomBytes(8).toString('hex')}`;

        const intent = worker.upsertWorkerOutboxIntent({
          tenantId: 'realtutorialhub',
          eventType: 'certificate.issued',
          aggregateId: randomAggregateId,
          payload: { certificateId: randomAggregateId, testIteration: i },
        });

        // Calling dispatchWorkerOutboxIntent without repository must throw and never call publish
        await expect(
          worker.dispatchWorkerOutboxIntent(intent, randomOwnerToken, publishMock)
        ).rejects.toThrow(/Durable outbox repository is required/i);
      }

      expect(publishMock).not.toHaveBeenCalled();
    });

    it('rejects upsertTransactionalOutboxIntent on partial SQL executors lacking select, insert, or update', async () => {
      const worker = await import(workerModulePath);
      const outboxInput = {
        tenantId: 'realtutorialhub',
        eventType: 'badge.awarded',
        aggregateId: `sub-${crypto.randomUUID()}`,
        payload: { submissionId: 'sub-1' },
      };

      // 1. Missing update & select (only insert)
      const partialInsertOnly = { insert: vi.fn() };
      await expect(
        worker.upsertTransactionalOutboxIntent(outboxInput, partialInsertOnly)
      ).rejects.toThrow(/Unsupported transaction executor for outbox intent/i);
      expect(partialInsertOnly.insert).not.toHaveBeenCalled();

      // 2. Missing insert & select (only update)
      const partialUpdateOnly = { update: vi.fn() };
      await expect(
        worker.upsertTransactionalOutboxIntent(outboxInput, partialUpdateOnly)
      ).rejects.toThrow(/Unsupported transaction executor for outbox intent/i);
      expect(partialUpdateOnly.update).not.toHaveBeenCalled();

      // 3. Missing insert & update (only select)
      const partialSelectOnly = { select: vi.fn() };
      await expect(
        worker.upsertTransactionalOutboxIntent(outboxInput, partialSelectOnly)
      ).rejects.toThrow(/Unsupported transaction executor for outbox intent/i);
      expect(partialSelectOnly.select).not.toHaveBeenCalled();

      // 4. Missing update (select + insert only)
      const partialSelectAndInsert = { select: vi.fn(), insert: vi.fn() };
      await expect(
        worker.upsertTransactionalOutboxIntent(outboxInput, partialSelectAndInsert)
      ).rejects.toThrow(/Unsupported transaction executor for outbox intent/i);
      expect(partialSelectAndInsert.select).not.toHaveBeenCalled();
      expect(partialSelectAndInsert.insert).not.toHaveBeenCalled();
    });

    it('succeeds dispatchWorkerOutboxIntent when conforming repository double is explicitly provided', async () => {
      const worker = await import(workerModulePath);
      const randomAggregateId = `agg-${crypto.randomUUID()}`;
      const repo = worker.createIsolatedTestOutboxRepository();

      const intent = await worker.upsertTransactionalOutboxIntent(
        {
          tenantId: 'realtutorialhub',
          eventType: 'badge.awarded',
          aggregateId: randomAggregateId,
          payload: { submissionId: randomAggregateId },
        },
        repo
      );

      let publishedPayload: any = null;
      const outcome = await worker.dispatchWorkerOutboxIntent(
        intent,
        'authorized-gemini-dispatcher',
        async (locked) => {
          publishedPayload = locked.payload;
        },
        repo
      );

      expect(outcome.status).toBe('published');
      expect(publishedPayload).toEqual({ submissionId: randomAggregateId });
    });
  });

  describe('Invitation Authority: Transactional Mandates and Isolated Repository Invariants', () => {
    it('runInInvitationTransaction strictly rejects executors lacking a transaction function', async () => {
      const invite = await import(inviteModulePath);
      const sideEffect = vi.fn(async () => 'forbidden');

      // 1. Bare object
      await expect(invite.runInInvitationTransaction({}, sideEffect)).rejects.toThrow(
        /does not support required transactional execution/i
      );

      // 2. Partial executor without transaction method
      await expect(
        invite.runInInvitationTransaction({ insert: vi.fn(), update: vi.fn() }, sideEffect)
      ).rejects.toThrow(/does not support required transactional execution/i);

      // 3. Non-object
      await expect(invite.runInInvitationTransaction(null, sideEffect)).rejects.toThrow(
        /Database client is required for transactional invitation execution/i
      );

      expect(sideEffect).not.toHaveBeenCalled();
    });

    it('commitStudentInvitationInTransaction rejects invalid transaction handles and missing SQL update capabilities', async () => {
      const invite = await import(inviteModulePath);

      // 1. Missing transaction handle
      await expect(
        invite.commitStudentInvitationInTransaction(
          { invitationId: 'inv-1', claimToken: 'token-1' },
          null
        )
      ).rejects.toThrow(/Valid transaction handle is required/i);

      // 2. Missing update method
      await expect(
        invite.commitStudentInvitationInTransaction(
          { invitationId: 'inv-1', claimToken: 'token-1' },
          {}
        )
      ).rejects.toThrow(/Transaction executor does not support required SQL update capability/i);
    });

    it('end-to-end invitation flow executes cleanly using explicitly injected test repository port', async () => {
      const invite = await import(inviteModulePath);
      const testRepo = invite.createIsolatedTestInvitationRepository();
      const email = `gemini.student.${crypto.randomBytes(4).toString('hex')}@skillup.org`;

      // 1. Issue invitation via repo port
      const issued = await invite.issueStudentInvitationInDb(
        { userId: 'usr-gemini-isolated', email },
        testRepo
      );
      expect(issued.invitationToken).toMatch(/^sku_inv_/);
      expect(issued.record.email).toBe(email);
      expect(issued.record.status).toBe('pending');

      // 2. Claim invitation via repo port
      const claim = await invite.claimStudentInvitationInDb(
        { invitationToken: issued.invitationToken, email },
        testRepo
      );
      expect(claim.ok).toBe(true);
      if (!claim.ok) throw new Error('Unreachable');
      expect(claim.claimToken).toBeDefined();

      // 3. Commit redemption in transaction via repo port
      const committed = await invite.commitStudentInvitationInTransaction(
        { invitationId: issued.record.invitationId, claimToken: claim.claimToken },
        testRepo
      );
      expect(committed.status).toBe('redeemed');
      expect(committed.redeemedAt).toBeDefined();

      // 4. Replay claim must be rejected
      const replayClaim = await invite.claimStudentInvitationInDb(
        { invitationToken: issued.invitationToken, email },
        testRepo
      );
      expect(replayClaim.ok).toBe(false);
      if (replayClaim.ok) throw new Error('Unreachable');
      expect(replayClaim.reason).toBe('already-redeemed');
    });
  });
});
