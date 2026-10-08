import { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

import { jsonData, parseJsonOrFormBody, requireAdminOrForbidden } from '@/lib/admin-bff';
import { listAdminStudents } from '@/lib/skillup-admin-data';
import { admissions, db, enquiries, userProfiles, users } from '@quiz/db-people';

const createStudentSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  batchId: z.string().min(1),
  batchName: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;
  return jsonData(await listAdminStudents(), 200);
}

export async function POST(request: NextRequest) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;

  const parsed = await parseJsonOrFormBody(request, createStudentSchema);
  if (!parsed.ok) return parsed.response;

  const passwordHash = await bcrypt.hash('SkillUp@2025', 10);
  const [user] = await db
    .insert(users)
    .values({
      email: parsed.data.email,
      passwordHash,
      role: 'student',
      platform: 'skillup',
      isActive: true,
      deletedAt: null,
    })
    .returning({ id: users.id });

  const [enquiry] = await db
    .insert(enquiries)
    .values({
      fullName: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.email,
      source: 'walkin',
      status: 'qualified',
      notes: `Admitted from admin create flow for batch ${parsed.data.batchName}`,
      deletedAt: null,
    })
    .returning({ id: enquiries.id });

  await db.insert(userProfiles).values({ userId: user.id, name: parsed.data.name });
  await db.insert(admissions).values({
    enquiryId: enquiry.id,
    studentUserId: user.id,
    admissionType: 'training',
    status: 'approved',
    documents: {},
  });

  return jsonData(
    {
      id: user.id,
      userId: user.id,
      name: parsed.data.name,
      email: parsed.data.email,
      batchId: parsed.data.batchId,
      batchName: parsed.data.batchName,
      attendancePct: 0,
      paymentStatus: 'due',
      upcomingSessionAt: new Date().toISOString(),
    },
    201
  );
}
