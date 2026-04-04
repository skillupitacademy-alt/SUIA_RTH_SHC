import {
  getSkillupFaculty,
  getSkillupProgramDetail,
  getSkillupPrograms,
  getSkillupAttendance,
  getSkillupStudentDashboard,
  getSkillupMyBatch,
  getSkillupPayments,
  getSkillupPlacement,
  getSkillupBatches,
} from '@/lib/skillup-data';
import { headers } from 'next/headers';

function resolveSkillupOrigin(): string {
  const candidate = process.env.NEXT_PUBLIC_WEB_APP_URL?.trim();
  if (candidate && candidate.length > 0) {
    return candidate.replace(/\/+$/, '');
  }

  return 'http://localhost:3004';
}

function toAbsoluteUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return new URL(path, resolveSkillupOrigin()).toString();
}

export async function fetchSkillupApi<T>(path: string): Promise<T> {
  const forwardedHeaders = new Headers();
  try {
    const requestHeaders = await headers();
    const xShadowUserId = requestHeaders.get('x-shadow-user-id');
    const xOriginalUserId = requestHeaders.get('x-original-user-id');
    const cookie = requestHeaders.get('cookie');
    const portalIdentity = requestHeaders.get('x-portal-identity');
    const brand = requestHeaders.get('x-brand');

    if (xShadowUserId) forwardedHeaders.set('x-user-id', xShadowUserId);
    if (xShadowUserId) forwardedHeaders.set('x-shadow-user-id', xShadowUserId);
    if (xOriginalUserId) forwardedHeaders.set('x-original-user-id', xOriginalUserId);
    if (cookie) forwardedHeaders.set('cookie', cookie);
    if (portalIdentity) forwardedHeaders.set('x-portal-identity', portalIdentity);
    if (brand) {
      forwardedHeaders.set('x-brand', brand);
      forwardedHeaders.set('x-platform', brand);
    }
  } catch {
    // Static build paths do not have a request scope. We keep the fetch attempt
    // for runtime rendering and fall back to live DB helpers only when needed.
  }

  try {
    const response = await fetch(toAbsoluteUrl(path), {
      cache: 'no-store',
      headers: forwardedHeaders,
    });

    if (!response.ok) {
      throw new Error(`Failed to load SkillUp data from ${path}`);
    }

    return (await response.json()) as T;
  } catch {
    if (path === '/api/programs') {
      return (await getSkillupPrograms()) as T;
    }

    if (path.startsWith('/api/programs/')) {
      const slug = path.replace('/api/programs/', '').split('/')[0];
      return ({ program: await getSkillupProgramDetail(slug) }) as T;
    }

    if (path === '/api/student/dashboard') return (await getSkillupStudentDashboard()) as T;
    if (path === '/api/student/my-batch') return (await getSkillupMyBatch()) as T;
    if (path === '/api/student/attendance') return (await getSkillupAttendance()) as T;
    if (path === '/api/student/payments') return (await getSkillupPayments()) as T;
    if (path === '/api/student/placement') return (await getSkillupPlacement()) as T;
    if (path === '/api/batches') return (await getSkillupBatches()) as T;
    if (path === '/api/faculty') return (await getSkillupFaculty()) as T;

    throw new Error(`Failed to load SkillUp data from ${path}`);
  }
}
