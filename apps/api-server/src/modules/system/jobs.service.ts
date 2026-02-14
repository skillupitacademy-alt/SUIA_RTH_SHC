import { db, backgroundJobs } from '@quiz/db';
import { eq, and, inArray } from 'drizzle-orm';

export interface CreateJobDTO {
  userId: string;
  type: string;
  payload?: Record<string, unknown>;
}

export class JobsService {
  static async createJob(dto: CreateJobDTO) {
    const [job] = await db
      .insert(backgroundJobs)
      .values({
        userId: dto.userId,
        type: dto.type,
        payload: dto.payload,
        status: 'pending',
      })
      .returning();
    
    return job;
  }

  static async getJob(jobId: string, userId: string) {
    return await db.query.backgroundJobs.findFirst({
      where: and(
        eq(backgroundJobs.id, jobId),
        eq(backgroundJobs.userId, userId)
      ),
    });
  }

  static async getActiveJobCount(userId: string) {
    const activeStatuses: ('pending' | 'processing')[] = ['pending', 'processing'];
    const results = await db
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
    status: 'pending' | 'processing' | 'completed' | 'failed',
    data?: { result?: Record<string, unknown>; error?: string }
  ) {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'processing') {
      updateData.startedAt = new Date();
    } else if (status === 'completed' || status === 'failed') {
      updateData.completedAt = new Date();
      if (data?.result) updateData.result = data.result;
      if (data?.error) updateData.error = data.error;
    }

    const [job] = await db
      .update(backgroundJobs)
      .set(updateData)
      .where(eq(backgroundJobs.id, jobId))
      .returning();
    
    return job;
  }

  /**
   * DEV ONLY: Simulate job transitions for testing resilience.
   */
  static async simulateJob(jobId: string, userId: string) {
    if (process.env.NODE_ENV === 'production') return;

    try {
      // 1. Move to processing after 3s
      await new Promise(resolve => setTimeout(resolve, 3000));
      await this.updateJobStatus(jobId, 'processing');

      // 2. Move to completed after another 10s
      await new Promise(resolve => setTimeout(resolve, 10000));
      await this.updateJobStatus(jobId, 'completed', { 
        result: { 
          message: 'Simulation completed successfully',
          timestamp: new Date().toISOString()
        } 
      });
    } catch (err) {
      await this.updateJobStatus(jobId, 'failed', { 
        error: err instanceof Error ? err.message : 'Simulation failed' 
      });
    }
  }
}
