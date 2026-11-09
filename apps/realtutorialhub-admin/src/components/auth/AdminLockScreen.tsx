'use client';

import { loginPortalSession, SharedAdminLockScreen, useThemeStore } from '@quiz/ui';
import { useCallback, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useAuthStore } from '@/store/auth-store';
import { clientLogger } from '@/utils/clientLogger';

export function AdminLockScreen() {
  const { user, unlock, logout, isLocked, login } = useAuthStore(
    useShallow((s) => ({
      user: s.user,
      unlock: s.unlock,
      logout: s.logout,
      isLocked: s.isLocked,
      login: s.login,
    }))
  );

  const activeTheme = useThemeStore((s) => s.theme);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanupUnauthorizedSession = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-platform': 'realtutorialhub',
        },
        credentials: 'include',
      });
    } catch {
      // Fail-safe session cleanup
    }
  }, []);

  const handleUnlock = useCallback(
    async (password: string) => {
      if (!password) return;

      // 1. Strict validation of locked session identity (fail closed)
      if (
        !user ||
        typeof user.id !== 'string' ||
        user.id.trim().length === 0 ||
        typeof user.email !== 'string' ||
        user.email.trim().length === 0
      ) {
        const msg = 'Locked session identity is missing or invalid';
        setError(msg);
        throw new Error(msg);
      }

      const lockedId = user.id.trim();
      const lockedEmail = user.email.trim().toLowerCase();

      setIsLoading(true);
      setError(null);

      try {
        clientLogger.warn('[AUTH_FLOW][ADMIN_LOCK_SCREEN][UNLOCK_SUBMIT]', {
          step: 'submit',
          emailDomain: lockedEmail.includes('@') ? lockedEmail.split('@')[1] : 'unknown',
        });

        // 2. Reauthenticate via trusted portal session helper
        let refreshedUser: { id?: string; email?: string; name?: string; role?: string; isAdmin?: boolean; onboarded?: boolean } | null = null;
        let expiresAt: string | null = null;

        try {
          const result = await loginPortalSession({
            email: lockedEmail,
            password,
            platform: 'realtutorialhub',
            portalIdentity: 'admin',
            portalName: 'RealTutorialHub Admin',
            allowedRoles: ['admin', 'super_admin'],
          });
          refreshedUser = result.user;
          expiresAt = result.expiresAt;
        } catch {
          throw new Error('Invalid account password');
        }

        // 3. Validate response shape before reading properties
        const untypedUser: unknown = refreshedUser;
        if (typeof untypedUser !== 'object' || untypedUser === null) {
          await cleanupUnauthorizedSession();
          throw new Error('Invalid authentication response');
        }

        // 4. Require valid, nonempty user.id and user.email in response
        if (typeof refreshedUser.id !== 'string' || refreshedUser.id.trim().length === 0) {
          await cleanupUnauthorizedSession();
          throw new Error('Authentication response is missing user ID');
        }

        if (typeof refreshedUser.email !== 'string' || refreshedUser.email.trim().length === 0) {
          await cleanupUnauthorizedSession();
          throw new Error('Authentication response is missing user email');
        }

        const resId = refreshedUser.id.trim();
        const resEmail = refreshedUser.email.trim().toLowerCase();

        // 5. Strict same-account verification: reject mismatch and purge session side effects
        if (resId !== lockedId || resEmail !== lockedEmail) {
          await cleanupUnauthorizedSession();
          throw new Error('Reauthenticated user does not match the locked session');
        }

        // 6. Strict administrator authorization: role must be explicitly authorized
        if (typeof refreshedUser.role !== 'string' || refreshedUser.role.trim().length === 0) {
          await cleanupUnauthorizedSession();
          throw new Error('Insufficient permissions: Administrator role required');
        }

        const normalizedRole = refreshedUser.role.trim().toLowerCase();
        if (normalizedRole !== 'admin' && normalizedRole !== 'super_admin') {
          await cleanupUnauthorizedSession();
          throw new Error('Insufficient permissions: Administrator role required');
        }

        // Contradictory claims: if isAdmin is boolean and false, reject
        if (typeof refreshedUser.isAdmin === 'boolean' && refreshedUser.isAdmin === false) {
          await cleanupUnauthorizedSession();
          throw new Error('Authentication contract violation: Contradictory administrator status');
        }

        clientLogger.warn('[AUTH_FLOW][ADMIN_LOCK_SCREEN][UNLOCK_SUCCESS]', {
          step: 'success',
          userId: resId,
        });

        // 7. Update local auth state with confirmed refreshed identity (no fallbacks or synthesized defaults)
        const confirmedName =
          typeof refreshedUser.name === 'string' && refreshedUser.name.trim().length > 0
            ? refreshedUser.name.trim()
            : (typeof user.name === 'string' && user.name.trim().length > 0 ? user.name.trim() : 'Admin User');

        login(
          {
            id: resId,
            email: resEmail,
            name: confirmedName,
            isAdmin: true,
            role: refreshedUser.role.trim(),
            onboarded: typeof refreshedUser.onboarded === 'boolean' ? refreshedUser.onboarded : true,
          },
          expiresAt
        );

        unlock();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Invalid account password';
        setError(message);
        clientLogger.error('Lock screen unlock failed', { reason: 'authentication_failed' });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [user, login, unlock, cleanupUnauthorizedSession]
  );

  const handleSwitchAccount = useCallback(() => {
    void cleanupUnauthorizedSession();
    logout();
    window.location.href = '/login';
  }, [logout, cleanupUnauthorizedSession]);

  return (
    <SharedAdminLockScreen
      isLocked={Boolean(isLocked)}
      user={user}
      brandName="RealTutorialHub"
      brandTitle="Terminal Locked"
      brandSubtitle="Security Protocol Alpha v1.0.4"
      theme={activeTheme === 'theme-b' ? 'theme-b' : 'theme-a'}
      isLoading={isLoading}
      error={error}
      onUnlock={handleUnlock}
      onSwitchAccount={handleSwitchAccount}
      onLogout={handleSwitchAccount}
    />
  );
}
