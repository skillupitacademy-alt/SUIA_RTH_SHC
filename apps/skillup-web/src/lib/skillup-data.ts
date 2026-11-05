import { and, desc, eq, isNull } from 'drizzle-orm';
import { Pool } from 'pg';

import {
  attendanceRecords,
  batchEnrollments,
  batchSessions,
  batches,
  paymentInstallments,
  faculty,
  domains,
  subjects,
  userProfiles,
  users,
  db,
} from '@quiz/db-people';
import {
  db as placementDb,
  findJobsForStudent,
  jobListings as placementJobListings,
  studentPlacementProfiles as placementStudentPlacementProfiles,
} from '@quiz/db-placement';

import type { SkillupSession } from '@/lib/skillup-types';
import type { SkillupProgramDetail } from '@/lib/skillup-types';

let paymentPool: Pool | null | undefined;

function getPaymentPool() {
  if (paymentPool === undefined) {
    const databaseUrl = process.env.DATABASE_DIRECT_URL_PAYMENT?.trim() || process.env.DATABASE_URL_PAYMENT?.trim() || '';
    paymentPool = databaseUrl.length > 0 ? new Pool({ connectionString: databaseUrl }) : null;
  }

  return paymentPool;
}
const attendanceDateFormatter = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });

function toDate(value: string | Date | null | undefined): Date {
  if (value instanceof Date) return value;
  return new Date(value ?? Date.now());
}

function toDateString(value: string | Date | null | undefined): string {
  return toDate(value).toISOString();
}

function formatSessionStatus(status: string): SkillupSession['status'] {
  if (status === 'scheduled') return 'upcoming';
  if (status === 'cancelled') return 'cancelled';
  if (status === 'completed') return 'completed';
  return 'unavailable';
}

function formatSessionMode(mode: string): SkillupSession['mode'] {
  if (mode === 'offline' || mode === 'online' || mode === 'hybrid') return mode;
  return 'unavailable';
}

async function getStudentProfile(userId: string) {
  const profile = await db
    .select({
      id: users.id,
      email: users.email,
      name: userProfiles.name,
    })
    .from(users)
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(eq(users.id, userId))
    .limit(1);

  if (profile.length === 0) {
    throw new Error(`SkillUp user ${userId} not found`);
  }

  return profile[0];
}

async function getStudentBatchContext(userId: string) {
  const enrollmentRows = await db
    .select({
      batchId: batchEnrollments.batchId,
      batchName: batches.name,
      capacity: batches.capacity,
      enrolledCount: batches.enrolledCount,
      mode: batches.mode,
      batchStatus: batches.status,
      facultyName: userProfiles.name,
      facultyUserId: faculty.userId,
    })
    .from(batchEnrollments)
    .innerJoin(batches, eq(batches.id, batchEnrollments.batchId))
    .leftJoin(faculty, eq(faculty.id, batches.facultyId))
    .leftJoin(users, eq(users.id, faculty.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(and(eq(batchEnrollments.studentUserId, userId), eq(batchEnrollments.status, 'active'), isNull(batchEnrollments.deletedAt)))
    .limit(1);

  const row = enrollmentRows[0];
  if (row === undefined) {
    return null;
  }

  const sessions = await db
    .select({
      id: batchSessions.id,
      scheduledAt: batchSessions.scheduledAt,
      title: batchSessions.sessionNotes,
      mode: batches.mode,
      status: batchSessions.status,
    })
    .from(batchSessions)
    .innerJoin(batches, eq(batches.id, batchSessions.batchId))
    .where(eq(batchSessions.batchId, row.batchId))
    .orderBy(desc(batchSessions.scheduledAt));

  return {
    ...row,
    sessions,
  };
}

export async function getSkillupPrograms() {
  const rows = await db
    .select({
      id: batches.id,
      slug: batches.id,
      name: batches.name,
      description: subjects.name,
      audience: domains.name,
      status: batches.status,
    })
    .from(batches)
    .leftJoin(subjects, eq(subjects.id, batches.subjectId))
    .leftJoin(domains, eq(domains.id, batches.domainId))
    .where(isNull(batches.deletedAt))
    .orderBy(desc(batches.createdAt));

  return {
    programs: rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      duration: 'Unavailable',
      description: row.description ? `Subject: ${row.description}` : 'Unavailable',
      audience: row.audience ? `Domain: ${row.audience}` : 'Unavailable',
      summary: row.status ? `Batch status: ${row.status}` : 'Batch status unavailable',
      highlights: [],
    })),
  };
}

