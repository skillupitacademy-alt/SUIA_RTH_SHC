'use client';

import { apiClient } from '@quiz/api-client';
import { recordCounter } from '@quiz/observability';
import { useAuthSync,ZLoader } from '@quiz/ui';
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
  const { user, isAuthenticated, login, logout, isLocked, setAccessDenied, setSessionExpired } = useAuthStore(
    useShallow((s) => ({
      user: s.user,
      isAuthenticated: s.isAuthenticated,
      login: s.login,
      logout: s.logout,
      isLocked: s.isLocked,
      setAccessDenied: s.setAccessDenied,
      setSessionExpired: s.setSessionExpired,
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

  // Circuit Breaker: Custom handler for Admin
  const handleUnauthorized = useCallback((e: Event) => {
    // PATIENCE PROTOCOL: If the terminal is locked, the user is still at their desk (or pause-mode)
    // We should NOT trigger a hard logout/redirect in the background.
    // The AdminLockScreen will handle re-authentication when the user attempts to unlock.
    if (isLocked === true) {
      clientLogger.warn('Circuit Breaker: 401 detected while LOCKED. Deferring to Lock Protocol.');
      recordCounter('admin.ui.auth.unauthorized_locked', 1, { route: pathname });
      e.preventDefault();
      return;
    }

    e.preventDefault();
    clientLogger.warn('Circuit Breaker: Global 401 detected. Transitioning to session-expired modal.');
    recordCounter('admin.ui.auth.unauthorized', 1, { route: pathname });
    setAccessDenied(false);
    setSessionExpired(true);
    setIsCheckingSession(false);
  }, [isLocked, pathname, setAccessDenied, setSessionExpired]);

  const handleForbidden = useCallback(
    (e: Event) => {
      e.preventDefault();
      clientLogger.warn('Circuit Breaker: Global 403 detected. Transitioning to access-denied modal.');
      recordCounter('admin.ui.auth.forbidden', 1, { route: pathname });
      setSessionExpired(false);
      setAccessDenied(true);
    },
    [pathname, setAccessDenied, setSessionExpired],
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

    const revalidate = async () => {
      setIsCheckingSession(true);
      try {
        const { user: validatedUser, expiresAt: validatedExpiresAt } = await apiClient.auth.getAdminSession();
        const validatedHasAdminRole = isAdminEquivalentRole(validatedUser?.role);
        if (validatedUser === null || validatedUser === undefined) {
          throw new Error('Unauthorized');
        }

        if (validatedHasAdminRole === false) {
          recordCounter('admin.ui.auth.revalidate_forbidden', 1, { route: pathname });
          setAccessDenied(true);
          setSessionExpired(false);
          setIsCheckingSession(false);
          return;
        }

        if (isSameAuthSession(user, validatedUser) === false) {
          login(validatedUser, validatedExpiresAt);
        }
      } catch (err: unknown) {
        clientLogger.error('Session revalidation failed', { error: err instanceof Error ? err.message : 'unknown' });
        recordCounter('admin.ui.auth.revalidate_failed', 1, {
          route: pathname,
          reason: err instanceof Error ? err.message : 'unknown',
        });
        setAccessDenied(false);
        setSessionExpired(true);
      } finally {
        setIsCheckingSession(false);
      }
    };

    if (isLocked === true && isAuthenticated === true && hasAdminRole === true) {
      setIsCheckingSession(false);
      return;
    }

    void revalidate();
  }, [isAuthenticated, isLocked, isSameAuthSession, login, pathname, setAccessDenied, setSessionExpired, user]);

  // Bypass guard for login page
  if (pathname === '/login') {
    return <>{children}</>;
  }

  const hasAdminRole = isAdminEquivalentRole(user?.role);

  if (isCheckingSession || isAuthenticated === false || hasAdminRole === false) {
    return (
      <div className="h-screen w-screen bg-background flex flex-col items-center justify-center">
        <ZLoader size="lg" text="Authenticating Admin Session" />
      </div>
    );
  }

  return <>{children}</>;
}
