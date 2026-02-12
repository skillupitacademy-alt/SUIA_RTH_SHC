import { type NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { DomainService } from '@/modules/domain/domain.service';

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const id = searchParams.get('id');

    if (id !== null && id !== '') {
      const hierarchy = await DomainService.getDomainHierarchy(id);
      return NextResponse.json(hierarchy);
    }

    const domains = await DomainService.getAllDomains();
    return NextResponse.json(domains);
  } catch (_error: unknown) {
    const errorMessage = _error instanceof Error ? _error.message : 'Failed to fetch domains';
    return NextResponse.json({ _error: errorMessage }, { status: 500 });
  }
}

export async function POST(_req: NextRequest) {
  try {
    const data = await _req.json();
    const domain = await DomainService.createDomain(data);
    return NextResponse.json(domain);
  } catch (_error: unknown) {
    const errorMessage = _error instanceof Error ? _error.message : 'Failed to create domain';
    return NextResponse.json({ _error: errorMessage }, { status: 400 });
  }
}
