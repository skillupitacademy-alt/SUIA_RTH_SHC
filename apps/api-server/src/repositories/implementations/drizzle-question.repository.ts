import { db, domains, questions, questionSkills, skills, subjects, subtopics, topics } from '@quiz/db';
import { and, desc, eq, inArray, lt, or, sql } from 'drizzle-orm';

import { buildPaginatedResponse, decodePageCursor } from '@/lib/pagination';

import { BaseRepository } from '../../modules/core/repositories/base.repository';
import { IQuestionRepository } from '../interfaces/question.repository.interface';

export class DrizzleQuestionRepository extends BaseRepository<typeof questions.$inferSelect, typeof questions> implements IQuestionRepository {
  protected table = questions;

  constructor(dbInstance: typeof db = db) {
    super(dbInstance);
  }

  withDb(dbClient: typeof db): this {
    return new DrizzleQuestionRepository(dbClient) as this;
  }

  async findAll(cursor: string | null, limit: number, filters?: { 
    domainId?: string;
    subjectId?: string;
    topicId?: string; 
    subtopicId?: string; 
    skillIds?: string[];
    status?: string;
    search?: string;
    fields?: string;
  }) {
    const baseConditions = [];

    if (filters?.subtopicId !== undefined && filters?.subtopicId !== null && filters?.subtopicId !== '') {
        baseConditions.push(eq(questions.subtopicId, filters.subtopicId));
    } else if (filters?.topicId !== undefined && filters?.topicId !== null && filters?.topicId !== '') {
        baseConditions.push(eq(questions.topicId, filters.topicId));
    }

    if (filters?.subjectId !== undefined && filters?.subjectId !== null && filters?.subjectId !== '') {
        const subjectTopicRows = await this.dbInstance
            .select({ id: topics.id })
            .from(topics)
            .where(eq(topics.subjectId, filters.subjectId));
        const subjectTopicIds = subjectTopicRows.map((topic) => topic.id);
        baseConditions.push(subjectTopicIds.length > 0 ? inArray(questions.topicId, subjectTopicIds) : sql`false`);
    } else if (filters?.domainId !== undefined && filters?.domainId !== null && filters?.domainId !== '') {
        const domainTopicRows = await this.dbInstance
            .select({ id: topics.id })
            .from(topics)
            .leftJoin(subjects, eq(topics.subjectId, subjects.id))
            .where(eq(subjects.domainId, filters.domainId));
        const domainTopicIds = domainTopicRows.map((topic) => topic.id);
        baseConditions.push(domainTopicIds.length > 0 ? inArray(questions.topicId, domainTopicIds) : sql`false`);
    }

    if (filters?.skillIds !== undefined && filters.skillIds.length > 0) {
        const skillQuestionRows = await this.dbInstance
            .select({ questionId: questionSkills.questionId })
            .from(questionSkills)
            .where(inArray(questionSkills.skillId, filters.skillIds));
        const skillQuestionIds = Array.from(new Set(skillQuestionRows.map((row) => row.questionId)));
        baseConditions.push(skillQuestionIds.length > 0 ? inArray(questions.id, skillQuestionIds) : sql`false`);
    }

    if (filters?.status !== undefined && filters?.status !== null && filters?.status !== '') {
        baseConditions.push(eq(questions.status, filters.status as "active" | "inactive" | "draft"));
    }

    if (filters?.search !== undefined && filters?.search !== null && filters?.search.trim() !== '') {
        baseConditions.push(sql`${questions.questionText} ILIKE ${'%' + filters.search + '%'}`);
    }

    const cursorConditions = [];
    if (cursor !== null && cursor !== '') {
        try {
            const { lastSortValue, lastId } = decodePageCursor(cursor);
            cursorConditions.push(
                or(
                    lt(questions.updatedAt, new Date(lastSortValue)),
                    and(eq(questions.updatedAt, new Date(lastSortValue)), lt(questions.id, lastId))
                )
            );
        } catch {
            // Fallback for legacy timestamp|id cursors
            const [cursorDate, cursorId] = cursor.split('|');
            if (cursorId) {
                cursorConditions.push(or(
                    lt(questions.updatedAt, new Date(cursorDate)),
                    and(eq(questions.updatedAt, new Date(cursorDate)), lt(questions.id, cursorId))
                ));
            } else {
                cursorConditions.push(lt(questions.updatedAt, new Date(cursorDate)));
            }
        }
    }

    const allConditions = [...baseConditions, ...cursorConditions];
    const whereClause = allConditions.length > 0 ? and(...allConditions) : undefined;

    const dataRaw = await this.dbInstance.query.questions.findMany({
      where: whereClause,
      limit: limit + 1,
      orderBy: [desc(questions.updatedAt), desc(questions.id)],
    });

    const questionIds = dataRaw.map((question) => question.id);
    const topicIds = Array.from(new Set(dataRaw.map((question) => question.topicId).filter((id): id is string => typeof id === 'string' && id !== '')));
    const subtopicIds = Array.from(new Set(dataRaw.map((question) => question.subtopicId).filter((id): id is string => typeof id === 'string' && id !== '')));

    const [skillRows, topicRows, subtopicRows] = await Promise.all([
      questionIds.length > 0
        ? this.dbInstance
            .select({
              questionId: questionSkills.questionId,
              skillId: skills.id,
              skillName: skills.name,
              skillCategory: skills.category,
            })
            .from(questionSkills)
            .leftJoin(skills, eq(questionSkills.skillId, skills.id))
            .where(inArray(questionSkills.questionId, questionIds))
        : Promise.resolve([]),
      topicIds.length > 0
        ? this.dbInstance
            .select({
              id: topics.id,
              name: topics.name,
              subjectId: subjects.id,
              subjectName: subjects.name,
              domainId: domains.id,
              domainName: domains.name,
            })
            .from(topics)
            .leftJoin(subjects, eq(topics.subjectId, subjects.id))
            .leftJoin(domains, eq(subjects.domainId, domains.id))
            .where(inArray(topics.id, topicIds))
        : Promise.resolve([]),
      subtopicIds.length > 0
        ? this.dbInstance
            .select({
              id: subtopics.id,
              name: subtopics.name,
              topicId: subtopics.topicId,
            })
            .from(subtopics)
            .where(inArray(subtopics.id, subtopicIds))
        : Promise.resolve([]),
    ]);

    const skillsByQuestionId = new Map<string, Array<{ skill: { id: string; name: string; category: string } }>>();
    for (const row of skillRows) {
      if (row.skillName === null) continue;
      const current = skillsByQuestionId.get(row.questionId) ?? [];
      current.push({
        skill: {
          id: row.skillId ?? '',
          name: row.skillName,
          category: row.skillCategory ?? 'technical',
        },
      });
      skillsByQuestionId.set(row.questionId, current);
    }

    const topicById = new Map(topicRows.map((topic) => [topic.id, {
      id: topic.id,
      name: topic.name,
      subject: topic.subjectId !== null
        ? {
            id: topic.subjectId,
            name: topic.subjectName ?? '',
            domain: topic.domainId !== null
              ? {
                  id: topic.domainId,
                  name: topic.domainName ?? '',
                }
              : null,
          }
        : null,
    }]));
    const subtopicById = new Map(subtopicRows.map((subtopic) => [subtopic.id, subtopic]));
    const dataHydrated = dataRaw.map((question) => ({
      ...question,
      questionSkills: skillsByQuestionId.get(question.id) ?? [],
      topic: typeof question.topicId === 'string' ? topicById.get(question.topicId) ?? null : null,
      subtopic: typeof question.subtopicId === 'string'
        ? (() => {
            const subtopic = subtopicById.get(question.subtopicId);
            return subtopic === undefined
              ? null
              : {
                  ...subtopic,
                  topic: typeof question.topicId === 'string' ? topicById.get(question.topicId) ?? null : null,
                };
          })()
        : null,
    }));

    // For total count, use only baseConditions
    const [{ count: totalCount }] = await this.dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(questions)
      .where(baseConditions.length > 0 ? and(...baseConditions) : sql`true`);

    const total = Number(totalCount ?? 0);

    const paginated = buildPaginatedResponse(
        dataHydrated,
        limit,
        item => item.updatedAt.toISOString(),
        total
    );

    return { 
        data: paginated.data, 
        total: paginated.total ?? 0, 
        nextCursor: paginated.nextCursor, 
        limit 
    };
  }

