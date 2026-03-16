import { db, skills } from '@quiz/db';
import { and, desc, eq, inArray, lt, or, type SQL, sql } from 'drizzle-orm';

import { buildPaginatedResponse, decodePageCursor } from '@/lib/pagination';
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
    const baseConditions: SQL[] = [];

    if (filters?.search !== undefined && filters?.search !== null && filters?.search.trim() !== '') {
        baseConditions.push(sql`${skills.name} ILIKE ${'%' + filters.search + '%'}`);
    }

    const cursorConditions: SQL[] = [];
    if (cursor !== null && cursor !== '') {
      try {
        const { lastSortValue, lastId } = decodePageCursor(cursor);
        cursorConditions.push(
          or(
            lt(skills.createdAt, new Date(lastSortValue)),
            and(eq(skills.createdAt, new Date(lastSortValue)), lt(skills.id, lastId))
          ) as SQL
        );
      } catch {
        const [cursorDate, cursorId] = cursor.split('|');
        if (cursorId) {
          cursorConditions.push(
            or(
              lt(skills.createdAt, new Date(cursorDate)),
              and(eq(skills.createdAt, new Date(cursorDate)), lt(skills.id, cursorId))
            ) as SQL
          );
        } else if (!Number.isNaN(new Date(cursorDate).getTime())) {
          cursorConditions.push(lt(skills.createdAt, new Date(cursorDate)));
        } else {
          // Legacy skill cursor support (name-based pagination)
          cursorConditions.push(lt(skills.name, cursor));
        }
      }
    }

    const allConditions = [...baseConditions, ...cursorConditions];
    const whereClause = allConditions.length > 0 ? and(...allConditions) : undefined;

    const dataRaw = await this.dbInstance.query.skills.findMany({
      where: whereClause,
      limit: limit + 1,
      orderBy: [desc(skills.createdAt), desc(skills.id)]
    });

    const [{ count: totalCount }] = await this.dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(skills)
      .where(baseConditions.length > 0 ? and(...baseConditions) : sql`true`);

    const total = Number(totalCount ?? 0);
    const paginated = buildPaginatedResponse(
      dataRaw,
      limit,
      item => item.createdAt.toISOString(),
      total
    );

    return {
      data: paginated.data,
      total: paginated.total ?? 0,
      nextCursor: paginated.nextCursor,
      limit
    };
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
