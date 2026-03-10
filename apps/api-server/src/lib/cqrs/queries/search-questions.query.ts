import { dbReadOnly, questions } from '@quiz/db';
import { ilike, or } from 'drizzle-orm';

import { Query, QueryHandler } from '../query-bus';

export interface SearchQuestionsInput {
  query?: string;
  limit?: number;
  offset?: number;
}

export class SearchQuestionsQuery implements Query {
  readonly type = 'SearchQuestionsQuery';
  constructor(public readonly input: SearchQuestionsInput) {}
}

export class SearchQuestionsHandler implements QueryHandler<SearchQuestionsQuery> {
  async handle(query: SearchQuestionsQuery): Promise<unknown> {
    const { query: searchTerm, limit = 20, offset = 0 } = query.input;

    const hasSearch = typeof searchTerm === 'string' && searchTerm.trim() !== '';
    return await dbReadOnly.query.questions.findMany({
      where: hasSearch ? or(
        ilike(questions.questionText, `%${searchTerm}%`),
        ilike(questions.explanation, `%${searchTerm}%`)
      ) : undefined,
      limit,
      offset,
      orderBy: (q, { desc }) => [desc(q.createdAt)]
    });
  }
}