function upcomingScheduledSessions<T extends { status: string; scheduledAt: Date | string }>(sessions: T[]): T[] {
  const now = Date.now();
  return sessions
    .filter((session) => session.status === 'scheduled' && new Date(session.scheduledAt).getTime() >= now)
    .sort((left, right) => new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime());
}

export async function getSkillupStudentDashboard(userId: string) {
    const profile = await getStudentProfile(userId);
    const batchContext = await getStudentBatchContext(userId);

    const installments = await db
      .select({
        id: paymentInstallments.id,
        label: paymentInstallments.label,
        dueDate: paymentInstallments.dueDate,
        amount: paymentInstallments.amount,
        status: paymentInstallments.status,
        paymentRef: paymentInstallments.paymentRef,
      })
      .from(paymentInstallments)
      .where(eq(paymentInstallments.studentUserId, userId))
      .orderBy(paymentInstallments.dueDate);

    const sessions = batchContext?.sessions ?? [];
    const completedCount = sessions.filter((session) => session.status === 'completed').length;
    const paymentDue = installments
      .filter((item) => item.status !== 'paid')
      .reduce((sum, item) => sum + item.amount, 0);

    const upcomingSessions = upcomingScheduledSessions(sessions);
    const nextSession = upcomingSessions[0];

    const attendancePercent = null;
    const progressPercent = sessions.length > 0 ? Math.round((completedCount / sessions.length) * 100) : null;

    return {
      summary: {
        name: profile.name ?? profile.email,
        batchName: batchContext?.batchName ?? 'Unavailable',
        facultyName: batchContext?.facultyName ?? 'Unavailable',
        currentTopic: 'Unavailable',
        attendancePercent,
        progressPercent,
        paymentDue,
        outstandingInstallments: installments.filter((item) => item.status !== 'paid').length,
        nextSessionAt: nextSession !== undefined ? toDateString(nextSession.scheduledAt) : null,
        upcomingSessions: upcomingSessions.length,
        placementMatches: (
          await placementDb
            .select({ id: placementJobListings.id })
            .from(placementJobListings)
            .where(and(eq(placementJobListings.status, 'open'), isNull(placementJobListings.deletedAt)))
        ).length,
      },
      sessions: upcomingSessions.map((session) => ({
        id: session.id,
        date: toDateString(session.scheduledAt),
        title: session.title ?? 'SkillUp session',
        mode: formatSessionMode(session.mode ?? ''),
        status: formatSessionStatus(session.status),
      })),
    };
}

export async function getSkillupMyBatch(userId: string) {
    const batchContext = await getStudentBatchContext(userId);

    if (batchContext === null) {
      return { batch: null, sessions: [] };
    }

    const upcomingSessions = upcomingScheduledSessions(batchContext.sessions);
    const nextSession = upcomingSessions[0];
    const currentTopic = 'Unavailable';
    const schedule = upcomingSessions.slice(0, 3).map((session) => ({
      day: new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(toDate(session.scheduledAt)),
      time: new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).format(toDate(session.scheduledAt)),
      topic: session.title ?? 'SkillUp session',
      mode: formatSessionMode(session.mode ?? ''),
    }));

    return {
      batch: {
        name: batchContext.batchName,
        faculty: batchContext.facultyName ?? 'Unavailable',
        currentTopic,
        nextSession: nextSession !== undefined ? toDateString(nextSession.scheduledAt) : null,
        studentCount: batchContext.enrolledCount,
        schedule,
        materials: [],
      },
      sessions: batchContext.sessions.map((session) => ({
        id: session.id,
        date: toDateString(session.scheduledAt),
        title: session.title ?? 'SkillUp session',
        mode: formatSessionMode(session.mode ?? ''),
        status: formatSessionStatus(session.status),
      })),
    };
}

