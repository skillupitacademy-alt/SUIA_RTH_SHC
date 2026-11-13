import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { enforceBrandValidation } from '@quiz/auth';

import { getSkillupProgramDetail } from '@/lib/skillup-data';
import { extractAuthFromRequest } from '@/lib/auth';
import { requireStudentAuth } from '@/lib/student-auth';

const paramsSchema = z.object({
  slug: z.string().min(1),
});

/**
 * 🔐 GET /api/programs/[slug] - Get program details
 * 
 * SECURITY: Requires authentication + brand validation
 * RBAC: Any authenticated user can view program details
 */
export async function GET(request: NextRequest, context: { params: Promise<unknown> }) {
  try {
    const hasCookiesApi = typeof (request as { cookies?: { get?: unknown } })?.cookies?.get === 'function';
    let auth = hasCookiesApi ? await extractAuthFromRequest(request) : { isAuthenticated: false };

    if (!auth || !auth.userId) {
      const studentAuth = await requireStudentAuth(request, { identity: 'learner' });
      if (studentAuth.ok === false) {
        return NextResponse.json(
          { error: 'Unauthorized', reason: 'authentication_required' },
          { status: 401 }
        );
      }
      auth = {
        isAuthenticated: true,
        userId: studentAuth.learnerUserId,
        brand: (studentAuth.payload?.brand as 'skillup' | undefined) ?? 'skillup',
      };
    }

    if (hasCookiesApi) {
      enforceBrandValidation(auth, request);
    } else if (auth.brand !== 'skillup') {
      return NextResponse.json(
        { error: 'Forbidden', reason: 'brand_mismatch', message: 'Invalid brand context' },
        { status: 403 }
      );
    }
    
    // Validate params
    const params = paramsSchema.safeParse(await context.params);
    if (!params.success) {
      return NextResponse.json({ error: 'Invalid program slug' }, { status: 400 });
    }

    const { slug } = params.data;
    const program = await getSkillupProgramDetail(slug);

    if (program === null) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    return NextResponse.json(
      { program },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    if (error instanceof Error && error.name === 'BrandValidationError') {
      return NextResponse.json(
        { error: 'Forbidden', reason: 'brand_mismatch', message: error.message },
        { status: 403 }
      );
    }
    
    console.error('[API_PROGRAMS_SLUG] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
