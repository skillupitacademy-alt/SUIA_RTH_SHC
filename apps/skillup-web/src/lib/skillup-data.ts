import { and, desc, eq, isNull } from 'drizzle-orm';

import {
  attendanceRecords,
  batchEnrollments,
  batchSessions,
  batches,
  paymentInstallments,
  placementJobs,
  studentPlacementProfiles,
  faculty,
  userProfiles,
  users,
  db,
} from '@quiz/db-people';

import { skillupPrograms } from '@/lib/skillup-demo-data';
import type { SkillupSession } from '@/lib/skillup-types';

const DEFAULT_STUDENT_EMAIL = 'student@skillupitacademy.com';

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
  const requestUserId = request?.headers?.get('x-user-id');
  if (requestUserId !== null && requestUserId !== undefined && requestUserId.trim() !== '') {
    return requestUserId;
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
  return { programs: skillupPrograms };
}

export async function getSkillupStudentDashboard(request?: RequestLike) {
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
      placementMatches: (await db.select({ id: placementJobs.id }).from(placementJobs).where(eq(placementJobs.isActive, true))).length,
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
}

export async function getSkillupMyBatch(request?: RequestLike) {
  const userId = await resolveStudentUserId(request);
  const batchContext = await getStudentBatchContext(userId);
  const profile = await getStudentProfile(userId);

  if (batchContext === null) {
    return {
      batch: {
        name: 'No batch assigned',
        faculty: 'SkillUp Faculty',
        currentTopic: 'No active session',
        nextSession: new Date().toISOString(),
        studentCount: 0,
        schedule: [],
        materials: [],
      },
      sessions: [],
    };
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
}

export async function getSkillupAttendance(request?: RequestLike) {
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
}

export async function getSkillupPayments(request?: RequestLike) {
  const userId = await resolveStudentUserId(request);
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

  return {
    installments: installments.map((item) => ({
      ...item,
      dueDate: toDate(item.dueDate).toISOString().slice(0, 10),
    })),
  };
}

export async function getSkillupPlacement(request?: RequestLike) {
  const userId = await resolveStudentUserId(request);
  const profile = await db
    .select({
      roleGoal: studentPlacementProfiles.roleGoal,
      resumeStatus: studentPlacementProfiles.resumeStatus,
      profileCompletion: studentPlacementProfiles.profileCompletion,
      interviewCount: studentPlacementProfiles.interviewCount,
      skills: studentPlacementProfiles.skills,
    })
    .from(studentPlacementProfiles)
    .where(eq(studentPlacementProfiles.userId, userId))
    .limit(1);

  const jobs = await db
    .select({
      id: placementJobs.id,
      company: placementJobs.company,
      title: placementJobs.title,
      location: placementJobs.location,
      match: placementJobs.matchScore,
    })
    .from(placementJobs)
    .where(eq(placementJobs.isActive, true))
    .orderBy(desc(placementJobs.matchScore));

  return {
    profile: profile[0] ?? {
      roleGoal: 'Frontend Developer',
      resumeStatus: 'Ready for review',
      profileCompletion: 0,
      interviewCount: 0,
      skills: [],
    },
    jobs,
  };
}

export async function getSkillupBatches(request?: RequestLike) {
  const userId = await resolveStudentUserId(request);
  const batchContext = await getStudentBatchContext(userId);

  if (batchContext === null) {
    return {
      batch: {
        name: 'No batch assigned',
        faculty: 'SkillUp Faculty',
        currentTopic: 'No active session',
        nextSession: new Date().toISOString(),
        studentCount: 0,
        schedule: [],
        materials: [],
      },
      sessions: [],
    };
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
}

export async function getSkillupFaculty() {
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
    faculty: mentors.map((mentor) => ({
      name: mentor.name ?? 'SkillUp Mentor',
      title: mentor.title === 'fulltime' ? 'Full-time Mentor' : mentor.title === 'parttime' ? 'Part-time Mentor' : 'Contract Mentor',
      description:
        mentor.description === 'active'
          ? 'Guides learners through the live batch journey.'
          : 'Supports the batch flow and learner guidance.',
    })),
    heroStats,
  };
}
