import { db, questions, questionSkills } from '@quiz/db';
import { and, desc, eq, inArray, lt, or, sql } from 'drizzle-orm';

import { getDrizzleFields } from '@/lib/field-selector';
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
    topicId?: string; 
    subtopicId?: string; 
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

    const QUESTION_ADMIN_ALLOWLIST = [
        'id',
        'topicId',
        'subtopicId',
        'questionText',
        'options',
        'correctAnswer',
        'explanation',
        'difficulty',
        'type',
        'status',
        'estimatedTime',
        'tags',
        'createdAt',
        'updatedAt'
    ];
    const columns = getDrizzleFields(filters?.fields, QUESTION_ADMIN_ALLOWLIST, questions as unknown as Record<string, unknown>);

    const dataRaw = await this.dbInstance.query.questions.findMany({
      where: whereClause,
      limit: limit + 1,
      orderBy: [desc(questions.updatedAt), desc(questions.id)],
      ...(columns ? { columns } : {}),
      with: {
        questionSkills: {
          with: {
            skill: true,
          },
        },
        topic: {
          with: {
            subject: {
              with: { domain: true }
            }
          }
        },
        subtopic: {
          with: {
            topic: {
              with: {
                subject: {
                  with: { domain: true }
                }
              }
            }
          }
        }
      }
    });

    // For total count, use only baseConditions
    const [{ count: totalCount }] = await this.dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(questions)
      .where(baseConditions.length > 0 ? and(...baseConditions) : sql`true`);

    const total = Number(totalCount ?? 0);

    const paginated = buildPaginatedResponse(
        dataRaw,
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
