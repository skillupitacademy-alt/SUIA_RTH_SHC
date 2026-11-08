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

  const handleUnlock = useCallback(
    async (password: string) => {
      if (!password || !user) return;

      setIsLoading(true);
      setError(null);

      try {
        const email = user.email ?? '';
        if (email.length === 0) {
          setError('Missing admin email');
          throw new Error('Missing admin email');
        }

        clientLogger.warn('[AUTH_FLOW][ADMIN_LOCK_SCREEN][UNLOCK_SUBMIT]', {
          step: 'submit',
          emailDomain: email.includes('@') ? email.split('@')[1] : 'unknown',
        });

        const { user: refreshedUser, expiresAt } = await loginPortalSession({
          email,
          password,
          platform: 'realtutorialhub',
          portalIdentity: 'admin',
          portalName: 'RealTutorialHub Admin',
          allowedRoles: ['admin', 'super_admin'],
        });

        clientLogger.warn('[AUTH_FLOW][ADMIN_LOCK_SCREEN][UNLOCK_RESPONSE]', {
          step: 'response',
          hasUser: refreshedUser !== null && refreshedUser !== undefined,
          expiresAt: expiresAt ?? null,
        });

        if (
          typeof refreshedUser.id !== 'string' ||
          refreshedUser.id.length === 0 ||
          typeof refreshedUser.email !== 'string' ||
          refreshedUser.email.length === 0
        ) {
          throw new Error('Invalid authentication response');
        }

        // Strict identity check: reauthenticated user must match locked user
        if (typeof user.id === 'string' && user.id.length > 0 && refreshedUser.id !== user.id) {
          throw new Error('Reauthenticated user does not match the locked session');
        }
        if (typeof user.email === 'string' && user.email.length > 0 && refreshedUser.email.toLowerCase() !== user.email.toLowerCase()) {
          throw new Error('Reauthenticated user does not match the locked session');
        }

        // Enforce admin privilege
        const role = typeof refreshedUser.role === 'string' ? refreshedUser.role.toLowerCase() : '';
        const isAdminRole = role === 'admin' || role === 'super_admin' || refreshedUser.isAdmin === true;
        if (!isAdminRole) {
          throw new Error('Insufficient permissions: Administrator role required');
        }

        // Update local auth state with confirmed refreshed user
        login(
          {
            id: refreshedUser.id,
            email: refreshedUser.email,
            name: refreshedUser.name ?? user.name ?? 'Admin User',
            isAdmin: refreshedUser.isAdmin ?? true,
            role: refreshedUser.role ?? 'admin',
            onboarded: refreshedUser.onboarded ?? true,
          },
          expiresAt
        );

        unlock();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Incorrect master password';
        setError(message);
        clientLogger.error('Lock screen unlock failed', { error: message });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [user, login, unlock]
  );

  const handleSwitchAccount = useCallback(() => {
    logout();
    window.location.href = '/login';
  }, [logout]);

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
