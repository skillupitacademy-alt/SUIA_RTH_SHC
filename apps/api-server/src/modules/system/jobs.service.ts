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
  private static resolveDb(predicate: (candidate: typeof db) => boolean) {
    const candidate = this._db ?? db;
    return predicate(candidate) ? candidate : db;
  }
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
    const client = this.resolveDb((candidate) => typeof (candidate as unknown as Record<string, unknown>).insert === 'function');
    const [job] = await client
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
    const client = this.resolveDb((candidate) => typeof (candidate as unknown as Record<string, unknown>).query === 'object');
    const finder = (client as unknown as { query: { backgroundJobs: { findFirst: unknown } } }).query?.backgroundJobs?.findFirst;
    if (typeof finder !== 'function') return undefined;
    const job = await finder({
      where: and(
        eq(backgroundJobs.id, jobId),
        eq(backgroundJobs.userId, userId)
      ),
    });
    return job as Job | undefined;
  }

  static async listJobs(options: ListJobsOptions): Promise<{ items: Job[]; total: number; nextCursor: { createdAt: string; id: string } | null; hasNextPage: boolean }> {
    const limit = options.limit ?? 50;
    const client = this.resolveDb((candidate) =>
      (candidate as unknown as Record<string, unknown>).query !== undefined && 
      typeof (candidate as unknown as Record<string, unknown>).select === 'function'
    );
    
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

    const items = await (client as unknown as { query: { backgroundJobs: { findMany: (o: unknown) => Promise<Job[]> } } }).query.backgroundJobs.findMany({
      where,
      orderBy: [desc(backgroundJobs.createdAt), desc(backgroundJobs.id)],
      limit: limit + 1,
    });

    const hasNextPage = items.length > limit;
    const results = hasNextPage ? items.slice(0, limit) : items;

    const nextCursor = hasNextPage && results.length > 0 ? {
        createdAt: new Date(results[results.length - 1].createdAt).toISOString(),
        id: results[results.length - 1].id
    } : null;

    const [countResult] = await client
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
    const client = this.resolveDb((candidate) => typeof (candidate as unknown as Record<string, unknown>).delete === 'function');
    await client
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
    const client = this.resolveDb((candidate) => typeof (candidate as unknown as Record<string, unknown>).select === 'function');
    const results = await client
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

    const client = this.resolveDb((candidate) => typeof (candidate as unknown as Record<string, unknown>).update === 'function');
    const [job] = await client
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
