import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearWorkerOutboxLedgerForTests,
  createIsolatedTestOutboxRepository,
  dispatchWorkerOutboxIntent,
  getWorkerOutboxIntent,
  upsertWorkerOutboxIntent,
} from '../worker-lease';

const storedCertificates: any[] = [];
let publishEventShouldFail = false;
let publishJSONShouldFail = false;
const publishedEvents: any[] = [];
const publishedQStashMessages: any[] = [];

const testOutboxRepo = createIsolatedTestOutboxRepository();

const fakeTx = {
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(async () => []),
    })),
  })),
  insert: vi.fn(() => ({
    values: vi.fn((vals: any) => ({
      returning: vi.fn(async () => {
        const cert = {
          id: 'cert-crash-rec-1',
          userId: vals.userId,
          scope: vals.scope,
          parentId: vals.parentId,
          parentName: vals.parentName,
          verificationCode: 'code-1234',
          issuedAt: new Date('2026-03-01T10:00:00.000Z'),
        };
        storedCertificates.push(cert);
        return [cert];
      }),
    })),
  })),
  update: vi.fn(() => ({
    set: vi.fn((vals: any) => ({
      where: vi.fn(async () => {
        if (vals.badgeAwarded) {
          fakeSubmission.badgeAwarded = true;
        }
      }),
    })),
  })),
  upsertIntent: (input: any) => testOutboxRepo.upsertIntent!(input),
};

const fakeSubmission: {
  id: string;
  userId: string;
  projectId: string;
  badgeAwarded: boolean;
} = {
  id: 'a0000000-0000-4000-8000-000000000001',
  userId: 'b0000000-0000-4000-8000-000000000002',
  projectId: 'c0000000-0000-4000-8000-000000000003',
  badgeAwarded: false,
};

const mocks = vi.hoisted(() => ({
  redisStore: new Map<string, string>(),
  publishEvent: vi.fn(async (type: string, payload: any, opts: any) => {
    if (publishEventShouldFail) {
      throw new Error('Downstream publisher network error');
    }
    publishedEvents.push({ type, payload, opts });
    return { messageId: 'msg-pub-1', envelope: {} };
  }),
  publishJSON: vi.fn(async (msg: any) => {
    if (publishJSONShouldFail) {
      throw new Error('QStash network drop');
    }
    publishedQStashMessages.push(msg);
    return { messageId: 'qstash-msg-1' };
  }),
  dbTransaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(fakeTx)),
  awardBadge: vi.fn(async () => undefined),
}));

vi.mock('@upstash/qstash', () => ({
  SignatureError: class SignatureError extends Error {},
  Client: class Client {
    publishJSON = mocks.publishJSON;
    constructor() {}
  },
  createQStashHandler: (_type: unknown, callback: (envelope: unknown) => Promise<unknown>) => {
    return async (req: Request) => callback(await req.json());
  },
}));

vi.mock('@upstash/redis', () => ({
  Redis: class Redis {
    async get(key: string) {
      return mocks.redisStore.get(key) ?? null;
    }
    async set(key: string, value: string, options?: { ex?: number; nx?: boolean }) {
      if (options?.nx && mocks.redisStore.has(key)) {
        return null;
      }
      mocks.redisStore.set(key, value);
      return 'OK';
    }
    async del(key: string) {
      mocks.redisStore.delete(key);
      return 1;
    }
    async eval(script: string, keys: string[], args: Array<string | number>) {
      const key = keys[0]!;
      if (script.includes('ACQUIRED')) {
        const current = mocks.redisStore.get(key);
        if (current) return current;
        mocks.redisStore.set(key, String(args[0]));
        return 'ACQUIRED';
      }
      if (script.includes('SET') && script.includes('tonumber(ARGV[3])')) {
        const current = mocks.redisStore.get(key);
        if (current !== args[0]) return 0;
        mocks.redisStore.set(key, String(args[1]));
        return 1;
      }
      if (script.includes('DEL')) {
        const current = mocks.redisStore.get(key);
        if (current !== args[0]) return 0;
        mocks.redisStore.delete(key);
        return 1;
      }
      return 1;
    }
    constructor() {}
  },
}));

vi.mock('@quiz/events', () => ({
  PlatformEventTypes: {
    CERTIFICATE_ISSUED: 'certificate.issued',
    PROJECT_SUBMITTED: 'project.submitted',
  },
  createQStashHandler: (_type: unknown, callback: (envelope: unknown) => Promise<unknown>) => {
    return async (req: Request) => callback(await req.json());
  },
  publishEvent: mocks.publishEvent,
}));

