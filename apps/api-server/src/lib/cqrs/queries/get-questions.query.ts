import { dbReadOnly } from '@quiz/db';

import { AdminQuestionEngine } from '@/modules/admin-engine/admin.question.engine';
import { container } from '@/modules/core/container';

import { Query, QueryHandler } from '../query-bus';

export class GetQuestionsQuery implements Query {
  readonly type = 'GetQuestionsQuery';
  constructor(
    public readonly cursor: string | null = null,
    public readonly limit: number = 20,
    public readonly filters?: { 
      domainId?: string; 
      subjectId?: string; 
      topicId?: string; 
      subtopicId?: string; 
      skillIds?: string[]; 
      status?: string; 
      search?: string;
      fields?: string;
    }
  ) {}
}

export class GetQuestionsHandler implements QueryHandler<GetQuestionsQuery> {
  async handle(query: GetQuestionsQuery): Promise<unknown> {
    const engine = container.get(AdminQuestionEngine);
    return await engine.withDb(dbReadOnly).getQuestions(query.cursor, query.limit, query.filters);
  }
}
