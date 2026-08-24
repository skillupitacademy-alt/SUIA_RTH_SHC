import { db as quizDb, domains, subjects, subtopics, topics } from "@quiz/db";
import {
  db as tutorialDb,
  STANDARD_QUERY_TIMEOUT,
  tutorialDomains,
  tutorialSubjects,
  tutorialSubtopics,
  tutorialTopics,
  withTimeout,
} from "@quiz/db-tutorial";
import { and, eq, isNull } from "drizzle-orm";

import { logger } from "@/lib/logger";

type HierarchyEntityType = "domain" | "subject" | "topic" | "subtopic";
type BulkSyncSummary = {
  total: number;
  succeeded: number;
  failed: number;
};

type QuizDomainRow = {
  id: string;
  name: string;
};

type QuizSubjectRow = QuizDomainRow & {
  domain: QuizDomainRow;
};

type QuizTopicRow = {
  id: string;
  name: string;
  subject: {
    id: string;
    name: string;
    domain: QuizDomainRow;
  };
};

type QuizSubtopicRow = {
  id: string;
  name: string;
  topic: {
    id: string;
    name: string;
    subject: {
      id: string;
      name: string;
      domain: QuizDomainRow;
    };
  };
};

type TutorialTx = {
  insert: typeof tutorialDb.insert;
};

const slugify = (value: string) => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");

  return normalized.length > 0 ? normalized : "item";
};

const uniqueSlug = (name: string, entityId: string) => {
  const suffix = entityId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
  return `${slugify(name)}-${suffix.length > 0 ? suffix : entityId.slice(0, 8)}`;
};

// Status tracking removed: MainDB tables don't have tutorialSyncStatus column
// Sync success/failure is now communicated via method return/throw instead of database state

const upsertTutorialDomain = async (
  tx: TutorialTx,
  source: QuizDomainRow,
  now: Date,
) => {
  const rows = await withTimeout(
    tx
      .insert(tutorialDomains)
      .values({
        externalId: source.id,
        name: source.name,
        slug: uniqueSlug(source.name, source.id),
        deletedAt: null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: tutorialDomains.externalId,
        set: {
          name: source.name,
          slug: uniqueSlug(source.name, source.id),
          deletedAt: null,
          updatedAt: now,
        },
      })
      .returning({ id: tutorialDomains.id }),
    STANDARD_QUERY_TIMEOUT,
    "HierarchySyncService.upsertTutorialDomain"
  );

  const [row] = rows as Array<{ id: string }>;
  if (row === undefined) {
    throw new Error("Failed to upsert tutorial domain");
  }

  return row.id;
};

const upsertTutorialSubject = async (
  tx: TutorialTx,
  source: QuizSubjectRow,
  tutorialDomainId: string,
  now: Date,
) => {
  const rows = await withTimeout(
    tx
      .insert(tutorialSubjects)
      .values({
        externalId: source.id,
        domainId: tutorialDomainId,
        name: source.name,
        slug: uniqueSlug(source.name, source.id),
        deletedAt: null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: tutorialSubjects.externalId,
        set: {
          domainId: tutorialDomainId,
          name: source.name,
          slug: uniqueSlug(source.name, source.id),
          deletedAt: null,
          updatedAt: now,
        },
      })
      .returning({ id: tutorialSubjects.id }),
    STANDARD_QUERY_TIMEOUT,
    "HierarchySyncService.upsertTutorialSubject"
  );

  const [row] = rows as Array<{ id: string }>;
  if (row === undefined) {
    throw new Error("Failed to upsert tutorial subject");
  }

  return row.id;
};

const upsertTutorialTopic = async (
  tx: TutorialTx,
  source: QuizTopicRow,
  tutorialSubjectId: string,
  now: Date,
) => {
  const rows = await withTimeout(
    tx
      .insert(tutorialTopics)
      .values({
        externalId: source.id,
        subjectId: tutorialSubjectId,
        name: source.name,
        slug: uniqueSlug(source.name, source.id),
        deletedAt: null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: tutorialTopics.externalId,
        set: {
          subjectId: tutorialSubjectId,
          name: source.name,
          slug: uniqueSlug(source.name, source.id),
          deletedAt: null,
          updatedAt: now,
        },
      })
      .returning({ id: tutorialTopics.id }),
    STANDARD_QUERY_TIMEOUT,
    "HierarchySyncService.upsertTutorialTopic"
  );

  const [row] = rows as Array<{ id: string }>;
  if (row === undefined) {
    throw new Error("Failed to upsert tutorial topic");
  }

  return row.id;
};

