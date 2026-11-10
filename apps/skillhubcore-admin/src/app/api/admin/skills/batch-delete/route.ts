import { requireAdminRequest } from '@/lib/admin-route-guard';
import { AcademicHierarchyService } from '@/lib/hierarchy/academic-hierarchy.service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const accessDenied = await requireAdminRequest(request);
  if (accessDenied) return accessDenied;

  try {
    const rawBody = await request.json();
    const result = await AcademicHierarchyService.batchDeleteSkills(rawBody);
    return NextResponse.json(
      result.status === 200 ? { message: result.message } : result,
      { status: result.status }
    );
  } catch (error) {
    console.error('Error batch deleting skills:', error);
    return NextResponse.json({ error: 'Failed to delete skills' }, { status: 500 });
  }
}