  async create(
    data: typeof questions.$inferInsert,
    skillIds?: string[],
    tx?: typeof db
  ) {
    const executor = tx !== undefined ? tx : this.dbInstance;
    
    const [newQuestion] = await executor.insert(questions).values(data).returning();

    if (skillIds !== undefined && skillIds.length > 0) {
        await executor.insert(questionSkills).values(skillIds.map(sid => ({
            questionId: newQuestion.id,
            skillId: sid
        })));
    }

    return newQuestion;
  }

  async update(
    id: string,
    data: Partial<typeof questions.$inferInsert>,
    skillIds?: string[],
    tx?: typeof db
  ) {
    const executor = tx !== undefined ? tx : this.dbInstance;

    const [updated] = await executor.update(questions).set(data).where(eq(questions.id, id)).returning();

    if (skillIds) {
        await executor.delete(questionSkills).where(eq(questionSkills.questionId, id));
        if (skillIds.length > 0) {
            await executor.insert(questionSkills).values(skillIds.map(sid => ({
                questionId: id,
                skillId: sid
            })));
        }
    }

    return updated;
  }

  async delete(id: string) {
    const [res] = await this.dbInstance.update(questions).set({ status: 'inactive' }).where(eq(questions.id, id)).returning();
    return res;
  }

  async deleteBatch(ids: string[]) {
    return await this.dbInstance.update(questions).set({ status: 'inactive' }).where(inArray(questions.id, ids)).returning();
  }

  async updateStatus(id: string, status: string) {
    const [res] = await this.dbInstance.update(questions).set({ status: status as 'active' | 'inactive' | 'draft' }).where(eq(questions.id, id)).returning();
    return res;
  }

  async bulkStatusUpdate(ids: string[], status: string) {
    return await this.dbInstance.update(questions).set({ status: status as 'active' | 'inactive' | 'draft' }).where(inArray(questions.id, ids)).returning();
  }
}
