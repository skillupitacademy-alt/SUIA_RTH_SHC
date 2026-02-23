import { db, reports } from '@quiz/db';
import { eq } from 'drizzle-orm';

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
  static async getReportByAttempt(attemptId: string) {
    return db.query.reports.findFirst({
      where: eq(reports.attemptId, attemptId),
    });
  }

  static async createReportIfNotExists(input: CreateReportInput) {
    const existing = await this.getReportByAttempt(input.attemptId);
    if (existing) return existing;

    const [newReport] = await db
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

  static async updateReportStatus(attemptId: string, status: 'pending' | 'generating' | 'ready' | 'failed', errorStage?: string) {
    const [updated] = await db
      .update(reports)
      .set({ 
        status, 
        errorStage: errorStage ?? null,
        updatedAt: new Date() 
      })
      .where(eq(reports.attemptId, attemptId))
      .returning();
    
    return updated;
  }

  static async updateReportSuccess(attemptId: string, data: UpdateReportSuccessInput) {
    const [updated] = await db
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
}
