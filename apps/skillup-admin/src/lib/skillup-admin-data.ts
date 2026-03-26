import { desc, eq, isNull } from 'drizzle-orm';

import {
  admissions,
  authAuditLog,
  attendanceRecords,
  batches,
  batchEnrollments,
  batchSessions,
  enquiries,
  enquiryFollowUps,
  faculty,
  paymentInstallments,
  placementJobs,
  studentPlacementProfiles,
  domains,
  subjects,
  userProfiles,
  users,
  db,
} from '@quiz/db-people';

export type AdminStudentSummary = {
  id: string;
  userId: string;
  name: string;
  email: string;
  batchId: string;
  batchName: string;
  attendancePct: number;
  paymentStatus: 'current' | 'due' | 'overdue';
  upcomingSessionAt: string;
};

export type AdminEnquiryItem = {
  id: string;
  userId: string | null;
  studentName: string;
  email: string;
  phone: string;
  program: string;
  status: 'new' | 'contacted' | 'qualified' | 'lost';
  counsellor: string;
  createdAt: string;
};

export type AdminBatchSummary = {
  id: string;
  name: string;
  program: string;
  studentCount: number;
  facultyName: string;
  nextSessionAt: string;
  sessionTopic: string;
};

export type AdminPaymentItem = {
  id: string;
  studentName: string;
  installmentId: string;
  amount: string;
  dueDate: string;
  overdueDays: number;
  status: 'paid' | 'pending' | 'overdue';
  paymentRef: string;
};

export type AdminPlacementProfile = {
  id: string;
  userId: string;
  studentName: string;
  resumeStatus: string;
  targetRole: string;
  location: string;
  matchScore: number;
  status: 'ready' | 'in_review';
  jobMatches: string[];
};

export type AdminJobPosting = {
  id: string;
  title: string;
  company: string;
  location: string;
  skills: string[];
  applicants: number;
};

export type AdminActivityItem = {
  id: string;
  title: string;
  detail: string;
  tone: 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate';
  at: string;
};

export type AdminAuditEntry = {
  id: string;
  studentId: string;
  studentName: string;
  action: 'enrolled' | 'payment' | 'attendance';
  actor: string;
  platform: 'skillup-web' | 'skillup-admin' | 'faculty-app' | 'skillhubcore-admin';
  timestamp: string;
  before: Record<string, string | number | boolean | null>;
  after: Record<string, string | number | boolean | null>;
};

function toIso(value: Date | string | null | undefined): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return new Date(value).toISOString();
  return new Date().toISOString();
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

export async function listAdminStudents(): Promise<AdminStudentSummary[]> {
  const rows = await db
    .select({
      id: users.id,
      userId: users.id,
      name: userProfiles.name,
      email: users.email,
      batchId: batches.id,
      batchName: batches.name,
      enrolledCount: batches.enrolledCount,
      capacity: batches.capacity,
      status: batches.status,
      startDate: batches.startDate,
      paymentCount: paymentInstallments.id,
      admissionsStatus: admissions.status,
    })
    .from(admissions)
    .innerJoin(users, eq(users.id, admissions.studentUserId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .leftJoin(batches, eq(batches.id, admissions.batchId))
    .leftJoin(paymentInstallments, eq(paymentInstallments.studentUserId, users.id));

  return rows.map((row) => ({
    id: row.userId,
    userId: row.userId,
    name: row.name ?? row.email,
    email: row.email,
    batchId: row.batchId ?? 'unassigned',
    batchName: row.batchName ?? 'Unassigned',
    attendancePct: 80,
    paymentStatus: row.paymentCount ? 'current' : 'due',
    upcomingSessionAt: toIso(row.startDate),
  }));
}

export async function listAdminEnquiries(): Promise<AdminEnquiryItem[]> {
  const rows = await db
    .select({
      id: enquiries.id,
      userId: enquiries.assignedCounsellorId,
      studentName: enquiries.fullName,
      email: enquiries.email,
      phone: enquiries.phone,
      status: enquiries.status,
      createdAt: enquiries.createdAt,
      counsellor: userProfiles.name,
    })
    .from(enquiries)
    .leftJoin(users, eq(users.id, enquiries.assignedCounsellorId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(isNull(enquiries.deletedAt))
    .orderBy(desc(enquiries.createdAt));

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    studentName: row.studentName,
    email: row.email,
    phone: row.phone,
    program: 'SkillUp Program',
    status: row.status,
    counsellor: row.counsellor ?? 'Unassigned',
    createdAt: toIso(row.createdAt),
  }));
}

export async function listAdminBatches(): Promise<AdminBatchSummary[]> {
  const rows = await db
    .select({
      id: batches.id,
      name: batches.name,
      studentCount: batches.enrolledCount,
      facultyName: userProfiles.name,
      nextSessionAt: batches.startDate,
      status: batches.status,
    })
    .from(batches)
    .leftJoin(faculty, eq(faculty.id, batches.facultyId))
    .leftJoin(users, eq(users.id, faculty.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(isNull(batches.deletedAt))
    .orderBy(desc(batches.createdAt));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    program: 'SkillUp Program',
    studentCount: row.studentCount,
    facultyName: row.facultyName ?? 'Unassigned',
    nextSessionAt: toIso(row.nextSessionAt),
    sessionTopic: row.status === 'active' ? 'Live batch session' : 'Upcoming session',
  }));
}

