import { DomainHierarchy, PaginatedQuestions, QuestionCounts, QuestionSummary, PaginatedResponse, AdminUserProfile, Domain, Subject, Topic } from '../types';

export interface AdminSuccessResponse {
  success?: boolean;
  message?: string;
  foundCount?: number;
  count?: number;
}

export interface AdminBlueprint {
  id: string;
  name: string;
  description: string | null;
  config: Record<string, unknown> | null;
  version: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface AdminPlatformMetrics {
  totalUsers: number;
  activeUsers24h: number;
  totalExams: number;
  liveExams: number;
  totalQuestions: number;
  recentCompletions: number;
}

export interface AdminExamActivityReport {
  started: number;
  completed: number;
  abandoned: number;
  byDomain: { name: string | null; count: number }[];
  avgCompletionTimeMinutes: number;
}

export interface AdminPerformanceAnalytics {
  domains: Array<{
    id: string | null;
    name: string | null;
    avgAccuracy: number;
    sampleSize: number;
    delta: number;
  }>;
  difficulty: Array<{
    level: string;
    avgAccuracy: number;
  }>;
  passFailTrends: {
    pass: number;
    fail: number;
  };
  efficiency: {
    mastery: number;
    persistence: number;
    rash: number;
    struggle: number;
    noData: number;
    total: number;
  };
  summary: {
    avgScore: number;
    passRate: number;
    totalExams: number;
    bestSkill: { name: string; delta: number } | null;
    worstSkill: { name: string; delta: number } | null;
    currentStreak: number;
    deltaPct: number | null;
    healthStatus: 'green' | 'yellow' | 'red';
  };
}

export interface AdminContentHealthReport {
  domainId: string;
  domainName: string;
  stats: QuestionCounts;
  subjects: Array<{
    id: string;
    name: string;
    stats: QuestionCounts;
    topics: Array<{
      id: string;
      name: string;
      stats: QuestionCounts;
      subtopics: Array<{
        id: string;
        name: string;
        stats: QuestionCounts;
      }>;
    }>;
  }>;
}

export interface AdminMetricRow {
  date?: string;
  count?: number;
  score?: number;
  [key: string]: unknown;
}

export interface AdminAuditLog {
  id: string;
  userId: string | null;
  action: string;
  ipAddress: string | null;
  severity: 'info' | 'warning' | 'critical' | null;
  metadata: Record<string, unknown> | null;
  createdAt: string | Date;
}

export interface AdminSystemUsage {
  cpu: number;
  memory: number;
  uptime: number;
  [key: string]: unknown;
}

export interface AdminLiveSession {
  id: string;
  userId: string;
  status: string;
  startedAt: string | Date;
  [key: string]: unknown;
}

export interface DuplicateCheckResponse {
  details: Array<{ index: number; originalId: string; isDuplicate: true }>;
  foundCount: number;
}

export interface AdminTrendSummary {
  avgScore: number;
  passRate: number;
  totalExams: number;
  bestSkill: { name: string; delta: number } | null;
  worstSkill: { name: string; delta: number } | null;
  currentStreak: number;
  deltaPct?: number | null;
  healthStatus?: 'green' | 'yellow' | 'red';
}

export interface AdminSessionListResponse {
  sessions: AdminLiveSession[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminQueueStats {
  enabled: boolean;
  timestamp: string;
  queues: Array<{
    id: string;
    queueName: string;
    displayName: string;
    status: 'online' | 'error';
    counts: Record<string, number> | null;
    lastFailed: Array<{
      id: string;
      name: string;
      failedReason: string;
      finishedOn: string | null;
      data: any;
    }>;
  }>;
}

export interface IAdminUserClient {
  getUsers(
    cursor?: string | null,
    limit?: number,
    status?: 'active' | 'deleted',
    filters?: {
      search?: string;
      role?: string;
      isBlocked?: boolean;
      isVerified?: boolean;
      status?: string;
      fields?: string;
    }
  ): Promise<PaginatedResponse<AdminUserProfile>>;
  updateUser(id: string, data: Partial<AdminUserProfile> & Record<string, unknown>): Promise<AdminUserProfile>;
  createUser(data: { email: string; name: string; password?: string; roles: string[] }): Promise<AdminUserProfile>;
  deleteUser(id: string): Promise<AdminSuccessResponse>;
  login(email: string, password: string, brand?: 'realtutorialhub' | 'skillup'): Promise<{
    user: AdminUserProfile;
    expiresAt: string | null;
  }>;
}

export interface IAdminQuestionConfigClient {
  getDomains(cursor?: string | null, limit?: number, search?: string): Promise<PaginatedResponse<Domain>>;
  createDomain(data: Pick<Domain, 'name' | 'slug' | 'description' | 'icon'>): Promise<Domain>;
  updateDomain(id: string, data: Partial<Pick<Domain, 'name' | 'slug' | 'description' | 'icon'>>): Promise<Domain>;
  deleteDomain(id: string): Promise<AdminSuccessResponse>;
  getSubjects(cursor?: string | null, limit?: number, domainId?: string, search?: string): Promise<PaginatedResponse<Subject>>;
  createSubject(data: Pick<Subject, 'name' | 'domainId' | 'slug' | 'description' | 'icon' | 'orderIndex'>): Promise<Subject>;
  getTopics(cursor?: string | null, limit?: number, subjectId?: string, search?: string): Promise<PaginatedResponse<Topic>>;
  createTopic(data: Pick<Topic, 'name' | 'subjectId' | 'slug' | 'description' | 'orderIndex' | 'complexity'>): Promise<Topic>;
  getQuestions(
    cursor?: string | null,
    limit?: number,
    filters?: {
      domainId?: string;
      subjectId?: string;
      topicId?: string;
      subtopicId?: string;
      skillIds?: string[];
      status?: string;
      search?: string;
      fields?: string;
    }
  ): Promise<PaginatedQuestions>;
  createQuestion(data: Omit<QuestionSummary, 'id'> & Record<string, unknown>): Promise<QuestionSummary>;
}

export interface IAdminBlueprintConfigClient {
  getBlueprints(cursor?: string | null, limit?: number, search?: string, fields?: string): Promise<PaginatedResponse<AdminBlueprint>>;
  getBlueprintById(id: string): Promise<AdminBlueprint>;
  createBlueprint(data: Record<string, unknown>): Promise<AdminBlueprint>;
  updateBlueprint(id: string, data: Partial<Record<string, unknown>>): Promise<AdminBlueprint>;
  deleteBlueprint(id: string): Promise<AdminSuccessResponse>;
}

export interface IAdminConfigClient extends IAdminQuestionConfigClient, IAdminBlueprintConfigClient {}

export interface IAdminAnalyticsClient {
  getMetrics(): Promise<AdminPlatformMetrics>;
  getUserMetrics(): Promise<AdminPlatformMetrics>;
  getSecurityMetrics(): Promise<Record<string, unknown>>;
  getPerformanceAnalytics(range?: string): Promise<AdminPerformanceAnalytics>;
}

export interface IAdminAuditClient {
  getAuditLogs(params?: any): Promise<AdminAuditLog[] | PaginatedResponse<AdminAuditLog>>;
}

export interface IAdminReportClient extends IAdminAnalyticsClient, IAdminAuditClient {}
