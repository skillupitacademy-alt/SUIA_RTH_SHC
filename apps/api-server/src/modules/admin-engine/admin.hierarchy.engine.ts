import { db, domains, subjects, topics, subtopics, skills, topicSkills } from '@quiz/db';
import { eq, and, sql, asc, desc, inArray } from 'drizzle-orm';

export class AdminHierarchyEngine {
  static async getDomains(page: number = 1, limit: number = 20, filters?: { search?: string }) {
    const offset = (page - 1) * limit;
    let whereClause = undefined;
    if (filters?.search !== undefined && filters?.search !== null && filters?.search.trim() !== '') {
        whereClause = sql`${domains.name} ILIKE ${'%' + filters.search + '%'}`;
    }

    const data = await db.query.domains.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: [desc(domains.createdAt)]
    });

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(domains)
      .where(whereClause ?? sql`true`);

    const total = Number(count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return { data, total, page, limit, totalPages };
  }

  static async createDomain(data: typeof domains.$inferInsert) {
    const [newDomain] = await db.insert(domains).values(data).returning();
    return newDomain;
  }

  static async updateDomain(id: string, data: Partial<typeof domains.$inferInsert>) {
    const [updated] = await db.update(domains).set(data).where(eq(domains.id, id)).returning();
    return updated;
  }

  static async deleteDomain(id: string) {
    const [deleted] = await db.delete(domains).where(eq(domains.id, id)).returning();
    return deleted;
  }

  static async deleteDomainsBatch(ids: string[]) {
    return await db.delete(domains).where(inArray(domains.id, ids)).returning();
  }

  static async validateTopic(_topicId: string) {
    // Placeholder for topic validation logic
    return { valid: true, issues: [] };
  }

  static async approveDomain(domainId: string) {
    const [updated] = await db.update(domains)
      .set({ status: 'active' })
      .where(eq(domains.id, domainId))
      .returning();
    return updated;
  }

  static async getSubjects(page: number = 1, limit: number = 20, filters?: { domainId?: string; search?: string }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    if (filters?.domainId !== undefined && filters?.domainId !== null && filters?.domainId !== '') {
        conditions.push(eq(subjects.domainId, filters.domainId));
    }
    if (filters?.search !== undefined && filters?.search !== null && filters?.search.trim() !== '') {
        conditions.push(sql`${subjects.name} ILIKE ${'%' + filters.search + '%'}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db.query.subjects.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: [desc(subjects.createdAt)]
    });

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(subjects)
      .where(whereClause ?? sql`true`);

    const total = Number(count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return { data, total, page, limit, totalPages };
  }

  static async createSubject(data: typeof subjects.$inferInsert) {
    const [newSub] = await db.insert(subjects).values(data).returning();
    return newSub;
  }

  static async updateSubject(id: string, data: Partial<typeof subjects.$inferInsert>) {
    const [updated] = await db.update(subjects).set(data).where(eq(subjects.id, id)).returning();
    return updated;
  }

  static async deleteSubject(id: string) {
    return await db.delete(subjects).where(eq(subjects.id, id)).returning();
  }

  static async deleteSubjectsBatch(ids: string[]) {
    return await db.delete(subjects).where(inArray(subjects.id, ids)).returning();
  }

  static async getTopics(page: number = 1, limit: number = 20, filters?: { subjectId?: string; search?: string }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    if (filters?.subjectId !== undefined && filters?.subjectId !== null && filters?.subjectId !== '') {
        conditions.push(eq(topics.subjectId, filters.subjectId));
    }
    if (filters?.search !== undefined && filters?.search !== null && filters?.search.trim() !== '') {
        conditions.push(sql`${topics.name} ILIKE ${'%' + filters.search + '%'}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db.query.topics.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: [desc(topics.createdAt)]
    });

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(topics)
      .where(whereClause ?? sql`true`);

    const total = Number(count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return { data, total, page, limit, totalPages };
  }

  static async createTopic(data: typeof topics.$inferInsert) {
    const [newTopic] = await db.insert(topics).values(data).returning();
    return newTopic;
  }

  static async updateTopic(id: string, data: Partial<typeof topics.$inferInsert>) {
    const [updated] = await db.update(topics).set(data).where(eq(topics.id, id)).returning();
    return updated;
  }

  static async deleteTopic(id: string) {
    return await db.delete(topics).where(eq(topics.id, id)).returning();
  }

  static async deleteTopicsBatch(ids: string[]) {
    return await db.delete(topics).where(inArray(topics.id, ids)).returning();
  }

  static async getSubtopics(page: number = 1, limit: number = 20, filters?: { topicId?: string; search?: string }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    if (filters?.topicId !== undefined && filters?.topicId !== null && filters?.topicId !== '') {
        conditions.push(eq(subtopics.topicId, filters.topicId));
    }
    if (filters?.search !== undefined && filters?.search !== null && filters?.search.trim() !== '') {
        conditions.push(sql`${subtopics.name} ILIKE ${'%' + filters.search + '%'}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db.query.subtopics.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: [desc(subtopics.createdAt)]
    });

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(subtopics)
      .where(whereClause ?? sql`true`);

    const total = Number(count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return { data, total, page, limit, totalPages };
  }

  static async createSubtopic(data: typeof subtopics.$inferInsert) {
    const [res] = await db.insert(subtopics).values(data).returning();
    return res;
  }

  static async updateSubtopic(id: string, data: Partial<typeof subtopics.$inferInsert>) {
    const [res] = await db.update(subtopics).set(data).where(eq(subtopics.id, id)).returning();
    return res;
  }

  static async deleteSubtopic(id: string) {
    const [res] = await db.delete(subtopics).where(eq(subtopics.id, id)).returning();
    return res;
  }

  static async deleteSubtopicsBatch(ids: string[]) {
    return await db.delete(subtopics).where(inArray(subtopics.id, ids)).returning();
  }

  static async getSkills(page: number = 1, limit: number = 20, filters?: { search?: string }) {
    const offset = (page - 1) * limit;
    let whereClause = undefined;
    if (filters?.search !== undefined && filters?.search !== null && filters?.search.trim() !== '') {
        whereClause = sql`${skills.name} ILIKE ${'%' + filters.search + '%'}`;
    }

    const data = await db.query.skills.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: [asc(skills.name)]
    });

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(skills)
      .where(whereClause ?? sql`true`);

    const total = Number(count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return { data, total, page, limit, totalPages };
  }

  static async createSkill(data: typeof skills.$inferInsert) {
    const [newSkill] = await db.insert(skills).values(data).returning();
    return newSkill;
  }

  static async updateSkill(id: string, data: Partial<typeof skills.$inferInsert>) {
    const [updated] = await db.update(skills).set(data).where(eq(skills.id, id)).returning();
    return updated;
  }

  static async deleteSkill(id: string) {
    return await db.delete(skills).where(eq(skills.id, id)).returning();
  }

  static async deleteSkillsBatch(ids: string[]) {
    return await db.delete(skills).where(inArray(skills.id, ids)).returning();
  }

  static async getTopicSkills(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;
    return await db.query.topicSkills.findMany({
      limit,
      offset,
      with: {
        topic: true,
        skill: true
      }
    });
  }

  static async getSkillsByTopic(topicId: string) {
    return await db.query.topicSkills.findMany({
      where: eq(topicSkills.topicId, topicId),
      with: {
        skill: true
      }
    });
  }

  static async mapTopicToSkills(topicId: string, skillIds: string[]) {
    // Transactional sync
    return await db.transaction(async (tx) => {
        await tx.delete(topicSkills).where(eq(topicSkills.topicId, topicId));
        if (skillIds.length > 0) {
            await tx.insert(topicSkills).values(skillIds.map(sid => ({
                topicId,
                skillId: sid
            })));
        }
    });
  }
}
