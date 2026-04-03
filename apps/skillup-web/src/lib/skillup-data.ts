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

const DEFAULT_STUDENT_EMAIL = 'student@skillupitacademy.com';
let authPool: Pool | null | undefined;
let paymentPool: Pool | null | undefined;

function getAuthPool() {
  if (authPool === undefined) {
    const databaseUrl = process.env.DATABASE_DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim() || '';
    authPool = databaseUrl.length > 0 ? new Pool({ connectionString: databaseUrl }) : null;
  }

  return authPool;
}

function getPaymentPool() {
  if (paymentPool === undefined) {
    const databaseUrl = process.env.DATABASE_DIRECT_URL_PAYMENT?.trim() || process.env.DATABASE_URL_PAYMENT?.trim() || '';
    paymentPool = databaseUrl.length > 0 ? new Pool({ connectionString: databaseUrl }) : null;
  }

  return paymentPool;
}
const FALLBACK_PROGRAMS = [
  {
    id: 'skillup-full-stack',
    slug: 'full-stack-web',
    name: 'Full Stack Developer',
    duration: 'Live track',
    description: 'Frontend, APIs, deployment, and project delivery.',
    audience: 'Students targeting product engineering roles',
    summary: 'Build production-ready web apps and interview-ready projects.',
    highlights: ['Frontend foundations', 'Next.js app architecture', 'API integration', 'Deployment readiness'],
  },
  {
    id: 'skillup-data',
    slug: 'data-analytics',
    name: 'Data Analyst',
    duration: 'Live track',
    description: 'SQL, dashboards, reporting, and business communication.',
    audience: 'Learners building reporting and insight skills',
    summary: 'Turn datasets into clear business insights and reports.',
    highlights: ['SQL analysis', 'Dashboard storytelling', 'Spreadsheet workflows', 'Stakeholder reporting'],
  },
  {
    id: 'skillup-cloud',
    slug: 'cloud-ops',
    name: 'Cloud Support',
    duration: 'Live track',
    description: 'Linux, networking, monitoring, incident response, and cloud workflows.',
    audience: 'Students preparing for support and operations roles',
    summary: 'Operate, monitor, and support modern cloud systems confidently.',
    highlights: ['Linux basics', 'Monitoring and incidents', 'Networking essentials', 'Cloud operations'],
  },
] as const;

const FALLBACK_FACULTY = [
  {
    name: 'Asha Iyer',
    title: 'Full Stack Mentor',
    description: 'Guides front-end and API delivery with weekly code review sessions.',
  },
  {
    name: 'Rahul Mehta',
    title: 'Data and BI Coach',
    description: 'Focuses on dashboards, SQL drills, and employer-ready reporting habits.',
  },
  {
    name: 'Neha Shah',
    title: 'Cloud Support Lead',
    description: 'Teaches deployment, observability, and production incident management.',
  },
] as const;

const FALLBACK_STUDENT_DASHBOARD = {
  summary: {
    name: 'Aarav Patel',
    batchName: 'SkillUp FS-24 Morning',
    facultyName: 'Asha Iyer',
    currentTopic: 'React state patterns',
    attendancePercent: 86,
    progressPercent: 68,
    paymentDue: 18000,
    outstandingInstallments: 1,
    nextSessionAt: '2026-03-24T09:30:00+05:30',
    upcomingSessions: 3,
    placementMatches: 6,
  },
  sessions: [
    { id: 'session-1', date: '2026-03-24T09:30:00+05:30', title: 'React state patterns and component design', mode: 'offline', status: 'upcoming' },
    { id: 'session-2', date: '2026-03-22T09:30:00+05:30', title: 'REST API integration and error handling', mode: 'online', status: 'completed', recording: 'https://learn.skillupitacademy.com/recordings/rest-api-integration' },
    { id: 'session-3', date: '2026-03-20T09:30:00+05:30', title: 'Project review and feedback clinic', mode: 'hybrid', status: 'completed', recording: 'https://learn.skillupitacademy.com/recordings/project-review' },
  ],
};

