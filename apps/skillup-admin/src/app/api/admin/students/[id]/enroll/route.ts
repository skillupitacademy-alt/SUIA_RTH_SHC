import { NextRequest } from 'next/server';

import { PlatformEventTypes, publishEvent } from '@quiz/events';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { and, eq, isNull, sql } from 'drizzle-orm';

import { jsonData, jsonError, requireAdminOrForbidden } from '@/lib/admin-bff';
import { getAdminStudentDetail } from '@/lib/skillup-admin-data';
import { admissions, batchEnrollments, batches, db, users } from '@quiz/db-people';

const enrollSchema = z.object({
  batchId: z.string().min(1).optional(),
  domainId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;

  const { id } = await context.params;
  const student = await getAdminStudentDetail(id);
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

  const batchId = parsed.data.batchId ?? student.batchId;
  const passwordHash = await bcrypt.hash('SkillUp@2025', 10);

  await db.transaction(async (tx) => {
    const [existingUser] = await tx.select({ id: users.id }).from(users).where(eq(users.id, student.userId)).limit(1);
    if (existingUser === undefined) {
      await tx.insert(users).values({
        id: student.userId,
        email: student.email,
        passwordHash,
        role: 'student',
        platform: 'skillup',
        isActive: true,
        deletedAt: null,
      });
    }

    if (student.enquiryId !== null) {
      const [existingAdmission] = await tx.select({ id: admissions.id }).from(admissions).where(eq(admissions.studentUserId, student.userId)).limit(1);
      if (existingAdmission === undefined) {
        await tx.insert(admissions).values({
          enquiryId: student.enquiryId,
          studentUserId: student.userId,
          admissionType: 'training',
          batchId,
          status: 'approved',
          documents: {},
        });
      } else {
        await tx
          .update(admissions)
          .set({
            batchId,
            status: 'approved',
            updatedAt: new Date(),
          })
          .where(eq(admissions.studentUserId, student.userId));
      }
    }

    const [existingEnrollment] = await tx
      .select({ id: batchEnrollments.id })
      .from(batchEnrollments)
      .where(and(eq(batchEnrollments.batchId, batchId), eq(batchEnrollments.studentUserId, student.userId), isNull(batchEnrollments.deletedAt)))
      .limit(1);

    if (existingEnrollment === undefined) {
      await tx.insert(batchEnrollments).values({
        batchId,
        studentUserId: student.userId,
        status: 'active',
      });

      await tx
        .update(batches)
        .set({ enrolledCount: sql`${batches.enrolledCount} + 1` })
        .where(eq(batches.id, batchId));
    }
  });

  const payload = {
    userId: student.userId,
    batchId,
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
      ...(await getAdminStudentDetail(id)),
      enrollmentStage: 'enrolled',
      enrollment: payload,
    },
    200
  );
}
