import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { DomainService, SubjectService } from '@/modules/domain/domain.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const domainId = searchParams.get('domainId');

    if (!domainId) {
      return NextResponse.json({ error: 'domainId is required' }, { status: 400 });
    }

    const subjects = await SubjectService.getSubjectsByDomain(domainId);
    return NextResponse.json(subjects);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
