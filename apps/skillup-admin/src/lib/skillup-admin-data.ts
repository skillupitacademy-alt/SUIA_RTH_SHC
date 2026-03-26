import { desc, eq, isNull } from 'drizzle-orm';

import {
  admissions,
  batches,
  enquiries,
  faculty,
  paymentInstallments,
  placementJobs,
  studentPlacementProfiles,
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
  studentName: string;
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

function toIso(value: Date | string | null | undefined): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return new Date(value).toISOString();
  return new Date().toISOString();
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
      roleGoal: studentPlacementProfiles.roleGoal,
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
    studentName: row.studentName ?? 'Unknown student',
    targetRole: row.roleGoal,
    location: 'Remote',
    matchScore: row.profileCompletion,
    status: row.profileCompletion >= 80 ? 'ready' : 'in_review',
    jobMatches: row.skills,
  }));
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