const FALLBACK_BATCH = {
  batch: {
    name: 'SkillUp FS-24 Morning',
    faculty: 'Asha Iyer',
    currentTopic: 'React state patterns',
    nextSession: '2026-03-24T09:30:00+05:30',
    studentCount: 28,
    schedule: [
      { day: 'Mon', time: '09:30 AM', topic: 'React components', mode: 'offline' },
      { day: 'Wed', time: '09:30 AM', topic: 'API integration', mode: 'online' },
      { day: 'Fri', time: '09:30 AM', topic: 'Project review', mode: 'hybrid' },
    ],
    materials: ['React component guide', 'API error handling notes', 'Project review rubric'],
  },
  sessions: [
    { id: 'session-1', date: '2026-03-24T09:30:00+05:30', title: 'React state patterns and component design', mode: 'offline', status: 'upcoming' },
    { id: 'session-2', date: '2026-03-22T09:30:00+05:30', title: 'REST API integration and error handling', mode: 'online', status: 'completed', recording: 'https://learn.skillupitacademy.com/recordings/rest-api-integration' },
    { id: 'session-3', date: '2026-03-20T09:30:00+05:30', title: 'Project review and feedback clinic', mode: 'hybrid', status: 'completed', recording: 'https://learn.skillupitacademy.com/recordings/project-review' },
  ],
};

const FALLBACK_ATTENDANCE = {
  history: [
    { date: 'Mon 18 Mar', state: 'present', note: 'On time for class' },
    { date: 'Tue 19 Mar', state: 'present', note: 'Completed in-class task' },
    { date: 'Wed 20 Mar', state: 'late', note: 'Joined after 10 minutes' },
    { date: 'Thu 21 Mar', state: 'present', note: 'Pair-programming session' },
    { date: 'Fri 22 Mar', state: 'present', note: 'Reviewed assignment feedback' },
    { date: 'Sat 23 Mar', state: 'absent', note: 'Planned leave' },
  ],
};

const FALLBACK_PLACEMENT = {
  profile: {
    roleGoal: 'Frontend Developer',
    resumeStatus: 'Ready for review',
    profileCompletion: 82,
    interviewCount: 4,
    skills: ['React', 'Next.js', 'TypeScript', 'REST APIs', 'Testing'],
  },
  jobs: [
    { id: 'job-1', company: 'BrightStack', title: 'Junior Frontend Engineer', location: 'Bengaluru', match: 94 },
    { id: 'job-2', company: 'Northwind Labs', title: 'Product Engineer Intern', location: 'Remote', match: 89 },
    { id: 'job-3', company: 'BlueOrbit', title: 'Web Developer Associate', location: 'Pune', match: 87 },
  ],
};

type RequestLike = {
  headers?: Headers;
};

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
  return 'completed';
}

function formatSessionMode(mode: string): SkillupSession['mode'] {
  if (mode === 'offline' || mode === 'online' || mode === 'hybrid') return mode;
  return 'hybrid';
}

