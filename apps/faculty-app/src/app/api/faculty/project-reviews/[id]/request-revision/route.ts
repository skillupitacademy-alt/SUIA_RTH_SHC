import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { findProjectReviewById } from '@/lib/faculty-demo-data';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  notes: z.string().min(1),
});

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const submission = findProjectReviewById(id);
  if (submission === undefined) {
    return NextResponse.json({ error: 'Project submission not found' }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }

  return NextResponse.json({ data: { ...submission, status: 'needs_review', reviewerNote: parsed.data.notes } }, { status: 200 });
}
