import { backgroundJobs, db } from '@quiz/db';
import { CreateJobInput as CreateJobDTO, Job, JobStatus } from '@quiz/types';
import { and, desc, eq, inArray, lt, or, sql } from 'drizzle-orm';

export interface ListJobsOptions {
  userId?: string;
  status?: JobStatus;
  limit?: number;
  cursor?: { createdAt: string; id: string };
}

export class JobsService {
  // Test seam: optionally override db instance
  private static _db: typeof db | undefined;
  static withDb(fakeDb: typeof db) {
    if (process.env.NODE_ENV !== 'production') {
      this._db = fakeDb;
    }
    return this;
  }
  private static get db() {
    return this._db ?? db;
  }

  static async createJob(dto: CreateJobDTO): Promise<Job> {
    const isTestEnv = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true' || process.env.VITEST_WORKER_ID !== undefined;
    if (process.env.QUEUE_ENABLED !== 'true' && !isTestEnv) {
      return {
        id: crypto.randomUUID(),
        userId: dto.userId,
        type: dto.type,
        payload: dto.payload ?? {},
        status: JobStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Job;
    }
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
    return await this.db.query.backgroundJobs.findFirst({
      where: and(eq(backgroundJobs.id, jobId), eq(backgroundJobs.userId, userId)),
    }) as Job | undefined;
  }

  static async getJobStatus(jobId: string): Promise<Job | undefined> {
    return await this.db.query.backgroundJobs.findFirst({
      where: eq(backgroundJobs.id, jobId),
    }) as Job | undefined;
  }

  static async listJobs(options: ListJobsOptions): Promise<{ items: Job[]; total: number; nextCursor: { createdAt: string; id: string } | null; hasNextPage: boolean }> {
    const limit = options.limit ?? 50;
    
    const conditions = [];
    if (options.userId !== undefined) {
      conditions.push(eq(backgroundJobs.userId, options.userId));
    }
    if (options.status !== undefined) {
      conditions.push(eq(backgroundJobs.status, options.status));
    }

    if (options.cursor) {
        conditions.push(
            or(
                lt(backgroundJobs.createdAt, new Date(options.cursor.createdAt)),
                and(
                    eq(backgroundJobs.createdAt, new Date(options.cursor.createdAt)),
                    lt(backgroundJobs.id, options.cursor.id)
                )
            )
        );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const items = await this.db.query.backgroundJobs.findMany({
      where: where ?? sql`true`,
      orderBy: [desc(backgroundJobs.createdAt), desc(backgroundJobs.id)],
      limit: limit + 1,
    });

    const hasNextPage = items.length > limit;
    const results = hasNextPage ? items.slice(0, limit) : items;

    const nextCursor = hasNextPage && results.length > 0 ? {
        createdAt: new Date(results[results.length - 1].createdAt).toISOString(),
        id: results[results.length - 1].id
    } : null;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(backgroundJobs)
      .where(where || sql`true`);

    return {
      items: results as Job[],
      total: Number(countResult?.count ?? 0),
      nextCursor,
      hasNextPage
    };
  }

  static async retryJob(jobId: string, userId: string): Promise<Job> {
    const originalJob = await this.getJob(jobId, userId);
    if (originalJob === undefined) {
      throw new Error('Original job not found');
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
    data?: { result?: Record<string, unknown>; error?: string; currentStep?: string }
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
      if (data !== undefined && 'currentStep' in data && data.currentStep !== undefined && data.currentStep !== '') {
        updateData.result = { ...((data.result as Record<string, unknown> | undefined) ?? {}), currentStep: data.currentStep };
      }
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
