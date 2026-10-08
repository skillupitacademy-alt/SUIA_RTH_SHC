import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { enforceBrandValidation } from '@quiz/auth';

import { getSkillupProgramDetail } from '@/lib/skillup-data';
import { extractAuthFromRequest } from '@/lib/auth';

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
    // 🔥 SECURITY FIX: Require authentication
    const auth = await extractAuthFromRequest(request);
    
    if (!auth || !auth.userId) {
      return NextResponse.json(
        { error: 'Unauthorized', reason: 'authentication_required' },
        { status: 401 }
      );
    }
    
    // 🔥 SECURITY FIX: Validate brand context
    enforceBrandValidation(auth, request);
    
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

    return NextResponse.json({ program });
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
