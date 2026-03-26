import { and, asc, desc, eq, gte, isNull, lt, sql } from 'drizzle-orm';

import {
  attendanceRecords,
  batchEnrollments,
  batchSessions,
  batches,
  db,
  domains,
  faculty,
  userProfiles,
  users,
} from '@quiz/db-people';

import { fetchFacultyUpstreamJson } from './faculty-api';

export interface FacultyBatchSummary {
  id: string;
  name: string;
  track: string;
  studentCount: number;
  nextSessionId: string;
  nextSessionAt: string;
  nextSessionTopic: string;
  progress: number;
}

export interface FacultyDashboardSummary {
  myBatches: number;
  sessionsToday: number;
  openHelpRequests: number;
  pendingProjectReviews: number;
  pendingSessionRequests: number;
}

export interface FacultyReviewQueueItem {
  id: string;
  studentId: string;
  studentName: string;
  projectName: string;
  status: string;
  submittedAt: string;
  aiFeedback: string;
  checklist: Array<{ label: string; passed: boolean }>;
}

export interface FacultyHelpRequestItem {
  id: string;
  studentId: string;
  studentName: string;
  subtopic: string;
  question: string;
  status: 'open' | 'in_progress' | 'resolved';
  requestedAt: string;
  resolvedAt: string | null;
}

export interface FacultyAttendanceStudent {
  id: string;
  name: string;
  rollNumber: string;
  avatarUrl: string;
  present: boolean;
}

export interface FacultySessionRequestItem {
  id: string;
  studentId: string;
  studentName: string;
  subtopic: string;
  doubtText: string;
  status: 'pending' | 'accepted' | 'scheduled' | 'completed' | 'cancelled';
  scheduledAt: string;
  batchName: string;
}

