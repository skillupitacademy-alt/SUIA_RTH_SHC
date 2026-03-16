import { db, questions } from '@quiz/db';

type QuestionModel = typeof questions.$inferSelect;
type QuestionInsert = typeof questions.$inferInsert;
type QuestionWithRelations = QuestionModel & Record<string, unknown>;

type QuestionTx = {
  update?: unknown;
  delete?: unknown;
  insert?: unknown;
};

export interface IQuestionRepository {
  /**
   * Returns a new instance of the repository using the specified database client.
   */
  withDb(dbClient: typeof db): this;
  findAll(cursor: string | null, limit: number, filters?: { 
    topicId?: string; 
    subtopicId?: string; 
    status?: string;
    search?: string;
    fields?: string;
  }): Promise<{
    data: QuestionWithRelations[];
    total: number;
    nextCursor: string | null;
    limit: number;
  }>;
  findById(id: string): Promise<QuestionWithRelations | undefined>;
  create(data: QuestionInsert, skillIds?: string[], tx?: QuestionTx): Promise<QuestionModel>;
  update(id: string, data: Partial<QuestionInsert>, skillIds?: string[], tx?: QuestionTx): Promise<QuestionModel>;
  delete(id: string): Promise<QuestionModel>;
  deleteBatch(ids: string[]): Promise<QuestionModel[]>;
  updateStatus(id: string, status: string): Promise<QuestionModel>;
  bulkStatusUpdate(ids: string[], status: string): Promise<QuestionModel[]>;
}