vi.mock('@quiz/db-tutorial', () => ({
  certificates: {},
  tutorialProjectSubmissions: {},
  TutorialProgressRepository: class TutorialProgressRepository {},
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(async () => [...storedCertificates]),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(async () => []),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(async () => undefined),
      })),
    })),
    claimIntent: (input: any) => testOutboxRepo.claimIntent(input),
    markPublished: (input: any) => testOutboxRepo.markPublished(input),
    markFailed: (input: any) => testOutboxRepo.markFailed(input),
    findIntent: (t: any, e: any, a: any) => testOutboxRepo.findIntent!(t, e, a),
    upsertIntent: (input: any) => testOutboxRepo.upsertIntent!(input),
    transaction: mocks.dbTransaction,
  },
  withTimeout: vi.fn((promise: Promise<unknown>) => promise),
  STANDARD_QUERY_TIMEOUT: 30_000,
  ProjectRepository: class ProjectRepository {
    async getSubmission(id: string) {
      return fakeSubmission.id === id ? { ...fakeSubmission } : undefined;
    }
    async getProject(_id: string) {
      return {
        id: 'proj-rec-1',
        scope: 'topic' as const,
        parentId: 'parent-rec-1',
        title: 'Topic Crash Rec',
      };
    }
    withDb(_tx: any) {
      return {
        awardBadge: mocks.awardBadge,
      };
    }
  },
  ProjectService: class ProjectService {
    async checkCertificateEligibility() {
      return { eligible: true };
    }
  },
}));

