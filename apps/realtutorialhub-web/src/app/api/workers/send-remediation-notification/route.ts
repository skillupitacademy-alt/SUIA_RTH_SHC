import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { SignatureError } from '@upstash/qstash';

import { createQStashHandler, PlatformEventTypes } from '@quiz/events';

import { logger } from '@/lib/logger';

const WeakSubtopicSchema = z.object({
  subtopicId: z.string().uuid(),
  subtopicName: z.string().min(1),
  score: z.number().min(0).max(100),
  threshold: z.number().default(60),
});

const RemediationNotificationPayloadSchema = z.object({
  userId: z.string().uuid(),
  examResultId: z.string().uuid(),
  weakSubtopics: z.array(WeakSubtopicSchema),
});

const RemediationNotificationEnvelopeSchema = z.object({
  id: z.string().uuid(),
  type: z.enum([PlatformEventTypes.EXAM_COMPLETED, 'remediation.notification_requested']),
  correlationId: z.string().uuid(),
  source: z.string().min(1),
  occurredAt: z.string().datetime({ offset: true }),
  version: z.number().int().positive(),
  data: RemediationNotificationPayloadSchema,
});

const RemediationNotificationSchema = z.union([
  RemediationNotificationPayloadSchema,
  RemediationNotificationEnvelopeSchema,
]);

type RemediationNotificationPayload = z.infer<typeof RemediationNotificationPayloadSchema>;

const notificationHandler = createQStashHandler(
  PlatformEventTypes.EXAM_COMPLETED,
  async (payload: unknown) => {
    const raw = payload as Record<string, unknown>;
    const resolved: RemediationNotificationPayload =
      raw !== null && typeof raw === 'object' && 'data' in raw && raw.data !== null && typeof raw.data === 'object'
        ? (raw.data as RemediationNotificationPayload)
        : (raw as RemediationNotificationPayload);
    const { userId, examResultId, weakSubtopics } = resolved;

    logger.info({
      event: 'remediation.notification.received',
      userId,
      examResultId,
      weakCount: weakSubtopics.length,
    });

    return new Response('ok', { status: 200 });
  },
  {
    schema: RemediationNotificationSchema,
    allowedTypes: ['remediation.notification_requested'],
  }
);

export async function POST(req: Request): Promise<Response> {
  try {
    return await notificationHandler(req);
  } catch (error) {
    if (error instanceof SignatureError || (error instanceof Error && error.name === 'SignatureError')) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    logger.error({
      event: 'remediation.notification_failed',
      error: error instanceof Error ? error.message : String(error),
    });

    return new Response('error', { status: 500 });
  }
}
