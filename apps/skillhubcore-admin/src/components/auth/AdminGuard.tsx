'use client';

import { apiClient } from '@quiz/api-client';
import { recordCounter } from '@quiz/observability';
import { useAuthSync } from '@quiz/ui';
import { Network } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useAuthStore } from '@/store/auth-store';
import { clientLogger } from '@/utils/clientLogger';

const normalizeRole = (value: string | null | undefined) => (typeof value === 'string' ? value.toLowerCase() : '');
const isAdminEquivalentRole = (value: string | null | undefined) => {
  const role = normalizeRole(value);
  return role === 'admin' || role === 'super_admin' || role === 'infrastructure';
};

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, login, logout, isLocked } = useAuthStore(
    useShallow((s) => ({
      user: s.user,
      isAuthenticated: s.isAuthenticated,
      login: s.login,
      logout: s.logout,
      isLocked: s.isLocked,
    })),
  );
  const pathname = usePathname();
  const [isCheckingSession, setIsCheckingSession] = useState(pathname !== '/login');

  const isSameAuthSession = useCallback((currentUser: typeof user, nextUser: typeof user) => {
    if (currentUser === null || currentUser === undefined || nextUser === null || nextUser === undefined) {
      return false;
    }

    return (
      currentUser.id === nextUser.id &&
      currentUser.email === nextUser.email &&
      normalizeRole(currentUser.role) === normalizeRole(nextUser.role) &&
      Boolean(currentUser.isAdmin) === Boolean(nextUser.isAdmin)
    );
  }, []);

  // Circuit Breaker: Custom handler for unauthorized requests
  const handleUnauthorized = useCallback((e: Event) => {
    // If locked, defer to lock screen for re-authentication
    if (isLocked === true) {
      clientLogger.warn('Circuit Breaker: 401 detected while LOCKED. Deferring to Lock Protocol.');
      recordCounter('admin.ui.auth.unauthorized_locked', 1, { route: pathname });
      e.preventDefault();
      return;
    }

    e.preventDefault();
    clientLogger.warn('Circuit Breaker: Global 401 detected. Redirecting to login.');
    recordCounter('admin.ui.auth.unauthorized', 1, { route: pathname });
    setIsCheckingSession(false);
    // Redirect to login - no legacy modals or query params
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }, [isLocked, pathname]);

  const handleForbidden = useCallback(
    (e: Event) => {
      e.preventDefault();
      clientLogger.warn('Circuit Breaker: Global 403 detected. Redirecting to login.');
      recordCounter('admin.ui.auth.forbidden', 1, { route: pathname });
      // Redirect to login - no legacy modals or query params
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    },
    [pathname],
  );

  // Centralized Auth Sync Hook
  useAuthSync({
    portal: 'admin',
    isAuthenticated,
    isLocked,
    logout,
    onUnauthorized: handleUnauthorized,
    onForbidden: handleForbidden,
  });

  useEffect(() => {
    if (pathname === '/login') {
      setIsCheckingSession(false);
      return;
    }

    const hasAdminRole = isAdminEquivalentRole(user?.role);

    // Skip revalidation if user is already authenticated and has admin role
    // Only revalidate on initial mount (when user is null)
    if (isAuthenticated === true && hasAdminRole === true && user !== null) {
      setIsCheckingSession(false);
      return;
    }

    const revalidate = async () => {
      setIsCheckingSession(true);
      try {
        const { user: validatedUser } = await apiClient.auth.getAdminSession();
        const validatedHasAdminRole = isAdminEquivalentRole(validatedUser?.role);
        if (validatedUser === null || validatedUser === undefined) {
          throw new Error('Unauthorized');
        }

        if (validatedHasAdminRole === false) {
          recordCounter('admin.ui.auth.revalidate_forbidden', 1, { route: pathname });
          // Redirect to login - no legacy query params
          window.location.href = '/login';
          return;
        }

        if (isSameAuthSession(user, validatedUser) === false) {
          login(validatedUser);
        }
      } catch (err: unknown) {
        clientLogger.error('Session revalidation failed', { error: err instanceof Error ? err.message : 'unknown' });
        recordCounter('admin.ui.auth.revalidate_failed', 1, {
          route: pathname,
          reason: err instanceof Error ? err.message : 'unknown',
        });
        // Redirect to login - no legacy query params
        window.location.href = '/login';
      } finally {
        setIsCheckingSession(false);
      }
    };

    if (isLocked === true && isAuthenticated === true && hasAdminRole === true) {
      setIsCheckingSession(false);
      return;
    }

    void revalidate();
  }, [isAuthenticated, isLocked, isSameAuthSession, login, user]); // Removed pathname from dependencies

  // Bypass guard for login page
  if (pathname === '/login') {
    return <>{children}</>;
  }

  const hasAdminRole = isAdminEquivalentRole(user?.role);

  // If user is authenticated and has admin role, show content immediately
  // The revalidation happens in the background
  if (isAuthenticated === true && hasAdminRole === true) {
    return <>{children}</>;
  }

  // Only show loading spinner if we're actively checking and don't have auth state yet
  if (isCheckingSession) {
    return (
      <div className="h-screen w-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 shadow-lg animate-pulse">
            <Network size={32} className="text-white" />
          </div>
          <p className="text-sm font-semibold text-slate-600">Loading SkillHubCore Admin...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }

  return null;
}
