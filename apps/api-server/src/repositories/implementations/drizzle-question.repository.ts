import { db, questions, questionSkills } from '@quiz/db';
import { and, desc, eq, inArray, lt, sql } from 'drizzle-orm';

import { BaseRepository } from '@/modules/core/repositories/base.repository';

import { IQuestionRepository } from '../interfaces/question.repository.interface';

export class DrizzleQuestionRepository extends BaseRepository<typeof questions.$inferSelect, typeof questions> implements IQuestionRepository {
  protected table = questions;

  constructor() {
    super(db);
  }

  async findAll(cursor: string | null, limit: number, filters?: { 
    topicId?: string; 
    subtopicId?: string; 
    status?: string;
    search?: string;
  }) {
    const conditions = [];

    if (cursor !== null && cursor !== '') {
        conditions.push(lt(questions.updatedAt, new Date(cursor)));
    }

    if (filters?.subtopicId !== undefined && filters?.subtopicId !== null && filters?.subtopicId !== '') {
        conditions.push(eq(questions.subtopicId, filters.subtopicId));
    } else if (filters?.topicId !== undefined && filters?.topicId !== null && filters?.topicId !== '') {
        conditions.push(eq(questions.topicId, filters.topicId));
    }

    if (filters?.status !== undefined && filters?.status !== null && filters?.status !== '') {
        conditions.push(eq(questions.status, filters.status as "active" | "inactive" | "draft"));
    }

    if (filters?.search !== undefined && filters?.search !== null && filters?.search.trim() !== '') {
        conditions.push(sql`${questions.questionText} ILIKE ${'%' + filters.search + '%'}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const dataRaw = await this.dbInstance.query.questions.findMany({
      where: whereClause,
      limit: limit + 1,
      orderBy: [desc(questions.updatedAt)],
      with: {
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

    const hasNext = dataRaw.length > limit;
    const data = hasNext ? dataRaw.slice(0, limit) : dataRaw;
    const nextCursor = hasNext ? data[data.length - 1].updatedAt.toISOString() : null;

    const [{ count }] = await this.dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(questions)
      .where(conditions.length > 0 ? and(...conditions.filter(c => !c.toString().includes('updated_at <'))) : sql`true`);

    const total = Number(count ?? 0);

    return { data, total, nextCursor, limit };
  }

  async create(
    data: typeof questions.$inferInsert,
    skillIds?: string[],
    tx?: {
      insert: typeof db.insert;
    }
  ) {
    const executor = tx || this.dbInstance;
    
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
    tx?: {
      update: typeof db.update;
      delete: typeof db.delete;
      insert: typeof db.insert;
    }
  ) {
    const executor = tx || this.dbInstance;

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
      // Logic from engine: delete is actually a status update to 'inactive'
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
