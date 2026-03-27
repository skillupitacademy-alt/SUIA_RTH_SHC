import {
  batchEnrollments,
  batches,
  db as peopleDb,
  paymentInstallments,
  userProfiles,
  users,
} from '@quiz/db-people';
import { and, eq, isNull } from 'drizzle-orm';

import { logger } from '@/lib/logger';
import { EmailService } from '@/modules/email/EmailService';

type SessionReminderInput = {
  batchId: string;
  sessionId: string;
  scheduledAt: string;
  sessionNotes: string;
};

type PaymentOverdueInput = {
  userId: string;
  installmentId: string;
  overdueByDays: number;
  detectedAt: string;
};

type Recipient = {
  userId: string;
  name: string;
  email: string;
};

function formatSessionDateTime(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(date);
}

function buildSessionReminderHtml(batchName: string, payload: SessionReminderInput, recipientName: string) {
  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6">
      <p>Hi ${recipientName},</p>
      <p>Your SkillUp batch has a scheduled session coming up.</p>
      <p><strong>Batch:</strong> ${batchName}</p>
      <p><strong>Session:</strong> ${payload.sessionNotes}</p>
      <p><strong>When:</strong> ${formatSessionDateTime(payload.scheduledAt)}</p>
      <p>Please be ready a few minutes early.</p>
    </div>
  `;
}

function buildOverdueHtml(recipientName: string, installmentLabel: string, dueDate: string, overdueByDays: number) {
  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6">
      <p>Hi ${recipientName},</p>
      <p>Your SkillUp installment is overdue.</p>
      <p><strong>Installment:</strong> ${installmentLabel}</p>
      <p><strong>Due date:</strong> ${dueDate}</p>
      <p><strong>Overdue by:</strong> ${overdueByDays} day${overdueByDays === 1 ? '' : 's'}</p>
    </div>
  `;
}

async function loadSessionRecipients(batchId: string): Promise<{ batchName: string; recipients: Recipient[] } | null> {
  const [batchRow] = await peopleDb
    .select({ name: batches.name })
    .from(batches)
    .where(and(eq(batches.id, batchId), isNull(batches.deletedAt)))
    .limit(1);

  if (batchRow === undefined) {
    return null;
  }

  const rows = await peopleDb
    .select({
      userId: users.id,
      email: users.email,
      name: userProfiles.name,
    })
    .from(batchEnrollments)
    .innerJoin(users, eq(users.id, batchEnrollments.studentUserId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(and(eq(batchEnrollments.batchId, batchId), eq(batchEnrollments.status, 'active'), isNull(batchEnrollments.deletedAt)));

  return {
    batchName: batchRow.name,
    recipients: rows.map((row) => ({
      userId: row.userId,
      email: row.email,
      name: row.name ?? row.email,
    })),
  };
}

async function loadOverdueRecipient(installmentId: string, userId: string) {
  const [row] = await peopleDb
    .select({
      installmentId: paymentInstallments.id,
      studentUserId: paymentInstallments.studentUserId,
      label: paymentInstallments.label,
      dueDate: paymentInstallments.dueDate,
      status: paymentInstallments.status,
      email: users.email,
      name: userProfiles.name,
    })
    .from(paymentInstallments)
    .innerJoin(users, eq(users.id, paymentInstallments.studentUserId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(and(eq(paymentInstallments.id, installmentId), eq(paymentInstallments.studentUserId, userId), isNull(users.deletedAt)))
    .limit(1);

  return row ?? null;
}

export class SkillupNotificationsService {
  static async sendSessionReminder(payload: SessionReminderInput) {
    const data = await loadSessionRecipients(payload.batchId);
    if (data === null || data.recipients.length === 0) {
      return { delivered: 0, batchName: null };
    }

    await Promise.all(
      data.recipients.map(async (recipient) => {
        await EmailService.sendEmail({
          to: recipient.email,
          subject: `SkillUp session reminder: ${payload.sessionNotes}`,
          html: buildSessionReminderHtml(data.batchName, payload, recipient.name),
        });
      })
    );

    logger.info(
      {
        event: 'skillup.session_reminder_sent',
        batchId: payload.batchId,
        sessionId: payload.sessionId,
        recipientCount: data.recipients.length,
      },
      'SkillUp session reminder delivered'
    );

    return { delivered: data.recipients.length, batchName: data.batchName };
  }

  static async sendPaymentOverdueReminder(payload: PaymentOverdueInput) {
    const row = await loadOverdueRecipient(payload.installmentId, payload.userId);
    if (row === null || row.status !== 'overdue') {
      return { delivered: 0 };
    }

    await EmailService.sendEmail({
      to: row.email,
      subject: `SkillUp payment overdue: ${row.label}`,
      html: buildOverdueHtml(row.name ?? row.email, row.label, String(row.dueDate), payload.overdueByDays),
    });

    logger.info(
      {
        event: 'skillup.payment_overdue_sent',
        userId: payload.userId,
        installmentId: payload.installmentId,
        overdueByDays: payload.overdueByDays,
      },
      'SkillUp payment overdue reminder delivered'
    );

    return { delivered: 1 };
  }
}
