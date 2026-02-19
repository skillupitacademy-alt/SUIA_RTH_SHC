import { backgroundJobs, db, notesAccessLogs, topics, users } from "@quiz/db";
import { eq } from "drizzle-orm";

import { EmailService } from "@/modules/email/EmailService";

type SendNotesPayload = {
  topicId: string;
  notesPath: string;
  learningUrl?: string | null;
  recommendationLevel: string;
};

/**
 * Processes pending email jobs from the background_jobs table.
 * Returns the number of jobs attempted.
 */
export async function processEmailJobs(): Promise<number> {
  const jobs = await db
    .select()
    .from(backgroundJobs)
    .where(eq(backgroundJobs.status, "pending"))
    .limit(10);

  let processedCount = 0;
  for (const job of jobs) {
    processedCount++;
    if (job.type !== "SEND_NOTES_EMAIL") continue;

    try {
      await db
        .update(backgroundJobs)
        .set({ status: "processing", startedAt: new Date() })
        .where(eq(backgroundJobs.id, job.id));

      const payload = job.payload as SendNotesPayload;
      const user = await db.query.users.findFirst({
        where: eq(users.id, job.userId),
        columns: { email: true },
      });

      if (typeof user?.email !== "string" || user.email.length === 0) {
        throw new Error("User email not found");
      }

      const topic = await db.query.topics.findFirst({
        where: eq(topics.id, payload.topicId),
        columns: { name: true },
      });
      const topicName = topic?.name ?? "your topic";

      let notesLink: string | null = null;
      const rawPath = (payload as { notesPath?: unknown }).notesPath;
      if (typeof rawPath === "string") {
        const trimmed = rawPath.trim();
        if (trimmed.length > 0) {
          notesLink = trimmed;
        }
      }

      const html = `
        <p>Hi,</p>
        <p>Based on your recent assessment, we recommend you <b>${payload.recommendationLevel}</b> <b>${topicName}</b>.</p>
        ${
          typeof payload.learningUrl === "string" && payload.learningUrl.length > 0
            ? `<p>Study link: <a href="${payload.learningUrl}">${payload.learningUrl}</a></p>`
            : ""
        }
        ${
          notesLink !== null
            ? `<p>Your secure notes are available here: <a href="${notesLink}">${notesLink}</a></p>`
            : "<p>Notes are being prepared.</p>"
        }
        <p>Your secure notes are being delivered via our system.</p>
        <p>Keep learning 🚀</p>
      `;

      await EmailService.getInstance().sendEmail({
        to: user.email,
        subject: `Refresher Notes: ${topicName}`,
        html,
      });

      await db.insert(notesAccessLogs).values({
        userId: job.userId,
        topicId: payload.topicId,
        deliveredVia: "email",
      });

      await db
        .update(backgroundJobs)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(backgroundJobs.id, job.id));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Email job failed";
      await db
        .update(backgroundJobs)
        .set({ status: "failed", error: message, completedAt: new Date() })
        .where(eq(backgroundJobs.id, job.id));
    }
  }
  return processedCount;
}
