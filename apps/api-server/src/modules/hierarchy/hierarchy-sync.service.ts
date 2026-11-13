import { db as quizDb, domains, subjects, subtopics, topics } from "@quiz/db";
import {
  db as tutorialDb,
  STANDARD_QUERY_TIMEOUT,
  tutorialDomains,
  tutorialSubjects,
  tutorialSubtopics,
  tutorialTopics,
  withMainHierarchyLocks,
  withTimeout,
} from "@quiz/db-tutorial";
import { and, asc, eq, gt, isNull } from "drizzle-orm";

import { logger } from "@/lib/logger";

export type HierarchyEntityType = "domain" | "subject" | "topic" | "subtopic";
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

const ENTITY_ORDER = ["domain", "subject", "topic", "subtopic"] as const;
const MAIN_TABLES = { domain: domains, subject: subjects, topic: topics, subtopic: subtopics };
export type ReconciliationEntity = { entityType: HierarchyEntityType; entityId: string };
export type ReconciliationOptions = {
  limit?: number;
  cursor?: ReconciliationEntity;
  entities?: ReconciliationEntity[];
};
type ReconciliationOutcome = "REPAIRED" | "ALREADY_CONSISTENT" | "SKIPPED_INACTIVE";
export type ReconciliationSummary = BulkSyncSummary & {
  mode: "CURRENT_STATE_RECONCILIATION";
  checked: number;
  driftFound: number;
  repaired: number;
  alreadyConsistent: number;
  skipped: number;
  scanComplete: boolean;
  complete: boolean;
  remaining: number | null;
  nextCursor?: ReconciliationEntity;
  outcomes: Array<ReconciliationEntity & { outcome: ReconciliationOutcome | "UNRESOLVED" }>;
};
type SourceMapping = ReconciliationEntity & { name: string; status: string; deletedAt: Date | null };
type TargetMapping = { id: string; name: string; deletedAt: Date | null; parentId: string | null };
type MappingReader = Pick<typeof tutorialDb, "query">;

function compareEntities(a: ReconciliationEntity, b: ReconciliationEntity) {
  return ENTITY_ORDER.indexOf(a.entityType) - ENTITY_ORDER.indexOf(b.entityType) || a.entityId.localeCompare(b.entityId);
}

function sourceMapping(entityType: HierarchyEntityType, row: { id: string; name: string; status: string; deletedAt: Date | null }): SourceMapping {
  return { entityType, entityId: row.id, name: row.name, status: row.status, deletedAt: row.deletedAt };
}

async function readMapping(db: MappingReader, source: ReconciliationEntity): Promise<TargetMapping | undefined> {
  const read = async () => {
    const externalId = source.entityId;
    if (source.entityType === "domain") {
      const row = await db.query.tutorialDomains.findFirst({ where: eq(tutorialDomains.externalId, externalId) });
      return row ? { ...row, parentId: null } : undefined;
    }
    if (source.entityType === "subject") {
      const row = await db.query.tutorialSubjects.findFirst({ where: eq(tutorialSubjects.externalId, externalId) });
      return row ? { ...row, parentId: row.domainId } : undefined;
    }
    if (source.entityType === "topic") {
      const row = await db.query.tutorialTopics.findFirst({ where: eq(tutorialTopics.externalId, externalId) });
      return row ? { ...row, parentId: row.subjectId } : undefined;
    }
    const row = await db.query.tutorialSubtopics.findFirst({ where: eq(tutorialSubtopics.externalId, externalId) });
    return row ? { ...row, parentId: row.topicId } : undefined;
  };
  return withTimeout(read(), STANDARD_QUERY_TIMEOUT, "HierarchySyncService.readMapping");
}

