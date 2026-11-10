import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { evaluateServerCookiesPageAccess } from '@/lib/server-page-auth';
import { sanitizeRedirectUrl } from '@/lib/sanitize-redirect';

const ClientShell = dynamic(() => import('../(admin)/ClientShell'), {
  ssr: true,
});

export default async function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const headersList = await headers();
  const requestedPath = headersList.get('x-shc-pathname') || '/questions';
  const outcome = await evaluateServerCookiesPageAccess(cookieStore, requestedPath);

  if (outcome.status === 'UNAUTHENTICATED') {
    const destination = sanitizeRedirectUrl(requestedPath, '/questions');
    const redirectParam = destination && destination !== '/questions' && destination !== '/'
      ? `?redirect=${encodeURIComponent(destination)}`
      : '';
    redirect(`/login${redirectParam}`);
  }

  if (outcome.status === 'FORBIDDEN') {
    redirect('/forbidden');
  }

  if (outcome.status === 'UNAVAILABLE') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 text-center">
        <div className="max-w-md rounded-lg border border-amber-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">Service Temporarily Unavailable</h1>
          <p className="mt-2 text-sm text-gray-600">
            The authentication service is temporarily unavailable. Please try again shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminGuard>
      <ClientShell>{children}</ClientShell>
    </AdminGuard>
  );
}
