import { cookies } from 'next/headers';

export interface BackendAuthUserState {
  id: string;
  email: string;
  name?: string | null;
  onboarded?: boolean;
  onboardingCompleted?: boolean;
  fullName?: string | null;
  status?: string | null;
  educationLevel?: string | null;
  primaryGoal?: string | null;
  domain?: string | null;
  subDomain?: string | null;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | null;
  timeCommitment?: string | null;
  journeyStatus?: string | null;
  roles?: string[];
}

function getInternalApiBase(): string {
  const internal = process.env.INTERNAL_API_URL?.trim();
  const fallback = process.env.NEXT_PUBLIC_API_URL?.trim();
  const candidate = internal && internal.length > 0 ? internal : fallback;

  if (!candidate) {
    throw new Error('INTERNAL_API_URL or NEXT_PUBLIC_API_URL must be configured');
  }

  const normalized = candidate.replace(/\/+$/, '');
  return normalized.toLowerCase().endsWith('/api') ? normalized : `${normalized}/api`;
}

async function getCookieHeader(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');
}

export async function fetchBackendAuthState(): Promise<BackendAuthUserState | null> {
  const cookieHeader = await getCookieHeader();
  if (cookieHeader.length === 0) {
    return null;
  }

  try {
    const response = await fetch(`${getInternalApiBase()}/auth/me`, {
      headers: {
        Cookie: cookieHeader,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json().catch(() => null)) as { user?: BackendAuthUserState } | null;
    return payload?.user ?? null;
  } catch {
    return null;
  }
}
