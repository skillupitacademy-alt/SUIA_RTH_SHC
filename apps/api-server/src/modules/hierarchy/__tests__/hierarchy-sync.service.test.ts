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

  const defaultTutorialInsert = (table: { __name: string }) => ({
    values: vi.fn((values: Record<string, unknown>) => ({
      onConflictDoUpdate: vi.fn(() => ({
        returning: vi.fn(async () => {
          tutorialInsertCalls.push({ table: table.__name, values });
          return [{ id: `${table.__name}-db-id` }];
        }),
      })),
    })),
  });

  const tutorialTx = {
    insert: vi.fn(defaultTutorialInsert),
  };

  const tutorialDb = {
    transaction: vi.fn(async (callback: (tx: typeof tutorialTx) => Promise<void>) => callback(tutorialTx)),
  };

  const loggerError = vi.fn();

  return {
    quizQuery,
    quizUpdate,
    quizUpdateCalls,
    tutorialDb,
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

describe("HierarchySyncService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.tutorialTx.insert.mockImplementation(mocks.defaultTutorialInsert);
    mocks.quizUpdateCalls.length = 0;
    mocks.tutorialInsertCalls.length = 0;
  });

  it("syncs a topic and marks the domain, subject, and topic as synced", async () => {
    mocks.quizQuery.topics.findFirst.mockResolvedValue({
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
    });

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
    expect(mocks.quizUpdateCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          table: "domains",
          values: expect.objectContaining({ tutorialSyncStatus: "synced" }),
        }),
        expect.objectContaining({
          table: "subjects",
          values: expect.objectContaining({ tutorialSyncStatus: "synced" }),
        }),
        expect.objectContaining({
          table: "topics",
          values: expect.objectContaining({ tutorialSyncStatus: "synced" }),
        }),
      ])
    );
  });

  it("syncs a subtopic and includes the full parent chain", async () => {
    mocks.quizQuery.subtopics.findFirst.mockResolvedValue({
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
    });

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
    expect(mocks.quizUpdateCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          table: "subtopics",
          values: expect.objectContaining({ tutorialSyncStatus: "synced" }),
        }),
      ])
    );
  });

  it("marks the source row as failed when tutorial sync throws", async () => {
    mocks.quizQuery.subjects.findFirst.mockResolvedValue({
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
    });
    mocks.tutorialTx.insert.mockImplementation(() => {
      throw new Error("tutorial write failed");
    });

    await expect(HierarchySyncService.sync("subject", "subject-11112222")).resolves.toBeUndefined();

    expect(mocks.quizUpdateCalls).toEqual([
      expect.objectContaining({
        table: "subjects",
        values: expect.objectContaining({ tutorialSyncStatus: "failed" }),
      }),
    ]);
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

    mocks.quizQuery.domains.findFirst.mockResolvedValue({
      id: "domain-1",
      name: "Web Development",
      description: "Domain description",
      category: "technical",
    });
    mocks.quizQuery.subjects.findFirst.mockResolvedValue({
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
    });
    mocks.quizQuery.topics.findFirst.mockResolvedValue({
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
    });
    mocks.quizQuery.subtopics.findFirst.mockResolvedValue({
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
    });

    await expect(HierarchySyncService.syncAll()).resolves.toEqual({
      total: 4,
      succeeded: 4,
      failed: 0,
    });

    expect(mocks.tutorialDb.transaction).toHaveBeenCalledTimes(4);
    expect(mocks.quizUpdateCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          table: "domains",
          values: expect.objectContaining({ tutorialSyncStatus: "synced" }),
        }),
        expect.objectContaining({
          table: "subjects",
          values: expect.objectContaining({ tutorialSyncStatus: "synced" }),
        }),
        expect.objectContaining({
          table: "topics",
          values: expect.objectContaining({ tutorialSyncStatus: "synced" }),
        }),
        expect.objectContaining({
          table: "subtopics",
          values: expect.objectContaining({ tutorialSyncStatus: "synced" }),
        }),
      ])
    );
  });

  it("retryFailed only reprocesses rows marked as failed", async () => {
    mocks.quizQuery.domains.findMany.mockResolvedValue([{ id: "domain-1" }]);
    mocks.quizQuery.subjects.findMany.mockResolvedValue([{ id: "subject-1" }]);
    mocks.quizQuery.topics.findMany.mockResolvedValue([{ id: "topic-1" }]);
    mocks.quizQuery.subtopics.findMany.mockResolvedValue([{ id: "subtopic-1" }]);

    mocks.quizQuery.domains.findFirst.mockResolvedValue({
      id: "domain-1",
      name: "Web Development",
      description: "Domain description",
      category: "technical",
    });
    mocks.quizQuery.subjects.findFirst.mockResolvedValue({
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
    });
    mocks.quizQuery.topics.findFirst.mockResolvedValue({
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
    });
    mocks.quizQuery.subtopics.findFirst.mockResolvedValue({
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
    });

    await expect(HierarchySyncService.retryFailed()).resolves.toEqual({
      total: 4,
      succeeded: 4,
      failed: 0,
    });

    expect(mocks.tutorialDb.transaction).toHaveBeenCalledTimes(4);
    expect(mocks.quizUpdateCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          table: "domains",
          values: expect.objectContaining({ tutorialSyncStatus: "synced" }),
        }),
        expect.objectContaining({
          table: "subjects",
          values: expect.objectContaining({ tutorialSyncStatus: "synced" }),
        }),
        expect.objectContaining({
          table: "topics",
          values: expect.objectContaining({ tutorialSyncStatus: "synced" }),
        }),
        expect.objectContaining({
          table: "subtopics",
          values: expect.objectContaining({ tutorialSyncStatus: "synced" }),
        }),
      ])
    );
  });
});
