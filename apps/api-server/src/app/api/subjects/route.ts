import { type NextRequest, NextResponse } from 'next/server';

import { withLogging } from '@/lib/withLogging';
import { SubjectService } from '@/modules/domain/domain.service';

export const dynamic = 'force-dynamic';

async function handler(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const domainId = searchParams.get('domainId');

    if (domainId === null || domainId === '') {
      return NextResponse.json({ _error: 'domainId is required' }, { status: 400 });
    }

    const subjects = await SubjectService.getSubjectsByDomain(domainId);
    return NextResponse.json(subjects);
  } catch (_error: unknown) {
    const errorMessage = _error instanceof Error ? _error.message : 'Failed to fetch subjects';
    return NextResponse.json({ _error: errorMessage }, { status: 500 });
  }
}

export const GET = withLogging(handler, { component: 'core', operation: 'get_subjects' });
