import { backgroundJobs, db } from '@quiz/db';
import { CreateJobInput as CreateJobDTO, Job,JobStatus } from '@quiz/types';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';

export interface ListJobsOptions {
  userId?: string;
  status?: JobStatus;
  limit?: number;
  offset?: number;
}

export class JobsService {
  // Test seam: optionally override db instance
  private static _db: typeof db | undefined;
  static withDb(fakeDb: typeof db) {
    if (process.env.NODE_ENV === 'test') {
      this._db = fakeDb;
    }
    return this;
  }
  private static get db() {
    return this._db ?? db;
  }

  static async createJob(dto: CreateJobDTO): Promise<Job> {
    const [job] = await this.db
      .insert(backgroundJobs)
      .values({
        userId: dto.userId,
        type: dto.type,
        payload: dto.payload,
        status: JobStatus.PENDING,
      })
      .returning();
    
    return job;
  }

  static async getJob(jobId: string, userId: string): Promise<Job | undefined> {
    const finder: typeof db.query.backgroundJobs.findFirst | undefined =
      this.db.query?.backgroundJobs?.findFirst;
    if (typeof finder !== 'function') return undefined;
    const job = await finder({
      where: and(
        eq(backgroundJobs.id, jobId),
        eq(backgroundJobs.userId, userId)
      ),
    });
    return job;
  }

  static async listJobs(options: ListJobsOptions): Promise<{ items: Job[]; total: number }> {
    const limit = options.limit ?? 50;
    const offset = options.offset ?? 0;
    
    const conditions = [];
    if (options.userId !== undefined) {
      conditions.push(eq(backgroundJobs.userId, options.userId));
    }
    if (options.status !== undefined) {
      conditions.push(eq(backgroundJobs.status, options.status));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const items = await this.db.query.backgroundJobs.findMany({
      where,
      orderBy: [desc(backgroundJobs.createdAt)],
      limit,
      offset,
    });

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(backgroundJobs)
      .where(where || sql`true`);

    return {
      items: items as Job[],
      total: Number(countResult?.count ?? 0),
    };
  }

  static async retryJob(jobId: string, userId: string): Promise<Job> {
    const originalJob = await this.getJob(jobId, userId);
    if (originalJob === undefined) {
      throw new Error('Original job not found or unauthorized');
    }

    // Create a new job with the same payload
    return await this.createJob({
      userId: originalJob.userId,
      type: originalJob.type,
      payload: (originalJob.payload !== null && originalJob.payload !== undefined) ? (originalJob.payload as Record<string, unknown>) : undefined,
    });
  }

  static async deleteJob(jobId: string, userId: string): Promise<void> {
    await this.db
      .delete(backgroundJobs)
      .where(
        and(
          eq(backgroundJobs.id, jobId),
          eq(backgroundJobs.userId, userId)
        )
      );
  }

  static async getActiveJobCount(userId: string): Promise<number> {
    const activeStatuses: JobStatus[] = [JobStatus.PENDING, JobStatus.PROCESSING];
    const results = await this.db
      .select()
      .from(backgroundJobs)
      .where(
        and(
          eq(backgroundJobs.userId, userId),
          inArray(backgroundJobs.status, activeStatuses)
        )
      );
    return results.length;
  }

  static async updateJobStatus(
    jobId: string, 
    status: JobStatus,
    data?: { result?: Record<string, unknown>; error?: string }
  ): Promise<Job> {
    const updateData: {
      status: JobStatus;
      updatedAt: Date;
      startedAt?: Date;
      completedAt?: Date;
      result?: Record<string, unknown>;
      error?: string;
    } = {
      status,
      updatedAt: new Date(),
    };

    if (status === JobStatus.PROCESSING) {
      updateData.startedAt = new Date();
    } else if (status === JobStatus.COMPLETED || status === JobStatus.FAILED) {
      updateData.completedAt = new Date();
      if (data?.result !== undefined) updateData.result = data.result;
      if (data?.error !== undefined) updateData.error = data.error;
    }

    const [job] = await this.db
      .update(backgroundJobs)
      .set(updateData)
      .where(eq(backgroundJobs.id, jobId))
      .returning();
    
    return job;
  }

  /**
   * DEV ONLY: Simulate job transitions for testing resilience.
   */
  static async simulateJob(jobId: string, _userId: string): Promise<void> {
    const allowMock = process.env.ALLOW_MOCK_JOBS === 'true' || process.env.NODE_ENV !== 'production';
    if (allowMock === false) return;

    try {
      // 1. Move to processing after 3s
      await new Promise(resolve => setTimeout(resolve, 3000));
      await this.updateJobStatus(jobId, JobStatus.PROCESSING);

      // 2. Move to completed after another 10s
      await new Promise(resolve => setTimeout(resolve, 10000));
      await this.updateJobStatus(jobId, JobStatus.COMPLETED, { 
        result: { 
          message: 'Simulation completed successfully',
          timestamp: new Date().toISOString()
        } 
      });
    } catch (err) {
      await this.updateJobStatus(jobId, JobStatus.FAILED, { 
        error: err instanceof Error ? err.message : 'Simulation failed' 
      });
    }
  }
}
