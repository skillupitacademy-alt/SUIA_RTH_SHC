import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm'
import { Redis } from '@upstash/redis'

import {
  db,
  remediationTriggers,
  STANDARD_QUERY_TIMEOUT,
  tutorialProgress,
  withTimeout,
} from '@quiz/db-tutorial'
import type {
  RemediationPlanResponse,
  RemediationWeakSubtopicInput,
  RemediationWeakSubtopicProgress,
} from '@quiz/types'

import { logger } from '@/lib/logger'

type DbClient = typeof db
type RemediationTriggerRow = typeof remediationTriggers.$inferSelect
type TutorialProgressRow = typeof tutorialProgress.$inferSelect

type RedisLike = {
  get(key: string): Promise<string | null> | string | null
  set(key: string, value: string, options?: { ex?: number; nx?: boolean }): Promise<unknown> | unknown
  del(key: string): Promise<unknown> | unknown
}

export interface RemediationServiceDependencies {
  dbClient?: DbClient
  getRedis?: () => RedisLike
  logger?: typeof logger
  now?: () => Date
}

const createRedisClient = (): RedisLike => {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (
    typeof url !== 'string' || url.trim().length === 0 ||
    typeof token !== 'string' || token.trim().length === 0
  ) {
    throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required')
  }

  return new Redis({ url, token })
}

const uniqueStrings = (values: string[]) => Array.from(new Set(values.filter((value) => value.trim().length > 0)))

const buildRecommendations = (weakSubtopics: RemediationWeakSubtopicInput[]) =>
  uniqueStrings(
    weakSubtopics.flatMap((subtopic) => {
      if (subtopic.score < subtopic.threshold - 20) {
        return ['notes', 'layman']
      }

      if (subtopic.score < subtopic.threshold) {
        return ['technical', 'code']
      }

      return ['ai_tutor']
    })
  )

const toProgressStatus = (row: TutorialProgressRow | undefined): RemediationWeakSubtopicProgress['progress'] => {
  if (row === undefined) return 'not_started'
  return row.status === 'completed' ? 'completed' : row.status === 'in_progress' ? 'in_progress' : 'not_started'
}

const toPlanStatus = (row: RemediationTriggerRow, completedCount: number): 'pending' | 'in_progress' | 'completed' => {
  if (row.status === 'completed') return 'completed'
  if (completedCount > 0) return 'in_progress'
  return 'pending'
}

export class RemediationService {
  private readonly dbClient: DbClient

  private readonly getRedis: () => RedisLike

  private readonly log: typeof logger

  private readonly now: () => Date

  constructor(dependencies: RemediationServiceDependencies = {}) {
    this.dbClient = dependencies.dbClient ?? db
    this.getRedis = dependencies.getRedis ?? createRedisClient
    this.log = dependencies.logger ?? logger
    this.now = dependencies.now ?? (() => new Date())
  }

  private async getTrigger(userId: string, examResultId: string): Promise<RemediationTriggerRow | undefined> {
    const rows = await withTimeout(
      this.dbClient
        .select()
        .from(remediationTriggers)
        .where(
          and(
            eq(remediationTriggers.userId, userId),
            eq(remediationTriggers.examResultId, examResultId),
            isNull(remediationTriggers.deletedAt)
          )
        )
        .orderBy(desc(remediationTriggers.createdAt))
        .limit(1),
      STANDARD_QUERY_TIMEOUT,
      'RemediationService.getTrigger'
    )

    return rows[0] as RemediationTriggerRow | undefined
  }

  private async getProgressRows(userId: string, subtopicIds: string[]): Promise<TutorialProgressRow[]> {
    if (subtopicIds.length === 0) return []

    const rows = await withTimeout(
      this.dbClient
        .select()
        .from(tutorialProgress)
        .where(
          and(
            eq(tutorialProgress.userId, userId),
            inArray(tutorialProgress.subtopicId, subtopicIds),
            isNull(tutorialProgress.deletedAt)
          )
        ),
      STANDARD_QUERY_TIMEOUT,
      'RemediationService.getProgressRows'
    )

    return rows as TutorialProgressRow[]
  }

  private toPlanResponse(
    trigger: RemediationTriggerRow,
    progressRows: TutorialProgressRow[]
  ): RemediationPlanResponse {
    const progressBySubtopic = new Map(progressRows.map((row) => [row.subtopicId, row]))
    const sourceWeakSubtopics = trigger.weakSubtopics.length > 0
      ? trigger.weakSubtopics
      : trigger.weakSubtopicIds.map((subtopicId) => ({
          subtopicId,
          subtopicName: subtopicId,
          score: 0,
          threshold: 60,
        }))

    const weakSubtopics = sourceWeakSubtopics.map((item) => ({
      ...item,
      progress: toProgressStatus(progressBySubtopic.get(item.subtopicId)),
    }))

    const completed = weakSubtopics.filter((item) => item.progress === 'completed').length
    const status = toPlanStatus(trigger, completed)

    return {
      examResultId: trigger.examResultId,
      weakSubtopics,
      recommendations: trigger.recommendedContentTypes.length > 0
        ? trigger.recommendedContentTypes
        : buildRecommendations(trigger.weakSubtopics.length > 0 ? trigger.weakSubtopics : sourceWeakSubtopics),
      overallProgress: {
        completed,
        total: weakSubtopics.length,
      },
      status,
    }
  }

