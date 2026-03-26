import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { and, eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

const envCandidates = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '../../.env.local'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../.env'),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  }
}

import { db } from './db';
import {
  admissions,
  attendanceRecords,
  batchEnrollments,
  batchSessions,
  batches,
  demoSessions,
  domains,
  enquiries,
  enquiryFollowUps,
  faculty,
  facultyAvailability,
  paymentInstallments,
  platformAccess,
  placementJobs,
  studentPlacementProfiles,
  subtopics,
  subjects,
  subscriptions,
  topics,
  userProfiles,
  users,
} from './schema';
import { hierarchySeed } from './seed';

type SeedAccount = {
  email: string;
  password: string;
  name: string;
  role: 'student' | 'admin' | 'faculty';
  platform: 'skillup';
  isCanonical?: boolean;
};

export const skillupSeedAccounts: SeedAccount[] = [
  {
    email: 'student@skillupitacademy.com',
    password: 'SkillUp@2025',
    name: 'SkillUp Test Student',
    role: 'student',
    platform: 'skillup',
    isCanonical: true,
  },
  {
    email: 'admin@skillupitacademy.com',
    password: 'SkillUpAdmin@2025',
    name: 'SkillUp Test Admin',
    role: 'admin',
    platform: 'skillup',
    isCanonical: true,
  },
  {
    email: 'faculty@skillupitacademy.com',
    password: 'Faculty@2025',
    name: 'SkillUp Test Faculty',
    role: 'faculty',
    platform: 'skillup',
    isCanonical: true,
  },
  {
    email: 'skillup_student@test.com',
    password: 'SkillUp@2024',
    name: 'SkillUp Student',
    role: 'student',
    platform: 'skillup',
  },
  {
    email: 'skillup_admin@test.com',
    password: 'Admin@2024',
    name: 'SkillUp Admin',
    role: 'admin',
    platform: 'skillup',
  },
  {
    email: 'faculty@test.com',
    password: 'Faculty@2024',
    name: 'SkillUp Faculty',
    role: 'faculty',
    platform: 'skillup',
  },
  {
    email: 'student2@skillupitacademy.com',
    password: 'SkillUp@2025',
    name: 'SkillUp Demo Student 2',
    role: 'student',
    platform: 'skillup',
  },
];

const seedMeta = {
  domain: hierarchySeed.domain,
  subject: hierarchySeed.subject,
  topic: hierarchySeed.topic,
  subtopic: hierarchySeed.subtopic,
  batchName: 'SkillUp Full Stack Cohort 1',
  facultyName: 'SkillUp Faculty Mentor',
  enquiryEmail: 'prospect@skillupitacademy.com',
};

const hashPassword = async (password: string): Promise<string> => bcrypt.hash(password, 12);

async function upsertUser(account: SeedAccount): Promise<string> {
  const passwordHash = await hashPassword(account.password);
  const [row] = await db
    .insert(users)
    .values({
      email: account.email,
      passwordHash,
      role: account.role,
      platform: account.platform,
      isActive: true,
      deletedAt: null,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        passwordHash,
        role: account.role,
        platform: account.platform,
        isActive: true,
        deletedAt: null,
        updatedAt: new Date(),
      },
    })
    .returning({ id: users.id });

  return row.id;
}

async function upsertUserProfile(userId: string, name: string): Promise<void> {
  await db
    .insert(userProfiles)
    .values({ userId, name })
    .onConflictDoUpdate({
      target: userProfiles.userId,
      set: {
        name,
        updatedAt: new Date(),
      },
    });
}

async function upsertPlatformAccess(userId: string): Promise<void> {
  await db
    .insert(platformAccess)
    .values({
      userId,
      platform: 'skillup',
      deletedAt: null,
    })
    .onConflictDoUpdate({
      target: [platformAccess.userId, platformAccess.platform],
      set: {
        deletedAt: null,
        grantedAt: new Date(),
      },
    });
}

async function upsertSubscription(userId: string): Promise<void> {
  const existing = await db.select({ id: subscriptions.id }).from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);

  if (existing.length > 0) {
    await db
      .update(subscriptions)
      .set({
        planType: 'pro',
        features: ['live_training', 'placement'],
        status: 'active',
        deletedAt: null,
      })
      .where(eq(subscriptions.id, existing[0].id));
    return;
  }

  await db.insert(subscriptions).values({
    userId,
    planType: 'pro',
    features: ['live_training', 'placement'],
    status: 'active',
    deletedAt: null,
  });
}

