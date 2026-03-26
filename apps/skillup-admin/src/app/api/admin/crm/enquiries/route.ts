import { NextRequest } from 'next/server';
import { z } from 'zod';
import { and, eq, isNull } from 'drizzle-orm';

import { jsonData, parseJsonOrFormBody, requireAdminOrForbidden } from '@/lib/admin-bff';
import { listAdminEnquiries } from '@/lib/skillup-admin-data';
import { enquiries, userProfiles, users, db } from '@quiz/db-people';

const createEnquirySchema = z.object({
  studentName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  program: z.string().min(2),
  counsellor: z.string().min(2),
});

export async function GET(request: NextRequest) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;
  return jsonData(await listAdminEnquiries(), 200);
}

export async function POST(request: NextRequest) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;

  const parsed = await parseJsonOrFormBody(request, createEnquirySchema);
  if (!parsed.ok) return parsed.response;

  const counsellor = await db
    .select({ id: users.id })
    .from(users)
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(and(eq(userProfiles.name, parsed.data.counsellor), isNull(users.deletedAt)))
    .limit(1);

  const [created] = await db
    .insert(enquiries)
    .values({
      fullName: parsed.data.studentName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      source: 'website',
      status: 'new',
      assignedCounsellorId: counsellor[0]?.id ?? null,
      notes: `Program: ${parsed.data.program}`,
      deletedAt: null,
    })
    .returning({ id: enquiries.id, fullName: enquiries.fullName, email: enquiries.email, phone: enquiries.phone });

  return jsonData(
    {
      id: created.id,
      userId: counsellor[0]?.id ?? null,
      studentName: created.fullName,
      email: created.email,
      phone: created.phone,
      program: parsed.data.program,
      status: 'new',
      counsellor: parsed.data.counsellor,
      createdAt: new Date().toISOString(),
    },
    201
  );
}
