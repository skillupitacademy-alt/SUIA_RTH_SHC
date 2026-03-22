import { NextRequest } from 'next/server';

import { PlatformEventTypes, publishEvent } from '@quiz/events';
import { z } from 'zod';

import { findAdminStudent, skillupDomainId } from '@/lib/admin-demo-data';
import { jsonData, jsonError, requireAdminOrForbidden } from '@/lib/admin-bff';

const enrollSchema = z.object({
  batchId: z.string().min(1).optional(),
  domainId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;

  const { id } = await context.params;
  const student = findAdminStudent(id);
  if (student === undefined) {
    return jsonError('Student not found', 404);
  }

  const contentType = request.headers.get('content-type') ?? '';
  const parsed = contentType.includes('application/json')
    ? enrollSchema.safeParse(await request.json().catch(() => ({})))
    : enrollSchema.safeParse(Object.fromEntries((await request.formData().catch(() => null))?.entries() ?? []));
  if (!parsed.success) {
    return jsonError('Invalid payload', 400, { issues: parsed.error.issues });
  }

  const payload = {
    userId: student.userId,
    domainId: parsed.data.domainId ?? skillupDomainId,
    batchId: parsed.data.batchId ?? student.batchId,
    enrollmentType: 'batch' as const,
    enrolledAt: new Date().toISOString(),
  };

  try {
    await publishEvent(PlatformEventTypes.STUDENT_ENROLLED, payload, {
      destinationUrl: process.env.SKILLUP_EVENT_URL ?? 'https://placeholder.invalid/events/student-enrolled',
    });
  } catch {
    // Demo mode should not block local rendering when QStash is unavailable.
  }

  return jsonData(
    {
      ...student,
      enrollmentStage: 'enrolled',
      enrollment: payload,
    },
    200
  );
}
