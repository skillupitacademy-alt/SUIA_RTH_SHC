'use client';

import { SharedAdminLockScreen } from '@quiz/ui';
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

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanupUnauthorizedSession = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-brand': 'skillhubcore',
        },
        credentials: 'include',
      });
    } catch {
      // Fail-safe cleanup
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
        clientLogger.warn('[AUTH_FLOW][SHC_LOCK_SCREEN][UNLOCK_SUBMIT]', {
          step: 'submit',
          emailDomain: lockedEmail.includes('@') ? lockedEmail.split('@')[1] : 'unknown',
        });

        // 2. Reauthenticate against authentic SHC login BFF
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-brand': 'skillhubcore',
          },
          body: JSON.stringify({
            email: lockedEmail,
            password,
            platform: 'skillhubcore',
          }),
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Invalid account password');
        }

        // 3. Validate response shape before reading properties
        const data = await response.json().catch(() => null);
        if (!data || typeof data !== 'object' || !data.user || typeof data.user !== 'object') {
          await cleanupUnauthorizedSession();
          throw new Error('Invalid authentication response');
        }

        const resUser = data.user as Record<string, unknown>;

        // 4. Require valid, nonempty user.id and user.email in response
        if (typeof resUser.id !== 'string' || resUser.id.trim().length === 0) {
          await cleanupUnauthorizedSession();
          throw new Error('Authentication response is missing user ID');
        }

        if (typeof resUser.email !== 'string' || resUser.email.trim().length === 0) {
          await cleanupUnauthorizedSession();
          throw new Error('Authentication response is missing user email');
        }

        const resId = resUser.id.trim();
        const resEmail = resUser.email.trim().toLowerCase();

        // 5. Strict same-account verification: reject mismatch and purge session side effects
        if (resId !== lockedId || resEmail !== lockedEmail) {
          await cleanupUnauthorizedSession();
          throw new Error('Reauthenticated user does not match the locked session');
        }

        // 6. Strict administrator authorization: role must be explicitly authorized
        if (typeof resUser.role !== 'string' || resUser.role.trim().length === 0) {
          await cleanupUnauthorizedSession();
          throw new Error('Insufficient permissions: Administrator role required');
        }

        const normalizedRole = resUser.role.trim().toLowerCase();
        if (normalizedRole !== 'admin' && normalizedRole !== 'super_admin') {
          await cleanupUnauthorizedSession();
          throw new Error('Insufficient permissions: Administrator role required');
        }

        // Contradictory claims: if isAdmin is boolean and false, reject
        if (typeof resUser.isAdmin === 'boolean' && resUser.isAdmin === false) {
          await cleanupUnauthorizedSession();
          throw new Error('Authentication contract violation: Contradictory administrator status');
        }

        clientLogger.warn('[AUTH_FLOW][SHC_LOCK_SCREEN][UNLOCK_SUCCESS]', {
          step: 'success',
          userId: resId,
        });

        // 7. Update auth store with confirmed refreshed identity (no fallbacks or synthesized defaults)
        const confirmedName =
          typeof resUser.name === 'string' && resUser.name.trim().length > 0
            ? resUser.name.trim()
            : (typeof user.name === 'string' && user.name.trim().length > 0 ? user.name.trim() : resEmail);

        login({
          id: resId,
          email: resEmail,
          name: confirmedName,
          isAdmin: true,
          role: resUser.role.trim(),
          onboarded: true,
        });

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
      brandName="SkillHubCore"
      brandTitle="Terminal Locked"
      brandSubtitle="SkillHubCore Security Protocol"
      theme="skillhubcore"
      isLoading={isLoading}
      error={error}
      onUnlock={handleUnlock}
      onSwitchAccount={handleSwitchAccount}
      onLogout={handleSwitchAccount}
    />
  );
}
