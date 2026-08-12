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
    const extractNameCursor = (value: string | null): string | null => {
      if (value === null || value === '') return null;
      try {
        const decoded = decodePageCursor(value);
        return decoded.lastSortValue;
      } catch {
        const [cursorDate] = value.split('|');
        if (Number.isNaN(new Date(cursorDate).getTime())) return value;
        return null;
      }
    };
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

    try {
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
    } catch {
      // Backward-compatibility fallback for deployments where skills.created_at is not migrated yet.
      // Use raw SQL selecting only legacy columns so Drizzle does not reference missing timestamp columns.
      const legacyCursor = extractNameCursor(cursor);
      const searchTerm = filters?.search !== undefined && filters.search !== null && filters.search.trim() !== ''
        ? `%${filters.search}%`
        : null;

      const rowsQuery = await this.dbInstance.execute(sql`
        SELECT "id", "name", "category", "mapping_type", "weight"
        FROM "skills"
        WHERE
          (${searchTerm}::text IS NULL OR "name" ILIKE ${searchTerm})
          AND (${legacyCursor}::text IS NULL OR "name" < ${legacyCursor})
        ORDER BY "name" DESC, "id" DESC
        LIMIT ${limit + 1}
      `);

      const countQuery = await this.dbInstance.execute(sql`
        SELECT count(*)::int AS count
        FROM "skills"
        WHERE (${searchTerm}::text IS NULL OR "name" ILIKE ${searchTerm})
      `);

      const dataRaw = rowsQuery.rows.map((row) => ({
        id: String((row as { id: unknown }).id),
        name: String((row as { name: unknown }).name),
        description: null,
        category: ((row as { category: unknown }).category as typeof skills.$inferSelect['category']) ?? null,
        weight: Number((row as { weight: unknown }).weight ?? 1),
        status: 'active',
        deletedAt: null,
        // Synthetic timestamps for legacy-schema fallback path only.
        createdAt: new Date(0),
        updatedAt: new Date(0),
      })) as Array<typeof skills.$inferSelect>;

      const totalCountRow = countQuery.rows[0] as { count?: unknown } | undefined;
      const total = Number(totalCountRow?.count ?? 0);

      const paginated = buildPaginatedResponse(
        dataRaw,
        limit,
        item => item.name,
        total
      );

      return {
        data: paginated.data,
        total: paginated.total ?? 0,
        nextCursor: paginated.nextCursor,
        limit
      };
    }
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