async function upsertFacultyAvailability(facultyId: string): Promise<void> {
  const slots = [
    { dayOfWeek: 1, startTime: '10:00:00', endTime: '12:00:00' },
    { dayOfWeek: 3, startTime: '14:00:00', endTime: '16:00:00' },
  ];

  for (const slot of slots) {
    const existing = await db
      .select({ id: facultyAvailability.id })
      .from(facultyAvailability)
      .where(
        and(
          eq(facultyAvailability.facultyId, facultyId),
          eq(facultyAvailability.dayOfWeek, slot.dayOfWeek),
          eq(facultyAvailability.startTime, slot.startTime)
        )
      )
      .limit(1);

    const payload = {
      facultyId,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isBooked: false,
      bookedBatchId: null,
    };

    if (existing.length > 0) {
      await db.update(facultyAvailability).set(payload).where(eq(facultyAvailability.id, existing[0].id));
      continue;
    }

    await db.insert(facultyAvailability).values(payload);
  }
}

async function ensureHierarchySeed(): Promise<{
  domainId: string;
  subjectId: string;
  topicId: string;
  subtopicId: string;
}> {
  const [domain] = await db
    .insert(domains)
    .values(seedMeta.domain)
    .onConflictDoUpdate({
      target: domains.slug,
      set: {
        name: seedMeta.domain.name,
        description: seedMeta.domain.description,
        deletedAt: null,
      },
    })
    .returning({ id: domains.id });

  const [subject] = await db
    .insert(subjects)
    .values({ ...seedMeta.subject, domainId: domain.id })
    .onConflictDoUpdate({
      target: subjects.slug,
      set: {
        name: seedMeta.subject.name,
        description: seedMeta.subject.description,
        domainId: domain.id,
        deletedAt: null,
      },
    })
    .returning({ id: subjects.id });

  const [topic] = await db
    .insert(topics)
    .values({ ...seedMeta.topic, subjectId: subject.id })
    .onConflictDoUpdate({
      target: topics.slug,
      set: {
        name: seedMeta.topic.name,
        description: seedMeta.topic.description,
        subjectId: subject.id,
        deletedAt: null,
      },
    })
    .returning({ id: topics.id });

  const [subtopic] = await db
    .insert(subtopics)
    .values({ ...seedMeta.subtopic, topicId: topic.id })
    .onConflictDoUpdate({
      target: subtopics.slug,
      set: {
        name: seedMeta.subtopic.name,
        description: seedMeta.subtopic.description,
        topicId: topic.id,
        difficultyLevels: seedMeta.subtopic.difficultyLevels,
        deletedAt: null,
      },
    })
    .returning({ id: subtopics.id });

  return {
    domainId: domain.id,
    subjectId: subject.id,
    topicId: topic.id,
    subtopicId: subtopic.id,
  };
}

async function upsertFaculty(userId: string, specializationId: string): Promise<string> {
  const existing = await db.select({ id: faculty.id }).from(faculty).where(eq(faculty.userId, userId)).limit(1);
  const payload = {
    userId,
    specializations: [specializationId],
    availabilityType: 'fulltime' as const,
    status: 'active' as const,
    hourlyRate: '1500.00',
    ratingAvg: '4.90',
    totalSessions: 12,
    joinedAt: '2025-01-15',
    deletedAt: null,
  };

  if (existing.length > 0) {
    await db.update(faculty).set(payload).where(eq(faculty.id, existing[0].id));
    return existing[0].id;
  }

  const [row] = await db.insert(faculty).values(payload).returning({ id: faculty.id });
  return row.id;
}

async function upsertBatch(domainId: string, subjectId: string, facultyId: string): Promise<string> {
  const existing = await db.select({ id: batches.id }).from(batches).where(eq(batches.name, seedMeta.batchName)).limit(1);
  const payload = {
    name: seedMeta.batchName,
    domainId,
    subjectId,
    facultyId,
    startDate: '2025-04-01',
    endDate: '2025-06-30',
    capacity: 20,
    enrolledCount: 3,
    mode: 'hybrid' as const,
    status: 'active' as const,
    deletedAt: null,
  };

  if (existing.length > 0) {
    await db.update(batches).set(payload).where(eq(batches.id, existing[0].id));
    return existing[0].id;
  }

  const [row] = await db.insert(batches).values(payload).returning({ id: batches.id });
  return row.id;
}

