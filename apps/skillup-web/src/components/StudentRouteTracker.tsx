'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function StudentRouteTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith('/student') || pathname.startsWith('/programs') || pathname === '/') {
      window.localStorage.setItem('skillup-last-visited-route', pathname);
    }
  }, [pathname]);

  return null;
}
