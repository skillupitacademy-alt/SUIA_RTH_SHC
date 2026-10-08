import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';

const ClientShell = dynamic(() => import('./ClientShell'), {
  ssr: true, // Keep SSR true since it's a layout shell
});

import { AdminGuard } from '@/components/auth/AdminGuard';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <ClientShell>{children}</ClientShell>
    </AdminGuard>
  );
}
