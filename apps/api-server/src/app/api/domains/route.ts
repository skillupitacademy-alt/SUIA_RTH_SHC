import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { DomainService } from '@/modules/domain/domain.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const hierarchy = await DomainService.getDomainHierarchy(id);
      return NextResponse.json(hierarchy);
    }

    const domains = await DomainService.getAllDomains();
    return NextResponse.json(domains);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const domain = await DomainService.createDomain(data);
    return NextResponse.json(domain);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
