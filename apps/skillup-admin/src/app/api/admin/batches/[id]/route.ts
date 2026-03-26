import { NextRequest } from 'next/server';
import { z } from 'zod';
import { and, eq, isNull } from 'drizzle-orm';

import { jsonData, jsonError, parseJsonOrFormBody, requireAdminOrForbidden } from '@/lib/admin-bff';
import { batches, db, faculty, userProfiles, users } from '@quiz/db-people';
import { getAdminBatchDetail } from '@/lib/skillup-admin-data';

const batchSchema = z.object({
  name: z.string().min(2),
  facultyName: z.string().min(2),
  capacity: z.coerce.number().int().positive(),
  startDate: z.string().min(4),
  status: z.enum(['upcoming', 'active', 'paused', 'completed', 'cancelled']),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function resolveFacultyId(facultyName: string): Promise<string | null> {
  const [match] = await db
    .select({ id: faculty.id })
    .from(faculty)
    .leftJoin(users, eq(users.id, faculty.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(and(eq(userProfiles.name, facultyName), isNull(faculty.deletedAt)))
    .limit(1);

  return match?.id ?? null;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;

  const { id } = await context.params;
  const existing = await getAdminBatchDetail(id);
  if (existing === undefined) {
    return jsonError('Batch not found', 404);
  }

  const parsed = await parseJsonOrFormBody(request, batchSchema);
  if (!parsed.ok) return parsed.response;

  const [currentBatch] = await db
    .select({ facultyId: batches.facultyId })
    .from(batches)
    .where(eq(batches.id, id))
    .limit(1);

  const facultyId = await resolveFacultyId(parsed.data.facultyName);

  await db
    .update(batches)
    .set({
      name: parsed.data.name,
      facultyId: facultyId ?? currentBatch?.facultyId ?? null,
      capacity: parsed.data.capacity,
      startDate: parsed.data.startDate,
      status: parsed.data.status,
      deletedAt: null,
    })
    .where(eq(batches.id, id));

  const detail = await getAdminBatchDetail(id);
  if (detail === undefined) {
    return jsonError('Batch not found', 404);
  }

  return jsonData({ updated: true, detail }, 200);
}
