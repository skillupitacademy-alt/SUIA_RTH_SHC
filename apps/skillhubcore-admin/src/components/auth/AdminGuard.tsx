'use client';

import { apiClient, ApiRequestError } from '@quiz/api-client';
import { recordCounter } from '@quiz/observability';
import { useAuthSync } from '@quiz/ui';
import { Network } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useAuthStore } from '@/store/auth-store';
import { clientLogger } from '@/utils/clientLogger';
import { AdminLockScreen } from './AdminLockScreen';

const normalizeRole = (value: string | null | undefined) => (typeof value === 'string' ? value.toLowerCase() : '');
const isAdminEquivalentRole = (value: string | null | undefined) => {
  const role = normalizeRole(value);
  return role === 'admin' || role === 'super_admin';
};

function isExplicitAuthError(err: unknown): boolean {
  if (err instanceof ApiRequestError) {
    return err.status === 401 || err.status === 403;
  }
  if (err && typeof err === 'object') {
    const status = (err as { status?: unknown }).status;
    if (status === 401 || status === 403) return true;
    const message = (err as { message?: unknown }).message;
    if (typeof message === 'string' && (message.includes('401') || message.includes('403') || message === 'Unauthorized')) {
      return true;
    }
  }
  return false;
}

apiClient.client.setPortalIdentity('admin');

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
  const [isCheckingSession, setIsCheckingSession] = useState(pathname !== '/login' && pathname !== '/forbidden');
  const [revalidateError, setRevalidateError] = useState<string | null>(null);

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
      clientLogger.warn('Circuit Breaker: Global 403 detected. Redirecting to /forbidden.');
      recordCounter('admin.ui.auth.forbidden', 1, { route: pathname });
      if (typeof window !== 'undefined') {
        window.location.href = '/forbidden';
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
    if (pathname === '/login' || pathname === '/forbidden') {
      setIsCheckingSession(false);
      return;
    }

    const hasAdminRole = isAdminEquivalentRole(user?.role);

    const revalidate = async (retryCount = 0) => {
      setIsCheckingSession(true);
      setRevalidateError(null);
      try {
        const { user: validatedUser } = await apiClient.auth.getAdminSession();
        const validatedHasAdminRole = isAdminEquivalentRole(validatedUser?.role);
        if (validatedUser === null || validatedUser === undefined) {
          throw new Error('Unauthorized');
        }

        if (validatedHasAdminRole === false) {
          recordCounter('admin.ui.auth.revalidate_forbidden', 1, { route: pathname });
          window.location.href = '/forbidden';
          return;
        }

        if (isSameAuthSession(user, validatedUser) === false) {
          login(validatedUser);
        }
        setIsCheckingSession(false);
      } catch (err: unknown) {
        const isAuthError = isExplicitAuthError(err);
        const errStatus = err instanceof ApiRequestError
          ? err.status
          : (err && typeof err === 'object' && 'status' in err && typeof (err as { status?: unknown }).status === 'number')
            ? (err as { status: number }).status
            : undefined;

        if (errStatus === 403) {
          clientLogger.error('Session authorization failed (403 Forbidden)', {
            error: err instanceof Error ? err.message : 'forbidden',
          });
          recordCounter('admin.ui.auth.revalidate_forbidden', 1, { route: pathname });
          setIsCheckingSession(false);
          window.location.href = '/forbidden';
          return;
        }

        if (isAuthError || errStatus === 401) {
          clientLogger.error('Session authentication failed (401)', {
            error: err instanceof Error ? err.message : 'unknown',
          });
          recordCounter('admin.ui.auth.revalidate_failed', 1, {
            route: pathname,
            reason: 'unauthorized',
          });
          setIsCheckingSession(false);
          window.location.href = '/login';
          return;
        }

        // Transient network or server reload error (e.g. during HMR recompilation)
        if (retryCount < 2) {
          const delay = (retryCount + 1) * 800;
          clientLogger.warn(`Transient session check error, retrying in ${delay}ms...`, {
            error: err instanceof Error ? err.message : 'unknown',
            retryCount,
          });
          setTimeout(() => {
            void revalidate(retryCount + 1);
          }, delay);
          return;
        }

        // If exhausted retries on network/recompilation error, do NOT redirect to /login
        clientLogger.error('Session revalidation network failure after retries', {
          error: err instanceof Error ? err.message : 'unknown',
        });
        recordCounter('admin.ui.auth.revalidate_network_error', 1, {
          route: pathname,
          reason: err instanceof Error ? err.message : 'network_error',
        });
        setRevalidateError('Unable to reach server. The application server or dev compiler may be reloading.');
        setIsCheckingSession(false);
      }
    };

    if (isLocked === true && isAuthenticated === true && hasAdminRole === true) {
      setIsCheckingSession(false);
      return;
    }

    void revalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLocked, isSameAuthSession, login, user]);

  // Bypass guard for login and forbidden pages
  if (pathname === '/login' || pathname === '/forbidden') {
    return <>{children}</>;
  }

  // Never render protected children while session revalidation is in progress
  // Prevents stale client state from flashing or displaying unconfirmed data
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

  // If transient connection error occurred after retries, offer Retry instead of kicking to /login
  if (revalidateError) {
    return (
      <div className="h-screen w-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shadow-sm">
            <Network size={28} />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Connection Interrupted</h2>
          <p className="text-sm text-slate-600">
            {revalidateError}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={() => {
                setIsCheckingSession(true);
                setRevalidateError(null);
                apiClient.auth.getAdminSession()
                  .then(({ user: valUser }) => {
                    if (valUser && isAdminEquivalentRole(valUser.role)) {
                      login(valUser);
                    } else {
                      window.location.href = '/login';
                    }
                  })
                  .catch((err) => {
                    if (isExplicitAuthError(err)) {
                      window.location.href = '/login';
                    } else {
                      setRevalidateError('Still unable to connect. Please try again.');
                    }
                  })
                  .finally(() => setIsCheckingSession(false));
              }}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
            >
              Retry Connection
            </button>
            <button
              type="button"
              onClick={() => { window.location.href = '/login'; }}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasAdminRole = isAdminEquivalentRole(user?.role);

  // Confirmed authenticated admin session only
  if (isAuthenticated === true && hasAdminRole === true) {
    return (
      <>
        {isLocked && <AdminLockScreen />}
        {children}
      </>
    );
  }

  // If not authenticated or forbidden, render null while revalidation or redirect takes effect
  return null;
}
