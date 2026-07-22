import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';

import { AdminGuard } from '@/components/auth/AdminGuard';

const ClientShell = dynamic(() => import('../(admin)/ClientShell'), {
  ssr: true,
});

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <ClientShell>{children}</ClientShell>
    </AdminGuard>
  );
}