export async function listAdminPayments(): Promise<AdminPaymentItem[]> {
  const rows = await db
    .select({
      id: paymentInstallments.id,
      label: paymentInstallments.label,
      dueDate: paymentInstallments.dueDate,
      amount: paymentInstallments.amount,
      status: paymentInstallments.status,
      paymentRef: paymentInstallments.paymentRef,
      studentName: userProfiles.name,
    })
    .from(paymentInstallments)
    .innerJoin(users, eq(users.id, paymentInstallments.studentUserId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .orderBy(paymentInstallments.dueDate);

  return rows.map((row) => ({
    id: row.id,
    studentName: row.studentName ?? 'Unknown student',
    installmentId: row.label,
    amount: `INR ${row.amount.toLocaleString('en-IN')}`,
    dueDate: toIso(row.dueDate).slice(0, 10),
    overdueDays: row.status === 'overdue' ? 14 : 0,
    status: row.status === 'paid' ? 'paid' : row.status === 'overdue' ? 'overdue' : 'pending',
    paymentRef: row.paymentRef ?? '-',
  }));
}

export async function listAdminPlacementProfiles(): Promise<AdminPlacementProfile[]> {
  const rows = await db
    .select({
      id: studentPlacementProfiles.id,
      userId: studentPlacementProfiles.userId,
      roleGoal: studentPlacementProfiles.roleGoal,
      resumeStatus: studentPlacementProfiles.resumeStatus,
      profileCompletion: studentPlacementProfiles.profileCompletion,
      skills: studentPlacementProfiles.skills,
      studentName: userProfiles.name,
    })
    .from(studentPlacementProfiles)
    .innerJoin(users, eq(users.id, studentPlacementProfiles.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .orderBy(desc(studentPlacementProfiles.createdAt));

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    studentName: row.studentName ?? 'Unknown student',
    resumeStatus: row.resumeStatus,
    targetRole: row.roleGoal,
    location: 'Remote',
    matchScore: row.profileCompletion,
    status: row.profileCompletion >= 80 ? 'ready' : 'in_review',
    jobMatches: row.skills,
  }));
}

export type AdminPlacementDetail = AdminPlacementProfile & {
  interviewCount: number;
  updatedAt: string;
  jobs: AdminJobPosting[];
};

export async function getAdminPlacementDetail(id: string): Promise<AdminPlacementDetail | undefined> {
  const [row] = await db
    .select({
      id: studentPlacementProfiles.id,
      userId: studentPlacementProfiles.userId,
      roleGoal: studentPlacementProfiles.roleGoal,
      resumeStatus: studentPlacementProfiles.resumeStatus,
      profileCompletion: studentPlacementProfiles.profileCompletion,
      interviewCount: studentPlacementProfiles.interviewCount,
      skills: studentPlacementProfiles.skills,
      updatedAt: studentPlacementProfiles.updatedAt,
      studentName: userProfiles.name,
    })
    .from(studentPlacementProfiles)
    .innerJoin(users, eq(users.id, studentPlacementProfiles.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(eq(studentPlacementProfiles.id, id))
    .limit(1);

  if (row === undefined) {
    return undefined;
  }

  const jobs = await listAdminJobPostings();

  return {
    id: row.id,
    userId: row.userId,
    studentName: row.studentName ?? 'Unknown student',
    resumeStatus: row.resumeStatus,
    targetRole: row.roleGoal,
    location: 'Remote',
    matchScore: row.profileCompletion,
    status: row.profileCompletion >= 80 ? 'ready' : 'in_review',
    jobMatches: row.skills,
    interviewCount: row.interviewCount,
    updatedAt: toIso(row.updatedAt),
    jobs,
  };
}

export async function listAdminJobPostings(): Promise<AdminJobPosting[]> {
  const rows = await db
    .select({
      id: placementJobs.id,
      title: placementJobs.title,
      company: placementJobs.company,
      location: placementJobs.location,
      matchScore: placementJobs.matchScore,
    })
    .from(placementJobs)
    .where(eq(placementJobs.isActive, true))
    .orderBy(desc(placementJobs.matchScore));

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    company: row.company,
    location: row.location,
    skills: ['React', 'TypeScript'],
    applicants: row.matchScore,
  }));
}

