import { db } from '@quiz/db';

export type UnknownRecord = Record<string, unknown>;

export type ExamActivityRow = { status: string; count: number };
export type DomainActivityRow = { domainName: string | null; count: number };
export type EfficiencyRow = { quadrant: string; count: number };
export type DomainHierarchy = {
  id: string;
  name: string;
  subjects: Array<Record<string, unknown>>;
};

export interface IAdminAnalyticsRepository {
  withDb(dbClient: typeof db): IAdminAnalyticsRepository;
  getPlatformMetrics(): Promise<UnknownRecord>;
  getExamActivity(): Promise<{
    statusStats: ExamActivityRow[];
    domainActivity: DomainActivityRow[];
    avgTime: number | null;
  }>;
  getEfficiencyAnalytics(): Promise<EfficiencyRow[]>;
  getAuditLogs(cursor: string | null, limit: number): Promise<{ data: UnknownRecord[]; nextCursor: string | null }>;
  getRBACMetrics(): Promise<UnknownRecord[]>;
  getAllDomainHierarchy(): Promise<DomainHierarchy[]>;
}
