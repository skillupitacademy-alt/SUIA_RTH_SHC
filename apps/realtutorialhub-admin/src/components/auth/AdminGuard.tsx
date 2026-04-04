import { apiClient } from '@quiz/api-client';
import { useAuthSync,ZLoader } from '@quiz/ui';
import { usePathname, useRouter } from 'next/navigation';
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
  const { user, isAuthenticated, login, logout, isLocked, setAccessDenied } = useAuthStore(
    useShallow((s) => ({
      user: s.user,
      isAuthenticated: s.isAuthenticated,
      login: s.login,
      logout: s.logout,
      isLocked: s.isLocked,
      setAccessDenied: s.setAccessDenied,
    })),
  );
  const router = useRouter();
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
      e.preventDefault();
      return;
    }

    void (async () => {
      clientLogger.warn('Circuit Breaker: Global 401 detected. Logging out.');
      try {
        await apiClient.auth.logout();
      } catch (err) {
        clientLogger.error('Server-side logout failed during unauthorized event', {
          error: err instanceof Error ? err.message : 'unknown',
        });
      } finally {
        logout();
        router.push('/login?reason=session_expired');
      }
    })();
  }, [isLocked, logout, router]);

  const handleForbidden = useCallback(
    (e: Event) => {
      e.preventDefault();
      setAccessDenied(true);
    },
    [setAccessDenied],
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
          setAccessDenied(true);
          router.push('/login?reason=access_denied');
          return;
        }

        if (isSameAuthSession(user, validatedUser) === false) {
          login(validatedUser, validatedExpiresAt);
        }
      } catch (err: unknown) {
        clientLogger.error('Session revalidation failed', { error: err instanceof Error ? err.message : 'unknown' });
        logout();
        router.push('/login?reason=session_expired');
      } finally {
        setIsCheckingSession(false);
      }
    };

    if (isLocked === true && isAuthenticated === true && hasAdminRole === true) {
      setIsCheckingSession(false);
      return;
    }

    void revalidate();
  }, [isAuthenticated, isLocked, isSameAuthSession, login, logout, pathname, router, setAccessDenied, user]);

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