export type AdminStudentDetail = AdminStudentSummary & {
  enquiryId: string | null;
  counselor: string;
  enrollmentStage: 'enquired' | 'qualified' | 'admitted' | 'enrolled';
  attendanceHistory: Array<{ label: string; pct: number }>;
  payments: Array<{ installment: string; status: 'paid' | 'pending' | 'overdue'; amount: string; dueDate: string }>;
  batchHistory: Array<{ batchName: string; joinedAt: string; status: string }>;
};

export type AdminEnquiryDetail = AdminEnquiryItem & {
  timeline: Array<{ label: string; at: string; note: string }>;
  notes: string[];
  nextStep: string;
};

export type AdminBatchDetail = AdminBatchSummary & {
  schedule: Array<{ day: string; topic: string; time: string }>;
  students: Array<{ id: string; name: string; attendancePct: number }>;
  assignedFaculty: string;
  capacity: number;
};

export async function getAdminDashboardSummary() {
  const [students, batchesRows, payments, placements] = await Promise.all([
    db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.platform, 'skillup')),
    db
      .select({ id: batches.id })
      .from(batches)
      .where(isNull(batches.deletedAt)),
    db
      .select({ amount: paymentInstallments.amount, status: paymentInstallments.status })
      .from(paymentInstallments),
    db
      .select({ completion: studentPlacementProfiles.profileCompletion })
      .from(studentPlacementProfiles),
  ]);

  const totalRevenue = payments.filter((row) => row.status === 'paid').reduce((sum, row) => sum + row.amount, 0);
  const placementRate =
    placements.length === 0 ? 0 : Math.round((placements.filter((row) => row.completion >= 80).length / placements.length) * 100);

  return {
    totalStudents: students.length,
    activeBatches: batchesRows.length,
    monthlyRevenue: totalRevenue,
    placementRate,
  };
}

