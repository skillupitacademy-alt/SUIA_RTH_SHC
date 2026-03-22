import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';

import { logger } from '@/lib/logger';

import { verifyQStashRequest } from '../qstash';

export const dynamic = 'force-dynamic';

const schema = z.object({
  requestId: z.string().uuid(),
  studentId: z.string().uuid(),
  facultyId: z.string().uuid(),
  subtopicId: z.string().uuid(),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await verifyQStashRequest(request);
    const payload = schema.parse(JSON.parse(body));

    logger.info({
      event: 'session.accepted.notify',
      studentId: payload.studentId,
      requestId: payload.requestId,
      facultyId: payload.facultyId,
      subtopicId: payload.subtopicId,
    });

    return new Response('ok', { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.name === 'SignatureError') {
      return new Response('Unauthorized', { status: 401 });
    }
    if (error instanceof SyntaxError || error instanceof ZodError) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid payload' }, { status: 400 });
    }

    logger.error({
      event: 'session.accepted.notify_failed',
      error: error instanceof Error ? error.message : String(error),
    });
    return new Response('error', { status: 500 });
  }
}
