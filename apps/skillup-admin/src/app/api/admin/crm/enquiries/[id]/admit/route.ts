import { NextRequest } from 'next/server';

import { PlatformEventTypes, publishEvent } from '@quiz/events';
import bcrypt from 'bcryptjs';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';

import { jsonData, jsonError, requireAdminOrForbidden } from '@/lib/admin-bff';
import { admissions, batchEnrollments, batches, db, enquiries, userProfiles, users } from '@quiz/db-people';
import { getAdminEnquiryDetail } from '@/lib/skillup-admin-data';

async function admit(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;

  const { id } = await context.params;
  const enquiry = await getAdminEnquiryDetail(id);
  if (enquiry === undefined) {
    return jsonError('Enquiry not found', 404);
  }

  const [batchRow] = await db
    .select({ id: batches.id })
    .from(batches)
    .where(isNull(batches.deletedAt))
    .orderBy(desc(batches.createdAt))
    .limit(1);

  if (batchRow === undefined) {
    return jsonError('No active batch available', 409);
  }

  const passwordHash = await bcrypt.hash('SkillUp@2025', 10);
  const [existingUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, enquiry.email)).limit(1);
  const userId =
    existingUser?.id ??
    (await db
      .insert(users)
      .values({
        email: enquiry.email,
        passwordHash,
        role: 'student',
        platform: 'skillup',
        isActive: true,
        deletedAt: null,
      })
      .returning({ id: users.id })
      .then((rows) => rows[0]?.id ?? null));

  if (userId === null) {
    return jsonError('Could not create student user', 500);
  }

  await db.insert(userProfiles).values({ userId, name: enquiry.studentName }).onConflictDoNothing();

  await db.transaction(async (tx) => {
    const [existingAdmission] = await tx.select({ id: admissions.id }).from(admissions).where(eq(admissions.studentUserId, userId)).limit(1);
    if (existingAdmission === undefined) {
      await tx.insert(admissions).values({
        enquiryId: id,
        studentUserId: userId,
        admissionType: 'training',
        batchId: batchRow.id,
        status: 'approved',
        documents: {},
      });
    } else {
      await tx
        .update(admissions)
        .set({ batchId: batchRow.id, status: 'approved', updatedAt: new Date() })
        .where(eq(admissions.studentUserId, userId));
    }

    const [existingEnrollment] = await tx
      .select({ id: batchEnrollments.id })
      .from(batchEnrollments)
      .where(and(eq(batchEnrollments.batchId, batchRow.id), eq(batchEnrollments.studentUserId, userId), isNull(batchEnrollments.deletedAt)))
      .limit(1);

    if (existingEnrollment === undefined) {
      await tx.insert(batchEnrollments).values({
        batchId: batchRow.id,
        studentUserId: userId,
        status: 'active',
      });

      await tx
        .update(batches)
        .set({ enrolledCount: sql`${batches.enrolledCount} + 1` })
        .where(eq(batches.id, batchRow.id));
    }

    await tx.update(enquiries).set({ status: 'qualified', updatedAt: new Date() }).where(eq(enquiries.id, id));
  });

  const admittedAt = new Date().toISOString();
  const payload = { userId, batchId: batchRow.id, admittedAt };

  try {
    await publishEvent(PlatformEventTypes.ADMISSION_COMPLETED, payload, {
      destinationUrl: process.env.SKILLUP_EVENT_URL ?? 'https://placeholder.invalid/events/admission-completed',
    });
  } catch {
    // Demo mode should not fail on missing QStash secrets.
  }

  return jsonData(
    {
      ...(await getAdminEnquiryDetail(id)),
      status: 'admitted' as const,
      admittedAt,
      batchId: batchRow.id,
      userId,
    },
    200
  );
}

export { admit as PATCH, admit as POST };