  async createPlan(
    userId: string,
    examResultId: string,
    weakSubtopics: RemediationWeakSubtopicInput[]
  ): Promise<RemediationPlanResponse> {
    const redis = this.getRedis()
    const redisKey = `remediation:${examResultId}`

    const existingMarker = await redis.get(redisKey)
    if (existingMarker !== null && String(existingMarker).trim().length > 0) {
      const existingPlan = await this.getPlan(userId, examResultId)
      if (existingPlan !== undefined) return existingPlan
    }

    const claimed = await redis.set(redisKey, 'processing', { ex: 86_400, nx: true })
    if (claimed == null || claimed === false) {
      const existingPlan = await this.getPlan(userId, examResultId)
      if (existingPlan !== undefined) return existingPlan
    }

    try {
      await this.dbClient.transaction(async (tx) => {
        const now = this.now()
        const weakSubtopicIds = weakSubtopics.map((item) => item.subtopicId)
        const recommendedContentTypes = buildRecommendations(weakSubtopics)

        const existingRows = await withTimeout(
          tx
            .select()
            .from(remediationTriggers)
            .where(
              and(
                eq(remediationTriggers.userId, userId),
                eq(remediationTriggers.examResultId, examResultId),
                isNull(remediationTriggers.deletedAt)
              )
            )
            .limit(1),
          STANDARD_QUERY_TIMEOUT,
          'RemediationService.createPlan.selectTrigger'
        )

        if (existingRows.length === 0) {
          await withTimeout(
            tx
              .insert(remediationTriggers)
              .values({
                examResultId,
                userId,
                weakSubtopics,
                weakSubtopicIds,
                recommendedContentTypes,
                status: 'pending',
                createdAt: now,
                updatedAt: now,
                deletedAt: null,
              })
              .returning(),
            STANDARD_QUERY_TIMEOUT,
            'RemediationService.createPlan.insertTrigger'
          )
        } else {
          await withTimeout(
            tx
              .update(remediationTriggers)
              .set({
                weakSubtopics,
                weakSubtopicIds,
                recommendedContentTypes,
                status: 'pending',
                updatedAt: now,
                deletedAt: null,
              })
              .where(eq(remediationTriggers.id, existingRows[0].id))
              .returning(),
            STANDARD_QUERY_TIMEOUT,
            'RemediationService.createPlan.updateTrigger'
          )
        }

        if (weakSubtopicIds.length > 0) {
          await withTimeout(
            tx
              .insert(tutorialProgress)
              .values(
                weakSubtopics.map((item) => ({
                  userId,
                  subtopicId: item.subtopicId,
                  status: 'not_started' as const,
                  blocksCompleted: [] as string[],
                  remediationTriggered: true as const,
                  score: null,
                  timeSpentSec: 0,
                  completedAt: null,
                  version: 1,
                  createdAt: now,
                  updatedAt: now,
                  deletedAt: null,
                }))
              )
              .onConflictDoUpdate({
                target: [tutorialProgress.userId, tutorialProgress.subtopicId],
                set: {
                  status: 'not_started',
                  blocksCompleted: [],
                  remediationTriggered: true,
                  score: null,
                  timeSpentSec: 0,
                  completedAt: null,
                  version: sql`${tutorialProgress.version} + 1`,
                  updatedAt: now,
                  deletedAt: null,
                },
              })
              .returning(),
            STANDARD_QUERY_TIMEOUT,
            'RemediationService.createPlan.upsertProgress'
          )
        }
      })

      await redis.set(redisKey, 'processed', { ex: 86_400 })

      const recommendedContentTypes = buildRecommendations(weakSubtopics)
      return {
        examResultId,
        weakSubtopics: weakSubtopics.map((item) => ({
          ...item,
          progress: 'not_started' as const,
        })),
        recommendations: recommendedContentTypes,
        overallProgress: {
          completed: 0,
          total: weakSubtopics.length,
        },
        status: 'pending' as const,
      }
    } catch (error) {
      await Promise.resolve(redis.del(redisKey)).catch(() => undefined)
      this.log.error({
        event: 'remediation.plan_failed',
        userId,
        examResultId,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async markFailed(userId: string, examResultId: string, weakSubtopics: RemediationWeakSubtopicInput[]): Promise<void> {
    const existing = await this.getTrigger(userId, examResultId)
    const now = this.now()
    const weakSubtopicIds = weakSubtopics.map((item) => item.subtopicId)
    const recommendedContentTypes = buildRecommendations(weakSubtopics)

    if (existing === undefined) {
      await withTimeout(
        this.dbClient
          .insert(remediationTriggers)
          .values({
            examResultId,
            userId,
            weakSubtopics,
            weakSubtopicIds,
            recommendedContentTypes,
            status: 'failed',
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
          })
          .returning(),
        STANDARD_QUERY_TIMEOUT,
        'RemediationService.markFailed.insert'
      )
      return
    }

    await withTimeout(
      this.dbClient
        .update(remediationTriggers)
        .set({
          weakSubtopics,
          weakSubtopicIds,
          recommendedContentTypes,
          status: 'failed',
          updatedAt: now,
        })
        .where(eq(remediationTriggers.id, existing.id))
        .returning(),
      STANDARD_QUERY_TIMEOUT,
      'RemediationService.markFailed.update'
    )
  }

  async getPlan(userId: string, examResultId: string): Promise<RemediationPlanResponse | undefined> {
    const trigger = await this.getTrigger(userId, examResultId)
    if (trigger === undefined) return undefined

    const progressRows = await this.getProgressRows(userId, trigger.weakSubtopicIds)
    return this.toPlanResponse(trigger, progressRows)
  }

  async markSubtopicRemediated(userId: string, subtopicId: string): Promise<RemediationPlanResponse | undefined> {
    const triggers = await withTimeout(
      this.dbClient
        .select()
        .from(remediationTriggers)
        .where(and(eq(remediationTriggers.userId, userId), isNull(remediationTriggers.deletedAt))),
      STANDARD_QUERY_TIMEOUT,
      'RemediationService.markSubtopicRemediated.selectTriggers'
    ) as RemediationTriggerRow[]

    const matchingTriggers = triggers.filter((trigger) => trigger.weakSubtopicIds.includes(subtopicId) && trigger.status !== 'completed')
    if (matchingTriggers.length === 0) return undefined

    const now = this.now()
    let lastPlan: RemediationPlanResponse | undefined

    await this.dbClient.transaction(async (tx) => {
      await withTimeout(
        tx
          .update(tutorialProgress)
          .set({
            status: 'completed',
            completedAt: now,
            remediationTriggered: true,
            version: sql`${tutorialProgress.version} + 1`,
            updatedAt: now,
          })
          .where(and(eq(tutorialProgress.userId, userId), eq(tutorialProgress.subtopicId, subtopicId), isNull(tutorialProgress.deletedAt)))
          .returning(),
        STANDARD_QUERY_TIMEOUT,
        'RemediationService.markSubtopicRemediated.updateProgress'
      )

      for (const trigger of matchingTriggers) {
        const progressRows = await withTimeout(
          tx
            .select()
            .from(tutorialProgress)
            .where(
              and(
                eq(tutorialProgress.userId, userId),
                inArray(tutorialProgress.subtopicId, trigger.weakSubtopicIds),
                isNull(tutorialProgress.deletedAt)
              )
            ),
          STANDARD_QUERY_TIMEOUT,
          'RemediationService.markSubtopicRemediated.selectProgress'
        ) as TutorialProgressRow[]

        const completed = progressRows.filter((row) => row.status === 'completed').length
        if (trigger.weakSubtopicIds.length > 0 && completed === trigger.weakSubtopicIds.length) {
          await withTimeout(
            tx
              .update(remediationTriggers)
              .set({
                status: 'completed',
                updatedAt: now,
              })
              .where(eq(remediationTriggers.id, trigger.id))
              .returning(),
            STANDARD_QUERY_TIMEOUT,
            'RemediationService.markSubtopicRemediated.completeTrigger'
          )
        }

        lastPlan = this.toPlanResponse({
          ...trigger,
          status: completed === trigger.weakSubtopicIds.length ? 'completed' : trigger.status,
        }, progressRows)
      }
    })

    return lastPlan
  }

  async getStudentRemediationHistory(userId: string): Promise<RemediationPlanResponse[]> {
    const triggers = await withTimeout(
      this.dbClient
        .select()
        .from(remediationTriggers)
        .where(and(eq(remediationTriggers.userId, userId), isNull(remediationTriggers.deletedAt)))
        .orderBy(desc(remediationTriggers.createdAt)),
      STANDARD_QUERY_TIMEOUT,
      'RemediationService.getStudentRemediationHistory'
    ) as RemediationTriggerRow[]

    const plans: RemediationPlanResponse[] = []
    for (const trigger of triggers) {
      const progressRows = await this.getProgressRows(userId, trigger.weakSubtopicIds)
      plans.push(this.toPlanResponse(trigger, progressRows))
    }

    return plans
  }
}
