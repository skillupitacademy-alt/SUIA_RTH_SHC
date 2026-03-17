import { redis } from '@/lib/redis';

export async function acquireJobLock(
  jobId: string,
  ttlSeconds: number = 300
): Promise<boolean> {
  const result = await redis.set(`job-lock:${jobId}`, '1', { nx: true, ex: ttlSeconds });
  return result === 'OK';
}

export async function releaseJobLock(jobId: string): Promise<void> {
  await redis.del(`job-lock:${jobId}`);
}
