import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getSkillupProgramDetail } from '@/lib/skillup-data';

const paramsSchema = z.object({
  slug: z.string().min(1),
});

export async function GET(_request: NextRequest, context: { params: Promise<unknown> }) {
  const params = paramsSchema.safeParse(await context.params);
  if (!params.success) {
    return NextResponse.json({ error: 'Invalid program slug' }, { status: 400 });
  }

  const { slug } = params.data;
  const program = await getSkillupProgramDetail(slug);

  if (program === null) {
    return NextResponse.json({ error: 'Program not found' }, { status: 404 });
  }

  return NextResponse.json({ program });
}
