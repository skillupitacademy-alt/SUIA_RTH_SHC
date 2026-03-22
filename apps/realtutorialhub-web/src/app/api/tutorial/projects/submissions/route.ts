import { NextRequest, NextResponse } from 'next/server';

import { AssignmentAuthError, requireStudent } from '@/lib/assignment-auth';
import { ProjectService } from '@/server/project.service';

export const dynamic = 'force-dynamic';

const projectService = new ProjectService();

export async function GET(req: NextRequest) {
  try {
    const session = await requireStudent(req);
    const data = await projectService.getMyProjects(session.userId);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    if (error instanceof AssignmentAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
