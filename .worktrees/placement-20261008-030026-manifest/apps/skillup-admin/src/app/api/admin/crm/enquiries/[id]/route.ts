import { NextRequest } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

import { jsonData, jsonError, parseJsonOrFormBody, requireAdminOrForbidden } from '@/lib/admin-bff';
import { db, enquiries, enquiryFollowUps } from '@quiz/db-people';
import { getAdminEnquiryDetail } from '@/lib/skillup-admin-data';

const enquirySchema = z.object({
  studentName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  status: z.enum(['new', 'contacted', 'qualified', 'lost']),
  notes: z.string().optional().default(''),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;

  const { id } = await context.params;
  const enquiry = await getAdminEnquiryDetail(id);
  if (enquiry === undefined) {
    return jsonError('Enquiry not found', 404);
  }

  const parsed = await parseJsonOrFormBody(request, enquirySchema);
  if (!parsed.ok) return parsed.response;

  await db.transaction(async (tx) => {
    await tx
      .update(enquiries)
      .set({
        fullName: parsed.data.studentName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        status: parsed.data.status,
        notes: parsed.data.notes,
        updatedAt: new Date(),
      })
      .where(eq(enquiries.id, id));

    await tx.insert(enquiryFollowUps).values({
      enquiryId: id,
      followUpType: 'update',
      notes: `Enquiry details updated to ${parsed.data.status}.`,
      nextFollowUpAt: new Date(),
    });
  });

  const updated = await getAdminEnquiryDetail(id);
  if (updated === undefined) {
    return jsonError('Enquiry not found', 404);
  }

  return jsonData({ updated: true, detail: updated }, 200);
}
