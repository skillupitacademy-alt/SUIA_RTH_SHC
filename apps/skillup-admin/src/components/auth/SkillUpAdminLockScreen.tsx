'use client';

import { SharedAdminLockScreen, type SharedAdminLockScreenUser } from '@quiz/ui';
import React from 'react';

export interface SkillUpAdminLockScreenProps {
  /**
   * Control flag. Remains false by default until a client lock policy
   * is formally approved and activated for SkillUp Admin.
   */
  isLocked?: boolean;
  user?: SharedAdminLockScreenUser | null;
  onUnlock?: (password: string) => Promise<void> | void;
  onSwitchAccount?: () => void;
  onLogout?: () => void;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * SkillUp Admin Lock Screen Adapter (Compatible Component).
 *
 * Provides brand-aligned (Cyan/Slate) presentation of the shared AdminLockScreen
 * for SkillUp IT Academy.
 *
 * INACTIVE BY DEFAULT:
 * As confirmed by architectural governance, SkillUp Admin uses a server-session
 * layout pattern and has not yet established an active client idle lock policy.
 * This adapter provides compile-time and visual compatibility without mounting
 * or activating unapproved lock workflows.
 */
export function SkillUpAdminLockScreen({
  isLocked = false,
  user = null,
  onUnlock,
  onSwitchAccount,
  onLogout,
  isLoading = false,
  error = null,
}: SkillUpAdminLockScreenProps) {
  if (!isLocked || !user) {
    return null;
  }

  const handleUnlock = async (password: string) => {
    if (onUnlock) {
      await onUnlock(password);
    }
  };

  const handleSwitchAccount = () => {
    if (onSwitchAccount) {
      onSwitchAccount();
    } else {
      window.location.href = '/login';
    }
  };

  return (
    <SharedAdminLockScreen
      isLocked={isLocked}
      user={user}
      brandName="SkillUp IT Academy"
      brandTitle="Terminal Locked"
      brandSubtitle="SkillUp Security Protocol"
      theme="skillup"
      isLoading={isLoading}
      error={error}
      onUnlock={handleUnlock}
      onSwitchAccount={handleSwitchAccount}
      onLogout={onLogout ?? handleSwitchAccount}
    />
  );
}

