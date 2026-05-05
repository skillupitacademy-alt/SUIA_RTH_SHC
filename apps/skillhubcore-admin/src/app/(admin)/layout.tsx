import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';

const ClientShell = dynamic(() => import('./ClientShell'), {
  ssr: true, // Keep SSR true since it's a layout shell
});

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <ClientShell>{children}</ClientShell>;
}