async function upsertBatchSession(batchId: string, facultyId: string, scheduledAt: Date, status: 'scheduled' | 'completed', notes: string, subtopicId: string): Promise<string> {
  const existing = await db
    .select({ id: batchSessions.id })
    .from(batchSessions)
    .where(and(eq(batchSessions.batchId, batchId), eq(batchSessions.scheduledAt, scheduledAt)))
    .limit(1);

  const payload = {
    batchId,
    facultyId,
    scheduledAt,
    durationMinutes: 120,
    subtopicsCovered: [subtopicId],
    sessionNotes: notes,
    status,
  };

  if (existing.length > 0) {
    await db.update(batchSessions).set(payload).where(eq(batchSessions.id, existing[0].id));
    return existing[0].id;
  }

  const [row] = await db.insert(batchSessions).values(payload).returning({ id: batchSessions.id });
  return row.id;
}

async function upsertEnrollment(batchId: string, studentUserId: string, status: 'active' | 'dropped' | 'completed', droppedAt: Date | null = null): Promise<string> {
  const existing = await db
    .select({ id: batchEnrollments.id })
    .from(batchEnrollments)
    .where(and(eq(batchEnrollments.batchId, batchId), eq(batchEnrollments.studentUserId, studentUserId)))
    .limit(1);

  const payload = {
    batchId,
    studentUserId,
    enrolledAt: new Date('2025-03-25T00:00:00Z'),
    status,
    droppedAt,
    deletedAt: null,
  };

  if (existing.length > 0) {
    await db.update(batchEnrollments).set(payload).where(eq(batchEnrollments.id, existing[0].id));
    return existing[0].id;
  }

  const [row] = await db.insert(batchEnrollments).values(payload).returning({ id: batchEnrollments.id });
  return row.id;
}

async function upsertAttendance(sessionId: string, studentUserId: string, status: 'present' | 'absent' | 'late', markedBy: string): Promise<string> {
  const existing = await db
    .select({ id: attendanceRecords.id })
    .from(attendanceRecords)
    .where(and(eq(attendanceRecords.sessionId, sessionId), eq(attendanceRecords.studentUserId, studentUserId)))
    .limit(1);

  const payload = {
    sessionId,
    studentUserId,
    status,
    markedBy,
    markedAt: new Date('2025-04-03T09:15:00Z'),
  };

  if (existing.length > 0) {
    await db.update(attendanceRecords).set(payload).where(eq(attendanceRecords.id, existing[0].id));
    return existing[0].id;
  }

  const [row] = await db.insert(attendanceRecords).values(payload).returning({ id: attendanceRecords.id });
  return row.id;
}

async function upsertEnquiry(counsellorId: string): Promise<string> {
  const existing = await db.select({ id: enquiries.id }).from(enquiries).where(eq(enquiries.phone, '9000000001')).limit(1);
  const payload = {
    fullName: 'Prospect Student',
    email: seedMeta.enquiryEmail,
    phone: '9000000001',
    source: 'website' as const,
    utmSource: 'skillup-home',
    utmMedium: 'organic',
    utmCampaign: 'skillup-demo',
    status: 'qualified' as const,
    assignedCounsellorId: counsellorId,
    notes: 'Interested in full stack program',
    deletedAt: null,
  };

  if (existing.length > 0) {
    await db.update(enquiries).set(payload).where(eq(enquiries.id, existing[0].id));
    return existing[0].id;
  }

  const [row] = await db.insert(enquiries).values(payload).returning({ id: enquiries.id });
  return row.id;
}

