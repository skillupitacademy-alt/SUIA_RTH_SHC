import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { AssignmentAuthError, requireStudent } from '@/lib/assignment-auth';
import { ProjectService } from '@/server/project.service';

export const dynamic = 'force-dynamic';

const projectService = new ProjectService();

const paramsSchema = z.object({
  projectId: z.string().uuid(),
});

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  let session;
  try {
    session = await requireStudent(req);
  } catch (error) {
    if (error instanceof AssignmentAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = await context.params;
  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid project id' }, { status: 400 });
  }

  const result = await projectService.getProject(parsed.data.projectId, session.userId);
  return NextResponse.json({ data: result }, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache',
    },
  });
}
