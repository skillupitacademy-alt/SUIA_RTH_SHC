import { Client } from '@upstash/qstash'

import type { RemediationWeakSubtopicInput, RemediationPlanResponse } from '@quiz/types'

import { logger } from '@/lib/logger'
import { RemediationService } from '../remediation.service'

type QStashLike = {
  publishJSON(args: { url: string; body: unknown; headers?: Record<string, string>; retries?: number }): Promise<unknown>
}

export interface ExamCompletedSagaPayload {
  userId: string
  examResultId: string
  weakSubtopics: RemediationWeakSubtopicInput[]
}

export interface ExamCompletedSagaDependencies {
  remediationService?: RemediationService
  getQStash?: () => QStashLike
  logger?: typeof logger
  appUrl?: string
}

const getAppUrl = () => {
  const publicUrl = process.env.NEXT_PUBLIC_APP_URL
  const internalUrl = process.env.INTERNAL_API_URL
  if (typeof publicUrl === 'string' && publicUrl.trim().length > 0) return publicUrl.trim()
  if (typeof internalUrl === 'string' && internalUrl.trim().length > 0) return internalUrl.trim()
  return 'https://user.realtutorialhub.com'
}

const getQStashClient = (): QStashLike => {
  const token = process.env.QSTASH_TOKEN
  if (typeof token !== 'string' || token.trim().length === 0) {
    throw new Error('QSTASH_TOKEN is required for remediation workflows')
  }

  return new Client({ token })
}

const buildWorkerUrl = (appUrl: string, path: string) => new URL(path, appUrl).toString()

export class ExamCompletedSaga {
  private readonly remediationService: RemediationService

  private readonly getQStash: () => QStashLike

  private readonly log: typeof logger

  private readonly appUrl: string

  constructor(dependencies: ExamCompletedSagaDependencies = {}) {
    this.remediationService = dependencies.remediationService ?? new RemediationService()
    this.getQStash = dependencies.getQStash ?? getQStashClient
    this.log = dependencies.logger ?? logger
    this.appUrl = dependencies.appUrl ?? getAppUrl()
  }

  async execute(payload: ExamCompletedSagaPayload): Promise<RemediationPlanResponse> {
    try {
      const plan = await this.remediationService.createPlan(
        payload.userId,
        payload.examResultId,
        payload.weakSubtopics
      )

      try {
        await this.getQStash().publishJSON({
          url: buildWorkerUrl(this.appUrl, '/api/workers/refresh-weak-areas-view'),
          body: { userId: payload.userId },
          retries: 1,
        })
      } catch (error) {
        this.log.warn({
          event: 'remediation.view_refresh_best_effort_failed',
          userId: payload.userId,
          examResultId: payload.examResultId,
          error: error instanceof Error ? error.message : String(error),
        })
      }

      await this.getQStash().publishJSON({
        url: buildWorkerUrl(this.appUrl, '/api/workers/send-remediation-notification'),
        body: {
          userId: payload.userId,
          examResultId: payload.examResultId,
          weakSubtopics: payload.weakSubtopics,
        },
        retries: 3,
      })

      return plan
    } catch (error) {
      try {
        await this.remediationService.markFailed(payload.userId, payload.examResultId, payload.weakSubtopics)
      } catch (markError) {
        this.log.warn({
          event: 'remediation.plan_failed_mark_failed',
          userId: payload.userId,
          examResultId: payload.examResultId,
          error: markError instanceof Error ? markError.message : String(markError),
        })
      }

      this.log.error({
        event: 'remediation.plan_failed',
        userId: payload.userId,
        examResultId: payload.examResultId,
        error: error instanceof Error ? error.message : String(error),
      })

      throw error
    }
  }
}
