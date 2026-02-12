import { type NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { SubjectService } from '@/modules/domain/domain.service';

export async function GET(_req: NextRequest) {
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
