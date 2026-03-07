/**
 * @deprecated The monolithic AdminClient violates the Interface Segregation Principle.
 * Prefer the specialized clients exported from '@quiz/api-client' instead.
 */
import { FetchClient } from '@quiz/api-client/core/fetch-client';
import { AnalyticsAdminClient } from './admin/analytics-admin-client';
import { AuditAdminClient } from './admin/audit-admin-client';
import { BlueprintAdminClient } from './admin/blueprint-admin-client';
import { JobAdminClient } from './admin/job-admin-client';
import { QuestionAdminClient } from './admin/question-admin-client';
import { SessionAdminClient } from './admin/session-admin-client';
import { UserAdminClient } from './admin/user-admin-client';

export class AdminClient {
  public questions: QuestionAdminClient;
  public users: UserAdminClient;
  public analytics: AnalyticsAdminClient;
  public blueprints: BlueprintAdminClient;
  public jobs: JobAdminClient;
  public sessions: SessionAdminClient;
  public audit: AuditAdminClient;

  constructor(private client: FetchClient) {
    this.questions = new QuestionAdminClient(this.client);
    this.users = new UserAdminClient(this.client);
    this.analytics = new AnalyticsAdminClient(this.client);
    this.blueprints = new BlueprintAdminClient(this.client);
    this.jobs = new JobAdminClient(this.client);
    this.sessions = new SessionAdminClient(this.client);
    this.audit = new AuditAdminClient(this.client);
  }

  // --- QUESTION & REPOSITORY DELEGATES (deprecated) ---
  getDomains(...args: Parameters<QuestionAdminClient['getDomains']>) {
    return this.questions.getDomains(...args);
  }
  createDomain(...args: Parameters<QuestionAdminClient['createDomain']>) {
    return this.questions.createDomain(...args);
  }
  updateDomain(...args: Parameters<QuestionAdminClient['updateDomain']>) {
    return this.questions.updateDomain(...args);
  }
  deleteDomain(...args: Parameters<QuestionAdminClient['deleteDomain']>) {
    return this.questions.deleteDomain(...args);
  }
  batchDeleteDomains(...args: Parameters<QuestionAdminClient['batchDeleteDomains']>) {
    return this.questions.batchDeleteDomains(...args);
  }

  getSubjects(...args: Parameters<QuestionAdminClient['getSubjects']>) {
    return this.questions.getSubjects(...args);
  }
  getSubjectsByDomain(...args: Parameters<QuestionAdminClient['getSubjectsByDomain']>) {
    return this.questions.getSubjectsByDomain(...args);
  }
  createSubject(...args: Parameters<QuestionAdminClient['createSubject']>) {
    return this.questions.createSubject(...args);
  }
  updateSubject(...args: Parameters<QuestionAdminClient['updateSubject']>) {
    return this.questions.updateSubject(...args);
  }
  deleteSubject(...args: Parameters<QuestionAdminClient['deleteSubject']>) {
    return this.questions.deleteSubject(...args);
  }
  batchDeleteSubjects(...args: Parameters<QuestionAdminClient['batchDeleteSubjects']>) {
    return this.questions.batchDeleteSubjects(...args);
  }

  getTopics(...args: Parameters<QuestionAdminClient['getTopics']>) {
    return this.questions.getTopics(...args);
  }
  getTopicsBySubject(...args: Parameters<QuestionAdminClient['getTopicsBySubject']>) {
    return this.questions.getTopicsBySubject(...args);
  }
  createTopic(...args: Parameters<QuestionAdminClient['createTopic']>) {
    return this.questions.createTopic(...args);
  }
  updateTopic(...args: Parameters<QuestionAdminClient['updateTopic']>) {
    return this.questions.updateTopic(...args);
  }
  deleteTopic(...args: Parameters<QuestionAdminClient['deleteTopic']>) {
    return this.questions.deleteTopic(...args);
  }
  batchDeleteTopics(...args: Parameters<QuestionAdminClient['batchDeleteTopics']>) {
    return this.questions.batchDeleteTopics(...args);
  }

