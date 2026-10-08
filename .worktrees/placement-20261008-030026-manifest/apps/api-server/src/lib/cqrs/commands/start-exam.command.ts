import { container } from '@/modules/core/container';
import { ExamEngine, StartExamConfig } from '@/modules/exam-engine/exam.engine';

import { Command, CommandHandler } from '../command-bus';

export interface StartExamInput {
  userId: string;
  blueprintId: string;
  idempotencyKey?: string;
  config?: StartExamConfig;
}

export class StartExamCommand implements Command {
  readonly type = 'StartExamCommand';
  constructor(public readonly input: StartExamInput) {}
}

export class StartExamHandler implements CommandHandler<StartExamCommand> {
  async handle(command: StartExamCommand): Promise<unknown> {
    const engine = container.get(ExamEngine);
    return await engine.startExam(
      command.input.userId,
      command.input.blueprintId,
      command.input.idempotencyKey,
      command.input.config
    );
  }
}
