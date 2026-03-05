import { db, skills, topicSkills } from '@quiz/db';
import { asc, eq, inArray, sql } from 'drizzle-orm';

export class AdminSkillEngine {
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
    const res = await db.query.topicSkills.findMany({
      where: eq(topicSkills.topicId, topicId),
      with: {
        skill: true
      }
    });
    return res.map(rs => rs.skill);
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