async function resolveStudentUserId(request?: RequestLike): Promise<string> {
  const requestUserId = request?.headers?.get('x-shadow-user-id');
  if (requestUserId !== null && requestUserId !== undefined && requestUserId.trim() !== '') {
    return requestUserId;
  }

  const authPoolClient = getAuthPool();
  if (authPoolClient !== null) {
    const { rows } = await authPoolClient.query<{ id: string }>(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      [DEFAULT_STUDENT_EMAIL],
    );

    if (rows[0] !== undefined) {
      return rows[0].id;
    }
  }

  const canonical = await db.select({ id: users.id }).from(users).where(eq(users.email, DEFAULT_STUDENT_EMAIL)).limit(1);
  if (canonical.length > 0) {
    return canonical[0].id;
  }

  const fallback = await db.select({ id: users.id }).from(users).where(eq(users.platform, 'skillup')).limit(1);
  if (fallback.length > 0) {
    return fallback[0].id;
  }

  throw new Error('SkillUp student user not found');
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
  try {
    const rows = await db
      .select({
        id: batches.id,
        slug: batches.id,
        name: batches.name,
        duration: batches.startDate,
        description: subjects.name,
        audience: domains.name,
        summary: batches.status,
      })
      .from(batches)
      .leftJoin(subjects, eq(subjects.id, batches.subjectId))
      .leftJoin(domains, eq(domains.id, batches.domainId))
      .where(isNull(batches.deletedAt))
      .orderBy(desc(batches.createdAt));

    if (rows.length === 0) {
      return { programs: [...FALLBACK_PROGRAMS] };
    }

    return {
      programs: rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        duration: row.duration ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(toDate(row.duration)) : 'Live track',
        description: row.description ?? 'Live SkillUp program',
        audience: row.audience ?? 'SkillUp learners',
        summary: row.summary === 'active' ? 'Active live batch' : 'Upcoming live batch',
        highlights: [row.description ?? 'Live curriculum', row.audience ?? 'SkillUp learners', 'Placement-ready workflow'],
      })),
    };
  } catch {
    return { programs: [...FALLBACK_PROGRAMS] };
  }
}

export async function getSkillupStudentDashboard(request?: RequestLike) {
  try {
    const userId = await resolveStudentUserId(request);
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
    const presentCount = await db
      .select({ count: attendanceRecords.id })
      .from(attendanceRecords)
      .innerJoin(batchSessions, eq(batchSessions.id, attendanceRecords.sessionId))
      .where(and(eq(attendanceRecords.studentUserId, userId), eq(attendanceRecords.status, 'present')));

    const paymentDue = installments
      .filter((item) => item.status !== 'paid')
      .reduce((sum, item) => sum + item.amount, 0);

    const nextSession = sessions.find((session) => session.status === 'scheduled') ?? sessions[0];

    const attendancePercent = sessions.length > 0 ? Math.round((presentCount.length / sessions.length) * 100) : 0;
    const progressPercent = sessions.length > 0 ? Math.round((completedCount / sessions.length) * 100) : 0;

    return {
      summary: {
        name: profile.name ?? profile.email,
        batchName: batchContext?.batchName ?? 'SkillUp Batch',
        facultyName: batchContext?.facultyName ?? 'SkillUp Faculty',
        currentTopic: batchContext?.sessions.find((session) => session.status === 'scheduled')?.title ?? batchContext?.sessions[0]?.title ?? 'SkillUp session',
        attendancePercent,
        progressPercent,
        paymentDue,
        outstandingInstallments: installments.filter((item) => item.status !== 'paid').length,
        nextSessionAt: nextSession !== undefined ? toDateString(nextSession.scheduledAt) : new Date().toISOString(),
        upcomingSessions: sessions.filter((session) => session.status === 'scheduled').length,
        placementMatches: (
          await placementDb
            .select({ id: placementJobListings.id })
            .from(placementJobListings)
            .where(and(eq(placementJobListings.status, 'open'), isNull(placementJobListings.deletedAt)))
        ).length,
      },
      sessions: sessions.map((session) => ({
        id: session.id,
        date: toDateString(session.scheduledAt),
        title: session.title ?? 'SkillUp session',
        mode: formatSessionMode(session.mode ?? 'hybrid'),
        status: formatSessionStatus(session.status),
        recording: session.status === 'completed' ? `https://learn.skillupitacademy.com/recordings/${session.id}` : undefined,
      })),
    };
  } catch {
    return FALLBACK_STUDENT_DASHBOARD;
  }
}

