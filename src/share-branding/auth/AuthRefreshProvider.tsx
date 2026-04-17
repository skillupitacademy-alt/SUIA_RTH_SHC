'use client';

import React from 'react';
import { useAutoRefresh } from './useAutoRefresh';

/**
 * 🔐 ENTERPRISE AUTH: Auth Refresh Provider
 * 
 * Wraps authenticated parts of the app to enable automatic token refresh.
 * Should be placed in dashboard layouts or any authenticated routes.
 * 
 * Usage:
 * ```tsx
 * <AuthRefreshProvider>
 *   <YourAuthenticatedContent />
 * </AuthRefreshProvider>
 * ```
 */
export function AuthRefreshProvider({ children }: { children: React.ReactNode }) {
  // 🔥 Enable automatic token refresh
  useAutoRefresh();

  return <>{children}</>;
}
