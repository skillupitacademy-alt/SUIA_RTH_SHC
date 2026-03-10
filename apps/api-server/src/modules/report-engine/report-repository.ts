import { db, reports } from "@quiz/db";
import { and, avg, count, desc, eq, type SQL } from "drizzle-orm";

export interface CreateReportInput {
  attemptId: string;
  userId: string;
  status?: 'pending' | 'generating' | 'ready' | 'failed';
  storageProvider?: string;
}

export interface UpdateReportSuccessInput {
  fileRef: string;
  generationTimeMs: number;
  fileSizeKb: number;
  pageCount: number;
}

export class ReportRepository {
  constructor(private readonly dbInstance: typeof db = db) {}

  withDb(dbClient: typeof db): ReportRepository {
    return new ReportRepository(dbClient);
  }

  async getReportByAttempt(attemptId: string) {
    return this.dbInstance.query.reports.findFirst({
      where: eq(reports.attemptId, attemptId),
    });
  }

  async createReportIfNotExists(input: CreateReportInput) {
    const existing = await this.getReportByAttempt(input.attemptId);
    if (existing) return existing;

    const [newReport] = await this.dbInstance
      .insert(reports)
      .values({
        attemptId: input.attemptId,
        userId: input.userId,
        status: input.status ?? 'pending',
        storageProvider: input.storageProvider ?? process.env.STORAGE_PROVIDER ?? 'blob',
      })
      .returning();
    
    return newReport;
  }

  async updateReportStatus(
    attemptId: string, 
    status: 'pending' | 'generating' | 'ready' | 'failed', 
    stageOrError?: string
  ) {
    const [updated] = await this.dbInstance
      .update(reports)
      .set({ 
        status, 
        errorStage: stageOrError ?? null,
        updatedAt: new Date() 
      })
      .where(eq(reports.attemptId, attemptId))
      .returning();
    
    return updated;
  }

  async updateReportSuccess(attemptId: string, data: UpdateReportSuccessInput) {
    const [updated] = await this.dbInstance
      .update(reports)
      .set({
        status: 'ready',
        fileRef: data.fileRef,
        generationTimeMs: data.generationTimeMs,
        fileSizeKb: data.fileSizeKb,
        pageCount: data.pageCount,
        errorStage: null,
        updatedAt: new Date(),
      })
      .where(eq(reports.attemptId, attemptId))
      .returning();
    
    return updated;
  }

  async listReports(filters: {
    status?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const conditions: SQL[] = [];

    if (filters.status !== undefined && filters.status.length > 0) {
      conditions.push(eq(reports.status, filters.status as 'pending' | 'generating' | 'ready' | 'failed'));
    }
    if (filters.userId !== undefined && filters.userId.length > 0) {
      conditions.push(eq(reports.userId, filters.userId));
    }

    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;

    const rows = await this.dbInstance
      .select()
      .from(reports)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(reports.updatedAt))
      .limit(limit)
      .offset(offset);

    return rows;
  }

  async getReportStats() {
    const statusCounts = await this.dbInstance
      .select({
        status: reports.status,
        total: count(),
      })
      .from(reports)
      .groupBy(reports.status);

    const avgGen = await this.dbInstance
      .select({
        avgMs: avg(reports.generationTimeMs),
      })
      .from(reports)
      .where(eq(reports.status, 'ready'));

    return {
      byStatus: Object.fromEntries(statusCounts.map(r => [r.status, Number(r.total)])),
      avgGenerationTimeMs: avgGen[0]?.avgMs !== null ? Math.round(Number(avgGen[0]?.avgMs ?? 0)) : null,
    };
  }

  // Convenience static helpers so existing callers using the class as a singleton keep working
  private static readonly defaultRepo = new ReportRepository();

  static getReportByAttempt(attemptId: string) {
    return this.defaultRepo.getReportByAttempt(attemptId);
  }

  static createReportIfNotExists(input: CreateReportInput) {
    return this.defaultRepo.createReportIfNotExists(input);
  }

  static updateReportStatus(
    attemptId: string,
    status: 'pending' | 'generating' | 'ready' | 'failed',
    stageOrError?: string
  ) {
    return this.defaultRepo.updateReportStatus(attemptId, status, stageOrError);
  }

  static updateReportSuccess(attemptId: string, data: UpdateReportSuccessInput) {
    return this.defaultRepo.updateReportSuccess(attemptId, data);
  }

  static listReports(filters?: { status?: string; userId?: string; limit?: number; offset?: number }) {
    return this.defaultRepo.listReports(filters);
  }

  static getReportStats() {
    return this.defaultRepo.getReportStats();
  }
}