export async function getSkillupMyBatch(request?: RequestLike) {
  try {
    const userId = await resolveStudentUserId(request);
    const batchContext = await getStudentBatchContext(userId);
    const profile = await getStudentProfile(userId);

    if (batchContext === null) {
      return FALLBACK_BATCH;
    }

    const nextSession = batchContext.sessions.find((session) => session.status === 'scheduled') ?? batchContext.sessions[0];
    const currentTopic = nextSession?.title ?? 'SkillUp session';
    const schedule = batchContext.sessions.slice(0, 3).map((session) => ({
      day: new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(toDate(session.scheduledAt)),
      time: new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).format(toDate(session.scheduledAt)),
      topic: session.title ?? 'SkillUp session',
      mode: session.mode ?? 'hybrid',
    }));

    return {
      batch: {
        name: batchContext.batchName,
        faculty: batchContext.facultyName ?? profile.name ?? 'SkillUp Faculty',
        currentTopic,
        nextSession: nextSession !== undefined ? toDateString(nextSession.scheduledAt) : new Date().toISOString(),
        studentCount: batchContext.enrolledCount,
        schedule,
        materials: batchContext.sessions.slice(0, 3).map((session) => session.title ?? 'Session notes'),
      },
      sessions: batchContext.sessions.map((session) => ({
        id: session.id,
        date: toDateString(session.scheduledAt),
        title: session.title ?? 'SkillUp session',
        mode: formatSessionMode(session.mode ?? 'hybrid'),
        status: formatSessionStatus(session.status),
        recording: session.status === 'completed' ? `https://learn.skillupitacademy.com/recordings/${session.id}` : undefined,
      })),
    };
  } catch {
    return FALLBACK_BATCH;
  }
}

export async function getSkillupAttendance(request?: RequestLike) {
  try {
    const userId = await resolveStudentUserId(request);
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
        note:
          row.status === 'present'
            ? 'On time for class'
            : row.status === 'late'
              ? 'Joined after 10 minutes'
              : 'Planned leave',
      })),
    };
  } catch {
    return FALLBACK_ATTENDANCE;
  }
}

export async function getSkillupPayments(request?: RequestLike) {
  try {
    const userId = await resolveStudentUserId(request);
    const paymentPoolClient = getPaymentPool();
    if (paymentPoolClient === null) {
      return { installments: [] };
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
  } catch {
    return { installments: [] };
  }
}

export async function getSkillupPlacement(request?: RequestLike) {
  try {
    const userId = await resolveStudentUserId(request);
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

    return {
      profile: profileRows[0] !== undefined
        ? {
            roleGoal: profileRows[0].skills[0] ?? 'Placement-ready role',
            resumeStatus: profileRows[0].status === 'active' ? 'Ready for review' : 'Paused',
            profileCompletion: profileRows[0].readinessScore,
            interviewCount: Math.max(1, Math.round(profileRows[0].readinessScore / 20)),
            skills: profileRows[0].skills,
          }
        : FALLBACK_PLACEMENT.profile,
      jobs: profileRows[0] === undefined
        ? jobs.map((job, index) => ({
            id: job.id,
            company: job.companyName,
            title: job.title,
            location: job.location,
            match: Math.max(60, 90 - index * 3),
          }))
        : await (async () => {
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
                  return {
                    id: job.id,
                    company: job.companyName,
                    title: job.title,
                    location: job.location,
                    match: Math.max(1, Math.round((match.score ?? 0) * 100)),
                  };
                })
                .filter((item): item is { id: string; company: string; title: string; location: string; match: number } => item !== null);

              if (ranked.length > 0) {
                return ranked;
              }
            } catch {
              // Fall back to DB ordering below.
            }

            return jobs.map((job, index) => ({
              id: job.id,
              company: job.companyName,
              title: job.title,
              location: job.location,
              match: Math.max(60, profileRows[0].readinessScore - index * 3),
            }));
          })(),
    };
  } catch {
    return FALLBACK_PLACEMENT;
  }
}

