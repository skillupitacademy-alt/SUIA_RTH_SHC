import { NextRequest, NextResponse } from 'next/server';
import { withObservability } from '@/middleware/observability.middleware';
import { AssignmentAuthError, requireStudent } from '@/lib/assignment-auth';
import { ProjectService } from '@/server/project.service';

export const dynamic = 'force-dynamic';

const projectService = new ProjectService();

async function handler(req: NextRequest, obsCtx: any) {
  const { requestId } = obsCtx; // 🔥 Observability context
  
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

// 🔥 OBSERVABILITY: Wrap with withObservability for full request tracing
export const GET = withObservability(handler);
