import { domains, getDb, subjects, subtopics, topics } from '@quiz/db';
import { eq, inArray, sql } from 'drizzle-orm';

export interface MainHierarchyScope {
  domainIds?: string[];
  subjectIds?: string[];
  topicIds?: string[];
  subtopicIds?: string[];
}

export class HierarchyCoordinationError extends Error {
  readonly status = 503;
  constructor(message = 'Hierarchy coordination unavailable') {
    super(message);
    this.name = 'HierarchyCoordinationError';
  }
}

const ordered = (ids: string[] = []) => [...new Set(ids)].sort();
const assertRows = <T extends { id: string; deletedAt: Date | null }>(ids: string[], rows: T[]) => {
  if (rows.length !== ids.length || rows.some(row => row.deletedAt !== null)) {
    throw new HierarchyCoordinationError('Hierarchy parent is missing or deleted');
  }
};

/**
 * Application writer convention, not a distributed transaction.
 * Locks MainDB ancestors before a TutorialDB transaction starts and releases only
 * after that transaction has actually committed or rolled back. Callers must not
 * detach work or race a write against a timeout that leaves its commit pending.
 * Lock order: domains, subjects, topics, subtopics; UUID order within each table.
 */
export async function withMainHierarchyLocks<T>(scope: MainHierarchyScope, operation: () => Promise<T>): Promise<T> {
  try {
    return await getDb().transaction(async tx => {
      await tx.execute(sql`SET LOCAL lock_timeout = '3s'`);
      const requestedSubtopics = ordered(scope.subtopicIds);
      const sourceSubtopics = requestedSubtopics.length
        ? await tx.select().from(subtopics).where(inArray(subtopics.id, requestedSubtopics)) : [];
      assertRows(requestedSubtopics, sourceSubtopics);
      const topicIds = ordered([...(scope.topicIds ?? []), ...sourceSubtopics.map(row => row.topicId)]);
      const sourceTopics = topicIds.length ? await tx.select().from(topics).where(inArray(topics.id, topicIds)) : [];
      assertRows(topicIds, sourceTopics);
      const subjectIds = ordered([...(scope.subjectIds ?? []), ...sourceTopics.map(row => row.subjectId)]);
      const sourceSubjects = subjectIds.length ? await tx.select().from(subjects).where(inArray(subjects.id, subjectIds)) : [];
      assertRows(subjectIds, sourceSubjects);
      const domainIds = ordered([...(scope.domainIds ?? []), ...sourceSubjects.map(row => row.domainId)]);
      if (domainIds.length === 0) throw new HierarchyCoordinationError('Hierarchy scope is required');

      const lockedDomains = await tx.select().from(domains).where(inArray(domains.id, domainIds)).orderBy(domains.id).for('share');
      assertRows(domainIds, lockedDomains);
      const lockedSubjects = subjectIds.length
        ? await tx.select().from(subjects).where(inArray(subjects.id, subjectIds)).orderBy(subjects.id).for('share') : [];
      assertRows(subjectIds, lockedSubjects);
      if (lockedSubjects.some(row => row.domainId !== sourceSubjects.find(source => source.id === row.id)?.domainId)) {
        throw new HierarchyCoordinationError('Hierarchy parent changed while acquiring locks');
      }
      // Exclusive topic locks also prevent new MainDB subtopic FK inserts while a
      // complete-topic synchronization discovers and copies its children.
      const lockedTopics = topicIds.length
        ? await tx.select().from(topics).where(inArray(topics.id, topicIds)).orderBy(topics.id).for('update') : [];
      assertRows(topicIds, lockedTopics);
      if (lockedTopics.some(row => row.subjectId !== sourceTopics.find(source => source.id === row.id)?.subjectId)) {
        throw new HierarchyCoordinationError('Hierarchy parent changed while acquiring locks');
      }
      const lockedSubtopics = topicIds.length
        ? await tx.select().from(subtopics).where(inArray(subtopics.topicId, topicIds)).orderBy(subtopics.id).for('share') : [];
      assertRows(requestedSubtopics, lockedSubtopics.filter(row => requestedSubtopics.includes(row.id)));
      if (sourceSubtopics.some(source => lockedSubtopics.find(row => row.id === source.id)?.topicId !== source.topicId)) {
        throw new HierarchyCoordinationError('Hierarchy parent changed while acquiring locks');
      }
      return operation();
    });
  } catch (error) {
    if (error instanceof HierarchyCoordinationError) throw error;
    if (error instanceof Error && 'code' in error &&
        ['55P03', '40P01', '57014', '08006', '08001'].includes(String(error.code))) {
      throw new HierarchyCoordinationError();
    }
    throw error;
  }
}

/** Validate a worker event's complete chain against the authoritative MainDB. */
export async function assertMainHierarchyRelationship(scope: {
  domainId: string; subjectId: string; topicId: string; subtopicId: string;
}): Promise<void> {
  const rows = await getDb().select({ id: subtopics.id }).from(subtopics)
    .innerJoin(topics, eq(subtopics.topicId, topics.id))
    .innerJoin(subjects, eq(topics.subjectId, subjects.id))
    .where(sql`${subtopics.id} = ${scope.subtopicId} AND ${topics.id} = ${scope.topicId}
      AND ${subjects.id} = ${scope.subjectId} AND ${subjects.domainId} = ${scope.domainId}`);
  if (rows.length !== 1) throw new HierarchyCoordinationError('Hierarchy relationship mismatch');
}