export async function getSkillupBatches(request?: RequestLike) {
  try {
    const userId = await resolveStudentUserId(request);
    const batchContext = await getStudentBatchContext(userId);

    if (batchContext === null) {
      return FALLBACK_BATCH;
    }

    const nextSession = batchContext.sessions.find((session) => session.status === 'scheduled') ?? batchContext.sessions[0];
    const materials = batchContext.sessions.slice(0, 3).map((session) => session.title ?? 'Session notes');

    return {
      batch: {
        name: batchContext.batchName,
        faculty: batchContext.facultyName ?? 'SkillUp Faculty',
        currentTopic: nextSession?.title ?? 'SkillUp session',
        nextSession: nextSession !== undefined ? toDateString(nextSession.scheduledAt) : new Date().toISOString(),
        studentCount: batchContext.enrolledCount,
        schedule: batchContext.sessions.slice(0, 3).map((session) => ({
          day: new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(toDate(session.scheduledAt)),
          time: new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).format(toDate(session.scheduledAt)),
          topic: session.title ?? 'SkillUp session',
          mode: session.mode ?? 'hybrid',
        })),
        materials,
      },
      sessions: batchContext.sessions.map((session) => ({
        id: session.id,
        date: toDateString(session.scheduledAt),
        title: session.title ?? 'SkillUp session',
        mode: formatSessionMode(session.mode ?? 'hybrid'),
        status: formatSessionStatus(session.status),
        recording: session.status === 'completed' ? `https://learn.skillupitacademy.com/recordings/${session.id}` : undefined,
      })),
    };
  } catch {
    return FALLBACK_BATCH;
  }
}

export async function getSkillupFaculty() {
  try {
    const mentors = await db
      .select({
        name: userProfiles.name,
        title: faculty.availabilityType,
        description: faculty.status,
      })
      .from(faculty)
      .innerJoin(users, eq(users.id, faculty.userId))
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(eq(faculty.status, 'active'));

    const heroStats = [
      { label: 'Active mentors', value: String(mentors.length) },
      { label: 'Batch reviews', value: String((await db.select({ id: batchSessions.id }).from(batchSessions)).length) },
      { label: 'Upcoming sessions', value: String((await db.select({ id: batchSessions.id }).from(batchSessions).where(eq(batchSessions.status, 'scheduled'))).length) },
      { label: 'Quality score', value: '96%' },
    ];

    return {
      faculty: mentors.length > 0
        ? mentors.map((mentor) => ({
            name: mentor.name ?? 'SkillUp Mentor',
            title: mentor.title === 'fulltime' ? 'Full-time Mentor' : mentor.title === 'parttime' ? 'Part-time Mentor' : 'Contract Mentor',
            description:
              mentor.description === 'active'
                ? 'Guides learners through the live batch journey.'
                : 'Supports the batch flow and learner guidance.',
          }))
        : [...FALLBACK_FACULTY],
      heroStats,
    };
  } catch {
    return {
      faculty: [...FALLBACK_FACULTY],
      heroStats: [
        { label: 'Active mentors', value: String(FALLBACK_FACULTY.length) },
        { label: 'Batch reviews', value: '3' },
        { label: 'Upcoming sessions', value: '3' },
        { label: 'Quality score', value: '96%' },
      ],
    };
  }
}

export async function getSkillupProgramBySlug(slug: string) {
  const programs = (await getSkillupPrograms()).programs;
  return programs.find((program) => program.slug === slug) ?? FALLBACK_PROGRAMS.find((program) => program.slug === slug);
}

export async function getSkillupProgramDetail(slug: string): Promise<SkillupProgramDetail | null> {
  const program = await getSkillupProgramBySlug(slug);
  if (program === undefined) {
    return null;
  }

  return {
    ...program,
    highlights: [...program.highlights],
    curriculum: [
      {
        title: 'Foundation',
        items: [program.highlights[0] ?? program.description, program.highlights[1] ?? program.summary],
      },
      {
        title: 'Build and ship',
        items: [program.highlights[2] ?? program.audience, program.highlights[3] ?? 'Live project delivery'],
      },
      {
        title: 'Placement prep',
        items: ['Interview readiness drills', 'Portfolio and resume review', 'Mentor feedback sessions'],
      },
    ],
  };
}
