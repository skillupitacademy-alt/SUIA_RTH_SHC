import { dbReadOnly } from '@quiz/db';

import { container } from '@/modules/core/container';
import { ExamRepository } from '@/modules/exam-engine/repositories/exam.repository';

import { Query, QueryHandler } from '../query-bus';

export interface GetUserExamsInput {
  userId: string;
  status?: string;
  limit?: number;
}

export class GetUserExamsQuery implements Query {
  readonly type = 'GetUserExamsQuery';
  constructor(public readonly input: GetUserExamsInput) {}
}

export class GetUserExamsHandler implements QueryHandler<GetUserExamsQuery> {
  async handle(query: GetUserExamsQuery): Promise<unknown> {
    const repo = container.get(ExamRepository);
    return await repo.withDb(dbReadOnly).findByUserId(query.input.userId, {
      status: query.input.status,
      limit: query.input.limit,
    });
  }
}
