/**
 * Application Composition Root
 * Registers all repository → service dependencies into the DI container.
 * Import and call `bootstrapContainer()` once at app startup.
 */
import { container } from '@/modules/core/container';
import { AuditLoggingExamRepository } from '@/modules/exam-engine/audit-logging.decorator';
import { ExamRepository } from '@/modules/exam-engine/repositories/exam.repository';
import { PerformanceService } from '@/modules/report-engine/performance.service';
// Services
import { SelectionService } from '@/modules/selection-engine/selection.service';
import { FeatureFlagService } from '@/modules/system/feature-flags.service';
import { DrizzleAdminAnalyticsRepository } from '@/repositories/implementations/drizzle-admin-analytics.repository';
// Repositories
import { DrizzleAdminUserRepository } from '@/repositories/implementations/drizzle-admin-user.repository';
import { DrizzleAuditRepository } from '@/repositories/implementations/drizzle-audit.repository';
import { DrizzleBlueprintRepository } from '@/repositories/implementations/drizzle-blueprint.repository';
import { DrizzleDomainRepository } from '@/repositories/implementations/drizzle-domain.repository';
import { DrizzleQuestionRepository } from '@/repositories/implementations/drizzle-question.repository';
import { DrizzleSessionRepository } from '@/repositories/implementations/drizzle-session.repository';
import { DrizzleSkillRepository } from '@/repositories/implementations/drizzle-skill.repository';
import { DrizzleSubjectRepository } from '@/repositories/implementations/drizzle-subject.repository';
import { DrizzleSubtopicRepository } from '@/repositories/implementations/drizzle-subtopic.repository';
import { DrizzleTopicRepository } from '@/repositories/implementations/drizzle-topic.repository';

// Repository interface tokens
export const TOKENS = {
  AdminUserRepo: 'IAdminUserRepository',
  AdminAnalyticsRepo: 'IAdminAnalyticsRepository',
  QuestionRepo: 'IQuestionRepository',
  SessionRepo: 'ISessionRepository',
  AuditRepo: 'IAuditRepository',
  DomainRepo: 'IDomainRepository',
  BlueprintRepo: 'IBlueprintRepository',
  SubjectRepo: 'ISubjectRepository',
  TopicRepo: 'ITopicRepository',
  SubtopicRepo: 'ISubtopicRepository',
  SkillRepo: 'ISkillRepo',
  ExamRepo: 'IExamRepository',
  SelectionService: 'ISelectionService',
  PerformanceService: 'IPerformanceService',
  AuditLoggingExamRepo: 'AuditLoggingExamRepository',
  FeatureFlagService: 'IFeatureFlagService',
} as const;

export function bootstrapContainer() {
  // Register repository implementations
  container.register(TOKENS.AdminUserRepo, new DrizzleAdminUserRepository());
  container.register(TOKENS.AdminAnalyticsRepo, new DrizzleAdminAnalyticsRepository());
  container.register(TOKENS.QuestionRepo, new DrizzleQuestionRepository());
  container.register(TOKENS.SessionRepo, new DrizzleSessionRepository());
  container.register(TOKENS.AuditRepo, new DrizzleAuditRepository());
  container.register(TOKENS.DomainRepo, new DrizzleDomainRepository());
  container.register(TOKENS.BlueprintRepo, new DrizzleBlueprintRepository());
  container.register(TOKENS.SubjectRepo, new DrizzleSubjectRepository());
  container.register(TOKENS.TopicRepo, new DrizzleTopicRepository());
  container.register(TOKENS.SubtopicRepo, new DrizzleSubtopicRepository());
  container.register(TOKENS.SkillRepo, new DrizzleSkillRepository());

  const examBaseRepo = new ExamRepository();
  container.register(TOKENS.ExamRepo, examBaseRepo);
  container.register(TOKENS.AuditLoggingExamRepo, new AuditLoggingExamRepository(examBaseRepo));
  
  // Register engine services as singletons
  container.register(TOKENS.SelectionService, new SelectionService());
  container.register(TOKENS.PerformanceService, new PerformanceService());
  container.register(TOKENS.FeatureFlagService, new FeatureFlagService());
}

// Auto-bootstrap the container when this module is imported (skip in tests)
const isTestEnv = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true' || process.env.VITEST_WORKER_ID !== undefined;
if (!isTestEnv) {
  bootstrapContainer();
}