export async function listAdminActivityFeed(): Promise<AdminActivityItem[]> {
  const [latestAdmission, latestPayment, latestAudit] = await Promise.all([
    db
      .select({
        id: admissions.id,
        createdAt: admissions.createdAt,
        studentName: userProfiles.name,
      })
      .from(admissions)
      .innerJoin(users, eq(users.id, admissions.studentUserId))
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .orderBy(desc(admissions.createdAt))
      .limit(1),
    db
      .select({
        id: paymentInstallments.id,
        label: paymentInstallments.label,
        paymentRef: paymentInstallments.paymentRef,
        dueDate: paymentInstallments.dueDate,
      })
      .from(paymentInstallments)
      .where(eq(paymentInstallments.status, 'paid'))
      .orderBy(desc(paymentInstallments.createdAt))
      .limit(1),
    db
      .select({
        id: authAuditLog.id,
        action: authAuditLog.action,
        platform: authAuditLog.platform,
        success: authAuditLog.success,
        createdAt: authAuditLog.createdAt,
      })
      .from(authAuditLog)
      .orderBy(desc(authAuditLog.createdAt))
      .limit(1),
  ]);

  const items: AdminActivityItem[] = [];
  const admission = latestAdmission[0];
  if (admission !== undefined) {
    items.push({
      id: admission.id,
      title: 'Student enrolled',
      detail: `${admission.studentName ?? 'A student'} joined the active admissions flow.`,
      tone: 'cyan',
      at: toIso(admission.createdAt),
    });
  }

  const payment = latestPayment[0];
  if (payment !== undefined) {
    items.push({
      id: payment.id,
      title: 'Payment recorded',
      detail: `Installment ${payment.label} cleared with reference ${payment.paymentRef ?? '-'}.`,
      tone: 'emerald',
      at: toIso(payment.dueDate),
    });
  }

  const audit = latestAudit[0];
  if (audit !== undefined) {
    items.push({
      id: audit.id,
      title: audit.action,
      detail: `${audit.platform ?? 'skillup'} event ${audit.success === false ? 'failed' : 'completed'} successfully.`,
      tone: audit.success === false ? 'rose' : 'amber',
      at: toIso(audit.createdAt),
    });
  }

  return items.slice(0, 3);
}

