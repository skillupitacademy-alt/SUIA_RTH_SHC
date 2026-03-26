import {
  skillupFacultyShowcase,
  skillupHeroStats,
  skillupPrograms,
  studentAttendanceHistory,
  studentBatchDetails,
  studentDashboardSummary,
  studentInstallments,
  studentJobMatches,
  studentPlacementProfile,
  studentSessions,
} from '@/lib/skillup-demo-data';
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
    const xUserId = requestHeaders.get('x-user-id');
    const cookie = requestHeaders.get('cookie');
    const portalIdentity = requestHeaders.get('x-portal-identity');

    if (xUserId) forwardedHeaders.set('x-user-id', xUserId);
    if (cookie) forwardedHeaders.set('cookie', cookie);
    if (portalIdentity) forwardedHeaders.set('x-portal-identity', portalIdentity);
  } catch {
    // Static build paths do not have a request scope. We keep the fetch attempt
    // for runtime rendering and fall back to local fixtures only when needed.
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
      return { programs: skillupPrograms } as T;
    }

    if (path === '/api/student/dashboard') return { summary: studentDashboardSummary, sessions: studentSessions } as T;
    if (path === '/api/student/my-batch') return { batch: studentBatchDetails, sessions: studentSessions } as T;
    if (path === '/api/student/attendance') return { history: studentAttendanceHistory } as T;
    if (path === '/api/student/payments') return { installments: studentInstallments } as T;
    if (path === '/api/student/placement') return { profile: studentPlacementProfile, jobs: studentJobMatches } as T;
    if (path === '/api/batches') return { batch: studentBatchDetails, sessions: studentSessions } as T;
    if (path === '/api/faculty') return { faculty: skillupFacultyShowcase, heroStats: skillupHeroStats } as T;

    throw new Error(`Failed to load SkillUp data from ${path}`);
  }
}
