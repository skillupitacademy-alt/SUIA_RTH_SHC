import { questions } from '@quiz/db';

type QuestionModel = typeof questions.$inferSelect;
type QuestionInsert = typeof questions.$inferInsert;
type QuestionWithRelations = QuestionModel & Record<string, unknown>;

type QuestionTx = {
  update?: unknown;
  delete?: unknown;
  insert?: unknown;
};

export interface IQuestionRepository {
  findAll(page: number, limit: number, filters?: { 
    topicId?: string; 
    subtopicId?: string; 
    status?: string;
    search?: string;
  }): Promise<{
    data: QuestionWithRelations[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  findById(id: string): Promise<QuestionWithRelations | undefined>;
  create(data: QuestionInsert, skillIds?: string[], tx?: QuestionTx): Promise<QuestionModel>;
  update(id: string, data: Partial<QuestionInsert>, skillIds?: string[], tx?: QuestionTx): Promise<QuestionModel>;
  delete(id: string): Promise<QuestionModel>;
  deleteBatch(ids: string[]): Promise<QuestionModel[]>;
  updateStatus(id: string, status: string): Promise<QuestionModel>;
  bulkStatusUpdate(ids: string[], status: string): Promise<QuestionModel[]>;
}
