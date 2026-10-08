import { MaintenanceWorker } from '../maintenance-worker';
import { commandBus } from './command-bus';
import { StartExamHandler } from './commands/start-exam.command';
import { SubmitAnswerHandler } from './commands/submit-answer.command';
import { GetAdminUsersHandler } from './queries/get-admin-users.query';
import { GetAuditLogsHandler } from './queries/get-audit-logs.query';
import { GetBlueprintsHandler } from './queries/get-blueprints.query';
import { GetDomainsHandler } from './queries/get-domains.query';
import { GetLiveSessionsHandler } from './queries/get-live-sessions.query';
import { GetPlatformMetricsHandler } from './queries/get-platform-metrics.query';
import { GetQuestionsHandler } from './queries/get-questions.query';
import { GetSkillsHandler } from './queries/get-skills.query';
import { GetSubjectsHandler } from './queries/get-subjects.query';
import { GetSubtopicsHandler } from './queries/get-subtopics.query';
import { GetTopicsHandler } from './queries/get-topics.query';
import { GetUserExamsHandler } from './queries/get-user-exams.query';
import { SearchQuestionsHandler } from './queries/search-questions.query';
import { queryBus } from './query-bus';
import { ReadModelUpdater } from './read-model-updater';

/**
 * Bootstraps the CQRS layer by registering all handlers.
 * This should be called during application startup.
 */
export function bootstrapCQRS() {
  // Queries
  queryBus.register('GetPlatformMetricsQuery', new GetPlatformMetricsHandler());
  queryBus.register('GetUserExamsQuery', new GetUserExamsHandler());
  queryBus.register('SearchQuestionsQuery', new SearchQuestionsHandler());
  queryBus.register('GetBlueprintsQuery', new GetBlueprintsHandler());
  queryBus.register('GetDomainsQuery', new GetDomainsHandler());
  queryBus.register('GetQuestionsQuery', new GetQuestionsHandler());
  queryBus.register('GetAdminUsersQuery', new GetAdminUsersHandler());
  queryBus.register('GetTopicsQuery', new GetTopicsHandler());
  queryBus.register('GetSubtopicsQuery', new GetSubtopicsHandler());
  queryBus.register('GetSubjectsQuery', new GetSubjectsHandler());
  queryBus.register('GetSkillsQuery', new GetSkillsHandler());
  queryBus.register('GetAuditLogsQuery', new GetAuditLogsHandler());
  queryBus.register('GetLiveSessionsQuery', new GetLiveSessionsHandler());

  // Commands
  commandBus.register('StartExamCommand', new StartExamHandler());
  commandBus.register('SubmitAnswerCommand', new SubmitAnswerHandler());

  // Task 115: Background Maintenance & Read Model Updates
  ReadModelUpdater.init();
  MaintenanceWorker.start();
}

export * from './command-bus';
export * from './commands/start-exam.command';
export * from './commands/submit-answer.command';
export * from './queries/get-admin-users.query';
export * from './queries/get-audit-logs.query';
export * from './queries/get-blueprints.query';
export * from './queries/get-domains.query';
export * from './queries/get-live-sessions.query';
export * from './queries/get-platform-metrics.query';
export * from './queries/get-questions.query';
export * from './queries/get-skills.query';
export * from './queries/get-subjects.query';
export * from './queries/get-subtopics.query';
export * from './queries/get-topics.query';
export * from './queries/get-user-exams.query';
export * from './queries/search-questions.query';
export * from './query-bus';
