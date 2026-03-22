import { Client } from '@upstash/qstash';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { findProjectReviewById } from '@/lib/faculty-demo-data';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  notes: z.string().optional(),
});

const getQStash = () => {
  const token = process.env.QSTASH_TOKEN;
  if (typeof token !== 'string' || token.trim().length === 0) {
    throw new Error('QSTASH_TOKEN is required');
  }
  return new Client({ token });
};

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

  try {
    await getQStash().publishJSON({
      url: `${process.env.INTERNAL_API_URL ?? 'http://localhost:3001'}/api/workers/project-approved`,
      body: {
        id: crypto.randomUUID(),
        type: 'project.approved',
        correlationId: id,
        source: 'faculty-app',
        occurredAt: new Date().toISOString(),
        version: 1,
        data: {
          submissionId: id,
          notes: parsed.data.notes ?? null,
        },
      },
    });
  } catch {
    // Allow local demo use without QStash secrets.
  }

  return NextResponse.json({ data: { ...submission, status: 'approved' } }, { status: 200 });
}
