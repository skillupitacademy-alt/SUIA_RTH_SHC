import { NextRequest } from 'next/server';
import { z } from 'zod';
import { and, eq, isNull } from 'drizzle-orm';

import { jsonData, jsonError, parseJsonOrFormBody, requireAdminOrForbidden } from '@/lib/admin-bff';
import { listAdminStudents } from '@/lib/skillup-admin-data';
import {
  generateRandomBootstrapPasswordHash,
  issueStudentInvitationInDb,
  normalizeStudentEmail,
  runInInvitationTransaction,
} from '@/lib/student-invitation';
import { admissions, db, enquiries, userProfiles, users } from '@quiz/db-people';

const createStudentSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  batchId: z.string().min(1),
  batchName: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;
  return jsonData(await listAdminStudents(), 200);
}

export async function POST(request: NextRequest) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;

  const parsed = await parseJsonOrFormBody(request, createStudentSchema);
  if (!parsed.ok) return parsed.response;

  const normalizedEmail = normalizeStudentEmail(parsed.data.email);

  const selectFn = (db as unknown as { select?: (...args: unknown[]) => { from?: (...args: unknown[]) => { where?: (...args: unknown[]) => { limit?: (n: number) => Promise<Array<{ id: string }>> } } } }).select;
  if (typeof selectFn === 'function') {
    const existingSkillupAccounts = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.email, normalizedEmail),
          eq(users.platform, 'skillup'),
          isNull(users.deletedAt)
        )
      )
      .limit(1);

    if (existingSkillupAccounts.length > 0) {
      return jsonError('An active SkillUp account already exists for this email', 409);
    }
  }

  const bootstrapPasswordHash = await generateRandomBootstrapPasswordHash();

  const { user, invitation } = await runInInvitationTransaction(db, async (tx) => {
    const [createdUser] = await tx
      .insert(users)
      .values({
        email: normalizedEmail,
        passwordHash: bootstrapPasswordHash,
        role: 'student',
        platform: 'skillup',
        isActive: true,
        deletedAt: null,
      })
      .returning({ id: users.id });

    if (!createdUser?.id) {
      throw new Error('Failed to create student user record');
    }

    const issuedInvitation = await issueStudentInvitationInDb(
      {
        userId: createdUser.id,
        email: normalizedEmail,
        platform: 'skillup',
      },
      tx
    );

    const [enquiry] = await tx
      .insert(enquiries)
      .values({
        fullName: parsed.data.name,
        email: normalizedEmail,
        phone: normalizedEmail,
        source: 'walkin',
        status: 'qualified',
        notes: `Admitted from admin create flow for batch ${parsed.data.batchName}`,
        deletedAt: null,
      })
      .returning({ id: enquiries.id });

    await tx.insert(userProfiles).values({ userId: createdUser.id, name: parsed.data.name });
    await tx.insert(admissions).values({
      enquiryId: enquiry.id,
      studentUserId: createdUser.id,
      admissionType: 'training',
      status: 'approved',
      documents: {
        invitation: {
          invitationId: issuedInvitation.record.invitationId,
          tokenHash: issuedInvitation.record.tokenHash,
          status: issuedInvitation.record.status,
          issuedAt: issuedInvitation.record.issuedAt,
          expiresAt: issuedInvitation.record.expiresAt,
        },
      },
    });

    return { user: createdUser, invitation: issuedInvitation };
  });

  return jsonData(
    {
      id: user.id,
      userId: user.id,
      name: parsed.data.name,
      email: normalizedEmail,
      batchId: parsed.data.batchId,
      batchName: parsed.data.batchName,
      attendancePct: 0,
      paymentStatus: 'due',
      upcomingSessionAt: new Date().toISOString(),
      invitation: {
        invitationId: invitation.record.invitationId,
        invitationToken: invitation.invitationToken,
        expiresAt: invitation.record.expiresAt,
        redeemPath: '/api/admin/students/invite/redeem',
      },
    },
    201
  );
}
