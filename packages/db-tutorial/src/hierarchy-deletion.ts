import { domains, getDb, subjects, subtopics, topics } from '@quiz/db';
import { inArray, sql } from 'drizzle-orm';

import { db } from './db';
import { HierarchyCoordinationError } from './hierarchy-coordination';
import { tutorialDomains, tutorialSidebarTreesV2, tutorialSubjects, tutorialSubtopics, tutorialTopics } from './schema';

export type HierarchyParentKind = 'domain' | 'subject' | 'topic' | 'subtopic';

export class HierarchyDependencyError extends Error {
  readonly status = 409;
  constructor() {
    super('Hierarchy deletion blocked by retained tutorial dependencies');
    this.name = 'HierarchyDependencyError';
  }
}

/** Physical mappings also retain dependent snapshots and learning references. */
export async function hasTutorialHierarchyDependents(kind: HierarchyParentKind, ids: string[]): Promise<boolean> {
  if (ids.length === 0) return false;
  const mappings = {
    domain: tutorialDomains, subject: tutorialSubjects, topic: tutorialTopics, subtopic: tutorialSubtopics,
  };
  const table = mappings[kind];
  const mapping = await db.select({ id: table.id }).from(table).where(inArray(table.externalId, ids)).limit(1);
  if (mapping.length > 0) return true;
  const sidebarColumns = {
    domain: tutorialSidebarTreesV2.domainId, subject: tutorialSidebarTreesV2.subjectId,
    topic: tutorialSidebarTreesV2.topicId, subtopic: tutorialSidebarTreesV2.activeSubtopicId,
  };
  const sidebars = await db.select({ id: tutorialSidebarTreesV2.id }).from(tutorialSidebarTreesV2)
    .where(inArray(sidebarColumns[kind], ids)).limit(1);
  return sidebars.length > 0;
}

/** Used by the alternate backend deletion entry points under the same parent locks. */
export async function withHierarchyDeletionLocks<T>(
  kind: HierarchyParentKind,
  ids: string[],
  operation: (tx: Parameters<Parameters<ReturnType<typeof getDb>['transaction']>[0]>[0]) => Promise<T>,
): Promise<T> {
  const table = { domain: domains, subject: subjects, topic: topics, subtopic: subtopics }[kind];
  const orderedIds = [...new Set(ids)].sort();
  try {
    return await getDb().transaction(async tx => {
      await tx.execute(sql`SET LOCAL lock_timeout = '3s'`);
      await tx.select({ id: table.id }).from(table).where(inArray(table.id, orderedIds)).orderBy(table.id).for('update');
      if (await hasTutorialHierarchyDependents(kind, orderedIds)) {
        throw new HierarchyDependencyError();
      }
      return operation(tx);
    });
  } catch (error) {
    if (error instanceof HierarchyDependencyError) throw error;
    throw new HierarchyCoordinationError();
  }
}
