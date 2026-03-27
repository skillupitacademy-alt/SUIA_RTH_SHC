import { NextRequest } from 'next/server';
import { z } from 'zod';
import { and, eq, isNull, sql } from 'drizzle-orm';

import { getAdminStudentDetail } from '@/lib/skillup-admin-data';
import { jsonData, jsonError, parseJsonOrFormBody, requireAdminOrForbidden } from '@/lib/admin-bff';
import { admissions, batchCapacityService, batchEnrollments, batches, db, enquiries, userProfiles, users } from '@quiz/db-people';

const updateStudentSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  batchId: z.string().min(1),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;

  const { id } = await context.params;
  const student = await getAdminStudentDetail(id);
  if (student === undefined) {
    return jsonError('Student not found', 404);
  }

  return jsonData(student, 200);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;

  const { id } = await context.params;
  const student = await getAdminStudentDetail(id);
  if (student === undefined) {
    return jsonError('Student not found', 404);
  }

  const parsed = await parseJsonOrFormBody(request, updateStudentSchema);
  if (!parsed.ok) return parsed.response;

  const nextBatchId = parsed.data.batchId;
  const currentBatchId = student.batchId;
  const needsReservation = currentBatchId !== nextBatchId;
  let reservationHeld = false;

  if (needsReservation) {
    reservationHeld = await batchCapacityService.reserveSlot(nextBatchId);
    if (!reservationHeld) {
      return jsonError('Batch is full', 409);
    }
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          email: parsed.data.email,
          updatedAt: new Date(),
          version: sql`${users.version} + 1`,
        })
        .where(eq(users.id, student.userId));

      const [profile] = await tx.select({ id: userProfiles.id }).from(userProfiles).where(eq(userProfiles.userId, student.userId)).limit(1);
      if (profile === undefined) {
        await tx.insert(userProfiles).values({
          userId: student.userId,
          name: parsed.data.name,
        });
      } else {
        await tx
          .update(userProfiles)
          .set({
            name: parsed.data.name,
            updatedAt: new Date(),
          })
          .where(eq(userProfiles.userId, student.userId));
      }

      if (student.enquiryId !== null) {
        await tx
          .update(enquiries)
          .set({
            fullName: parsed.data.name,
            email: parsed.data.email,
            updatedAt: new Date(),
          })
          .where(eq(enquiries.id, student.enquiryId));
      }

      const [existingAdmission] = await tx.select({ id: admissions.id }).from(admissions).where(eq(admissions.studentUserId, student.userId)).limit(1);
      if (existingAdmission === undefined) {
        if (student.enquiryId !== null) {
          await tx.insert(admissions).values({
            enquiryId: student.enquiryId,
            studentUserId: student.userId,
            admissionType: 'training',
            batchId: nextBatchId,
            status: 'approved',
            documents: {},
          });
        }
      } else {
        await tx
          .update(admissions)
          .set({
            batchId: nextBatchId,
            status: 'approved',
            updatedAt: new Date(),
          })
          .where(eq(admissions.studentUserId, student.userId));
      }

      const [existingEnrollment] = await tx
        .select({ id: batchEnrollments.id, batchId: batchEnrollments.batchId })
        .from(batchEnrollments)
        .where(and(eq(batchEnrollments.studentUserId, student.userId), isNull(batchEnrollments.deletedAt)))
        .limit(1);

      if (existingEnrollment === undefined) {
        await tx.insert(batchEnrollments).values({
          batchId: nextBatchId,
          studentUserId: student.userId,
          status: 'active',
        });
        await tx
          .update(batches)
          .set({ enrolledCount: sql`${batches.enrolledCount} + 1` })
          .where(eq(batches.id, nextBatchId));
      } else if (existingEnrollment.batchId !== nextBatchId) {
        await tx
          .update(batchEnrollments)
          .set({
            batchId: nextBatchId,
            status: 'active',
            droppedAt: null,
            deletedAt: null,
          })
          .where(eq(batchEnrollments.id, existingEnrollment.id));

        await tx
          .update(batches)
          .set({ enrolledCount: sql`${batches.enrolledCount} + 1` })
          .where(eq(batches.id, nextBatchId));

        await tx
          .update(batches)
          .set({ enrolledCount: sql`GREATEST(${batches.enrolledCount} - 1, 0)` })
          .where(eq(batches.id, existingEnrollment.batchId));
      }
    });
  } catch (error) {
    if (reservationHeld) {
      await batchCapacityService.releaseSlot(nextBatchId).catch(() => undefined);
    }
    return jsonError(error instanceof Error ? error.message : 'Failed to update student', 500);
  }

  if (reservationHeld && currentBatchId !== null && currentBatchId !== nextBatchId) {
    await batchCapacityService.releaseSlot(currentBatchId).catch(() => undefined);
  }

  const detail = await getAdminStudentDetail(id);
  if (detail === undefined) {
    return jsonError('Student not found', 404);
  }

  return jsonData({ updated: true, detail }, 200);
}