async function upsertFollowUp(enquiryId: string, counsellorId: string): Promise<void> {
  const scheduledAt = new Date('2025-03-28T10:00:00Z');
  const existing = await db
    .select({ id: enquiryFollowUps.id })
    .from(enquiryFollowUps)
    .where(and(eq(enquiryFollowUps.enquiryId, enquiryId), eq(enquiryFollowUps.nextFollowUpAt, scheduledAt), eq(enquiryFollowUps.followUpType, 'call')))
    .limit(1);

  const payload = {
    enquiryId,
    counsellorId,
    followUpType: 'call',
    notes: 'Follow up after demo class',
    nextFollowUpAt: scheduledAt,
  };

  if (existing.length > 0) {
    await db.update(enquiryFollowUps).set(payload).where(eq(enquiryFollowUps.id, existing[0].id));
    return;
  }

  await db.insert(enquiryFollowUps).values(payload);
}

async function upsertDemoSession(enquiryId: string, facultyId: string): Promise<void> {
  const scheduledAt = new Date('2025-03-29T11:00:00Z');
  const existing = await db
    .select({ id: demoSessions.id })
    .from(demoSessions)
    .where(and(eq(demoSessions.enquiryId, enquiryId), eq(demoSessions.scheduledAt, scheduledAt)))
    .limit(1);

  const payload = {
    enquiryId,
    facultyId,
    scheduledAt,
    status: 'completed' as const,
    feedback: 'Positive demo, wants batch details',
  };

  if (existing.length > 0) {
    await db.update(demoSessions).set(payload).where(eq(demoSessions.id, existing[0].id));
    return;
  }

  await db.insert(demoSessions).values(payload);
}

async function upsertPaymentInstallment(studentUserId: string, label: string, dueDate: string, amount: number, status: 'paid' | 'due' | 'overdue', paymentRef?: string): Promise<void> {
  const existing = await db
    .select({ id: paymentInstallments.id })
    .from(paymentInstallments)
    .where(and(eq(paymentInstallments.studentUserId, studentUserId), eq(paymentInstallments.label, label), eq(paymentInstallments.dueDate, dueDate)))
    .limit(1);

  const payload = {
    studentUserId,
    label,
    dueDate,
    amount,
    status,
    paymentRef: paymentRef ?? null,
  };

  if (existing.length > 0) {
    await db.update(paymentInstallments).set(payload).where(eq(paymentInstallments.id, existing[0].id));
    return;
  }

  await db.insert(paymentInstallments).values(payload);
}

async function upsertPlacementProfile(studentUserId: string): Promise<void> {
  const existing = await db.select({ id: studentPlacementProfiles.id }).from(studentPlacementProfiles).where(eq(studentPlacementProfiles.userId, studentUserId)).limit(1);
  const payload = {
    userId: studentUserId,
    roleGoal: 'Frontend Developer',
    resumeStatus: 'Ready for review',
    profileCompletion: 82,
    interviewCount: 4,
    skills: ['React', 'Next.js', 'TypeScript', 'REST APIs', 'Testing'],
  };

  if (existing.length > 0) {
    await db.update(studentPlacementProfiles).set({ ...payload, updatedAt: new Date() }).where(eq(studentPlacementProfiles.id, existing[0].id));
    return;
  }

  await db.insert(studentPlacementProfiles).values(payload);
}

async function upsertPlacementJobs(): Promise<void> {
  const jobs = [
    { company: 'BrightStack', title: 'Junior Frontend Engineer', location: 'Bengaluru', matchScore: 94 },
    { company: 'Northwind Labs', title: 'Product Engineer Intern', location: 'Remote', matchScore: 89 },
    { company: 'BlueOrbit', title: 'Web Developer Associate', location: 'Pune', matchScore: 87 },
  ];

  for (const job of jobs) {
    const existing = await db
      .select({ id: placementJobs.id })
      .from(placementJobs)
      .where(and(eq(placementJobs.company, job.company), eq(placementJobs.title, job.title)))
      .limit(1);

    const payload = { ...job, isActive: true };
    if (existing.length > 0) {
      await db.update(placementJobs).set(payload).where(eq(placementJobs.id, existing[0].id));
      continue;
    }
    await db.insert(placementJobs).values(payload);
  }
}

