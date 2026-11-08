import { SignatureError } from '@upstash/qstash'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { z, ZodError } from 'zod'

import { db, STANDARD_QUERY_TIMEOUT, withTimeout } from '@quiz/db-tutorial'

import { logger } from '@/lib/logger'
import { verifyQStashRequest } from '../qstash'
import {
  acquireWorkerLease,
  completeWorkerLeaseIfOwner,
  releaseWorkerLeaseIfOwner,
  type WorkerRedisLike,
} from '../worker-lease'

export const dynamic = 'force-dynamic'

const RefreshPayloadSchema = z.object({
  userId: z.string().uuid(),
})

type RedisLike = WorkerRedisLike

const createRedisClient = (): RedisLike => {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (
    typeof url !== 'string' || url.trim().length === 0 ||
    typeof token !== 'string' || token.trim().length === 0
  ) {
    throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required')
  }

  return new Redis({ url, token }) as unknown as RedisLike
}

export async function POST(req: Request): Promise<Response> {
  const redis = createRedisClient()
  try {
    const body = await verifyQStashRequest(req)
    const payload = RefreshPayloadSchema.parse(JSON.parse(body))
    const redisKey = `view-refresh:${payload.userId}`

    const claim = await acquireWorkerLease(redis, redisKey, {
      leaseSeconds: 60,
      pendingPrefix: 'processing',
    })
    if (claim.kind !== 'acquired') {
      return new Response('ok', { status: 200 })
    }

    try {
      await withTimeout(
        db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_student_weak_areas`),
        STANDARD_QUERY_TIMEOUT,
        'refresh-weak-areas-view.refresh'
      )

      const completionTransition = await completeWorkerLeaseIfOwner(
        redis,
        redisKey,
        claim.pendingValue,
        'processed',
        60
      )
      if (completionTransition !== 'applied') {
        return new Response('Event lease ownership lost before completion', { status: 409 })
      }

      logger.info({
        event: 'mv.refreshed',
        userId: payload.userId,
      })

      return new Response('ok', { status: 200 })
    } catch (error) {
      await releaseWorkerLeaseIfOwner(redis, redisKey, claim.pendingValue).catch(() => undefined)
      throw error
    }
  } catch (error) {
    if (error instanceof SignatureError || (error instanceof Error && error.name === 'SignatureError')) {
      return new Response('Unauthorized', { status: 401 })
    }

    if (error instanceof ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid payload' }, { status: 400 })
    }

    logger.error({
      event: 'mv.refresh_failed',
      error: error instanceof Error ? error.message : String(error),
    })

    return new Response('error', { status: 500 })
  }
}