  getSubtopics(...args: Parameters<QuestionAdminClient['getSubtopics']>) {
    return this.questions.getSubtopics(...args);
  }
  createSubtopic(...args: Parameters<QuestionAdminClient['createSubtopic']>) {
    return this.questions.createSubtopic(...args);
  }
  updateSubtopic(...args: Parameters<QuestionAdminClient['updateSubtopic']>) {
    return this.questions.updateSubtopic(...args);
  }
  deleteSubtopic(...args: Parameters<QuestionAdminClient['deleteSubtopic']>) {
    return this.questions.deleteSubtopic(...args);
  }
  batchDeleteSubtopics(...args: Parameters<QuestionAdminClient['batchDeleteSubtopics']>) {
    return this.questions.batchDeleteSubtopics(...args);
  }

  getSkills(...args: Parameters<QuestionAdminClient['getSkills']>) {
    return this.questions.getSkills(...args);
  }
  getTopicSkills(...args: Parameters<QuestionAdminClient['getTopicSkills']>) {
    return this.questions.getTopicSkills(...args);
  }
  createSkill(...args: Parameters<QuestionAdminClient['createSkill']>) {
    return this.questions.createSkill(...args);
  }
  updateSkill(...args: Parameters<QuestionAdminClient['updateSkill']>) {
    return this.questions.updateSkill(...args);
  }
  deleteSkill(...args: Parameters<QuestionAdminClient['deleteSkill']>) {
    return this.questions.deleteSkill(...args);
  }
  batchDeleteSkills(...args: Parameters<QuestionAdminClient['batchDeleteSkills']>) {
    return this.questions.batchDeleteSkills(...args);
  }
  mapTopicSkills(...args: Parameters<QuestionAdminClient['mapTopicSkills']>) {
    return this.questions.mapTopicSkills(...args);
  }

  getQuestions(...args: Parameters<QuestionAdminClient['getQuestions']>) {
    return this.questions.getQuestions(...args);
  }
  getQuestionById(...args: Parameters<QuestionAdminClient['getQuestionById']>) {
    return this.questions.getQuestionById(...args);
  }
  createQuestion(...args: Parameters<QuestionAdminClient['createQuestion']>) {
    return this.questions.createQuestion(...args);
  }
  bulkCreateQuestions(...args: Parameters<QuestionAdminClient['bulkCreateQuestions']>) {
    return this.questions.bulkCreateQuestions(...args);
  }
  updateQuestion(...args: Parameters<QuestionAdminClient['updateQuestion']>) {
    return this.questions.updateQuestion(...args);
  }
  deleteQuestion(...args: Parameters<QuestionAdminClient['deleteQuestion']>) {
    return this.questions.deleteQuestion(...args);
  }
  batchDeleteQuestions(...args: Parameters<QuestionAdminClient['batchDeleteQuestions']>) {
    return this.questions.batchDeleteQuestions(...args);
  }

  atomicSeed(...args: Parameters<QuestionAdminClient['atomicSeed']>) {
    return this.questions.atomicSeed(...args);
  }
  saveFactoryBatch(...args: Parameters<QuestionAdminClient['saveFactoryBatch']>) {
    return this.questions.saveFactoryBatch(...args);
  }
  checkDuplicates(...args: Parameters<QuestionAdminClient['checkDuplicates']>) {
    return this.questions.checkDuplicates(...args);
  }

  // --- USER DELEGATES (deprecated) ---
  getUsers(...args: Parameters<UserAdminClient['getUsers']>) {
    return this.users.getUsers(...args);
  }
  updateUser(...args: Parameters<UserAdminClient['updateUser']>) {
    return this.users.updateUser(...args);
  }
  deleteUser(...args: Parameters<UserAdminClient['deleteUser']>) {
    return this.users.deleteUser(...args);
  }
  login(...args: Parameters<UserAdminClient['login']>) {
    return this.users.login(...args);
  }

