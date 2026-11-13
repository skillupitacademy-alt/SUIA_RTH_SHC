import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const quizQuery = {
    domains: { findFirst: vi.fn(), findMany: vi.fn() },
    subjects: { findFirst: vi.fn(), findMany: vi.fn() },
    topics: { findFirst: vi.fn(), findMany: vi.fn() },
    subtopics: { findFirst: vi.fn(), findMany: vi.fn() },
  };

  const quizUpdateCalls: Array<{ table: string; values: Record<string, unknown> }> = [];

  const quizUpdate = vi.fn((table: { __name: string }) => ({
    set: vi.fn((values: Record<string, unknown>) => ({
      where: vi.fn(async () => {
        quizUpdateCalls.push({ table: table.__name, values });
        return [];
      }),
    })),
  }));

  const tutorialInsertCalls: Array<{ table: string; values: Record<string, unknown> }> = [];

  const tutorialState: Record<string, Record<string, unknown>> = {};
  const tutorialQuery = Object.fromEntries([
    ["tutorialDomains", "tutorial_domains"], ["tutorialSubjects", "tutorial_subjects"],
    ["tutorialTopics", "tutorial_topics"], ["tutorialSubtopics", "tutorial_subtopics"],
  ].map(([key, table]) => [key, { findFirst: vi.fn(async () => tutorialState[table]) }]));

  const defaultTutorialInsert = (table: { __name: string }) => ({
    values: vi.fn((values: Record<string, unknown>) => ({
      onConflictDoUpdate: vi.fn((config: { set: Record<string, unknown> }) => ({
        returning: vi.fn(async () => {
          tutorialInsertCalls.push({ table: table.__name, values });
          const existing = tutorialState[table.__name];
          if (existing?.deletedAt) return [];
          tutorialState[table.__name] = existing
            ? { ...existing, ...config.set }
            : { id: `${table.__name}-db-id`, ...values };
          return [{ id: `${table.__name}-db-id` }];
        }),
      })),
    })),
  });

  const tutorialTx = {
    query: tutorialQuery,
    insert: vi.fn(defaultTutorialInsert),
  };

  const tutorialDb = {
    query: tutorialQuery,
    transaction: vi.fn(async (callback: (tx: typeof tutorialTx) => Promise<void>) => {
      const start = tutorialInsertCalls.length;
      const snapshot = structuredClone(tutorialState);
      try { return await callback(tutorialTx); }
      catch (error) {
        tutorialInsertCalls.splice(start);
        for (const key of Object.keys(tutorialState)) delete tutorialState[key];
        Object.assign(tutorialState, snapshot);
        throw error;
      }
    }),
  };

  const loggerError = vi.fn();

  return {
    quizQuery,
    quizUpdate,
    quizUpdateCalls,
    tutorialDb,
    tutorialQuery,
    tutorialState,
    tutorialTx,
    tutorialInsertCalls,
    defaultTutorialInsert,
    loggerError,
  };
});

vi.mock("@quiz/db", () => ({
  db: {
    query: mocks.quizQuery,
    update: mocks.quizUpdate,
  },
  domains: { id: "domain-id", __name: "domains" },
  subjects: { id: "subject-id", __name: "subjects" },
  topics: { id: "topic-id", __name: "topics" },
  subtopics: { id: "subtopic-id", __name: "subtopics" },
}));

vi.mock("@quiz/db-tutorial", () => ({
  withMainHierarchyLocks: async (_scope: unknown, operation: () => Promise<unknown>) => operation(),
  db: mocks.tutorialDb,
  tutorialDomains: { id: "tutorial-domain-id", externalId: "external_id", __name: "tutorial_domains" },
  tutorialSubjects: { id: "tutorial-subject-id", externalId: "external_id", __name: "tutorial_subjects" },
  tutorialTopics: { id: "tutorial-topic-id", externalId: "external_id", __name: "tutorial_topics" },
  tutorialSubtopics: { id: "tutorial-subtopic-id", externalId: "external_id", __name: "tutorial_subtopics" },
  STANDARD_QUERY_TIMEOUT: 15_000,
  withTimeout: async <T>(value: Promise<T>) => value,
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: mocks.loggerError,
  },
}));