export interface FacultyAssignmentItem {
  id: string;
  title: string;
  question: string;
  subtopic: string;
  difficulty: string;
  questionType: string;
  points: number;
  isPublished: boolean;
  helpRequestCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FacultyUpcomingSessionItem {
  id: string;
  batchId: string;
  batchName: string;
  topic: string;
  sessionNotes: string;
  durationMinutes: number;
  scheduledAt: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  studentCount: number;
}

export interface FacultyAttendanceSummaryItem {
  batchId: string;
  batchName: string;
  sessionId: string;
  sessionAt: string;
  sessionTopic: string;
  studentCount: number;
  presentCount: number;
  absentCount: number;
}

async function getFacultyRow(userId: string) {
  const [row] = await db
    .select({
      id: faculty.id,
      userId: faculty.userId,
    })
    .from(faculty)
    .where(and(eq(faculty.userId, userId), isNull(faculty.deletedAt)))
    .limit(1);
  return row ?? null;
}

function formatSessionTopic(topic: string | null | undefined) {
  return topic?.trim().length ? topic : 'Next cohort session';
}

function toIso(value: Date | null | undefined) {
  return value instanceof Date ? value.toISOString() : new Date().toISOString();
}

function buildAvatar(seed: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="32" fill="#E0F2FE"/>
      <circle cx="32" cy="24" r="10" fill="#0EA5E9"/>
      <path d="M16 52c0-8.836 7.164-16 16-16s16 7.164 16 16" fill="#38BDF8"/>
      <text x="32" y="39" text-anchor="middle" font-size="14" font-family="Arial" fill="#0F172A">${seed.slice(0, 1).toUpperCase()}</text>
    </svg>`
  )}`;
}

async function fetchFacultyTutorialData<T>(userId: string, path: string): Promise<T | null> {
  return fetchFacultyUpstreamJson<T>({ 'x-user-id': userId }, path);
}

export async function getFacultyDashboardSummary(userId: string): Promise<FacultyDashboardSummary> {
  const facultyRow = await getFacultyRow(userId);
  if (facultyRow === null) {
    return {
      myBatches: 0,
      sessionsToday: 0,
      openHelpRequests: 0,
      pendingProjectReviews: 0,
      pendingSessionRequests: 0,
    };
  }

  const [batchRows, todaySessions, helpRequests, reviewQueue, sessionRequests] = await Promise.all([
    db.select({ id: batches.id }).from(batches).where(and(eq(batches.facultyId, facultyRow.id), isNull(batches.deletedAt))),
    db
      .select({ id: batchSessions.id })
      .from(batchSessions)
      .innerJoin(batches, eq(batchSessions.batchId, batches.id))
      .where(
        and(
          eq(batches.facultyId, facultyRow.id),
          gte(batchSessions.scheduledAt, new Date(new Date().setHours(0, 0, 0, 0))),
          lt(batchSessions.scheduledAt, new Date(new Date().setHours(24, 0, 0, 0)))
        )
      ),
    fetchFacultyTutorialData<{ data: FacultyHelpRequestItem[] }>(userId, '/api/tutorial/faculty/help-requests'),
    fetchFacultyTutorialData<{ data: FacultyReviewQueueItem[] }>(userId, '/api/tutorial/faculty/review-queue'),
    fetchFacultyTutorialData<{ data: FacultySessionRequestItem[] }>(userId, '/api/tutorial/faculty/live-sessions'),
  ]);

  return {
    myBatches: batchRows.length,
    sessionsToday: todaySessions.length,
    openHelpRequests: helpRequests?.data.filter((item) => item.status !== 'resolved').length ?? 0,
    pendingProjectReviews: reviewQueue?.data.length ?? 0,
    pendingSessionRequests: sessionRequests?.data.length ?? 0,
  };
}

export async function listFacultyBatches(userId: string): Promise<FacultyBatchSummary[]> {
  const facultyRow = await getFacultyRow(userId);
  if (facultyRow === null) {
    return [];
  }

  const batchRows = await db
    .select({
      id: batches.id,
      name: batches.name,
      startDate: batches.startDate,
      status: batches.status,
      subjectId: batches.subjectId,
      domainName: domains.name,
      trackName: sql<string | null>`null`,
    })
    .from(batches)
    .leftJoin(domains, eq(domains.id, batches.domainId))
    .where(and(eq(batches.facultyId, facultyRow.id), isNull(batches.deletedAt)))
    .orderBy(desc(batches.createdAt));

  const summaries: FacultyBatchSummary[] = [];

  for (const batch of batchRows) {
    const [enrollmentRows, sessionRows, nextSessionRows] = await Promise.all([
      db
        .select({ studentUserId: batchEnrollments.studentUserId })
        .from(batchEnrollments)
        .where(and(eq(batchEnrollments.batchId, batch.id), isNull(batchEnrollments.deletedAt))),
      db
        .select({
          id: batchSessions.id,
          scheduledAt: batchSessions.scheduledAt,
          status: batchSessions.status,
          sessionNotes: batchSessions.sessionNotes,
        })
        .from(batchSessions)
        .where(eq(batchSessions.batchId, batch.id))
        .orderBy(asc(batchSessions.scheduledAt)),
      db
        .select({
          id: batchSessions.id,
          scheduledAt: batchSessions.scheduledAt,
          sessionNotes: batchSessions.sessionNotes,
        })
        .from(batchSessions)
        .where(eq(batchSessions.batchId, batch.id))
        .orderBy(asc(batchSessions.scheduledAt))
        .limit(1),
    ]);

    const completedSessions = sessionRows.filter((session) => session.status === 'completed').length;
    const progress = sessionRows.length > 0 ? Math.round((completedSessions / sessionRows.length) * 100) : 0;
    const nextSession = nextSessionRows[0];

    summaries.push({
      id: batch.id,
      name: batch.name,
      track: batch.domainName ?? 'SkillUp',
      studentCount: enrollmentRows.length,
      nextSessionId: nextSessionRows[0]?.id ?? sessionRows[0]?.id ?? batch.id,
      nextSessionAt: toIso(nextSession?.scheduledAt ?? null),
      nextSessionTopic: formatSessionTopic(nextSession?.sessionNotes ?? null),
      progress,
    });
  }

  return summaries;
}

export async function getFacultyAttendanceRoster(userId: string, batchId: string, sessionId: string) {
  const facultyRow = await getFacultyRow(userId);
  if (facultyRow === null) {
    return null;
  }

  const [batchRow, sessionRow] = await Promise.all([
    db
      .select({ id: batches.id, name: batches.name })
      .from(batches)
      .where(and(eq(batches.id, batchId), eq(batches.facultyId, facultyRow.id), isNull(batches.deletedAt)))
      .limit(1),
    db
      .select({ id: batchSessions.id, scheduledAt: batchSessions.scheduledAt })
      .from(batchSessions)
      .where(and(eq(batchSessions.id, sessionId), eq(batchSessions.batchId, batchId)))
      .limit(1),
  ]);

  if (batchRow[0] === undefined || sessionRow[0] === undefined) {
    return null;
  }

  const rosterRows = await db
    .select({
      studentUserId: batchEnrollments.studentUserId,
      studentName: userProfiles.name,
      attendanceStatus: attendanceRecords.status,
    })
    .from(batchEnrollments)
    .innerJoin(users, eq(users.id, batchEnrollments.studentUserId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .leftJoin(
      attendanceRecords,
      and(eq(attendanceRecords.studentUserId, batchEnrollments.studentUserId), eq(attendanceRecords.sessionId, sessionId))
    )
    .where(and(eq(batchEnrollments.batchId, batchId), isNull(batchEnrollments.deletedAt)))
    .orderBy(asc(batchEnrollments.enrolledAt));

  return {
    batchId: batchRow[0].id,
    batchName: batchRow[0].name,
    sessionId: sessionRow[0].id,
    sessionAt: sessionRow[0].scheduledAt.toISOString(),
    roster: rosterRows.map((row, index) => ({
      id: row.studentUserId,
      name: row.studentName ?? 'SkillUp Student',
      rollNumber: `SK${String(index + 1).padStart(3, '0')}`,
      avatarUrl: buildAvatar(row.studentName ?? 'S'),
      present: row.attendanceStatus !== 'absent',
    })),
  };
}

export async function listFacultyReviewQueue(userId: string): Promise<FacultyReviewQueueItem[]> {
  const facultyRow = await getFacultyRow(userId);
  if (facultyRow === null) {
    return [];
  }

  const response = await fetchFacultyTutorialData<{ data: FacultyReviewQueueItem[] }>(userId, '/api/tutorial/faculty/review-queue');
  return response?.data ?? [];
}

export async function listFacultyProjectReviews(userId: string): Promise<FacultyReviewQueueItem[]> {
  return listFacultyReviewQueue(userId);
}

export async function listFacultyHelpRequests(userId: string): Promise<FacultyHelpRequestItem[]> {
  const facultyRow = await getFacultyRow(userId);
  if (facultyRow === null) {
    return [];
  }

  const response = await fetchFacultyTutorialData<{ data: FacultyHelpRequestItem[] }>(userId, '/api/tutorial/faculty/help-requests');
  return response?.data ?? [];
}

export async function listFacultySessionRequests(userId: string): Promise<FacultySessionRequestItem[]> {
  const facultyRow = await getFacultyRow(userId);
  if (facultyRow === null) {
    return [];
  }

  const response = await fetchFacultyTutorialData<{ data: FacultySessionRequestItem[] }>(userId, '/api/tutorial/faculty/live-sessions');
  return response?.data ?? [];
}

export async function listFacultyAssignments(userId: string): Promise<FacultyAssignmentItem[]> {
  const facultyRow = await getFacultyRow(userId);
  if (facultyRow === null) {
    return [];
  }

  const response = await fetchFacultyTutorialData<{ data: FacultyAssignmentItem[] }>(userId, '/api/tutorial/faculty/assignments');
  return response?.data ?? [];
}

export async function listFacultyUpcomingSessions(userId: string): Promise<FacultyUpcomingSessionItem[]> {
  const facultyRow = await getFacultyRow(userId);
  if (facultyRow === null) {
    return [];
  }

  const rows = await db
    .select({
      id: batchSessions.id,
      batchId: batchSessions.batchId,
      batchName: batches.name,
      scheduledAt: batchSessions.scheduledAt,
      durationMinutes: batchSessions.durationMinutes,
      status: batchSessions.status,
      sessionNotes: batchSessions.sessionNotes,
    })
    .from(batchSessions)
    .innerJoin(batches, eq(batches.id, batchSessions.batchId))
    .where(and(eq(batches.facultyId, facultyRow.id), isNull(batches.deletedAt)))
    .orderBy(asc(batchSessions.scheduledAt));

  const enrollmentCounts = await db
    .select({
      batchId: batchEnrollments.batchId,
      studentUserId: batchEnrollments.studentUserId,
    })
    .from(batchEnrollments)
    .innerJoin(batches, eq(batches.id, batchEnrollments.batchId))
    .where(and(eq(batches.facultyId, facultyRow.id), isNull(batchEnrollments.deletedAt), isNull(batches.deletedAt)));

  const studentCountMap = new Map<string, number>();
  for (const row of enrollmentCounts) {
    studentCountMap.set(row.batchId, (studentCountMap.get(row.batchId) ?? 0) + 1);
  }

  const upcoming = rows
    .filter((row) => row.status === 'scheduled' || row.status === 'completed' || row.status === 'cancelled')
    .slice(0, 12)
    .map((row) => ({
      id: row.id,
      batchId: row.batchId,
      batchName: row.batchName,
      topic: formatSessionTopic(row.sessionNotes),
      sessionNotes: row.sessionNotes ?? '',
      durationMinutes: row.durationMinutes,
      scheduledAt: toIso(row.scheduledAt),
      status: row.status,
      studentCount: studentCountMap.get(row.batchId) ?? 0,
    }));

  return upcoming;
}

export async function listFacultyAttendanceOverview(userId: string): Promise<FacultyAttendanceSummaryItem[]> {
  const facultyRow = await getFacultyRow(userId);
  if (facultyRow === null) {
    return [];
  }

  const batchRows = await db
    .select({
      batchId: batches.id,
      batchName: batches.name,
    })
    .from(batches)
    .where(and(eq(batches.facultyId, facultyRow.id), isNull(batches.deletedAt)))
    .orderBy(desc(batches.createdAt));

  const summaries: FacultyAttendanceSummaryItem[] = [];

  for (const batch of batchRows) {
    const [sessionRows, enrollmentRows] = await Promise.all([
      db
        .select({
          id: batchSessions.id,
          scheduledAt: batchSessions.scheduledAt,
          sessionNotes: batchSessions.sessionNotes,
          status: batchSessions.status,
        })
        .from(batchSessions)
        .where(eq(batchSessions.batchId, batch.batchId))
        .orderBy(desc(batchSessions.scheduledAt))
        .limit(3),
      db
        .select({
          studentUserId: batchEnrollments.studentUserId,
          attendanceStatus: attendanceRecords.status,
          sessionId: attendanceRecords.sessionId,
        })
        .from(batchEnrollments)
        .leftJoin(
          attendanceRecords,
          eq(attendanceRecords.studentUserId, batchEnrollments.studentUserId)
        )
        .where(and(eq(batchEnrollments.batchId, batch.batchId), isNull(batchEnrollments.deletedAt))),
    ]);

    for (const session of sessionRows) {
      const attendanceForSession = enrollmentRows.filter((row) => row.sessionId === session.id);
      const presentCount = attendanceForSession.filter((row) => row.attendanceStatus === 'present').length;
      const absentCount = attendanceForSession.filter((row) => row.attendanceStatus === 'absent').length;

      summaries.push({
        batchId: batch.batchId,
        batchName: batch.batchName,
        sessionId: session.id,
        sessionAt: toIso(session.scheduledAt),
        sessionTopic: formatSessionTopic(session.sessionNotes),
        studentCount: enrollmentRows.length,
        presentCount,
        absentCount,
      });
    }
  }

  return summaries;
}

export async function upsertFacultyAttendance(
  userId: string,
  batchId: string,
  sessionId: string,
  attendanceRecordsPayload: Array<{ studentId: string; present: boolean }>
) {
  const facultyRow = await getFacultyRow(userId);
  if (facultyRow === null) {
    return null;
  }

  const roster = await getFacultyAttendanceRoster(userId, batchId, sessionId);
  if (roster === null) {
    return null;
  }

  for (const record of attendanceRecordsPayload) {
    await db
      .insert(attendanceRecords)
      .values({
        sessionId,
        studentUserId: record.studentId,
        status: record.present ? 'present' : 'absent',
        markedBy: facultyRow.id,
        markedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [attendanceRecords.sessionId, attendanceRecords.studentUserId],
        set: {
          status: record.present ? 'present' : 'absent',
          markedBy: facultyRow.id,
          markedAt: new Date(),
        },
      });
  }

  return roster.roster.length;
}
