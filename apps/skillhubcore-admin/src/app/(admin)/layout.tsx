import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { evaluateServerCookiesPageAccess } from '@/lib/server-page-auth';
import { sanitizeRedirectUrl } from '@/lib/sanitize-redirect';

const ClientShell = dynamic(() => import('./ClientShell'), {
  ssr: true,
});

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const headersList = await headers();
  const requestedPath = headersList.get('x-shc-pathname') || '/dashboard';
  const admissionAssertion = headersList.get('x-shc-admission-assertion');
  const outcome = await evaluateServerCookiesPageAccess(cookieStore, requestedPath, admissionAssertion);

  if (outcome.status === 'UNAUTHENTICATED') {
    const destination = sanitizeRedirectUrl(requestedPath, '/dashboard');
    const redirectParam = destination && destination !== '/dashboard' && destination !== '/'
      ? `?redirect=${encodeURIComponent(destination)}`
      : '';
    redirect(`/login${redirectParam}`);
  }

  if (outcome.status === 'FORBIDDEN') {
    redirect('/forbidden');
  }

  if (outcome.status === 'UNAVAILABLE') {
    // 🔒 G4 / R4-14: Fail closed with an error so Next.js does not render a 200 OK response shell
    throw new Error('Service Unavailable: Authentication service temporarily unavailable.');
  }

  return (
    <AdminGuard>
      <ClientShell>{children}</ClientShell>
    </AdminGuard>
  );
}