vi.mock('@/server/project.service', () => ({
  ProjectService: class ProjectService {
    async checkCertificateEligibility() {
      return { eligible: true };
    }
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import { POST as postIssueCertificate } from '../issue-certificate/route';
import { POST as postAwardProjectBadge } from '../award-project-badge/route';

const makeCertRequest = (body: unknown) =>
  new Request('http://localhost/api/workers/issue-certificate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

const makeBadgeRequest = (body: unknown) =>
  new Request('http://localhost/api/workers/award-project-badge', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('Durable Worker Outbox Crash-Recovery & Idempotency Probes (A2)', () => {
  beforeEach(() => {
    clearWorkerOutboxLedgerForTests();
    mocks.redisStore.clear();
    storedCertificates.length = 0;
    publishedEvents.length = 0;
    publishedQStashMessages.length = 0;
    fakeSubmission.badgeAwarded = false;
    publishEventShouldFail = false;
    publishJSONShouldFail = false;
    vi.clearAllMocks();

    vi.stubEnv('QSTASH_TOKEN', 'test-qstash-token');
    vi.stubEnv('CERTIFICATE_ISSUED_EVENT_URL', 'https://tutorial.test/api/events/certificate-issued');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.test');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token');
    vi.stubEnv('QSTASH_CURRENT_SIGNING_KEY', 'sig-key');
    vi.stubEnv('QSTASH_NEXT_SIGNING_KEY', 'next-key');
  });

  it('recovers from publish failure during certificate issuance without duplicating records or losing events', async () => {
    const userId = crypto.randomUUID();
    const parentId = crypto.randomUUID();
    const payload = {
      id: crypto.randomUUID(),
      type: 'project.certificate_requested',
      correlationId: crypto.randomUUID(),
      source: 'quiz-platform',
      occurredAt: new Date().toISOString(),
      version: 1,
      data: {
        userId,
        scope: 'topic' as const,
        parentId,
        parentName: 'Advanced TypeScript',
      },
    };

    // --- Delivery 1: DB persistence succeeds, but publish fails ---
    publishEventShouldFail = true;
    const res1 = await postIssueCertificate(makeCertRequest(payload));
    expect(res1.status).toBe(500);

    // Verify row was committed to DB, but outbox intent remains unpublished
    expect(storedCertificates).toHaveLength(1);
    expect(mocks.dbTransaction).toHaveBeenCalledTimes(1);
    expect(publishedEvents).toHaveLength(0);

    // --- Delivery 2: Worker retry ---
    publishEventShouldFail = false;
    const res2 = await postIssueCertificate(makeCertRequest(payload));
    expect(res2.status).toBe(200);

    // Verify NO duplicate certificate row was inserted
    expect(storedCertificates).toHaveLength(1);
    expect(mocks.dbTransaction).toHaveBeenCalledTimes(1); // Still exactly 1 call from Delivery 1!

    // Verify event publication recovered and published successfully
    expect(publishedEvents).toHaveLength(1);
    expect(publishedEvents[0].type).toBe('certificate.issued');
    expect(publishedEvents[0].payload.certificateId).toBe('cert-crash-rec-1');
    expect(publishedEvents[0].payload.userId).toBe(userId);

    // --- Delivery 3: Subsequent duplicate after completion ---
    const res3 = await postIssueCertificate(makeCertRequest(payload));
    expect(res3.status).toBe(200);
    const body3 = await res3.text();
    expect(body3).toContain('Duplicate event ignored');

    // Verify still zero extra DB inserts and zero duplicate publications
    expect(storedCertificates).toHaveLength(1);
    expect(mocks.dbTransaction).toHaveBeenCalledTimes(1);
    expect(publishedEvents).toHaveLength(1);
  });

  it('recovers from publish failure during project badge award without duplicating badge awards', async () => {
    const payload = {
      id: crypto.randomUUID(),
      type: 'project.approved' as const,
      correlationId: crypto.randomUUID(),
      source: 'quiz-platform',
      occurredAt: new Date().toISOString(),
      version: 1,
      data: {
        submissionId: fakeSubmission.id,
        projectId: fakeSubmission.projectId,
        userId: fakeSubmission.userId,
        badgeId: 'd0000000-0000-4000-8000-000000000004',
      },
    };

    // --- Delivery 1: DB award succeeds, but QStash publish fails ---
    publishJSONShouldFail = true;
    const res1 = await postAwardProjectBadge(makeBadgeRequest(payload));
    expect(res1.status).toBe(500);

    // Verify badge award transaction executed, but publication failed
    expect(mocks.awardBadge).toHaveBeenCalledTimes(1);
    expect(fakeSubmission.badgeAwarded).toBe(true);
    expect(publishedQStashMessages).toHaveLength(0);

    // --- Delivery 2: Worker retry ---
    publishJSONShouldFail = false;
    const res2 = await postAwardProjectBadge(makeBadgeRequest(payload));
    expect(res2.status).toBe(200);

    // Verify badge was NOT re-awarded in DB
    expect(mocks.awardBadge).toHaveBeenCalledTimes(1); // Still 1!

    // Verify publication succeeded
    expect(publishedQStashMessages).toHaveLength(1);
    expect(publishedQStashMessages[0].body.type).toBe('project.certificate_requested');
    expect(publishedQStashMessages[0].body.data.userId).toBe(fakeSubmission.userId);

    // --- Delivery 3: Duplicate delivery ---
    const res3 = await postAwardProjectBadge(makeBadgeRequest(payload));
    expect(res3.status).toBe(200);
    const body3 = await res3.text();
    expect(body3).toContain('Duplicate event ignored');

    // Verify invariant holds
    expect(mocks.awardBadge).toHaveBeenCalledTimes(1);
    expect(publishedQStashMessages).toHaveLength(1);
  });

  it('S1: preserves pending outbox intent across fresh module instances (vi.resetModules) and rejects competing dispatchers or payload mutation', async () => {
    const aggregateId = crypto.randomUUID();
    const originalPayload = {
      certificateId: aggregateId,
      userId: crypto.randomUUID(),
      issuedAt: '2026-03-01T10:00:00.000Z',
    };

    const intent = upsertWorkerOutboxIntent({
      tenantId: 'realtutorialhub',
      eventType: 'certificate.issued',
      aggregateId,
      payload: originalPayload,
    });

    // Attempt to overwrite payload under the same event identity must fail closed
    expect(() =>
      upsertWorkerOutboxIntent({
        tenantId: 'realtutorialhub',
        eventType: 'certificate.issued',
        aggregateId,
        payload: { ...originalPayload, userId: crypto.randomUUID() },
      })
    ).toThrow(/Conflicting outbox payload/i);

    expect(getWorkerOutboxIntent('realtutorialhub', 'certificate.issued', aggregateId)?.payload).toEqual(
      originalPayload
    );

    // Simulate process/module restart
    vi.resetModules();
    const freshLeaseModule = await import('../worker-lease');
    const recovered = freshLeaseModule.getWorkerOutboxIntent(
      'realtutorialhub',
      'certificate.issued',
      aggregateId
    );
    expect(recovered).toBeDefined();
    expect(recovered?.eventId).toBe(intent.eventId);
    expect(recovered?.payload).toEqual(originalPayload);

    // Competing dispatcher fencing: while dispatcher A is publishing, dispatcher B must be rejected
    let releaseFirstPublish!: () => void;
    const firstPublishGate = new Promise<void>((resolve) => {
      releaseFirstPublish = resolve;
    });
    const publishCalls: string[] = [];

    const firstDispatchPromise = freshLeaseModule.dispatchWorkerOutboxIntent(
      recovered!,
      'owner-dispatcher-a',
      async (locked) => {
        publishCalls.push(`a:${locked.eventId}`);
        await firstPublishGate;
      },
      freshLeaseModule.createIsolatedTestOutboxRepository()
    );

    await expect(
      freshLeaseModule.dispatchWorkerOutboxIntent(
        recovered!,
        'owner-dispatcher-b',
        async (locked) => {
          publishCalls.push(`b:${locked.eventId}`);
        },
        freshLeaseModule.createIsolatedTestOutboxRepository()
      )
    ).rejects.toThrow(/already being published/i);

    releaseFirstPublish();
    const firstOutcome = await firstDispatchPromise;
    expect(firstOutcome.status).toBe('published');
    expect(publishCalls).toEqual([`a:${intent.eventId}`]);
  });
});