const upsertTutorialSubtopic = async (
  tx: TutorialTx,
  source: QuizSubtopicRow,
  tutorialTopicId: string,
  now: Date,
) => {
  const rows = await withTimeout(
    tx
      .insert(tutorialSubtopics)
      .values({
        externalId: source.id,
        topicId: tutorialTopicId,
        name: source.name,
        slug: uniqueSlug(source.name, source.id),
        difficultyLevels: [],
        deletedAt: null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: tutorialSubtopics.externalId,
        set: {
          topicId: tutorialTopicId,
          name: source.name,
          slug: uniqueSlug(source.name, source.id),
          difficultyLevels: [],
          deletedAt: null,
          updatedAt: now,
        },
      })
      .returning({ id: tutorialSubtopics.id }),
    STANDARD_QUERY_TIMEOUT,
    "HierarchySyncService.upsertTutorialSubtopic"
  );

  const [row] = rows as Array<{ id: string }>;
  if (row === undefined) {
    throw new Error("Failed to upsert tutorial subtopic");
  }

  return row.id;
};

export class HierarchySyncService {
  /**
   * Ensure complete hierarchy synchronization for a topic before sidebar publish.
   * 
   * This method guarantees that:
   * 1. Parent chain (domain → subject → topic) exists in TutorialDB
   * 2. ALL active subtopics under the topic exist in TutorialDB
   * 3. Every external_id mapping is verified
   * 
   * Used by: Left Sidebar publish boundary
   * 
   * @throws Error if any required synchronization or verification fails
   * @returns Verified mapping information
   */
  static async ensureTopicHierarchySynced(topicId: string): Promise<{
    domain: { externalId: string; internalId: string };
    subject: { externalId: string; internalId: string };
    topic: { externalId: string; internalId: string };
    subtopics: Array<{ externalId: string; internalId: string; name: string }>;
  }> {
    const now = new Date();

    // Load MainDB topic with complete parent chain and ALL active subtopics
    const source = await withTimeout(
      quizDb.query.topics.findFirst({
        where: eq(topics.id, topicId),
        with: {
          subject: {
            with: {
              domain: true,
            },
          },
        },
      }) as unknown as Promise<QuizTopicRow | null>,
      STANDARD_QUERY_TIMEOUT,
      "HierarchySyncService.ensureTopicHierarchySynced.fetchTopic"
    );

    if (
      source === null ||
      source.subject === undefined ||
      source.subject === null ||
      source.subject.domain === undefined ||
      source.subject.domain === null
    ) {
      throw new Error(`Topic not found or incomplete hierarchy: ${topicId}`);
    }

    // Load ALL active subtopics for this topic
    const activeSubtopics = await withTimeout(
      quizDb.query.subtopics.findMany({
        where: and(
          eq(subtopics.topicId, topicId),
          isNull(subtopics.deletedAt)
        ),
      }) as unknown as Promise<Array<{ id: string; name: string; topicId: string }>>,
      STANDARD_QUERY_TIMEOUT,
      "HierarchySyncService.ensureTopicHierarchySynced.fetchSubtopics"
    );

    // Synchronize complete hierarchy in a transaction
    const result = await tutorialDb.transaction(async (tx) => {
      const tutorialTx = tx as TutorialTx;

      // Sync parent chain
      const tutorialDomainId = await upsertTutorialDomain(tutorialTx, source.subject.domain, now);
      const tutorialSubjectId = await upsertTutorialSubject(tutorialTx, source.subject, tutorialDomainId, now);
      const tutorialTopicId = await upsertTutorialTopic(tutorialTx, source, tutorialSubjectId, now);

      // Sync ALL active subtopics
      const subtopicResults: Array<{ externalId: string; internalId: string; name: string }> = [];
      
      for (const subtopic of activeSubtopics) {
        const subtopicWithParent = {
          ...subtopic,
          topic: source,
        };
        const tutorialSubtopicId = await upsertTutorialSubtopic(
          tutorialTx,
          subtopicWithParent as QuizSubtopicRow,
          tutorialTopicId,
          now
        );
        subtopicResults.push({
          externalId: subtopic.id,
          internalId: tutorialSubtopicId,
          name: subtopic.name,
        });
      }

      return {
        domain: {
          externalId: source.subject.domain.id,
          internalId: tutorialDomainId,
        },
        subject: {
          externalId: source.subject.id,
          internalId: tutorialSubjectId,
        },
        topic: {
          externalId: source.id,
          internalId: tutorialTopicId,
        },
        subtopics: subtopicResults,
      };
    });

    // Verify all mappings exist in TutorialDB
    await this.verifyTopicHierarchyMappings(result);

    return result;
  }

