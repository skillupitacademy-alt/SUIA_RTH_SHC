import { NextRequest } from 'next/server';
import { z } from 'zod';
import { and, eq, isNull } from 'drizzle-orm';

import { jsonData, parseJsonOrFormBody, requireAdminOrForbidden } from '@/lib/admin-bff';
import { listAdminBatches } from '@/lib/skillup-admin-data';
import { batches, faculty, userProfiles, users, db } from '@quiz/db-people';

const createBatchSchema = z.object({
  name: z.string().min(2),
  facultyName: z.string().min(2),
  program: z.string().min(2),
  capacity: z.coerce.number().int().positive(),
  startDate: z.string().min(4),
  sessionTopic: z.string().min(2),
});

export async function GET(request: NextRequest) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;
  return jsonData(await listAdminBatches(), 200);
}

export async function POST(request: NextRequest) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;

  const parsed = await parseJsonOrFormBody(request, createBatchSchema);
  if (!parsed.ok) return parsed.response;

  const facultyMatch = await db
    .select({ id: faculty.id })
    .from(faculty)
    .leftJoin(users, eq(users.id, faculty.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(and(eq(userProfiles.name, parsed.data.facultyName), isNull(faculty.deletedAt)))
    .limit(1);

  const [created] = await db
    .insert(batches)
    .values({
      name: parsed.data.name,
      facultyId: facultyMatch[0]?.id ?? null,
      capacity: parsed.data.capacity,
      enrolledCount: 0,
      mode: 'hybrid',
      status: 'upcoming',
      startDate: parsed.data.startDate,
      deletedAt: null,
    })
    .returning({ id: batches.id, name: batches.name });

  return jsonData(
    {
      id: created.id,
      name: created.name,
      studentCount: 0,
      nextSessionAt: parsed.data.startDate,
      facultyName: parsed.data.facultyName,
      program: parsed.data.program,
      sessionTopic: parsed.data.sessionTopic,
    },
    201
  );
}