  // --- BLUEPRINT DELEGATES (deprecated) ---
  getBlueprints(...args: Parameters<BlueprintAdminClient['getBlueprints']>) {
    return this.blueprints.getBlueprints(...args);
  }
  getBlueprintById(...args: Parameters<BlueprintAdminClient['getBlueprintById']>) {
    return this.blueprints.getBlueprintById(...args);
  }
  createBlueprint(...args: Parameters<BlueprintAdminClient['createBlueprint']>) {
    return this.blueprints.createBlueprint(...args);
  }
  updateBlueprint(...args: Parameters<BlueprintAdminClient['updateBlueprint']>) {
    return this.blueprints.updateBlueprint(...args);
  }
  deleteBlueprint(...args: Parameters<BlueprintAdminClient['deleteBlueprint']>) {
    return this.blueprints.deleteBlueprint(...args);
  }

  // --- ANALYTICS DELEGATES (deprecated) ---
  getMetrics(...args: Parameters<AnalyticsAdminClient['getMetrics']>) {
    return this.analytics.getMetrics(...args);
  }
  getUserMetrics(...args: Parameters<AnalyticsAdminClient['getUserMetrics']>) {
    return this.analytics.getUserMetrics(...args);
  }
  getSecurityMetrics(...args: Parameters<AnalyticsAdminClient['getSecurityMetrics']>) {
    return this.analytics.getSecurityMetrics(...args);
  }
  getContentHealthReport(...args: Parameters<AnalyticsAdminClient['getContentHealthReport']>) {
    return this.analytics.getContentHealthReport(...args);
  }
  getPerformanceAnalytics(...args: Parameters<AnalyticsAdminClient['getPerformanceAnalytics']>) {
    return this.analytics.getPerformanceAnalytics(...args);
  }
  getExamActivity(...args: Parameters<AnalyticsAdminClient['getExamActivity']>) {
    return this.analytics.getExamActivity(...args);
  }
  getRBACMetrics(...args: Parameters<AnalyticsAdminClient['getRBACMetrics']>) {
    return this.analytics.getRBACMetrics(...args);
  }
  getBlueprintMetrics(...args: Parameters<AnalyticsAdminClient['getBlueprintMetrics']>) {
    return this.analytics.getBlueprintMetrics(...args);
  }
  getGrowthMetrics(...args: Parameters<AnalyticsAdminClient['getGrowthMetrics']>) {
    return this.analytics.getGrowthMetrics(...args);
  }
  getSystemUsage(...args: Parameters<AnalyticsAdminClient['getSystemUsage']>) {
    return this.analytics.getSystemUsage(...args);
  }
  getTrendSummary(...args: Parameters<AnalyticsAdminClient['getTrendSummary']>) {
    return this.analytics.getTrendSummary(...args);
  }
  getScoreTrends(...args: Parameters<AnalyticsAdminClient['getScoreTrends']>) {
    return this.analytics.getScoreTrends(...args);
  }
  getSkillTrends(...args: Parameters<AnalyticsAdminClient['getSkillTrends']>) {
    return this.analytics.getSkillTrends(...args);
  }

  // --- JOB DELEGATES (deprecated) ---
  createJob(...args: Parameters<JobAdminClient['createJob']>) {
    return this.jobs.createJob(...args);
  }
  getJobById(...args: Parameters<JobAdminClient['getJobById']>) {
    return this.jobs.getJobById(...args);
  }

  // --- SESSION DELEGATES (deprecated) ---
  getLiveSessions(...args: Parameters<SessionAdminClient['getLiveSessions']>) {
    return this.sessions.getLiveSessions(...args);
  }

  // --- AUDIT DELEGATES (deprecated) ---
  getAuditLogs(...args: Parameters<AuditAdminClient['getAuditLogs']>) {
    return this.audit.getAuditLogs(...args);
  }
}
