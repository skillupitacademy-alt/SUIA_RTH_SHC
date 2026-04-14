import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { badRequest, notFound, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { type RequestBrand } from '@/lib/request-brand';
import { withLogging } from '@/lib/withLogging';
import { getAuthBrandContext, shouldUseBrandBinding } from '@/modules/auth/brand-db';
import { setOnboardingStateCookie } from '@/modules/auth/onboarding-state-cookie';
import { UserRepository } from '@/modules/auth/repositories/user.repository';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

export const dynamic = 'force-dynamic';

const onboardingSchema = z.object({
  fullName: z.string(),
  educationLevel: z.string(),
  status: z.enum(['student', 'professional']),
  primaryGoal: z.string(),
  domain: z.string(),
  subDomain: z.string().optional().default(''),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  timeCommitment: z.string(),
  journeyStatus: z.enum(['not_started', 'in_progress', 'skipped', 'completed']).default('completed'),
});

async function handler(request: NextRequest) {
  try {
    const token = container.get(TokenService).getAccessToken(request, { scope: 'user' });
    if (typeof token !== 'string' || token.trim().length === 0) {
      return ApiResponse.error(unauthorized('Unauthorized', 'UNAUTHORIZED'));
    }

    const payload = await container.get(TokenService).verifyUserAccessToken(token);
    const brand = ((payload.brand === 'skillup' ? 'skillup' : payload.brand === 'realtutorialhub' ? 'realtutorialhub' : undefined)
      ?? null) satisfies RequestBrand | null;
    if (brand === null) {
      return ApiResponse.error(unauthorized('Brand claim missing', 'UNAUTHORIZED'));
    }

    const parsed = onboardingSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return ApiResponse.error(badRequest('Invalid onboarding payload', 'BAD_REQUEST', parsed.error.issues));
    }

    const originalUserId =
      typeof payload.originalUserId === 'string' && payload.originalUserId.trim().length > 0
        ? payload.originalUserId
        : null;
    if (originalUserId === null) {
      return ApiResponse.error(unauthorized('Unauthorized', 'UNAUTHORIZED'));
    }

    const brandContext = getAuthBrandContext(brand);
    const baseRepo = container.get(UserRepository);
    const userRepo = shouldUseBrandBinding() && typeof baseRepo.withDb === 'function'
      ? baseRepo.withDb(brandContext.db, brandContext.tables)
      : baseRepo;

    const existingUser = await userRepo.findByIdWithDetails(originalUserId);
    if (existingUser === undefined) {
      return ApiResponse.error(notFound('User', originalUserId));
    }

    const updatedProfile = await userRepo.upsertOnboardingProfile(originalUserId, {
      ...parsed.data,
    });
    const onboardingCompleted = updatedProfile?.onboardingCompleted === true;

    const response = ApiResponse.success({
      success: true,
      onboardingCompleted,
      profile: updatedProfile,
    });
    setOnboardingStateCookie(response, request, onboardingCompleted);
    return response;
  } catch (error) {
    return ApiResponse.error(error, 400);
  }
}

export const POST = withLogging(handler, { component: 'auth', operation: 'submit_onboarding' });
