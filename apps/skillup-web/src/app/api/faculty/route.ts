import { NextResponse, type NextRequest } from 'next/server';
import { enforceBrandValidation } from '@quiz/auth';

import { getSkillupFaculty } from '@/lib/skillup-data';
import { extractAuthFromRequest } from '@/lib/auth';
import { requireStudentAuth } from '@/lib/student-auth';

/**
 * 🔐 GET /api/faculty - List faculty members
 * 
 * SECURITY: Requires authentication + brand validation
 * RBAC: Any authenticated user can view faculty list
 */
export async function GET(req?: NextRequest) {
  try {
    const effectiveReq = req ?? (new Request('https://user.skillupitacademy.com/api/faculty') as unknown as NextRequest);

    const hasCookiesApi = typeof (effectiveReq as { cookies?: { get?: unknown } })?.cookies?.get === 'function';
    let auth = hasCookiesApi ? await extractAuthFromRequest(effectiveReq) : { isAuthenticated: false };

    if (!auth || !auth.userId) {
      const studentAuth = await requireStudentAuth(effectiveReq);
      if (studentAuth.ok === false) {
        return NextResponse.json(
          { error: 'Unauthorized', reason: 'authentication_required' },
          { status: 401 }
        );
      }
      auth = {
        isAuthenticated: true,
        userId: studentAuth.userId,
        brand: (studentAuth.payload?.brand as 'skillup' | undefined) ?? 'skillup',
      };
    }

    if (req && hasCookiesApi) {
      enforceBrandValidation(auth, effectiveReq);
    } else if (auth.brand !== 'skillup') {
      return NextResponse.json(
        { error: 'Forbidden', reason: 'brand_mismatch', message: 'Invalid brand context' },
        { status: 403 }
      );
    }

    return NextResponse.json(await getSkillupFaculty(), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'BrandValidationError') {
      return NextResponse.json(
        { error: 'Forbidden', reason: 'brand_mismatch', message: error.message },
        { status: 403 }
      );
    }
    
    console.error('[API_FACULTY] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