async function upsertAdmission(enquiryId: string, studentUserId: string, domainId: string, batchId: string, approverId: string): Promise<void> {
  const existing = await db.select({ id: admissions.id }).from(admissions).where(eq(admissions.studentUserId, studentUserId)).limit(1);
  const payload = {
    enquiryId,
    studentUserId,
    admissionType: 'training' as const,
    domainId,
    batchId,
    status: 'approved' as const,
    admissionDate: new Date('2025-03-30T00:00:00Z'),
    documents: { idProof: true, photo: true },
    approvedBy: approverId,
    deletedAt: null,
  };

  if (existing.length > 0) {
    await db.update(admissions).set(payload).where(eq(admissions.id, existing[0].id));
    return;
  }

  await db.insert(admissions).values(payload);
}

export async function seedSkillupPeopleData(): Promise<void> {
  const hierarchy = await ensureHierarchySeed();

  const userIds = new Map<string, string>();
  for (const account of skillupSeedAccounts) {
    const userId = await upsertUser(account);
    userIds.set(account.email, userId);
    await upsertUserProfile(userId, account.name);
    await upsertPlatformAccess(userId);
    await upsertSubscription(userId);
  }

  const facultyUserId = userIds.get('faculty@skillupitacademy.com');
  const adminUserId = userIds.get('admin@skillupitacademy.com');
  const canonicalStudentId = userIds.get('student@skillupitacademy.com');
  const fallbackStudentId = userIds.get('skillup_student@test.com');
  const extraStudentId = userIds.get('student2@skillupitacademy.com');

  if (!facultyUserId || !adminUserId || !canonicalStudentId || !fallbackStudentId || !extraStudentId) {
    throw new Error('Missing seeded user ids');
  }

  const facultyId = await upsertFaculty(facultyUserId, hierarchy.domainId);
  await upsertFacultyAvailability(facultyId);
  const batchId = await upsertBatch(hierarchy.domainId, hierarchy.subjectId, facultyId);
  const sessionOneId = await upsertBatchSession(batchId, facultyId, new Date('2025-04-01T10:00:00Z'), 'completed', 'Introduction to full stack roadmap', hierarchy.subtopicId);
  const sessionTwoId = await upsertBatchSession(batchId, facultyId, new Date('2025-04-03T10:00:00Z'), 'completed', 'JavaScript async patterns', hierarchy.subtopicId);
  const sessionThreeId = await upsertBatchSession(batchId, facultyId, new Date('2025-04-05T10:00:00Z'), 'scheduled', 'API integration workshop', hierarchy.subtopicId);

  await upsertEnrollment(batchId, canonicalStudentId, 'active');
  await upsertEnrollment(batchId, fallbackStudentId, 'active');

  await upsertAttendance(sessionOneId, canonicalStudentId, 'present', facultyId);
  await upsertAttendance(sessionTwoId, canonicalStudentId, 'late', facultyId);
  await upsertAttendance(sessionThreeId, canonicalStudentId, 'absent', facultyId);

  await upsertPaymentInstallment(canonicalStudentId, 'Admission fee', '2026-01-15', 15000, 'paid', 'PAY-1001');
  await upsertPaymentInstallment(canonicalStudentId, 'Training fee - month 2', '2026-02-15', 15000, 'paid', 'PAY-1002');
  await upsertPaymentInstallment(canonicalStudentId, 'Training fee - month 3', '2026-03-10', 18000, 'overdue');
  await upsertPaymentInstallment(canonicalStudentId, 'Placement support fee', '2026-04-10', 12000, 'due');

  await upsertPlacementProfile(canonicalStudentId);
  await upsertPlacementJobs();

  const enquiryId = await upsertEnquiry(adminUserId);
  await upsertFollowUp(enquiryId, adminUserId);
  await upsertDemoSession(enquiryId, facultyId);
  await upsertAdmission(enquiryId, canonicalStudentId, hierarchy.domainId, batchId, adminUserId);

  const summary = {
    canonicalAccounts: skillupSeedAccounts.filter((account) => account.isCanonical).map((account) => account.email),
    demoAccounts: skillupSeedAccounts.filter((account) => !account.isCanonical).map((account) => account.email),
    hierarchy,
    batchId,
    facultyId,
    sessionIds: [sessionOneId, sessionTwoId, sessionThreeId],
    enquiryId,
  };

  console.log(JSON.stringify({ ok: true, summary }, null, 2));
}

if (process.argv[1] !== undefined && process.argv[1].endsWith('seed-skillup.ts')) {
  void seedSkillupPeopleData();
}
