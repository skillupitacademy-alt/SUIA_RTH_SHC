import { db, skills } from '@quiz/db';
import { and, desc, eq, inArray, lt, type SQL,sql } from 'drizzle-orm';

import { BaseRepository } from '@/modules/core/repositories/base.repository';

import { ISkillRepository } from '../interfaces/skill.repository.interface';

export class DrizzleSkillRepository extends BaseRepository<typeof skills.$inferSelect, typeof skills> implements ISkillRepository {
  protected table = skills;

  constructor(dbInstance: typeof db = db) {
    super(dbInstance);
  }

  withDb(dbClient: typeof db): this {
    return new DrizzleSkillRepository(dbClient) as this;
  }


  async findAll(cursor: string | null, limit: number, filters?: { search?: string }) {
    const conditions: SQL[] = [];

    if (cursor !== null && cursor !== '') {
        // Use lexicographic cursor on name for deterministic ordering
        conditions.push(lt(skills.name, cursor));
    }

    if (filters?.search !== undefined && filters?.search !== null && filters?.search.trim() !== '') {
        conditions.push(sql`${skills.name} ILIKE ${'%' + filters.search + '%'}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const dataRaw = await this.dbInstance.query.skills.findMany({
      where: whereClause,
      limit: limit + 1,
      orderBy: [desc(skills.name)]
    });

    const hasNext = dataRaw.length > limit;
    const data = hasNext ? dataRaw.slice(0, limit) : dataRaw;
    const nextCursor = hasNext ? data[data.length - 1].name : null;

    const [{ count }] = await this.dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(skills)
      .where(whereClause ?? sql`true`);

    const total = Number(count ?? 0);

    return { data, total, nextCursor, limit };
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

  async getTopicSkills(cursor: string | null = null, limit: number = 20) {
    if (cursor !== null && cursor !== '') {
        // No dedicated id column; cursor pagination skipped for join table
    }

    const dataRaw = await this.dbInstance.query.topicSkills.findMany({
      limit: limit + 1,
      where: undefined,
      with: {
        topic: true,
        skill: true
      }
    });

    const hasNext = dataRaw.length > limit;
    const data = hasNext ? dataRaw.slice(0, limit) : dataRaw;
    const nextCursor = hasNext ? null : null;

    return { data, nextCursor };
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
