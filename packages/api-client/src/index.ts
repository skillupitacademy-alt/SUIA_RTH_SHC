import { FetchClient } from './core/fetch-client';
import { AuthClient } from './modules/auth-client';
import { QuizClient } from './modules/quiz-client';
import { DashboardClient } from './modules/dashboard-client';
import { SearchClient } from './modules/search-client';
import { AnalyticsClient } from './modules/analytics-client';
import { ReportClient } from './modules/report-client';
import { TelemetryClient } from './modules/telemetry-client';
import { TutorClient } from './modules/tutor-client';
import { ContentAdminClient } from './modules/admin/content-admin-client';
import { UserAdminClient } from './modules/admin/user-admin-client';
import { AnalyticsAdminClient } from './modules/admin/analytics-admin-client';
import { SystemAdminClient } from './modules/admin/system-admin-client';

function getApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    let url = process.env.NEXT_PUBLIC_API_URL.trim();
    url = url.replace(/\/+$/, ''); // strip trailing slash(es)
    // Ensure the path ends with /api to hit Next routes correctly
    if (!url.toLowerCase().endsWith('/api')) {
      url = `${url}/api`;
    }
    return url;
  }
  return '/api';
}

function getAdminUrl(): string {
  if (process.env.NEXT_PUBLIC_ADMIN_URL) {
    return process.env.NEXT_PUBLIC_ADMIN_URL.replace(/\/$/, '');
  }
  return '#'; 
}

const API_URL = getApiUrl();
const ADMIN_URL = getAdminUrl();

const baseClient = new FetchClient(API_URL);
const contentAdmin = new ContentAdminClient(baseClient);
const userAdmin = new UserAdminClient(baseClient);
const analyticsAdmin = new AnalyticsAdminClient(baseClient);
const systemAdmin = new SystemAdminClient(baseClient);

export * from './modules/auth-client';
export * from './modules/quiz-client';
export * from './modules/admin/content-admin-client';
export * from './modules/admin/user-admin-client';
export * from './modules/admin/analytics-admin-client';
export * from './modules/admin/system-admin-client';
export * from './modules/admin/question-admin-client';
export * from './modules/admin/blueprint-admin-client';
export * from './modules/admin/job-admin-client';
export * from './modules/admin/session-admin-client';
export * from './modules/admin/audit-admin-client';
export * from './modules/admin.types';
export * from './modules/dashboard-client';
export * from './modules/report-client';
export * from './modules/search-client';
export * from './modules/telemetry-client';
export * from './modules/analytics-client';
export * from './modules/tutor-client';
export * from './types';

