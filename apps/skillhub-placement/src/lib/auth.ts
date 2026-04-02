import { cookies } from 'next/headers';

import { TokenService } from '@quiz/auth';

import { resolvePlacementBrand, type PlacementBrand } from '@/lib/brand';

export type PlacementViewer = {
  userId: string;
  brand: PlacementBrand;
  roles: string[];
};

export async function getPlacementViewer(): Promise<PlacementViewer | null> {
  const cookieStore = await cookies();
  const token =
    cookieStore.get('skillhubcore_accessToken')?.value ??
    cookieStore.get('accessToken')?.value;

  if (typeof token !== 'string' || token.trim().length === 0) {
    return null;
  }

  try {
    const payload = await TokenService.verifyUserAccessToken(token, { audience: 'user' });
    const userId =
      typeof payload.sub === 'string' && payload.sub.trim().length > 0
        ? payload.sub
        : typeof payload.userId === 'string' && payload.userId.trim().length > 0
          ? payload.userId
          : null;

    if (userId === null) {
      return null;
    }

    return {
      userId,
      brand: resolvePlacementBrand(typeof payload.brand === 'string' ? payload.brand : undefined),
      roles: Array.isArray(payload.roles) ? payload.roles : [],
    };
  } catch {
    return null;
  }
}
