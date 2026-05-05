import type { ReactNode } from 'react';
import ClientShell from './ClientShell';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <ClientShell>{children}</ClientShell>;
}