export async function getAdminStudentDetail(id: string): Promise<AdminStudentDetail | undefined> {
  const [studentRow] = await db
    .select({
      userId: users.id,
      name: userProfiles.name,
      email: users.email,
      enquiryId: enquiries.id,
      batchId: batches.id,
      batchName: batches.name,
      batchStart: batches.startDate,
      admissionStatus: admissions.status,
      counsellorName: userProfiles.name,
    })
    .from(users)
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .leftJoin(admissions, eq(admissions.studentUserId, users.id))
    .leftJoin(batches, eq(batches.id, admissions.batchId))
    .leftJoin(enquiries, eq(enquiries.email, users.email))
    .where(eq(users.id, id))
    .limit(1);

  if (studentRow === undefined) {
    return undefined;
  }

  const [counsellorRow] = await db
    .select({
      name: userProfiles.name,
    })
    .from(enquiries)
    .leftJoin(users, eq(users.id, enquiries.assignedCounsellorId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(eq(enquiries.email, studentRow.email))
    .limit(1);

  const attendanceRows = await db
    .select({
      status: attendanceRecords.status,
      markedAt: attendanceRecords.markedAt,
    })
    .from(attendanceRecords)
    .where(eq(attendanceRecords.studentUserId, id))
    .orderBy(desc(attendanceRecords.markedAt))
    .limit(6);

  const paymentRows = await db
    .select({
      label: paymentInstallments.label,
      status: paymentInstallments.status,
      amount: paymentInstallments.amount,
      dueDate: paymentInstallments.dueDate,
    })
    .from(paymentInstallments)
    .where(eq(paymentInstallments.studentUserId, id))
    .orderBy(paymentInstallments.dueDate);

  const batchHistoryRows = await db
    .select({
      batchName: batches.name,
      joinedAt: batchEnrollments.enrolledAt,
      status: batchEnrollments.status,
    })
    .from(batchEnrollments)
    .innerJoin(batches, eq(batches.id, batchEnrollments.batchId))
    .where(eq(batchEnrollments.studentUserId, id))
    .orderBy(desc(batchEnrollments.enrolledAt));

  const attendedCount = attendanceRows.filter((row) => row.status === 'present').length;
  const attendancePct = attendanceRows.length === 0 ? 0 : Math.round((attendedCount / attendanceRows.length) * 100);

  return {
    id: studentRow.userId,
    userId: studentRow.userId,
    enquiryId: studentRow.enquiryId ?? null,
    name: studentRow.name ?? studentRow.email,
    email: studentRow.email,
    batchId: studentRow.batchId ?? 'unassigned',
    batchName: studentRow.batchName ?? 'Unassigned',
    attendancePct,
    paymentStatus: paymentRows.some((row) => row.status === 'overdue')
      ? 'overdue'
      : paymentRows.some((row) => row.status === 'due')
        ? 'due'
        : 'current',
    upcomingSessionAt: toIso(studentRow.batchStart),
    counselor: counsellorRow?.name ?? 'Unassigned',
    enrollmentStage:
      studentRow.admissionStatus === 'approved'
        ? 'enrolled'
        : studentRow.admissionStatus === 'pending'
          ? 'qualified'
          : 'enquired',
    attendanceHistory: attendanceRows.map((row, index) => ({
      label: `Record ${index + 1}`,
      pct: row.status === 'present' ? 100 : row.status === 'late' ? 70 : 0,
    })),
    payments: paymentRows.map((row) => ({
      installment: row.label,
      status: row.status === 'paid' ? 'paid' : row.status === 'overdue' ? 'overdue' : 'pending',
      amount: formatCurrency(row.amount),
      dueDate: toIso(row.dueDate).slice(0, 10),
    })),
    batchHistory: batchHistoryRows.map((row) => ({
      batchName: row.batchName,
      joinedAt: toIso(row.joinedAt).slice(0, 10),
      status: row.status,
    })),
  };
}

export async function getAdminEnquiryDetail(id: string): Promise<AdminEnquiryDetail | undefined> {
  const [row] = await db
    .select({
      id: enquiries.id,
      userId: enquiries.assignedCounsellorId,
      studentName: enquiries.fullName,
      email: enquiries.email,
      phone: enquiries.phone,
      status: enquiries.status,
      createdAt: enquiries.createdAt,
      notes: enquiries.notes,
      counsellor: userProfiles.name,
    })
    .from(enquiries)
    .leftJoin(users, eq(users.id, enquiries.assignedCounsellorId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(eq(enquiries.id, id))
    .limit(1);

  if (row === undefined) {
    return undefined;
  }

  const followUps = await db
    .select({
      followUpType: enquiryFollowUps.followUpType,
      notes: enquiryFollowUps.notes,
      nextFollowUpAt: enquiryFollowUps.nextFollowUpAt,
      createdAt: enquiryFollowUps.createdAt,
    })
    .from(enquiryFollowUps)
    .where(eq(enquiryFollowUps.enquiryId, id))
    .orderBy(desc(enquiryFollowUps.createdAt));

  const notes = [row.notes, ...followUps.map((followUp) => followUp.notes).filter((note): note is string => typeof note === 'string')].filter(
    (note): note is string => typeof note === 'string' && note.length > 0
  );

  return {
    id: row.id,
    userId: row.userId,
    studentName: row.studentName,
    email: row.email,
    phone: row.phone,
    program: 'SkillUp Program',
    status: row.status,
    counsellor: row.counsellor ?? 'Unassigned',
    createdAt: toIso(row.createdAt),
    timeline: [
      { label: 'Enquiry received', at: toIso(row.createdAt), note: row.notes ?? 'Submitted from SkillUp landing page.' },
      ...followUps.map((followUp, index) => ({
        label: `${followUp.followUpType} ${index + 1}`.trim(),
        at: toIso(followUp.nextFollowUpAt ?? followUp.createdAt),
        note: followUp.notes ?? 'Follow-up logged.',
      })),
    ],
    notes,
    nextStep:
      row.status === 'new'
        ? 'Contact and qualify the enquiry'
        : row.status === 'contacted'
          ? 'Schedule a follow-up call'
          : row.status === 'qualified'
            ? 'Create admission and assign batch'
            : 'Archive or re-engage later',
  };
}

export async function getAdminBatchDetail(id: string): Promise<AdminBatchDetail | undefined> {
  const [row] = await db
    .select({
      id: batches.id,
      name: batches.name,
      studentCount: batches.enrolledCount,
      facultyName: userProfiles.name,
      nextSessionAt: batches.startDate,
      capacity: batches.capacity,
      domainName: domains.name,
      subjectName: subjects.name,
    })
    .from(batches)
    .leftJoin(faculty, eq(faculty.id, batches.facultyId))
    .leftJoin(users, eq(users.id, faculty.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .leftJoin(domains, eq(domains.id, batches.domainId))
    .leftJoin(subjects, eq(subjects.id, batches.subjectId))
    .where(eq(batches.id, id))
    .limit(1);

  if (row === undefined) {
    return undefined;
  }

  const sessions = await db
    .select({
      id: batchSessions.id,
      scheduledAt: batchSessions.scheduledAt,
      durationMinutes: batchSessions.durationMinutes,
      sessionNotes: batchSessions.sessionNotes,
      status: batchSessions.status,
    })
    .from(batchSessions)
    .where(eq(batchSessions.batchId, id))
    .orderBy(batchSessions.scheduledAt);

  const students = await db
    .select({
      id: users.id,
      name: userProfiles.name,
    })
    .from(batchEnrollments)
    .innerJoin(users, eq(users.id, batchEnrollments.studentUserId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(eq(batchEnrollments.batchId, id))
    .orderBy(desc(batchEnrollments.enrolledAt));

  return {
    id: row.id,
    name: row.name,
    program: 'SkillUp Program',
    studentCount: row.studentCount,
    facultyName: row.facultyName ?? 'Unassigned',
    nextSessionAt: toIso(sessions[0]?.scheduledAt ?? row.nextSessionAt ?? new Date()),
    sessionTopic: sessions[0]?.sessionNotes ?? 'Upcoming session',
    schedule: sessions.map((session) => ({
      day: session.scheduledAt.toLocaleDateString('en-US', { weekday: 'long' }),
      topic: session.sessionNotes ?? `${session.durationMinutes} minute session`,
      time: session.scheduledAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    })),
    students: students.map((student) => ({
      id: student.id,
      name: student.name ?? 'Unknown student',
      attendancePct: 100,
    })),
    assignedFaculty: row.facultyName ?? 'Unassigned',
    capacity: row.capacity,
  };
}

export async function listAdminAuditLog(filters: {
  student?: string;
  action?: string;
  from?: string;
  to?: string;
}) {
  const rows = await db
    .select({
      id: authAuditLog.id,
      actorId: authAuditLog.actorId,
      action: authAuditLog.action,
      platform: authAuditLog.platform,
      success: authAuditLog.success,
      metadata: authAuditLog.metadata,
      createdAt: authAuditLog.createdAt,
      actorName: userProfiles.name,
    })
    .from(authAuditLog)
    .leftJoin(users, eq(users.id, authAuditLog.actorId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .orderBy(desc(authAuditLog.createdAt))
    .limit(500);

  return rows
    .map((row) => ({
      id: row.id,
      studentId: String(row.metadata?.studentId ?? row.actorId ?? '-'),
      studentName: String(row.metadata?.studentName ?? row.actorName ?? 'System'),
      action: String(row.metadata?.action ?? row.action ?? 'event') as AdminAuditEntry['action'],
      actor: row.actorName ?? 'System',
      platform: (String(row.platform ?? 'skillup-admin') as AdminAuditEntry['platform']),
      timestamp: toIso(row.createdAt),
      before: (row.metadata?.before as Record<string, string | number | boolean | null>) ?? {},
      after: (row.metadata?.after as Record<string, string | number | boolean | null>) ?? {},
    }))
    .filter((entry) => {
      if (filters.student !== undefined && filters.student.length > 0) {
        const term = filters.student.toLowerCase();
        if (!entry.studentName.toLowerCase().includes(term) && !entry.studentId.toLowerCase().includes(term)) {
          return false;
        }
      }

      if (filters.action !== undefined && filters.action.length > 0 && entry.action !== filters.action) {
        return false;
      }

      if (filters.from !== undefined && filters.from.length > 0 && new Date(entry.timestamp).getTime() < new Date(filters.from).getTime()) {
        return false;
      }

      if (filters.to !== undefined && filters.to.length > 0) {
        const end = new Date(filters.to);
        end.setHours(23, 59, 59, 999);
        if (new Date(entry.timestamp).getTime() > end.getTime()) {
          return false;
        }
      }

      return true;
    });
}

export function serializeAdminAuditCsv(entries: AdminAuditEntry[]) {
  const rows = [
    'id,studentId,studentName,action,actor,platform,timestamp,before,after',
    ...entries.map((entry) =>
      [
        entry.id,
        entry.studentId,
        entry.studentName,
        entry.action,
        entry.actor,
        entry.platform,
        entry.timestamp,
        JSON.stringify(entry.before).split('"').join('""'),
        JSON.stringify(entry.after).split('"').join('""'),
      ]
        .map((value) => `"${value}"`)
        .join(',')
    ),
  ];

  return rows;
}
