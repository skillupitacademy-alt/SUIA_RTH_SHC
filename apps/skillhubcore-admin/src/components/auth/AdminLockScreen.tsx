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

        clientLogger.warn('[AUTH_FLOW][SHC_LOCK_SCREEN][UNLOCK_SUBMIT]', {
          step: 'submit',
          emailDomain: email.includes('@') ? email.split('@')[1] : 'unknown',
        });

        // Reauthenticate against authentic SHC login BFF
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-brand': 'skillhubcore',
          },
          body: JSON.stringify({
            email,
            password,
            platform: 'skillhubcore',
          }),
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Incorrect master password' }));
          throw new Error(errorData.error || errorData.message || 'Incorrect master password');
        }

        const data = await response.json();
        if (!data || !data.user) {
          throw new Error('Invalid authentication response');
        }

        // Verify reauthenticated identity matches the locked user
        if (user.id && data.user.id && data.user.id !== user.id) {
          throw new Error('Reauthenticated user does not match the locked session');
        }
        if (user.email && data.user.email && data.user.email.toLowerCase() !== user.email.toLowerCase()) {
          throw new Error('Reauthenticated user does not match the locked session');
        }

        // Reject inactive or non-admin roles
        const role = (data.user.role || '').toLowerCase();
        const isAdminRole = role === 'admin' || role === 'super_admin' || data.user.isAdmin === true;
        if (!isAdminRole) {
          throw new Error('Insufficient permissions: Administrator role required');
        }

        clientLogger.warn('[AUTH_FLOW][SHC_LOCK_SCREEN][UNLOCK_SUCCESS]', {
          step: 'success',
          userId: data.user.id,
        });

        // Update auth store with confirmed refreshed identity
        login({
          id: data.user.id ?? user.id,
          email: data.user.email ?? user.email,
          name: data.user.name ?? data.user.email ?? user.name ?? 'Admin User',
          isAdmin: data.user.isAdmin ?? true,
          role: data.user.role ?? 'admin',
          onboarded: true,
        });

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
