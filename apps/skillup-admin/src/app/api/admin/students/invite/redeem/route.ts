import { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { and, eq, isNull } from 'drizzle-orm';

import { jsonData, jsonError, parseJsonOrFormBody } from '@/lib/admin-bff';
import {
  normalizeStudentEmail,
  redeemStudentInvitationToken,
} from '@/lib/student-invitation';
import { admissions, db, users } from '@quiz/db-people';

const redeemInvitationSchema = z.object({
  invitationToken: z.string().min(16),
  email: z.string().email(),
  newPassword: z
    .string()
    .min(10, 'Password must be at least 10 characters')
    .refine((val) => val !== 'SkillUp@2025', {
      message: 'Static default passwords are prohibited',
    }),
  platform: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const parsed = await parseJsonOrFormBody(request, redeemInvitationSchema);
  if (!parsed.ok) return parsed.response;

  const platform = (parsed.data.platform ?? 'skillup').trim().toLowerCase();
  if (platform !== 'skillup') {
    return jsonError('Cross-tenant invitation redemption denied', 403);
  }

  const normalizedEmail = normalizeStudentEmail(parsed.data.email);
  const redemption = redeemStudentInvitationToken({
    invitationToken: parsed.data.invitationToken,
    email: normalizedEmail,
    platform,
  });

  if (!redemption.ok) {
    const statusByReason: Record<typeof redemption.reason, number> = {
      'invalid-token': 401,
      'already-redeemed': 409,
      expired: 410,
      revoked: 403,
      'tenant-mismatch': 403,
      'email-mismatch': 403,
    };
    return jsonError(`Invitation redemption rejected: ${redemption.reason}`, statusByReason[redemption.reason]);
  }

  const newPasswordHash = await bcrypt.hash(parsed.data.newPassword, 10);

  await db
    .update(users)
    .set({
      passwordHash: newPasswordHash,
      isActive: true,
    })
    .where(
      and(
        eq(users.id, redemption.record.userId),
        eq(users.platform, 'skillup'),
        isNull(users.deletedAt)
      )
    );

  await db
    .update(admissions)
    .set({
      documents: {
        invitation: {
          invitationId: redemption.record.invitationId,
          tokenHash: redemption.record.tokenHash,
          status: redemption.record.status,
          issuedAt: redemption.record.issuedAt,
          expiresAt: redemption.record.expiresAt,
          redeemedAt: redemption.record.redeemedAt,
        },
      },
    })
    .where(eq(admissions.studentUserId, redemption.record.userId));

  return jsonData(
    {
      userId: redemption.record.userId,
      email: redemption.record.email,
      platform: redemption.record.platform,
      invitationId: redemption.record.invitationId,
      status: 'activated',
      redeemedAt: redemption.record.redeemedAt,
    },
    200
  );
}
