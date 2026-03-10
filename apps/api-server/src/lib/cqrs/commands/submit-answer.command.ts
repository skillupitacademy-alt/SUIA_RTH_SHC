import { container } from '@/modules/core/container';
import { ExamEngine } from '@/modules/exam-engine/exam.engine';

import { Command, CommandHandler } from '../command-bus';

export interface SubmitAnswerInput {
  examId: string;
  userId: string;
  questionId: string;
  answer: string;
  idempotencyKey?: string;
}

export class SubmitAnswerCommand implements Command {
  readonly type = 'SubmitAnswerCommand';
  constructor(public readonly input: SubmitAnswerInput) {}
}

export class SubmitAnswerHandler implements CommandHandler<SubmitAnswerCommand> {
  async handle(command: SubmitAnswerCommand): Promise<unknown> {
    const engine = container.get(ExamEngine);
    // Correct order: examId, questionId, answer, userId, idempotencyKey
    return await engine.submitAnswer(
      command.input.examId,
      command.input.questionId,
      command.input.answer,
      command.input.userId,
      command.input.idempotencyKey
    );
  }
}