  /**
   * Verify that all expected TutorialDB mappings actually exist.
   * 
   * @throws Error if any required mapping is missing
   */
  private static async verifyTopicHierarchyMappings(expected: {
    domain: { externalId: string };
    subject: { externalId: string };
    topic: { externalId: string };
    subtopics: Array<{ externalId: string }>;
  }): Promise<void> {
    // Verify domain mapping
    const domainCheck = await withTimeout(
      tutorialDb.query.tutorialDomains.findFirst({
        where: eq(tutorialDomains.externalId, expected.domain.externalId),
        columns: { id: true },
      }),
      STANDARD_QUERY_TIMEOUT,
      "HierarchySyncService.verifyDomainMapping"
    );
    if (!domainCheck) {
      throw new Error(`Domain mapping verification failed: ${expected.domain.externalId}`);
    }

    // Verify subject mapping
    const subjectCheck = await withTimeout(
      tutorialDb.query.tutorialSubjects.findFirst({
        where: eq(tutorialSubjects.externalId, expected.subject.externalId),
        columns: { id: true },
      }),
      STANDARD_QUERY_TIMEOUT,
      "HierarchySyncService.verifySubjectMapping"
    );
    if (!subjectCheck) {
      throw new Error(`Subject mapping verification failed: ${expected.subject.externalId}`);
    }

    // Verify topic mapping
    const topicCheck = await withTimeout(
      tutorialDb.query.tutorialTopics.findFirst({
        where: eq(tutorialTopics.externalId, expected.topic.externalId),
        columns: { id: true },
      }),
      STANDARD_QUERY_TIMEOUT,
      "HierarchySyncService.verifyTopicMapping"
    );
    if (!topicCheck) {
      throw new Error(`Topic mapping verification failed: ${expected.topic.externalId}`);
    }

    // Verify ALL subtopic mappings
    for (const subtopic of expected.subtopics) {
      const subtopicCheck = await withTimeout(
        tutorialDb.query.tutorialSubtopics.findFirst({
          where: eq(tutorialSubtopics.externalId, subtopic.externalId),
          columns: { id: true },
        }),
        STANDARD_QUERY_TIMEOUT,
        "HierarchySyncService.verifySubtopicMapping"
      );
      if (!subtopicCheck) {
        throw new Error(`Subtopic mapping verification failed: ${subtopic.externalId}`);
      }
    }
  }

  static async sync(entityType: HierarchyEntityType, entityId: string): Promise<void> {
    await this.attemptSync(entityType, entityId);
  }

  static async retryFailed(): Promise<BulkSyncSummary> {
    const summary: BulkSyncSummary = { total: 0, succeeded: 0, failed: 0 };
    const entityBatches: Array<{ entityType: HierarchyEntityType; ids: Array<{ id: string }> }> = [];

    for (const batch of entityBatches) {
      for (const row of batch.ids) {
        summary.total += 1;
        const success = await this.attemptSync(batch.entityType, row.id);
        if (success) {
          summary.succeeded += 1;
        } else {
          summary.failed += 1;
        }
      }
    }

    return summary;
  }

  static async syncAll(): Promise<BulkSyncSummary> {
    const summary: BulkSyncSummary = { total: 0, succeeded: 0, failed: 0 };
    const entityBatches: Array<{ entityType: HierarchyEntityType; ids: Array<{ id: string }> }> = [
      {
        entityType: "domain",
        ids: await withTimeout(
          quizDb.query.domains.findMany({
            columns: { id: true },
          }) as Promise<Array<{ id: string }>>,
          STANDARD_QUERY_TIMEOUT,
          "HierarchySyncService.syncAll.domains",
        ),
      },
      {
        entityType: "subject",
        ids: await withTimeout(
          quizDb.query.subjects.findMany({
            columns: { id: true },
          }) as Promise<Array<{ id: string }>>,
          STANDARD_QUERY_TIMEOUT,
          "HierarchySyncService.syncAll.subjects",
        ),
      },
      {
        entityType: "topic",
        ids: await withTimeout(
          quizDb.query.topics.findMany({
            columns: { id: true },
          }) as Promise<Array<{ id: string }>>,
          STANDARD_QUERY_TIMEOUT,
          "HierarchySyncService.syncAll.topics",
        ),
      },
      {
        entityType: "subtopic",
        ids: await withTimeout(
          quizDb.query.subtopics.findMany({
            columns: { id: true },
          }) as Promise<Array<{ id: string }>>,
          STANDARD_QUERY_TIMEOUT,
          "HierarchySyncService.syncAll.subtopics",
        ),
      },
    ];

    for (const batch of entityBatches) {
      for (const row of batch.ids) {
        summary.total += 1;
        const success = await this.attemptSync(batch.entityType, row.id);
        if (success) {
          summary.succeeded += 1;
        } else {
          summary.failed += 1;
        }
      }
    }

    return summary;
  }

