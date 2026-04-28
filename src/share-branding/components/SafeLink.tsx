'use client';

import Link from 'next/link';
import React from 'react';

interface SafeLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  title?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * 🔐 SafeLink
 * Disables prefetch for protected routes to prevent 503 errors
 * 
 * Why: Next.js prefetch can trigger SSR without cookies, causing auth failures
 * Solution: Disable prefetch for protected routes, keep it for public routes
 */

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/launch-exam',
  '/tutorial',
  '/node-map',
];

export function SafeLink({
  href,
  children,
  ...props
}: SafeLinkProps) {
  const isProtectedRoute = PROTECTED_PREFIXES.some(prefix =>
    href.startsWith(prefix)
  );

  return (
    <Link
      href={href}
      prefetch={!isProtectedRoute}
      {...props}
    >
      {children}
    </Link>
  );
}
