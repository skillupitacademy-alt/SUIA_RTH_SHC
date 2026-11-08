import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { evaluateServerCookiesPageAccess } from '@/lib/server-page-auth';

const ClientShell = dynamic(() => import('../(admin)/ClientShell'), {
  ssr: true,
});

export default async function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const outcome = await evaluateServerCookiesPageAccess(cookieStore, '/questions');

  if (outcome.status === 'UNAUTHENTICATED') {
    redirect('/login');
  }

  if (outcome.status === 'FORBIDDEN') {
    redirect('/forbidden');
  }

  return (
    <AdminGuard>
      <ClientShell>{children}</ClientShell>
    </AdminGuard>
  );
}