async function writeMapping(tx: TutorialTx, source: SourceMapping, parentId: string | null, now: Date) {
  const row = { id: source.entityId, name: source.name };
  if (source.entityType === "domain") return upsertTutorialDomain(tx, row, now, true);
  if (parentId === null || parentId.length === 0) throw new Error("Missing parent mapping");
  if (source.entityType === "subject") return upsertTutorialSubject(tx, row, parentId, now, true);
  if (source.entityType === "topic") return upsertTutorialTopic(tx, row, parentId, now, true);
  return upsertTutorialSubtopic(tx, row, parentId, now, true);
}

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
  reconcile = false,
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
        setWhere: isNull(tutorialDomains.deletedAt),
        set: {
          name: source.name,
          ...(reconcile ? {} : { slug: uniqueSlug(source.name, source.id) }),
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
  source: QuizDomainRow,
  tutorialDomainId: string,
  now: Date,
  reconcile = false,
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
        setWhere: isNull(tutorialSubjects.deletedAt),
        set: {
          domainId: tutorialDomainId,
          name: source.name,
          ...(reconcile ? {} : { slug: uniqueSlug(source.name, source.id) }),
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
  source: QuizDomainRow,
  tutorialSubjectId: string,
  now: Date,
  reconcile = false,
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
        setWhere: isNull(tutorialTopics.deletedAt),
        set: {
          subjectId: tutorialSubjectId,
          name: source.name,
          ...(reconcile ? {} : { slug: uniqueSlug(source.name, source.id) }),
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
  source: QuizDomainRow,
  tutorialTopicId: string,
  now: Date,
  reconcile = false,
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
        setWhere: isNull(tutorialSubtopics.deletedAt),
        set: {
          topicId: tutorialTopicId,
          name: source.name,
          ...(reconcile ? {} : { slug: uniqueSlug(source.name, source.id) }),
          ...(reconcile ? {} : { difficultyLevels: [] }),
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
    return withMainHierarchyLocks({ topicIds: [topicId] }, async () => {
      const chain = await this.sourceChain({ entityType: "topic", entityId: topicId });
      if (chain.some((row) => row.status !== "active" || row.deletedAt !== null)) {
        throw new Error("Cannot synchronize an inactive hierarchy");
      }
      return this.ensureLockedTopicHierarchySynced(topicId);
    });
  }

  private static async ensureLockedTopicHierarchySynced(topicId: string) {
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
          isNull(subtopics.deletedAt),
          eq(subtopics.status, "active")
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

  static async sync(entityType: HierarchyEntityType, entityId: string): Promise<boolean> {
    return this.attemptSync(entityType, entityId);
  }

  /** Reconcile current mappings. No historical failure journal exists. */
  static async retryFailed(options: ReconciliationOptions = {}): Promise<ReconciliationSummary> {
    const limit = options.limit ?? 50;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new Error("Reconciliation limit must be between 1 and 100");
    }
    if (options.entities && (options.entities.length === 0 || options.entities.length > 100)) {
      throw new Error("Reconciliation scope must contain between 1 and 100 entities");
    }
    const summary: ReconciliationSummary = {
      mode: "CURRENT_STATE_RECONCILIATION", total: 0, succeeded: 0, failed: 0,
      checked: 0, driftFound: 0, repaired: 0, alreadyConsistent: 0, skipped: 0,
      scanComplete: false, complete: false, remaining: null, outcomes: [],
    };
    const candidates = options.entities
      ? [...new Map(options.entities.map((item) => [`${item.entityType}:${item.entityId}`, item])).values()]
        .sort(compareEntities).filter((item) => !options.cursor || compareEntities(item, options.cursor) > 0)
        .slice(0, limit + 1)
      : await this.reconciliationCandidates(limit + 1, options.cursor);
    const started = Date.now();
    for (const candidate of candidates.slice(0, limit)) {
      // Finish/rollback the current transaction before yielding a continuation.
      if (summary.checked > 0 && Date.now() - started >= 30_000) break;
      summary.checked += 1;
      summary.total += 1;
      summary.nextCursor = candidate;
      try {
        let driftRecorded = false;
        const outcome = await this.reconcileEntity(candidate, () => {
          if (!driftRecorded) summary.driftFound += 1;
          driftRecorded = true;
        });
        summary.outcomes.push({ ...candidate, outcome });
        if (outcome === "SKIPPED_INACTIVE") summary.skipped += 1;
        else {
          summary.succeeded += 1;
          if (outcome === "REPAIRED") summary.repaired += 1;
          else summary.alreadyConsistent += 1;
        }
      } catch (error) {
        summary.failed += 1;
        summary.outcomes.push({ ...candidate, outcome: "UNRESOLVED" });
        await this.logFailure(candidate.entityType, candidate.entityId, error);
      }
    }
    summary.scanComplete = candidates.length <= limit && summary.checked === candidates.length;
    summary.complete = summary.scanComplete && summary.failed === 0;
    summary.remaining = summary.scanComplete ? summary.failed : null;
    // A caller must retry the current page when any item is unresolved.
    // Advancing its cursor would otherwise skip failed entities permanently.
    if (summary.scanComplete || summary.failed > 0) delete summary.nextCursor;
    return summary;
  }

  private static async reconciliationCandidates(limit: number, cursor?: ReconciliationEntity) {
    const candidates: ReconciliationEntity[] = [];
    for (const entityType of ENTITY_ORDER) {
      if (cursor && ENTITY_ORDER.indexOf(entityType) < ENTITY_ORDER.indexOf(cursor.entityType)) continue;
      const table = MAIN_TABLES[entityType];
      const rows = await withTimeout(quizDb.select({ id: table.id }).from(table).where(and(
        isNull(table.deletedAt), eq(table.status, "active"),
        cursor?.entityType === entityType ? gt(table.id, cursor.entityId) : undefined,
      )).orderBy(asc(table.id)).limit(limit - candidates.length), STANDARD_QUERY_TIMEOUT,
      "HierarchySyncService.reconciliationCandidates");
      candidates.push(...rows.map((row) => ({ entityType, entityId: row.id })));
      if (candidates.length === limit) break;
    }
    return candidates;
  }

  private static async sourceChain(entity: ReconciliationEntity): Promise<SourceMapping[]> {
    const { entityType, entityId } = entity;
    const fetchSource = async () => {
      if (entityType === "domain") {
        const row = await quizDb.query.domains.findFirst({ where: eq(domains.id, entityId) });
        return row ? [sourceMapping("domain", row)] : [];
      }
      if (entityType === "subject") {
        const row = await quizDb.query.subjects.findFirst({ where: eq(subjects.id, entityId), with: { domain: true } });
        return row?.domain ? [sourceMapping("domain", row.domain), sourceMapping("subject", row)] : [];
      }
      if (entityType === "topic") {
        const row = await quizDb.query.topics.findFirst({ where: eq(topics.id, entityId), with: { subject: { with: { domain: true } } } });
        return row?.subject?.domain ? [sourceMapping("domain", row.subject.domain), sourceMapping("subject", row.subject), sourceMapping("topic", row)] : [];
      }
      const row = await quizDb.query.subtopics.findFirst({ where: eq(subtopics.id, entityId), with: { topic: { with: { subject: { with: { domain: true } } } } } });
      return row?.topic?.subject?.domain ? [sourceMapping("domain", row.topic.subject.domain), sourceMapping("subject", row.topic.subject), sourceMapping("topic", row.topic), sourceMapping("subtopic", row)] : [];
    };
    const chain = await withTimeout(fetchSource(), STANDARD_QUERY_TIMEOUT, "HierarchySyncService.sourceChain");
    if (!chain.length) throw new Error("Authoritative hierarchy is missing or incomplete");
    return chain;
  }

  private static async reconcileEntity(entity: ReconciliationEntity, onDrift: () => void): Promise<ReconciliationOutcome> {
    const scopes = {
      domain: { domainIds: [entity.entityId] }, subject: { subjectIds: [entity.entityId] },
      topic: { topicIds: [entity.entityId] }, subtopic: { subtopicIds: [entity.entityId] },
    };
    return withMainHierarchyLocks(scopes[entity.entityType], async () => {
      // Source and target are read after acquiring the same ancestor locks used by deletion.
      const chain = await this.sourceChain(entity);
      if (chain.some((row) => row.status !== "active" || row.deletedAt !== null)) return "SKIPPED_INACTIVE";
      const result = await tutorialDb.transaction(async (tx) => {
        const expected: Array<{ source: SourceMapping; id: string; parentId: string | null }> = [];
        let parentId: string | null = null;
        let repaired = false;
        for (const source of chain) {
          const target = await readMapping(tx, source);
          if (target?.deletedAt) {
            onDrift();
            throw new Error("Retained deleted mapping requires an explicit restoration decision");
          }
          let id = target?.id;
          if (!target || target.name !== source.name || target.parentId !== parentId) {
            onDrift();
            // Only canonical mapping fields are reconciled. Published content is untouched.
            id = await writeMapping(tx, source, parentId, new Date());
            repaired = true;
          }
          if (id === undefined || id.length === 0) throw new Error("Mapping write returned no identifier");
          expected.push({ source, id, parentId });
          parentId = id;
        }
        return { expected, repaired };
      });
      // This read follows the actual TutorialDB commit, while MainDB locks remain held.
      for (const expected of result.expected) {
        const actual = await readMapping(tutorialDb, expected.source);
        if (!actual || actual.deletedAt || actual.id !== expected.id ||
            actual.name !== expected.source.name || actual.parentId !== expected.parentId) {
          throw new Error("Post-commit hierarchy mapping verification failed");
        }
      }
      return result.repaired ? "REPAIRED" : "ALREADY_CONSISTENT";
    });
  }

  static async syncAll(): Promise<BulkSyncSummary> {
    const summary: BulkSyncSummary = { total: 0, succeeded: 0, failed: 0 };
    const entityBatches: Array<{ entityType: HierarchyEntityType; ids: Array<{ id: string }> }> = [
      {
        entityType: "domain",
        ids: await withTimeout(
          quizDb.query.domains.findMany({
            columns: { id: true },
            where: and(isNull(domains.deletedAt), eq(domains.status, "active")),
            orderBy: [asc(domains.id)],
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
            where: and(isNull(subjects.deletedAt), eq(subjects.status, "active")),
            orderBy: [asc(subjects.id)],
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
            where: and(isNull(topics.deletedAt), eq(topics.status, "active")),
            orderBy: [asc(topics.id)],
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
            where: and(isNull(subtopics.deletedAt), eq(subtopics.status, "active")),
            orderBy: [asc(subtopics.id)],
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
    const scopes = {
      domain: { domainIds: [entityId] }, subject: { subjectIds: [entityId] },
      topic: { topicIds: [entityId] }, subtopic: { subtopicIds: [entityId] },
    };
    return withMainHierarchyLocks(scopes[entityType], async () => {
      const chain = await this.sourceChain({ entityType, entityId });
      if (chain.some((row) => row.status !== "active" || row.deletedAt !== null)) {
        throw new Error("Cannot synchronize an inactive hierarchy");
      }
      return this.executeLockedSync(entityType, entityId, now);
    });
  }

  private static async executeLockedSync(entityType: HierarchyEntityType, entityId: string, now: Date) {
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
