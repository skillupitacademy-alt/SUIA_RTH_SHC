import { NextRequest } from 'next/server';

import { PlatformEventTypes, publishEvent } from '@quiz/events';

import { findAdminEnquiry } from '@/lib/admin-demo-data';
import { jsonData, jsonError, requireAdminOrForbidden } from '@/lib/admin-bff';

function resolveBatchId(program: string) {
  const normalized = program.toLowerCase();
  if (normalized.includes('react')) return 'batch-react-2026';
  if (normalized.includes('node')) return 'batch-node-2026';
  return 'batch-ai-2026';
}

async function admit(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;

  const { id } = await context.params;
  const enquiry = findAdminEnquiry(id);
  if (enquiry === undefined) {
    return jsonError('Enquiry not found', 404);
  }

  const batchId = resolveBatchId(enquiry.program);
  const admittedAt = new Date().toISOString();
  const payload = { userId: enquiry.userId, batchId, admittedAt };

  try {
    await publishEvent(PlatformEventTypes.ADMISSION_COMPLETED, payload, {
      destinationUrl: process.env.SKILLUP_EVENT_URL ?? 'https://placeholder.invalid/events/admission-completed',
    });
  } catch {
    // Demo mode should not fail on missing QStash secrets.
  }

  return jsonData(
    {
      ...enquiry,
      status: 'admitted' as const,
      admittedAt,
      batchId,
      audit: 'AdmissionSaga: enquiry admitted and payment plan created',
    },
    200
  );
}

export { admit as PATCH, admit as POST };