import { HierarchySyncService } from "../hierarchy-sync.service";

function active<T>(value: T): T {
  if (!value || typeof value !== "object") return value;
  const row = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(row)) result[key] = active(item);
  if ("id" in row && "name" in row) Object.assign(result, { status: "active", deletedAt: null });
  return result as T;
}

describe("HierarchySyncService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.tutorialTx.insert.mockImplementation(mocks.defaultTutorialInsert);
    for (const key of Object.keys(mocks.tutorialState)) delete mocks.tutorialState[key];
    mocks.quizUpdateCalls.length = 0;
    mocks.tutorialInsertCalls.length = 0;
  });

  it("syncs a topic and its parent mappings without removed MainDB status columns", async () => {
    mocks.quizQuery.topics.findFirst.mockResolvedValue(active({
      id: "topic-12345678",
      name: "Async programming",
      description: "Topic description",
      complexityLevel: 2,
      weight: 3,
      learningUrl: null,
      detailedNotesPath: null,
      notesAssetId: null,
      subjectId: "subject-87654321",
      subject: {
        id: "subject-87654321",
        name: "JavaScript",
        description: "Subject description",
        order: 1,
        domainId: "domain-11223344",
        domain: {
          id: "domain-11223344",
          name: "Web Development",
          description: "Domain description",
          category: "technical",
        },
      },
    }));

    await HierarchySyncService.sync("topic", "topic-12345678");

    expect(mocks.tutorialDb.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.tutorialInsertCalls.map((entry) => entry.table)).toEqual([
      "tutorial_domains",
      "tutorial_subjects",
      "tutorial_topics",
    ]);
    expect(mocks.tutorialInsertCalls[0]?.values).toMatchObject({
      externalId: "domain-11223344",
      name: "Web Development",
      slug: "web-development-domain11",
      deletedAt: null,
    });
    expect(mocks.tutorialInsertCalls[2]?.values).toMatchObject({
      externalId: "topic-12345678",
      subjectId: "tutorial_subjects-db-id",
      name: "Async programming",
      slug: "async-programming-topic123",
      deletedAt: null,
    });
    // Current contract persists TutorialDB mappings and exposes outcomes through logs/summary.
    expect(mocks.quizUpdate).not.toHaveBeenCalled();
  });

  it("syncs a subtopic and includes the full parent chain", async () => {
    mocks.quizQuery.subtopics.findFirst.mockResolvedValue(active({
      id: "subtopic-99887766",
      name: "Promise chaining",
      description: "Subtopic description",
      depthLevel: 2,
      topicId: "topic-55667788",
      topic: {
        id: "topic-55667788",
        name: "Async programming",
        description: "Topic description",
        complexityLevel: 2,
        weight: 3,
        learningUrl: null,
        detailedNotesPath: null,
        notesAssetId: null,
        subjectId: "subject-44556677",
        subject: {
          id: "subject-44556677",
          name: "JavaScript",
          description: "Subject description",
          order: 1,
          domainId: "domain-33445566",
          domain: {
            id: "domain-33445566",
            name: "Web Development",
            description: "Domain description",
            category: "technical",
          },
        },
      },
    }));

    await HierarchySyncService.sync("subtopic", "subtopic-99887766");

    expect(mocks.tutorialInsertCalls.map((entry) => entry.table)).toEqual([
      "tutorial_domains",
      "tutorial_subjects",
      "tutorial_topics",
      "tutorial_subtopics",
    ]);
    expect(mocks.tutorialInsertCalls[3]?.values).toMatchObject({
      externalId: "subtopic-99887766",
      topicId: "tutorial_topics-db-id",
      name: "Promise chaining",
      slug: "promise-chaining-subtopic",
      difficultyLevels: [],
      deletedAt: null,
    });
    // Current contract persists TutorialDB mappings and exposes outcomes through logs/summary.
    expect(mocks.quizUpdate).not.toHaveBeenCalled();
  });

  it("rolls back failed tutorial synchronization and emits its existing failure event", async () => {
    mocks.quizQuery.subjects.findFirst.mockResolvedValue(active({
      id: "subject-11112222",
      name: "JavaScript",
      description: "Subject description",
      order: 1,
      domainId: "domain-11112222",
      domain: {
        id: "domain-11112222",
        name: "Web Development",
        description: "Domain description",
        category: "technical",
      },
    }));
    mocks.tutorialTx.insert.mockImplementation(table => {
      if (table.__name === 'tutorial_subjects') throw new Error("tutorial write failed");
      return mocks.defaultTutorialInsert(table);
    });

    await expect(HierarchySyncService.sync("subject", "subject-11112222")).resolves.toBe(false);

    // Current contract persists TutorialDB mappings and exposes outcomes through logs/summary.
    expect(mocks.quizUpdate).not.toHaveBeenCalled();
    expect(mocks.tutorialInsertCalls).toEqual([]);
    expect(mocks.tutorialDb.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.loggerError).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "hierarchy.sync_failed",
        entityType: "subject",
        entityId: "subject-11112222",
      }),
      "Hierarchy sync failed"
    );
  });

  it("syncAll backfills every hierarchy row and returns a summary", async () => {
    mocks.quizQuery.domains.findMany.mockResolvedValue([{ id: "domain-1" }]);
    mocks.quizQuery.subjects.findMany.mockResolvedValue([{ id: "subject-1" }]);
    mocks.quizQuery.topics.findMany.mockResolvedValue([{ id: "topic-1" }]);
    mocks.quizQuery.subtopics.findMany.mockResolvedValue([{ id: "subtopic-1" }]);

    mocks.quizQuery.domains.findFirst.mockResolvedValue(active({
      id: "domain-1",
      name: "Web Development",
      description: "Domain description",
      category: "technical",
    }));
    mocks.quizQuery.subjects.findFirst.mockResolvedValue(active({
      id: "subject-1",
      name: "JavaScript",
      description: "Subject description",
      order: 1,
      domainId: "domain-1",
      domain: {
        id: "domain-1",
        name: "Web Development",
        description: "Domain description",
        category: "technical",
      },
    }));
    mocks.quizQuery.topics.findFirst.mockResolvedValue(active({
      id: "topic-1",
      name: "Async programming",
      description: "Topic description",
      complexityLevel: 2,
      weight: 3,
      learningUrl: null,
      detailedNotesPath: null,
      notesAssetId: null,
      subjectId: "subject-1",
      subject: {
        id: "subject-1",
        name: "JavaScript",
        description: "Subject description",
        order: 1,
        domainId: "domain-1",
        domain: {
          id: "domain-1",
          name: "Web Development",
          description: "Domain description",
          category: "technical",
        },
      },
    }));
    mocks.quizQuery.subtopics.findFirst.mockResolvedValue(active({
      id: "subtopic-1",
      name: "Promise chaining",
      description: "Subtopic description",
      depthLevel: 2,
      topicId: "topic-1",
      topic: {
        id: "topic-1",
        name: "Async programming",
        description: "Topic description",
        complexityLevel: 2,
        weight: 3,
        learningUrl: null,
        detailedNotesPath: null,
        notesAssetId: null,
        subjectId: "subject-1",
        subject: {
          id: "subject-1",
          name: "JavaScript",
          description: "Subject description",
          order: 1,
          domainId: "domain-1",
          domain: {
            id: "domain-1",
            name: "Web Development",
            description: "Domain description",
            category: "technical",
          },
        },
      },
    }));

    await expect(HierarchySyncService.syncAll()).resolves.toEqual({
      total: 4,
      succeeded: 4,
      failed: 0,
    });

    expect(mocks.tutorialDb.transaction).toHaveBeenCalledTimes(4);
    // Current contract persists TutorialDB mappings and exposes outcomes through logs/summary.
    expect(mocks.quizUpdate).not.toHaveBeenCalled();
  });

  it('syncAll counts a failed item and continues committing independent successful items', async () => {
    mocks.quizQuery.domains.findMany.mockResolvedValue([{ id: 'good-domain' }, { id: 'missing-domain' }]);
    for (const kind of ['subjects', 'topics', 'subtopics'] as const) mocks.quizQuery[kind].findMany.mockResolvedValue([]);
    mocks.quizQuery.domains.findFirst.mockResolvedValueOnce(active({ id: 'good-domain', name: 'Fixture domain' })).mockResolvedValueOnce(active({ id: 'good-domain', name: 'Fixture domain' })).mockResolvedValueOnce(null);
    await expect(HierarchySyncService.syncAll()).resolves.toEqual({ total: 2, succeeded: 1, failed: 1 });
    expect(mocks.tutorialInsertCalls.map(row => row.values.externalId)).toEqual(['good-domain']);
    expect(mocks.loggerError).toHaveBeenCalledWith(expect.objectContaining({
      event: 'hierarchy.sync_failed', entityType: 'domain', entityId: 'missing-domain',
    }), 'Hierarchy sync failed');
  });

  it("retryFailed discovers missing current mappings, repairs parents first and verifies an idempotent second run", async () => {
    mocks.quizQuery.domains.findMany.mockResolvedValue([{ id: "domain-1" }]);
    mocks.quizQuery.subjects.findMany.mockResolvedValue([{ id: "subject-1" }]);
    mocks.quizQuery.topics.findMany.mockResolvedValue([{ id: "topic-1" }]);
    mocks.quizQuery.subtopics.findMany.mockResolvedValue([{ id: "subtopic-1" }]);

    mocks.quizQuery.domains.findFirst.mockResolvedValue(active({
      id: "domain-1",
      name: "Web Development",
      description: "Domain description",
      category: "technical",
    }));
    mocks.quizQuery.subjects.findFirst.mockResolvedValue(active({
      id: "subject-1",
      name: "JavaScript",
      description: "Subject description",
      order: 1,
      domainId: "domain-1",
      domain: {
        id: "domain-1",
        name: "Web Development",
        description: "Domain description",
        category: "technical",
      },
    }));
    mocks.quizQuery.topics.findFirst.mockResolvedValue(active({
      id: "topic-1",
      name: "Async programming",
      description: "Topic description",
      complexityLevel: 2,
      weight: 3,
      learningUrl: null,
      detailedNotesPath: null,
      notesAssetId: null,
      subjectId: "subject-1",
      subject: {
        id: "subject-1",
        name: "JavaScript",
        description: "Subject description",
        order: 1,
        domainId: "domain-1",
        domain: {
          id: "domain-1",
          name: "Web Development",
          description: "Domain description",
          category: "technical",
        },
      },
    }));
    mocks.quizQuery.subtopics.findFirst.mockResolvedValue(active({
      id: "subtopic-1",
      name: "Promise chaining",
      description: "Subtopic description",
      depthLevel: 2,
      topicId: "topic-1",
      topic: {
        id: "topic-1",
        name: "Async programming",
        description: "Topic description",
        complexityLevel: 2,
        weight: 3,
        learningUrl: null,
        detailedNotesPath: null,
        notesAssetId: null,
        subjectId: "subject-1",
        subject: {
          id: "subject-1",
          name: "JavaScript",
          description: "Subject description",
          order: 1,
          domainId: "domain-1",
          domain: {
            id: "domain-1",
            name: "Web Development",
            description: "Domain description",
            category: "technical",
          },
        },
      },
    }));

    const entities = [
      { entityType: "domain" as const, entityId: "domain-1" },
      { entityType: "subject" as const, entityId: "subject-1" },
      { entityType: "topic" as const, entityId: "topic-1" },
      { entityType: "subtopic" as const, entityId: "subtopic-1" },
    ];
    await expect(HierarchySyncService.retryFailed({ entities })).resolves.toMatchObject({
      mode: "CURRENT_STATE_RECONCILIATION", total: 4, succeeded: 4, failed: 0,
      checked: 4, repaired: 4, driftFound: 4, complete: true,
    });
    expect(mocks.tutorialInsertCalls.map((row) => row.table)).toEqual([
      "tutorial_domains", "tutorial_subjects", "tutorial_topics", "tutorial_subtopics",
    ]);
    expect(mocks.tutorialState.tutorial_subtopics.topicId).toBe("tutorial_topics-db-id");
    const writes = mocks.tutorialInsertCalls.length;
    await expect(HierarchySyncService.retryFailed({ entities })).resolves.toMatchObject({
      checked: 4, repaired: 0, alreadyConsistent: 4, complete: true,
    });
    expect(mocks.tutorialInsertCalls).toHaveLength(writes);
    expect(mocks.quizUpdate).not.toHaveBeenCalled();
  });
});
