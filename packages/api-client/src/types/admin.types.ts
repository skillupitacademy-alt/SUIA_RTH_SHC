import { DomainHierarchy, PaginatedQuestions, QuestionCounts, QuestionSummary } from '../types';

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
  details: Array<{ id?: string; questionText: string }>;
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