export const apiClient = {
  auth: new AuthClient(baseClient),
  quiz: new QuizClient(baseClient),
  content: contentAdmin,
  user: userAdmin,
  adminAnalytics: analyticsAdmin,
  system: systemAdmin,
  dashboard: new DashboardClient(baseClient),
  reports: new ReportClient(baseClient),
  search: new SearchClient(baseClient),
  telemetry: new TelemetryClient(baseClient),
  analytics: new AnalyticsClient(baseClient),
  tutor: new TutorClient(baseClient),
  client: baseClient,
  getAdminUrl: () => ADMIN_URL,
  // Compatibility shim for legacy code
  admin: {
    // structured sub-clients
    questions: contentAdmin,
    users: userAdmin,
    analytics: analyticsAdmin,
    blueprints: contentAdmin,
    jobs: systemAdmin,
    sessions: systemAdmin,
    audit: systemAdmin,
    // legacy flat methods (delegating)
    login: userAdmin.login.bind(userAdmin),
    getQueueStats: systemAdmin.getQueueStats.bind(systemAdmin),
    performJobAction: systemAdmin.performJobAction.bind(systemAdmin),
    createJob: async (type: string, payload: Record<string, unknown> = {}) => {
      const res = await systemAdmin.createJob(type, payload);
      // Minimal shape sufficient for trackers; status is pending until worker updates it.
      return { job: { id: res.jobId, status: 'pending', type, payload } as any };
    },
    getJobById: async (id: string) => {
      try {
        const job = await systemAdmin.getJobById(id);
        return { job };
      } catch {
        return { job: null };
      }
    },
    getLiveSessions: (..._args: unknown[]) => systemAdmin.getLiveSessions(),
    getSystemUsage: systemAdmin.getSystemUsage.bind(systemAdmin),
    getAuditLogs: systemAdmin.getAuditLogs.bind(systemAdmin),

    getUsers: userAdmin.getUsers.bind(userAdmin),
    updateUser: userAdmin.updateUser.bind(userAdmin),
    deleteUser: userAdmin.deleteUser.bind(userAdmin),

    getMetrics: analyticsAdmin.getMetrics.bind(analyticsAdmin),
    getUserMetrics: analyticsAdmin.getUserMetrics.bind(analyticsAdmin),
    getSecurityMetrics: analyticsAdmin.getSecurityMetrics.bind(analyticsAdmin),
    getContentHealthReport: analyticsAdmin.getContentHealthReport.bind(analyticsAdmin),
    getPerformanceAnalytics: analyticsAdmin.getPerformanceAnalytics.bind(analyticsAdmin),
    getExamActivity: analyticsAdmin.getExamActivity.bind(analyticsAdmin),
    getRBACMetrics: analyticsAdmin.getRBACMetrics.bind(analyticsAdmin),
    getBlueprintMetrics: analyticsAdmin.getBlueprintMetrics.bind(analyticsAdmin),
    getGrowthMetrics: analyticsAdmin.getGrowthMetrics.bind(analyticsAdmin),
    getTrendSummary: analyticsAdmin.getTrendSummary.bind(analyticsAdmin),
    getScoreTrends: analyticsAdmin.getScoreTrends.bind(analyticsAdmin),
    getSkillTrends: analyticsAdmin.getSkillTrends.bind(analyticsAdmin),

    getQuestions: contentAdmin.getQuestions.bind(contentAdmin),
    getQuestionById: contentAdmin.getQuestionById.bind(contentAdmin),
    createQuestion: contentAdmin.createQuestion.bind(contentAdmin),
    bulkCreateQuestions: contentAdmin.bulkCreateQuestions.bind(contentAdmin),
    updateQuestion: contentAdmin.updateQuestion.bind(contentAdmin),
    deleteQuestion: contentAdmin.deleteQuestion.bind(contentAdmin),
    batchDeleteQuestions: contentAdmin.batchDeleteQuestions.bind(contentAdmin),
    atomicSeed: contentAdmin.atomicSeed.bind(contentAdmin),
    saveFactoryBatch: contentAdmin.saveFactoryBatch.bind(contentAdmin),
    checkDuplicates: contentAdmin.checkDuplicates.bind(contentAdmin),

    getDomains: contentAdmin.getDomains.bind(contentAdmin),
    createDomain: contentAdmin.createDomain.bind(contentAdmin),
    updateDomain: contentAdmin.updateDomain.bind(contentAdmin),
    deleteDomain: contentAdmin.deleteDomain.bind(contentAdmin),
    batchDeleteDomains: contentAdmin.batchDeleteDomains.bind(contentAdmin),

    getSubjects: contentAdmin.getSubjects.bind(contentAdmin),
    getSubjectsByDomain: contentAdmin.getSubjectsByDomain.bind(contentAdmin),
    createSubject: contentAdmin.createSubject.bind(contentAdmin),
    updateSubject: contentAdmin.updateSubject.bind(contentAdmin),
    deleteSubject: contentAdmin.deleteSubject.bind(contentAdmin),
    batchDeleteSubjects: contentAdmin.batchDeleteSubjects.bind(contentAdmin),

    getTopics: contentAdmin.getTopics.bind(contentAdmin),
    getTopicsBySubject: contentAdmin.getTopicsBySubject.bind(contentAdmin),
    createTopic: contentAdmin.createTopic.bind(contentAdmin),
    updateTopic: contentAdmin.updateTopic.bind(contentAdmin),
    deleteTopic: contentAdmin.deleteTopic.bind(contentAdmin),
    batchDeleteTopics: contentAdmin.batchDeleteTopics.bind(contentAdmin),

    getSubtopics: contentAdmin.getSubtopics.bind(contentAdmin),
    createSubtopic: contentAdmin.createSubtopic.bind(contentAdmin),
    updateSubtopic: contentAdmin.updateSubtopic.bind(contentAdmin),
    deleteSubtopic: contentAdmin.deleteSubtopic.bind(contentAdmin),
    batchDeleteSubtopics: contentAdmin.batchDeleteSubtopics.bind(contentAdmin),

    getSkills: contentAdmin.getSkills.bind(contentAdmin),
    getTopicSkills: contentAdmin.getTopicSkills.bind(contentAdmin),
    createSkill: contentAdmin.createSkill.bind(contentAdmin),
    updateSkill: contentAdmin.updateSkill.bind(contentAdmin),
    deleteSkill: contentAdmin.deleteSkill.bind(contentAdmin),
    batchDeleteSkills: contentAdmin.batchDeleteSkills.bind(contentAdmin),
    mapTopicSkills: contentAdmin.mapTopicSkills.bind(contentAdmin),

    getBlueprints: contentAdmin.getBlueprints.bind(contentAdmin),
    getBlueprintById: contentAdmin.getBlueprintById.bind(contentAdmin),
    createBlueprint: contentAdmin.createBlueprint.bind(contentAdmin),
    updateBlueprint: contentAdmin.updateBlueprint.bind(contentAdmin),
    deleteBlueprint: contentAdmin.deleteBlueprint.bind(contentAdmin),
  }
};
