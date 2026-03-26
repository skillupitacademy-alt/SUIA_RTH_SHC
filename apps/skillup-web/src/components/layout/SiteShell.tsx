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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.08),_transparent_28%),linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)] text-slate-900">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
