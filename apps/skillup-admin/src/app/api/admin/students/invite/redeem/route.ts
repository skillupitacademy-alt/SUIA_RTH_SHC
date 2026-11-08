import { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { and, eq, isNull } from 'drizzle-orm';

import { jsonData, jsonError, parseJsonOrFormBody } from '@/lib/admin-bff';
import {
  claimStudentInvitationInDb,
  commitStudentInvitationInTransaction,
  normalizeStudentEmail,
  releaseStudentInvitationInDb,
  runInInvitationTransaction,
} from '@/lib/student-invitation';
import * as peopleDb from '@quiz/db-people';

const { admissions, db, users } = peopleDb;

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

export function hasZeroAffectedRows(result: unknown): boolean {
  if (result === null || result === undefined) {
    return true;
  }
  if (Array.isArray(result)) {
    return result.length === 0;
  }
  if (typeof result === 'object') {
    const candidate = result as {
      rowCount?: unknown;
      affectedRows?: unknown;
      count?: unknown;
    };
    if (typeof candidate.rowCount === 'number') {
      return candidate.rowCount <= 0;
    }
    if (typeof candidate.affectedRows === 'number') {
      return candidate.affectedRows <= 0;
    }
    if (typeof candidate.count === 'number') {
      return candidate.count <= 0;
    }
  }
  return true;
}

class ZeroAffectedAccountRowsError extends Error {
  constructor() {
    super('Student account not found or ineligible for activation');
    this.name = 'ZeroAffectedAccountRowsError';
  }
}

export async function POST(request: NextRequest) {
  const parsed = await parseJsonOrFormBody(request, redeemInvitationSchema);
  if (!parsed.ok) return parsed.response;

  const platform = (parsed.data.platform ?? 'skillup').trim().toLowerCase();
  if (platform !== 'skillup') {
    return jsonError('Cross-tenant invitation redemption denied', 403);
  }

  const normalizedEmail = normalizeStudentEmail(parsed.data.email);
  const claim = await claimStudentInvitationInDb(
    {
      invitationToken: parsed.data.invitationToken,
      email: normalizedEmail,
      platform,
    },
    db
  );

  if (!claim.ok) {
    const statusByReason: Record<typeof claim.reason, number> = {
      'invalid-token': 401,
      'already-redeemed': 409,
      expired: 410,
      revoked: 403,
      'tenant-mismatch': 403,
      'email-mismatch': 403,
    };
    return jsonError(`Invitation redemption rejected: ${claim.reason}`, statusByReason[claim.reason]);
  }

  try {
    const newPasswordHash = await bcrypt.hash(parsed.data.newPassword, 10);
    const redeemedAtDate = new Date();
    const redeemedAtIso = redeemedAtDate.toISOString();

    const committed = await runInInvitationTransaction(db, async (tx) => {
      const userUpdateBuilder = tx
        .update(users)
        .set({
          passwordHash: newPasswordHash,
          isActive: true,
        })
        .where(
          and(
            eq(users.id, claim.record.userId),
            eq(users.platform, 'skillup'),
            isNull(users.deletedAt)
          )
        );

      const userUpdateResult =
        typeof (userUpdateBuilder as { returning?: unknown })?.returning === 'function'
          ? await (userUpdateBuilder as unknown as { returning: () => Promise<unknown> }).returning()
          : await userUpdateBuilder;

      if (hasZeroAffectedRows(userUpdateResult)) {
        throw new ZeroAffectedAccountRowsError();
      }

      let existingDocuments: Record<string, unknown> = {};
      if (typeof tx?.select === 'function') {
        const selectBuilder = tx
          .select({ documents: admissions.documents })
          .from(admissions)
          .where(eq(admissions.studentUserId, claim.record.userId));
        const rows =
          typeof selectBuilder?.limit === 'function'
            ? await selectBuilder.limit(1)
            : await selectBuilder;
        if (Array.isArray(rows) && rows[0]?.documents && typeof rows[0].documents === 'object') {
          existingDocuments = { ...(rows[0].documents as Record<string, unknown>) };
        }
      }

      await tx
        .update(admissions)
        .set({
          documents: {
            ...existingDocuments,
            invitation: {
              invitationId: claim.record.invitationId,
              tokenHash: claim.record.tokenHash,
              status: 'redeemed',
              issuedAt: claim.record.issuedAt,
              expiresAt: claim.record.expiresAt,
              redeemedAt: redeemedAtIso,
            },
          },
        })
        .where(eq(admissions.studentUserId, claim.record.userId));

      return commitStudentInvitationInTransaction(
        {
          invitationId: claim.record.invitationId,
          claimToken: claim.claimToken,
          now: redeemedAtDate,
        },
        tx
      );
    });

    return jsonData(
      {
        userId: committed.userId,
        email: committed.email,
        platform: committed.platform,
        invitationId: committed.invitationId,
        status: 'activated',
        redeemedAt: committed.redeemedAt,
      },
      200
    );
  } catch (error) {
    await releaseStudentInvitationInDb(
      {
        invitationId: claim.record.invitationId,
        claimToken: claim.claimToken,
      },
      db
    );
    if (error instanceof ZeroAffectedAccountRowsError) {
      return jsonError(error.message, 404);
    }
    throw error;
  }
}
