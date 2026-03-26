import { NextRequest } from 'next/server';

import { eq } from 'drizzle-orm';

import { jsonData, jsonError, requireAdminOrForbidden } from '@/lib/admin-bff';
import { enquiries, db, enquiryFollowUps } from '@quiz/db-people';
import { getAdminEnquiryDetail } from '@/lib/skillup-admin-data';

async function qualify(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;

  const { id } = await context.params;
  const enquiry = await getAdminEnquiryDetail(id);
  if (enquiry === undefined) {
    return jsonError('Enquiry not found', 404);
  }

  await db.transaction(async (tx) => {
    await tx
      .update(enquiries)
      .set({ status: 'qualified', updatedAt: new Date() })
      .where(eq(enquiries.id, id));

    await tx.insert(enquiryFollowUps).values({
      enquiryId: id,
      followUpType: 'qualification',
      notes: 'Qualification completed from admin workflow.',
      nextFollowUpAt: new Date(),
    });
  });

  const updated = await getAdminEnquiryDetail(id);
  return jsonData(
    updated ?? enquiry,
    200
  );
}

export { qualify as PATCH, qualify as POST };
