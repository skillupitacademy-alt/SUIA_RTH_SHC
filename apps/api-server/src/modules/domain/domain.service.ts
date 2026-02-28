import { db, domains, subjects, subtopics, topics } from '@quiz/db';
import { and, eq, inArray } from "drizzle-orm";

import { cacheService, type CacheValue } from '@/modules/core/cache.service';

const CACHE_TTL_METADATA = 1000 * 60 * 60; // 1 hour for metadata

export class DomainService {
  static async getAllDomains() {
    const cacheKey = 'metadata:domains:all';
    const cached = await cacheService.get<CacheValue>(cacheKey).catch(() => null);
    if (Array.isArray(cached)) return cached;

    const result = await db.query.domains.findMany({
      where: eq(domains.status, 'active'),
      with: {
        subjects: {
          where: eq(subjects.status, 'active'),
          orderBy: [subjects.order],
        }
      }
    });

    await cacheService.set(cacheKey, result, CACHE_TTL_METADATA).catch(() => null);
    return result;
  }

  static async getDomainHierarchy(domainId: string) {
    const cacheKey = `metadata:domain-hierarchy:${domainId}`;
    const cached = await cacheService.get<CacheValue>(cacheKey).catch(() => null);
    if (cached !== null) return cached as typeof result | null;

    const result = await db.query.domains.findFirst({
      where: eq(domains.id, domainId),
      with: {
        subjects: {
          where: eq(subjects.status, 'active'),
          orderBy: [subjects.order],
          with: {
            topics: {
              where: eq(topics.status, 'active'),
              orderBy: [topics.complexityLevel],
              with: {
                subtopics: true,
              }
            }
          }
        }
      }
    });

    if (result) {
        await cacheService.set(cacheKey, result, CACHE_TTL_METADATA).catch(() => null);
    }
    return result ?? null;
  }

  static async createDomain(data: typeof domains.$inferInsert) {
    await cacheService.del('metadata:domains:all').catch(() => null);
    return await db.insert(domains).values(data).returning();
  }

  static async updateDomain(id: string, data: Partial<typeof domains.$inferInsert>) {
    await cacheService.del('metadata:domains:all').catch(() => null);
    await cacheService.del(`metadata:domain-hierarchy:${id}`).catch(() => null);
    return await db.update(domains).set(data).where(eq(domains.id, id)).returning();
  }

  static async deleteDomain(id: string) {
    await cacheService.del('metadata:domains:all').catch(() => null);
    await cacheService.del(`metadata:domain-hierarchy:${id}`).catch(() => null);
    return await db.delete(domains).where(eq(domains.id, id)).returning();
  }

  static async deleteDomainsBatch(ids: string[]) {
    await cacheService.del('metadata:domains:all').catch(() => null);
    for (const id of ids) {
        await cacheService.del(`metadata:domain-hierarchy:${id}`).catch(() => null);
    }
    return await db.delete(domains).where(inArray(domains.id, ids)).returning();
  }
}

export class SubjectService {
  static async getSubjectsByDomain(domainId: string) {
    const cacheKey = `metadata:subjects:domain:${domainId}`;
    const cached = await cacheService.get<CacheValue>(cacheKey).catch(() => null);
    if (Array.isArray(cached)) return cached;

    const result = await db.query.subjects.findMany({
      where: and(eq(subjects.domainId, domainId), eq(subjects.status, 'active')),
      orderBy: [subjects.order],
    });

    await cacheService.set(cacheKey, result, CACHE_TTL_METADATA).catch(() => null);
    return result;
  }

  static async createSubject(data: typeof subjects.$inferInsert) {
    if (typeof data.domainId === 'string' && data.domainId !== '') {
      await cacheService.del(`metadata:subjects:domain:${data.domainId}`).catch(() => null);
    }
    await cacheService.del('metadata:domains:all').catch(() => null);
    return await db.insert(subjects).values(data).returning();
  }

  static async updateSubject(id: string, data: Partial<typeof subjects.$inferInsert>) {
    // Invalidation simplified for metadata
    await cacheService.del('metadata:domains:all').catch(() => null);
    return await db.update(subjects).set(data).where(eq(subjects.id, id)).returning();
  }

  static async deleteSubject(id: string) {
    await cacheService.del('metadata:domains:all').catch(() => null);
    return await db.delete(subjects).where(eq(subjects.id, id)).returning();
  }

  static async deleteSubjectsBatch(ids: string[]) {
    await cacheService.del('metadata:domains:all').catch(() => null);
    return await db.delete(subjects).where(inArray(subjects.id, ids)).returning();
  }
}

export class TopicService {
  static async getTopicsBySubject(subjectId: string) {
    const cacheKey = `metadata:topics:subject:${subjectId}`;
    const cached = await cacheService.get<CacheValue>(cacheKey).catch(() => null);
    if (Array.isArray(cached)) return cached;

    const results = await db.query.topics.findMany({
      where: and(eq(topics.subjectId, subjectId), eq(topics.status, 'active')),
      orderBy: [topics.complexityLevel],
      with: {
        topicSkills: {
          with: {
            skill: true
          }
        }
      }
    });

    const mapped = results.map(topic => ({
      ...topic,
      skillName: Array.isArray(topic.topicSkills) && topic.topicSkills.length > 0 ? topic.topicSkills[0]?.skill?.name ?? null : null
    }));

    await cacheService.set(cacheKey, mapped, CACHE_TTL_METADATA).catch(() => null);
    return mapped;
  }

  static async getSubtopicsByTopic(topicId: string) {
    return await db.query.subtopics.findMany({
      where: eq(subtopics.topicId, topicId),
    });
  }

  static async createSubtopic(data: typeof subtopics.$inferInsert) {
    return await db.insert(subtopics).values(data).returning();
  }

  static async updateSubtopic(id: string, data: Partial<typeof subtopics.$inferInsert>) {
    return await db.update(subtopics).set(data).where(eq(subtopics.id, id)).returning();
  }

  static async deleteSubtopic(id: string) {
    return await db.delete(subtopics).where(eq(subtopics.id, id)).returning();
  }

  static async deleteSubtopicsBatch(ids: string[]) {
    return await db.delete(subtopics).where(inArray(subtopics.id, ids)).returning();
  }

  static async createTopic(data: typeof topics.$inferInsert) {
    if (typeof data.subjectId === 'string' && data.subjectId !== '') {
      await cacheService.del(`metadata:topics:subject:${data.subjectId}`).catch(() => null);
    }
    return await db.insert(topics).values(data).returning();
  }

  static async updateTopic(id: string, data: Partial<typeof topics.$inferInsert>) {
    if (typeof data.subjectId === 'string' && data.subjectId !== '') {
      await cacheService.del(`metadata:topics:subject:${data.subjectId}`).catch(() => null);
    }
    return await db.update(topics).set(data).where(eq(topics.id, id)).returning();
  }

  static async deleteTopic(id: string) {
    return await db.delete(topics).where(eq(topics.id, id)).returning();
  }

  static async deleteTopicsBatch(ids: string[]) {
    return await db.delete(topics).where(inArray(topics.id, ids)).returning();
  }
}