  private static async attemptSync(entityType: HierarchyEntityType, entityId: string): Promise<boolean> {
    const now = new Date();

    try {
      await this.executeSync(entityType, entityId, now);
      return true;
    } catch (error) {
      await this.logFailure(entityType, entityId, error);
      return false;
    }
  }

  private static async executeSync(entityType: HierarchyEntityType, entityId: string, now: Date) {
    if (entityType === "domain") {
      await this.syncDomain(entityId, now);
      return;
    }

    if (entityType === "subject") {
      await this.syncSubject(entityId, now);
      return;
    }

    if (entityType === "topic") {
      await this.syncTopic(entityId, now);
      return;
    }

    await this.syncSubtopic(entityId, now);
  }

  private static async logFailure(entityType: HierarchyEntityType, entityId: string, error: unknown) {
    logger.error(
      {
        event: "hierarchy.sync_failed",
        entityType,
        entityId,
        error: error instanceof Error ? error.message : String(error),
      },
      "Hierarchy sync failed",
    );
  }

  private static async syncDomain(entityId: string, now: Date) {
    const source = (await withTimeout(
      quizDb.query.domains.findFirst({
        where: eq(domains.id, entityId),
      }) as Promise<QuizDomainRow | null>,
      STANDARD_QUERY_TIMEOUT,
      "HierarchySyncService.fetchDomain"
    )) as QuizDomainRow | null;

    if (source === null) {
      throw new Error(`Domain not found: ${entityId}`);
    }

    await tutorialDb.transaction(async (tx) => {
      await upsertTutorialDomain(tx as TutorialTx, source, now);
    });
  }

  private static async syncSubject(entityId: string, now: Date) {
    const source = await withTimeout(
      quizDb.query.subjects.findFirst({
        where: eq(subjects.id, entityId),
        with: {
          domain: true,
        },
      }) as unknown as Promise<QuizSubjectRow | null>,
      STANDARD_QUERY_TIMEOUT,
      "HierarchySyncService.fetchSubject"
    );

    if (source === null || source.domain === undefined || source.domain === null) {
      throw new Error(`Subject not found: ${entityId}`);
    }

    await tutorialDb.transaction(async (tx) => {
      const tutorialTx = tx as TutorialTx;
      const tutorialDomainId = await upsertTutorialDomain(tutorialTx, source.domain, now);
      await upsertTutorialSubject(tutorialTx, source, tutorialDomainId, now);
    });
  }

  private static async syncTopic(entityId: string, now: Date) {
    const source = await withTimeout(
      quizDb.query.topics.findFirst({
        where: eq(topics.id, entityId),
        with: {
          subject: {
            with: {
              domain: true,
            },
          },
        },
      }) as unknown as Promise<QuizTopicRow | null>,
      STANDARD_QUERY_TIMEOUT,
      "HierarchySyncService.fetchTopic"
    );

    if (
      source === null ||
      source.subject === undefined ||
      source.subject === null ||
      source.subject.domain === undefined ||
      source.subject.domain === null
    ) {
      throw new Error(`Topic not found: ${entityId}`);
    }

    await tutorialDb.transaction(async (tx) => {
      const tutorialTx = tx as TutorialTx;
      const tutorialDomainId = await upsertTutorialDomain(tutorialTx, source.subject.domain, now);
      const tutorialSubjectId = await upsertTutorialSubject(tutorialTx, source.subject, tutorialDomainId, now);
      await upsertTutorialTopic(tutorialTx, source, tutorialSubjectId, now);
    });
  }

  private static async syncSubtopic(entityId: string, now: Date) {
    const source = await withTimeout(
      quizDb.query.subtopics.findFirst({
        where: eq(subtopics.id, entityId),
        with: {
          topic: {
            with: {
              subject: {
                with: {
                  domain: true,
                },
              },
            },
          },
        },
      }) as unknown as Promise<QuizSubtopicRow | null>,
      STANDARD_QUERY_TIMEOUT,
      "HierarchySyncService.fetchSubtopic"
    );

    if (
      source === null ||
      source.topic === undefined ||
      source.topic === null ||
      source.topic.subject === undefined ||
      source.topic.subject === null ||
      source.topic.subject.domain === undefined ||
      source.topic.subject.domain === null
    ) {
      throw new Error(`Subtopic not found: ${entityId}`);
    }

    await tutorialDb.transaction(async (tx) => {
      const tutorialTx = tx as TutorialTx;
      const tutorialDomainId = await upsertTutorialDomain(tutorialTx, source.topic.subject.domain, now);
      const tutorialSubjectId = await upsertTutorialSubject(tutorialTx, source.topic.subject, tutorialDomainId, now);
      const tutorialTopicId = await upsertTutorialTopic(tutorialTx, source.topic, tutorialSubjectId, now);
      await upsertTutorialSubtopic(tutorialTx, source, tutorialTopicId, now);
    });
  }
}
