import { NextResponse, type NextRequest } from 'next/server';
import { enforceBrandValidation } from '@quiz/auth';

import { getSkillupPrograms } from '@/lib/skillup-data';
import { extractAuthFromRequest } from '@/lib/auth';

/**
 * 🔐 GET /api/programs - List programs
 * 
 * SECURITY: Requires authentication + brand validation
 * RBAC: Any authenticated user can view programs
 */
export async function GET(req: NextRequest) {
  try {
    // 🔥 SECURITY FIX: Require authentication
    const auth = await extractAuthFromRequest(req);
    
    if (!auth || !auth.userId) {
      return NextResponse.json(
        { error: 'Unauthorized', reason: 'authentication_required' },
        { status: 401 }
      );
    }
    
    // 🔥 SECURITY FIX: Validate brand context
    enforceBrandValidation(auth, req);
    
    // ✅ Authenticated and brand-validated - proceed
    return NextResponse.json(await getSkillupPrograms());
  } catch (error) {
    if (error instanceof Error && error.name === 'BrandValidationError') {
      return NextResponse.json(
        { error: 'Forbidden', reason: 'brand_mismatch', message: error.message },
        { status: 403 }
      );
    }
    
    console.error('[API_PROGRAMS] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
