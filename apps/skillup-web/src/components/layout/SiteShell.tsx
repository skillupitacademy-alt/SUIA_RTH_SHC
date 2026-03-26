'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { Footer } from './Footer';
import { Header } from './Header';

const PUBLIC_CHROME_ROUTES = ['/', '/programs'];

function shouldShowChrome(pathname: string): boolean {
  return PUBLIC_CHROME_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (!shouldShowChrome(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="surface-shell min-h-screen text-slate-900">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
