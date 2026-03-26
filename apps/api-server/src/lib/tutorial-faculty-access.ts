import {
  attendanceRecords as peopleAttendanceRecords,
  batchEnrollments,
  batches,
  batchSessions,
  db as peopleDb,
  faculty,
  getOrSetPeopleUserSubCache,
  userProfiles,
  users,
} from '@quiz/db-people';
import {
  assignmentHelpRequests,
  db as tutorialDb,
  liveSessionRequests,
  tutorialAssignments,
  tutorialProjects,
  tutorialProjectSubmissions,
  tutorialSubtopics,
} from '@quiz/db-tutorial';
import { and, asc, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export type FacultyAccess = {
  facultyId: string;
  userId: string;
};

export type FacultyReviewQueueItem = {
  id: string;
  studentId: string;
  studentName: string;
  projectName: string;
  status: string;
  submittedAt: string;
  aiFeedback: string;
  checklist: Array<{ label: string; passed: boolean }>;
};

export type FacultyHelpRequestItem = {
  id: string;
  studentId: string;
  studentName: string;
  subtopic: string;
  question: string;
  status: string;
  requestedAt: string;
  resolvedAt: string | null;
};

export type FacultyLiveSessionItem = {
  id: string;
  studentId: string;
  studentName: string;
  subtopic: string;
  doubtText: string;
  status: string;
  scheduledAt: string;
  batchName: string;
};

export type FacultyAssignmentItem = {
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
};

export type FacultyAttendanceStudent = {
  id: string;
  name: string;
  rollNumber: string;
  avatarUrl: string;
  present: boolean;
};

export type FacultyAttendanceRoster = {
  batchId: string;
  batchName: string;
  sessionId: string;
  sessionAt: string;
  roster: FacultyAttendanceStudent[];
};

export async function resolveFacultyAccess(request: NextRequest): Promise<FacultyAccess | null> {
  const userId = request.headers.get('x-user-id');
  if (userId === null || userId.trim().length === 0) {
    return null;
  }

  return getOrSetPeopleUserSubCache<FacultyAccess | null>(userId, async () => {
    const [row] = await peopleDb
      .select({
        userId: users.id,
        facultyId: faculty.id,
        role: users.role,
      })
      .from(users)
      .innerJoin(faculty, eq(faculty.userId, users.id))
      .where(and(eq(users.id, userId), isNull(users.deletedAt), isNull(faculty.deletedAt)))
      .limit(1);

    if (row === undefined) {
      return null;
    }

    if (row.role !== 'faculty' && row.role !== 'admin' && row.role !== 'super_admin') {
      return null;
    }

    return { facultyId: row.facultyId, userId: row.userId };
  });
}

async function getFacultyStudentIds(facultyId: string) {
  const rows = await peopleDb
    .select({ studentUserId: batchEnrollments.studentUserId })
    .from(batchEnrollments)
    .innerJoin(batches, eq(batches.id, batchEnrollments.batchId))
    .where(
      and(
        eq(batches.facultyId, facultyId),
        eq(batchEnrollments.status, 'active'),
        isNull(batchEnrollments.deletedAt),
        isNull(batches.deletedAt)
      )
    )
    .orderBy(asc(batchEnrollments.enrolledAt));

  return [...new Set(rows.map((row) => row.studentUserId))];
}

async function getStudentDirectory(studentIds: string[]) {
  if (studentIds.length === 0) {
    return new Map<string, { name: string; email: string }>();
  }

  const rows = await peopleDb
    .select({
      id: users.id,
      email: users.email,
      name: userProfiles.name,
    })
    .from(users)
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(inArray(users.id, studentIds));

  return new Map(rows.map((row) => [row.id, { name: row.name ?? row.email, email: row.email }]));
}

async function getStudentBatchNameMap(studentIds: string[]) {
  if (studentIds.length === 0) {
    return new Map<string, string>();
  }

  const rows = await peopleDb
    .select({
      studentUserId: batchEnrollments.studentUserId,
      batchName: batches.name,
      enrolledAt: batchEnrollments.enrolledAt,
    })
    .from(batchEnrollments)
    .innerJoin(batches, eq(batches.id, batchEnrollments.batchId))
    .where(and(inArray(batchEnrollments.studentUserId, studentIds), eq(batchEnrollments.status, 'active'), isNull(batchEnrollments.deletedAt), isNull(batches.deletedAt)))
    .orderBy(desc(batchEnrollments.enrolledAt));

  const map = new Map<string, string>();
  for (const row of rows) {
    if (map.has(row.studentUserId)) continue;
    map.set(row.studentUserId, row.batchName);
  }
  return map;
}

async function getSubtopicNameMap(subtopicIds: string[]) {
  if (subtopicIds.length === 0) {
    return new Map<string, string>();
  }

  const rows = await tutorialDb
    .select({
      id: tutorialSubtopics.id,
      name: tutorialSubtopics.name,
    })
    .from(tutorialSubtopics)
    .where(inArray(tutorialSubtopics.id, subtopicIds));

  return new Map(rows.map((row) => [row.id, row.name]));
}

async function getAssignmentHelpRequestCountMap(studentIds: string[]) {
  if (studentIds.length === 0) {
    return new Map<string, number>();
  }

  const rows = await tutorialDb
    .select({
      assignmentId: assignmentHelpRequests.assignmentId,
      count: sql<number>`count(*)`,
    })
    .from(assignmentHelpRequests)
    .where(and(inArray(assignmentHelpRequests.userId, studentIds), isNull(assignmentHelpRequests.deletedAt)))
    .groupBy(assignmentHelpRequests.assignmentId);

  return new Map(rows.map((row) => [row.assignmentId, Number(row.count)]));
}

async function getProjectTitleMap(projectIds: string[]) {
  if (projectIds.length === 0) {
    return new Map<string, string>();
  }

  const rows = await tutorialDb
    .select({
      id: tutorialProjects.id,
      title: tutorialProjects.title,
    })
    .from(tutorialProjects)
    .where(inArray(tutorialProjects.id, projectIds));

  return new Map(rows.map((row) => [row.id, row.title]));
}

export async function loadFacultyReviewQueue(access: FacultyAccess): Promise<FacultyReviewQueueItem[]> {
  const studentIds = await getFacultyStudentIds(access.facultyId);
  if (studentIds.length === 0) return [];

  const studentDirectory = await getStudentDirectory(studentIds);
  const submissions = await tutorialDb
    .select({
      id: tutorialProjectSubmissions.id,
      userId: tutorialProjectSubmissions.userId,
      projectId: tutorialProjectSubmissions.projectId,
      status: tutorialProjectSubmissions.status,
      submittedAt: tutorialProjectSubmissions.submittedAt,
      feedback: tutorialProjectSubmissions.feedback,
      aiReview: tutorialProjectSubmissions.aiReview,
      submissionContent: tutorialProjectSubmissions.submissionContent,
    })
    .from(tutorialProjectSubmissions)
    .where(and(inArray(tutorialProjectSubmissions.userId, studentIds), isNull(tutorialProjectSubmissions.deletedAt)))
    .orderBy(desc(tutorialProjectSubmissions.createdAt))
    .limit(50);

  const projectTitleMap = await getProjectTitleMap(submissions.map((row) => row.projectId));

  return submissions.map((row) => {
    const student = studentDirectory.get(row.userId);
    const checklistSource = row.submissionContent as { checklist?: Array<{ label?: string; passed?: boolean }> } | null;
    return {
      id: row.id,
      studentId: row.userId,
      studentName: student?.name ?? 'SkillUp Student',
      projectName: projectTitleMap.get(row.projectId) ?? 'Project submission',
      status: row.status,
      submittedAt: row.submittedAt?.toISOString() ?? new Date().toISOString(),
      aiFeedback:
        typeof row.feedback === 'string' && row.feedback.trim().length > 0
          ? row.feedback
          : 'Awaiting human review.',
      checklist: Array.isArray(checklistSource?.checklist)
        ? checklistSource!.checklist
            .map((item) => ({ label: item.label ?? 'Checklist item', passed: item.passed ?? false }))
            .filter((item) => item.label.length > 0)
        : [],
    };
  });
}

export async function loadFacultyHelpRequests(access: FacultyAccess): Promise<FacultyHelpRequestItem[]> {
  const studentIds = await getFacultyStudentIds(access.facultyId);
  if (studentIds.length === 0) return [];

  const studentDirectory = await getStudentDirectory(studentIds);
  const helpRows = await tutorialDb
    .select({
      id: assignmentHelpRequests.id,
      userId: assignmentHelpRequests.userId,
      assignmentId: assignmentHelpRequests.assignmentId,
      subtopicId: assignmentHelpRequests.subtopicId,
      question: assignmentHelpRequests.question,
      status: assignmentHelpRequests.status,
      resolvedAt: assignmentHelpRequests.resolvedAt,
      createdAt: assignmentHelpRequests.createdAt,
    })
    .from(assignmentHelpRequests)
    .where(and(inArray(assignmentHelpRequests.userId, studentIds), isNull(assignmentHelpRequests.deletedAt)))
    .orderBy(desc(assignmentHelpRequests.createdAt))
    .limit(50);

  const subtopicMap = await getSubtopicNameMap(helpRows.map((row) => row.subtopicId));
  return helpRows.map((row) => {
    const student = studentDirectory.get(row.userId);
    return {
      id: row.id,
      studentId: row.userId,
      studentName: student?.name ?? 'SkillUp Student',
      subtopic: subtopicMap.get(row.subtopicId) ?? 'Tutorial help',
      question: row.question,
      status: row.status,
      requestedAt: row.createdAt.toISOString(),
      resolvedAt: row.resolvedAt?.toISOString() ?? null,
    };
  });
}

export async function loadFacultyLiveSessions(access: FacultyAccess): Promise<FacultyLiveSessionItem[]> {
  const studentIds = await getFacultyStudentIds(access.facultyId);
  if (studentIds.length === 0) return [];

  const studentDirectory = await getStudentDirectory(studentIds);
  const batchNameMap = await getStudentBatchNameMap(studentIds);
  const rows = await tutorialDb
    .select({
      id: liveSessionRequests.id,
      studentId: liveSessionRequests.studentId,
      subtopicId: liveSessionRequests.subtopicId,
      doubtText: liveSessionRequests.doubtText,
      status: liveSessionRequests.status,
      meetingLink: liveSessionRequests.meetingLink,
      scheduledAt: liveSessionRequests.scheduledAt,
      createdAt: liveSessionRequests.createdAt,
    })
    .from(liveSessionRequests)
    .where(and(inArray(liveSessionRequests.studentId, studentIds), isNull(liveSessionRequests.deletedAt)))
    .orderBy(desc(liveSessionRequests.createdAt))
    .limit(50);

  const subtopicMap = await getSubtopicNameMap(rows.map((row) => row.subtopicId));
  return rows.map((row) => {
    const student = studentDirectory.get(row.studentId);
    return {
      id: row.id,
      studentId: row.studentId,
      studentName: student?.name ?? 'SkillUp Student',
      subtopic: subtopicMap.get(row.subtopicId) ?? 'Live session request',
      doubtText: row.doubtText ?? 'Student requested a live session.',
      status: row.status,
      scheduledAt: row.scheduledAt?.toISOString() ?? new Date().toISOString(),
      batchName: batchNameMap.get(row.studentId) ?? 'SkillUp Batch',
    };
  });
}

export async function loadFacultyAssignments(access: FacultyAccess): Promise<FacultyAssignmentItem[]> {
  const studentIds = await getFacultyStudentIds(access.facultyId);
  if (studentIds.length === 0) {
    return [];
  }

  const [rows, helpRequestCounts] = await Promise.all([
    tutorialDb
      .select({
        id: tutorialAssignments.id,
        title: tutorialAssignments.title,
        question: tutorialAssignments.question,
        subtopicId: tutorialAssignments.subtopicId,
        difficulty: tutorialAssignments.difficulty,
        questionType: tutorialAssignments.questionType,
        points: tutorialAssignments.points,
        isPublished: tutorialAssignments.isPublished,
        createdAt: tutorialAssignments.createdAt,
        updatedAt: tutorialAssignments.updatedAt,
      })
      .from(tutorialAssignments)
      .where(isNull(tutorialAssignments.deletedAt))
      .orderBy(desc(tutorialAssignments.createdAt))
      .limit(50),
    getAssignmentHelpRequestCountMap(studentIds),
  ]);

  const subtopicMap = await getSubtopicNameMap(rows.map((row) => row.subtopicId));

  return rows.map((row) => ({
    id: row.id,
    title: row.title?.trim().length ? row.title : 'Tutorial assignment',
    question: row.question?.trim().length ? row.question : 'Assignment question',
    subtopic: subtopicMap.get(row.subtopicId) ?? 'Tutorial subtopic',
    difficulty: row.difficulty,
    questionType: row.questionType,
    points: row.points,
    isPublished: row.isPublished,
    helpRequestCount: helpRequestCounts.get(row.id) ?? 0,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function updateFacultyLiveSession(
  access: FacultyAccess,
  requestId: string,
  data: {
    status?: 'pending' | 'accepted' | 'scheduled' | 'completed' | 'cancelled';
    meetingLink?: string | null;
    scheduledAt?: Date | null;
    cancelledReason?: string | null;
  }
) {
  const studentIds = await getFacultyStudentIds(access.facultyId);
  const [row] = await tutorialDb
    .update(liveSessionRequests)
    .set({
      status: data.status,
      meetingLink: data.meetingLink,
      scheduledAt: data.scheduledAt,
      cancelledReason: data.cancelledReason,
      updatedAt: new Date(),
    })
    .where(and(eq(liveSessionRequests.id, requestId), inArray(liveSessionRequests.studentId, studentIds)))
    .returning({
      id: liveSessionRequests.id,
      studentId: liveSessionRequests.studentId,
      subtopicId: liveSessionRequests.subtopicId,
      doubtText: liveSessionRequests.doubtText,
      status: liveSessionRequests.status,
      meetingLink: liveSessionRequests.meetingLink,
      scheduledAt: liveSessionRequests.scheduledAt,
      createdAt: liveSessionRequests.createdAt,
    });

  return row ?? null;
}

function buildAttendanceAvatar(seed: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="32" fill="#E0F2FE"/>
      <circle cx="32" cy="24" r="10" fill="#0EA5E9"/>
      <path d="M16 52c0-8.836 7.164-16 16-16s16 7.164 16 16" fill="#38BDF8"/>
      <text x="32" y="39" text-anchor="middle" font-size="14" font-family="Arial" fill="#0F172A">${seed.slice(0, 1).toUpperCase()}</text>
    </svg>`
  )}`;
}

export async function getFacultyAttendanceRoster(access: FacultyAccess, batchId: string, sessionId: string) {
  const [batchRow, sessionRow] = await Promise.all([
    peopleDb
      .select({
        id: batches.id,
        name: batches.name,
        facultyId: batches.facultyId,
      })
      .from(batches)
      .where(and(eq(batches.id, batchId), eq(batches.facultyId, access.facultyId), isNull(batches.deletedAt)))
      .limit(1),
    peopleDb
      .select({
        id: batchSessions.id,
        scheduledAt: batchSessions.scheduledAt,
      })
      .from(batchSessions)
      .where(and(eq(batchSessions.id, sessionId), eq(batchSessions.batchId, batchId)))
      .limit(1),
  ]);

  if (batchRow[0] === undefined || sessionRow[0] === undefined) {
    return null;
  }

  const rosterRows = await peopleDb
    .select({
      studentUserId: batchEnrollments.studentUserId,
      studentName: userProfiles.name,
      attendanceStatus: peopleAttendanceRecords.status,
    })
    .from(batchEnrollments)
    .innerJoin(users, eq(users.id, batchEnrollments.studentUserId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .leftJoin(
      peopleAttendanceRecords,
      and(eq(peopleAttendanceRecords.studentUserId, batchEnrollments.studentUserId), eq(peopleAttendanceRecords.sessionId, sessionId))
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
      avatarUrl: buildAttendanceAvatar(row.studentName ?? 'S'),
      present: row.attendanceStatus !== 'absent',
    })),
  };
}

export async function upsertFacultyAttendance(
  access: FacultyAccess,
  batchId: string,
  sessionId: string,
  attendanceRecordsPayload: Array<{ studentId: string; present: boolean }>
) {
  const roster = await getFacultyAttendanceRoster(access, batchId, sessionId);
  if (roster === null) {
    return null;
  }

  for (const record of attendanceRecordsPayload) {
    await peopleDb
      .insert(peopleAttendanceRecords)
      .values({
        sessionId,
        studentUserId: record.studentId,
        status: record.present ? 'present' : 'absent',
        markedBy: access.facultyId,
        markedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [peopleAttendanceRecords.sessionId, peopleAttendanceRecords.studentUserId],
        set: {
          status: record.present ? 'present' : 'absent',
          markedBy: access.facultyId,
          markedAt: new Date(),
        },
      });
  }

  return roster.roster.length;
}

export async function markFacultyHelpRequest(
  access: FacultyAccess,
  requestId: string,
  status: 'open' | 'in_progress' | 'resolved',
  resolvedAt?: Date | null
) {
  const studentIds = await getFacultyStudentIds(access.facultyId);
  const [row] = await tutorialDb
    .update(assignmentHelpRequests)
    .set({
      status,
      resolvedAt: status === 'resolved' ? resolvedAt ?? new Date() : null,
      updatedAt: new Date(),
    })
    .where(and(eq(assignmentHelpRequests.id, requestId), inArray(assignmentHelpRequests.userId, studentIds)))
    .returning({ id: assignmentHelpRequests.id, status: assignmentHelpRequests.status, resolvedAt: assignmentHelpRequests.resolvedAt });

  return row ?? null;
}

export async function decideFacultyProjectSubmission(
  access: FacultyAccess,
  submissionId: string,
  decision: 'approve' | 'request_revision',
  notes?: string | null
) {
  const studentIds = await getFacultyStudentIds(access.facultyId);
  const status = decision === 'approve' ? 'approved' : 'revision-requested';
  const [row] = await tutorialDb
    .update(tutorialProjectSubmissions)
    .set({
      status,
      feedback: notes ?? null,
      gradedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(tutorialProjectSubmissions.id, submissionId), inArray(tutorialProjectSubmissions.userId, studentIds)))
    .returning({
      id: tutorialProjectSubmissions.id,
      status: tutorialProjectSubmissions.status,
      feedback: tutorialProjectSubmissions.feedback,
    });

  return row ?? null;
}

export async function acceptFacultyLiveSession(access: FacultyAccess, requestId: string, meetingLink: string) {
  const studentIds = await getFacultyStudentIds(access.facultyId);
  const [row] = await tutorialDb
    .update(liveSessionRequests)
    .set({
      status: 'accepted',
      meetingLink,
      updatedAt: new Date(),
    })
    .where(and(eq(liveSessionRequests.id, requestId), inArray(liveSessionRequests.studentId, studentIds)))
    .returning({
      id: liveSessionRequests.id,
      studentId: liveSessionRequests.studentId,
      status: liveSessionRequests.status,
      meetingLink: liveSessionRequests.meetingLink,
      scheduledAt: liveSessionRequests.scheduledAt,
      doubtText: liveSessionRequests.doubtText,
      subtopicId: liveSessionRequests.subtopicId,
    });

  return row ?? null;
}
