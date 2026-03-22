import { and, eq, isNull } from 'drizzle-orm';

import { withTimeout, STANDARD_QUERY_TIMEOUT } from '@quiz/db';
import type { HierarchyDomainDTO, HierarchySubjectDTO, HierarchyTopicDTO, HierarchySubtopicDTO, CreateSubtopicInput } from './hierarchy.types';

import { db, schema } from '@/lib/db';

export class HierarchyRepository {
  constructor(private readonly dbClient = db) {}

  async getDomains(): Promise<HierarchyDomainDTO[]> {
    const rows = await withTimeout(
      this.dbClient
        .select()
        .from(schema.domains)
        .where(isNull(schema.domains.deletedAt)),
      STANDARD_QUERY_TIMEOUT,
      'people.domains.list'
    );
    return rows as HierarchyDomainDTO[];
  }

  async getSubjects(domainId: string): Promise<HierarchySubjectDTO[]> {
    const rows = await withTimeout(
      this.dbClient
        .select()
        .from(schema.subjects)
        .where(and(eq(schema.subjects.domainId, domainId), isNull(schema.subjects.deletedAt))),
      STANDARD_QUERY_TIMEOUT,
      'people.subjects.list'
    );
    return rows as HierarchySubjectDTO[];
  }

  async getTopics(subjectId: string): Promise<HierarchyTopicDTO[]> {
    const rows = await withTimeout(
      this.dbClient
        .select()
        .from(schema.topics)
        .where(and(eq(schema.topics.subjectId, subjectId), isNull(schema.topics.deletedAt))),
      STANDARD_QUERY_TIMEOUT,
      'people.topics.list'
    );
    return rows as HierarchyTopicDTO[];
  }

  async getSubtopics(topicId: string): Promise<HierarchySubtopicDTO[]> {
    const rows = await withTimeout(
      this.dbClient
        .select()
        .from(schema.subtopics)
        .where(and(eq(schema.subtopics.topicId, topicId), isNull(schema.subtopics.deletedAt))),
      STANDARD_QUERY_TIMEOUT,
      'people.subtopics.list'
    );
    return rows as HierarchySubtopicDTO[];
  }

  async createSubtopic(input: CreateSubtopicInput): Promise<HierarchySubtopicDTO> {
    const [row] = await withTimeout(
      this.dbClient
        .insert(schema.subtopics)
        .values({
          topicId: input.topicId,
          name: input.name,
          slug: input.slug,
          description: input.description ?? null,
          difficultyLevels: input.difficultyLevels,
        })
        .returning(),
      STANDARD_QUERY_TIMEOUT,
      'people.subtopics.create'
    );
    return row as HierarchySubtopicDTO;
  }
}
