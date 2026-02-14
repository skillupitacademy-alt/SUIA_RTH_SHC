import { db, backgroundJobs } from '@quiz/db';
import { eq, and } from 'drizzle-orm';

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

  static async updateJobStatus(
    jobId: string, 
    status: 'pending' | 'processing' | 'completed' | 'failed',
    data?: { result?: Record<string, unknown>; error?: string }
  ) {
    const updateData: Partial<typeof backgroundJobs.$inferInsert> = {
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
}
