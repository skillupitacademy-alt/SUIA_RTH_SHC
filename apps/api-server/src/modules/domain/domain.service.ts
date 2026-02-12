import { db, domains, subjects, topics, subtopics } from '@quiz/db';
import { eq, and, inArray } from "drizzle-orm";

export class DomainService {
  static async getAllDomains() {
    return await db.query.domains.findMany({
      where: eq(domains.status, 'active'),
      with: {
        subjects: {
          where: eq(subjects.status, 'active'),
          orderBy: [subjects.order],
        }
      }
    });
  }

  static async getDomainHierarchy(domainId: string) {
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
    return result ?? null;
  }

  static async createDomain(data: typeof domains.$inferInsert) {
    return await db.insert(domains).values(data).returning();
  }

  static async updateDomain(id: string, data: Partial<typeof domains.$inferInsert>) {
    return await db.update(domains).set(data).where(eq(domains.id, id)).returning();
  }

  static async deleteDomain(id: string) {
    return await db.delete(domains).where(eq(domains.id, id)).returning();
  }

  static async deleteDomainsBatch(ids: string[]) {
    return await db.delete(domains).where(inArray(domains.id, ids)).returning();
  }
}

export class SubjectService {
  static async getSubjectsByDomain(domainId: string) {
    return await db.query.subjects.findMany({
      where: and(eq(subjects.domainId, domainId), eq(subjects.status, 'active')),
      orderBy: [subjects.order],
    });
  }

  static async createSubject(data: typeof subjects.$inferInsert) {
    return await db.insert(subjects).values(data).returning();
  }

  static async updateSubject(id: string, data: Partial<typeof subjects.$inferInsert>) {
    return await db.update(subjects).set(data).where(eq(subjects.id, id)).returning();
  }

  static async deleteSubject(id: string) {
    return await db.delete(subjects).where(eq(subjects.id, id)).returning();
  }

  static async deleteSubjectsBatch(ids: string[]) {
    return await db.delete(subjects).where(inArray(subjects.id, ids)).returning();
  }
}

export class TopicService {
  static async getTopicsBySubject(subjectId: string) {
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

    return results.map(topic => ({
      ...topic,
      skillName: (topic.topicSkills !== undefined && topic.topicSkills !== null && topic.topicSkills.length > 0) ? topic.topicSkills[0]?.skill?.name : null
    }));
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
    return await db.insert(topics).values(data).returning();
  }

  static async updateTopic(id: string, data: Partial<typeof topics.$inferInsert>) {
    return await db.update(topics).set(data).where(eq(topics.id, id)).returning();
  }

  static async deleteTopic(id: string) {
    return await db.delete(topics).where(eq(topics.id, id)).returning();
  }

  static async deleteTopicsBatch(ids: string[]) {
    return await db.delete(topics).where(inArray(topics.id, ids)).returning();
  }
}
