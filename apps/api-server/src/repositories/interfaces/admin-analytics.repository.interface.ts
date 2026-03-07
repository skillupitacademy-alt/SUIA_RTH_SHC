type UnknownRecord = Record<string, unknown>;

type ExamActivityRow = { status: string; count: number };
type DomainActivityRow = { domainName: string | null; count: number };
type EfficiencyRow = { quadrant: string; count: number };
type DomainHierarchy = {
  id: string;
  name: string;
  subjects: Array<{
    id: string;
    name: string;
    topics: Array<{
      id: string;
      name: string;
      subtopics: Array<{ id: string; name: string }>;
      questions: Array<{ difficulty: string; subtopicId: string | null }>;
    }>;
  }>;
};

export interface IAdminAnalyticsRepository {
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
