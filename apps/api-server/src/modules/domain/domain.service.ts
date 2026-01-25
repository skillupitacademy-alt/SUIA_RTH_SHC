import { db, domains, subjects, topics, subtopics } from '@quiz/db';
import { eq, sql, and } from 'drizzle-orm';

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
    return await db.query.domains.findFirst({
      where: eq(domains.id, domainId),
      with: {
        subjects: {
          where: eq(subjects.status, 'active'),
          orderBy: [subjects.order],
          with: {
            topics: {
              where: eq(topics.status, 'active'),
              with: {
                subtopics: true,
              }
            }
          }
        }
      }
    });
  }

  static async createDomain(data: { name: string; description?: string; category?: string }) {
    return await db.insert(domains).values(data).returning();
  }
}

export class SubjectService {
  static async getSubjectsByDomain(domainId: string) {
    return await db.query.subjects.findMany({
      where: and(eq(subjects.domainId, domainId), eq(subjects.status, 'active')),
      orderBy: [subjects.order],
    });
  }
}