export async function getSkillupAttendance(userId: string) {
    const rows = await db
      .select({
        status: attendanceRecords.status,
        markedAt: attendanceRecords.markedAt,
      })
      .from(attendanceRecords)
      .where(eq(attendanceRecords.studentUserId, userId))
      .orderBy(desc(attendanceRecords.markedAt));

    return {
      history: rows.map((row) => ({
        date: attendanceDateFormatter.format(toDate(row.markedAt)),
        state: row.status,
        note: 'Details unavailable',
      })),
    };
}

export async function getSkillupPayments(userId: string) {
    const paymentPoolClient = getPaymentPool();
    if (paymentPoolClient === null) {
      throw new Error('Payment data unavailable');
    }

    const { rows: installments } = await paymentPoolClient.query<{
      id: string;
      installmentNumber: number;
      dueDate: string | Date;
      amount: number;
      status: 'paid' | 'due' | 'overdue';
      paymentRef: string | null;
    }>(
      `
      SELECT
        pi.id,
        pi.installment_number AS "installmentNumber",
        pi.due_date AS "dueDate",
        pi.amount,
        pi.status,
        pi.payment_ref AS "paymentRef"
      FROM payment_installments pi
      INNER JOIN payment_plans pp ON pp.id = pi.plan_id
      WHERE pp.user_id = $1
      ORDER BY pi.due_date
    `,
      [userId],
    );

    return {
      installments: installments.map((item) => ({
        id: item.id,
        label:
          item.installmentNumber === 1
            ? 'Admission fee'
            : `Training fee - month ${item.installmentNumber}`,
        dueDate: toDate(item.dueDate).toISOString().slice(0, 10),
        amount: item.amount,
        status: item.status,
        paymentRef: item.paymentRef,
      })),
    };
}

export async function getSkillupPlacement(userId: string) {
    const profileRows = await placementDb
      .select({
        userId: placementStudentPlacementProfiles.userId,
        status: placementStudentPlacementProfiles.status,
        readinessScore: placementStudentPlacementProfiles.readinessScore,
        skills: placementStudentPlacementProfiles.skills,
        preferredLocation: placementStudentPlacementProfiles.preferredLocation,
        expectedCtc: placementStudentPlacementProfiles.expectedCtc,
        experienceSummary: placementStudentPlacementProfiles.experienceSummary,
      })
      .from(placementStudentPlacementProfiles)
      .where(and(eq(placementStudentPlacementProfiles.userId, userId), eq(placementStudentPlacementProfiles.status, 'active'), isNull(placementStudentPlacementProfiles.deletedAt)))
      .limit(1);

    const jobs = await placementDb
      .select({
        id: placementJobListings.id,
        companyName: placementJobListings.companyName,
        title: placementJobListings.title,
        location: placementJobListings.location,
        ctcMin: placementJobListings.ctcMin,
        ctcMax: placementJobListings.ctcMax,
        deadline: placementJobListings.deadline,
      })
      .from(placementJobListings)
      .where(and(eq(placementJobListings.status, 'open'), isNull(placementJobListings.deletedAt)))
      .orderBy(desc(placementJobListings.deadline), desc(placementJobListings.createdAt));

    // Return null profile when no active profile exists (no fabricated data)
    const profile = profileRows[0] !== undefined
      ? {
          roleGoal: null, // Unavailable until authoritative source established
          resumeStatus: null, // Unavailable until authoritative source established
          profileCompletion: null, // Unavailable until authoritative source established
          skills: profileRows[0].skills,
          readinessScore: profileRows[0].readinessScore,
        }
      : null;

    // Process jobs: keep persisted jobs browsable in DB order, with null match when unavailable
    const jobsWithMatches = await (async () => {
      // Without profile, return jobs in DB order with null match (no matching available)
      if (profileRows[0] === undefined) {
        return jobs.map((job) => ({
          id: job.id,
          company: job.companyName,
          title: job.title,
          location: job.location,
          match: null as number | null,
        }));
      }

      // With profile, attempt vector matching
      try {
        const vectorMatches = await findJobsForStudent({
          userId,
          readinessScore: profileRows[0].readinessScore,
          skills: profileRows[0].skills,
          experienceSummary: profileRows[0].experienceSummary,
          preferredLocation: profileRows[0].preferredLocation,
          expectedCtc: profileRows[0].expectedCtc,
        }, Math.max(2, jobs.length));

        const jobMap = new Map(jobs.map((job) => [job.id, job]));
        const ranked = vectorMatches
          .map((match) => {
            const job = jobMap.get(String(match.id));
            if (job === undefined) {
              return null;
            }
            // Return null for unavailable/zero scores (no calibrated measurement)
            // Zero is valid when measured, but score is currently uncalibrated
            const matchScore = match.score !== null && match.score !== undefined && match.score > 0
              ? Math.round(match.score * 100)
              : null;
            return {
              id: job.id,
              company: job.companyName,
              title: job.title,
              location: job.location,
              match: matchScore,
            };
          })
          .filter((item): item is { id: string; company: string; title: string; location: string; match: number | null } => item !== null);

        if (ranked.length > 0) {
          return ranked;
        }
      } catch {
        // Vector service failed, fall through to DB ordering below
      }

      // Fall back to DB ordering with null match (matching unavailable)
      return jobs.map((job) => ({
        id: job.id,
        company: job.companyName,
        title: job.title,
        location: job.location,
        match: null as number | null,
      }));
    })();

    return {
      profile,
      jobs: jobsWithMatches,
    };
}

