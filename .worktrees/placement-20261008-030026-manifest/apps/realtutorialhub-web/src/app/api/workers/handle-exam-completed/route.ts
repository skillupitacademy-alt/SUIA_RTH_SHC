import { SignatureError } from '@upstash/qstash'
import { NextResponse } from 'next/server'
import { z, ZodError } from 'zod'

import { createQStashHandler, PlatformEventTypes } from '@quiz/events'

import { logger } from '@/lib/logger'
import { ExamCompletedSaga } from '../../../../server/sagas/exam-completed.saga'

export const dynamic = 'force-dynamic'

const WeakSubtopicSchema = z.object({
  subtopicId: z.string().uuid(),
  subtopicName: z.string().min(1),
  score: z.number().min(0).max(100),
  threshold: z.number().default(60),
})

const ExamCompletedPayloadSchema = z.object({
  userId: z.string().uuid(),
  examResultId: z.string().uuid(),
  weakSubtopics: z.array(WeakSubtopicSchema),
})

const ExamCompletedEnvelopeSchema = z.object({
  id: z.string().uuid(),
  type: z.literal(PlatformEventTypes.EXAM_COMPLETED),
  correlationId: z.string().uuid(),
  source: z.string().min(1),
  occurredAt: z.string().datetime({ offset: true }),
  version: z.number().int().positive(),
  data: ExamCompletedPayloadSchema,
})

const saga = new ExamCompletedSaga()

const handler = createQStashHandler(
  PlatformEventTypes.EXAM_COMPLETED,
  async (envelope: unknown) => {
    const parsed = ExamCompletedEnvelopeSchema.parse(envelope)
    await saga.execute(parsed.data)
    return new Response('ok', { status: 200 })
  },
  {
    schema: ExamCompletedEnvelopeSchema,
  }
)

export async function POST(req: Request): Promise<Response> {
  try {
    return await handler(req)
  } catch (error) {
    if (error instanceof SignatureError || (error instanceof Error && error.name === 'SignatureError')) {
      return new Response('Unauthorized', { status: 401 })
    }

    if (error instanceof ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid payload' }, { status: 400 })
    }

    logger.error({
      event: 'remediation.worker_crashed',
      error: error instanceof Error ? error.message : String(error),
    })

    return new Response('error', { status: 500 })
  }
}
