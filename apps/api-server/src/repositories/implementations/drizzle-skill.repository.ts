import { db, skills } from '@quiz/db';
import { eq, inArray, sql } from 'drizzle-orm';

import { BaseRepository } from '@/modules/core/repositories/base.repository';

import { ISkillRepository } from '../interfaces/skill.repository.interface';

export class DrizzleSkillRepository extends BaseRepository<typeof skills.$inferSelect, typeof skills> implements ISkillRepository {
  protected table = skills;

  constructor() {
    super(db);
  }

  async findAll(page: number, limit: number, filters?: { search?: string }) {
    const offset = (page - 1) * limit;
    let whereClause = undefined;
    if (filters?.search !== undefined && filters?.search !== null && filters?.search.trim() !== '') {
        whereClause = sql`${skills.name} ILIKE ${'%' + filters.search + '%'}`;
    }

    const data = await this.dbInstance.query.skills.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: [skills.name]
    });

    const [{ count }] = await this.dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(skills)
      .where(whereClause ?? sql`true`);

    const total = Number(count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return { data, total, page, limit, totalPages };
  }

  async create(data: typeof skills.$inferInsert) {
    const [newSkill] = await this.dbInstance.insert(skills).values(data).returning();
    return newSkill;
  }

  async update(id: string, data: Partial<typeof skills.$inferInsert>) {
    const [updated] = await this.dbInstance.update(skills).set(data).where(eq(skills.id, id)).returning();
    return updated;
  }

  async delete(id: string) {
    const [deleted] = await this.dbInstance.delete(skills).where(eq(skills.id, id)).returning();
    return deleted;
  }

  async deleteBatch(ids: string[]) {
    return await this.dbInstance.delete(skills).where(inArray(skills.id, ids)).returning();
  }

  async getTopicSkills(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;
    return await this.dbInstance.query.topicSkills.findMany({
      limit,
      offset,
      with: {
        topic: true,
        skill: true
      }
    });
  }

  async getSkillsByTopic(topicId: string) {
    const { topicSkills } = await import('@quiz/db');
    const res = await this.dbInstance.query.topicSkills.findMany({
      where: eq(topicSkills.topicId, topicId),
      with: {
        skill: true
      }
    });
    return res.map(rs => rs.skill as typeof skills.$inferSelect);
  }

  async mapTopicToSkills(topicId: string, skillIds: string[]) {
    const { topicSkills } = await import('@quiz/db');
    await this.dbInstance.transaction(async (tx) => {
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