export async function getSkillupBatches(userId: string) {
    const batchContext = await getStudentBatchContext(userId);

    if (batchContext === null) {
      return { batch: null, sessions: [] };
    }

    const upcomingSessions = upcomingScheduledSessions(batchContext.sessions);
    const nextSession = upcomingSessions[0];
    const materials: string[] = [];

    return {
      batch: {
        name: batchContext.batchName,
        faculty: batchContext.facultyName ?? 'Unavailable',
        currentTopic: 'Unavailable',
        nextSession: nextSession !== undefined ? toDateString(nextSession.scheduledAt) : null,
        studentCount: batchContext.enrolledCount,
        schedule: upcomingSessions.slice(0, 3).map((session) => ({
          day: new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(toDate(session.scheduledAt)),
          time: new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).format(toDate(session.scheduledAt)),
          topic: session.title ?? 'SkillUp session',
          mode: formatSessionMode(session.mode ?? ''),
        })),
        materials,
      },
      sessions: batchContext.sessions.map((session) => ({
        id: session.id,
        date: toDateString(session.scheduledAt),
        title: session.title ?? 'SkillUp session',
        mode: formatSessionMode(session.mode ?? ''),
        status: formatSessionStatus(session.status),
      })),
    };
}

export async function getSkillupFaculty() {
  const mentors = await db
    .select({ name: userProfiles.name, title: faculty.availabilityType })
    .from(faculty)
    .innerJoin(users, eq(users.id, faculty.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(eq(faculty.status, 'active'));

  return {
    faculty: mentors.map((mentor) => ({
      name: mentor.name ?? 'Name unavailable',
      title: mentor.title ?? 'Availability unavailable',
      description: 'Faculty details unavailable',
    })),
    heroStats: [{ label: 'Active mentors', value: String(mentors.length) }],
  };
}

export async function getSkillupProgramBySlug(slug: string) {
  const programs = (await getSkillupPrograms()).programs;
  return programs.find((program) => program.slug === slug);
}

export async function getSkillupProgramDetail(slug: string): Promise<SkillupProgramDetail | null> {
  const program = await getSkillupProgramBySlug(slug);
  if (program === undefined) {
    return null;
  }

  return {
    ...program,
    highlights: [...program.highlights],
    curriculum: [],
  };
}
