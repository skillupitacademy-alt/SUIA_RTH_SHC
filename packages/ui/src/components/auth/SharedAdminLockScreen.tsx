'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronRight, Lock, LogOut, ShieldCheck, User as UserIcon } from 'lucide-react';
import { ZLoader } from '../../ZLoader';
import { cn } from '../../lib/utils';
import type { SharedAdminLockScreenProps } from './lock-screen-types';
import { resolveLockScreenTheme } from './lock-screen-themes';

export function SharedAdminLockScreen({
  isLocked,
  user,
  brandName = 'SkillHubCore',
  brandTitle = 'Terminal Locked',
  brandSubtitle = 'Security Protocol Alpha v1.0.4',
  customIcon,
  theme,
  themeTokens: customThemeTokens,
  onUnlock,
  onSwitchAccount,
  onLogout,
  isLoading: externalIsLoading,
  error: externalError,
  passwordLabel = 'Master Password',
  passwordPlaceholder = 'Enter master password',
  className,
}: SharedAdminLockScreenProps) {
  const [password, setPassword] = useState('');
  const [internalIsLoading, setInternalIsLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  const tokens = resolveLockScreenTheme(theme, customThemeTokens);

  const isLoading = externalIsLoading ?? internalIsLoading;
  const error = externalError !== undefined ? externalError : internalError;

  // Track and restore focus
  useEffect(() => {
    if (!isLocked) return;

    previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;

    // Focus input on mount
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    return () => {
      clearTimeout(timer);
      if (previouslyFocusedElementRef.current && typeof previouslyFocusedElementRef.current.focus === 'function') {
        previouslyFocusedElementRef.current.focus();
      }
    };
  }, [isLocked]);

  // Accessible focus trap
  useEffect(() => {
    if (!isLocked) return;
    const container = containerRef.current;
    if (!container) return;

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const nodes = Array.from(
        container.querySelectorAll<HTMLElement>(focusableSelectors.join(','))
      );
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === first || !container.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !container.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isLocked]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!password || isLoading) return;

      setInternalIsLoading(true);
      setInternalError(null);

      try {
        await onUnlock(password);
        setPassword('');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Authentication failed';
        setInternalError(message);
      } finally {
        setInternalIsLoading(false);
      }
    },
    [password, isLoading, onUnlock]
  );

  const handleLogoutClick = useCallback(() => {
    if (onLogout) {
      onLogout();
    } else {
      onSwitchAccount();
    }
  }, [onLogout, onSwitchAccount]);

  if (!isLocked || !user) {
    return null;
  }

  const roleDisplay = user.role
    ? user.role.replace(/_/g, ' ')
    : user.isAdmin
    ? 'Admin'
    : 'Administrator';

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shared-lock-screen-title"
      aria-describedby="shared-lock-screen-subtitle"
      className={cn(
        'fixed inset-0 z-[100000] flex items-center justify-center',
        'animate-in fade-in duration-300 motion-reduce:animate-none',
        tokens.overlayBg,
        className
      )}
    >
      <div
        className={cn(
          'w-full max-w-sm px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center space-y-6 sm:space-y-8',
          'animate-in zoom-in-95 duration-300 motion-reduce:animate-none'
        )}
      >
        {/* Branding and status header */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div
              className={cn(
                'w-20 h-20 sm:w-24 sm:h-24 rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center',
                tokens.iconContainerGradient,
                tokens.iconShadow
              )}
            >
              {customIcon ?? <Lock size={36} className="text-white sm:size-10" />}
            </div>
            <div
              className={cn(
                'absolute -bottom-2 -right-2 p-1.5 sm:p-2 rounded-full border-4 shadow-lg',
                tokens.badgeBg,
                tokens.badgeBorder
              )}
            >
              <ShieldCheck size={14} className="sm:size-4" />
            </div>
          </div>

          <div className="text-center">
            <h1
              id="shared-lock-screen-title"
              className="text-xl sm:text-2xl font-black font-outfit uppercase tracking-tighter text-white"
            >
              {brandTitle}
            </h1>
            <p
              id="shared-lock-screen-subtitle"
              className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2 mt-1"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse motion-reduce:animate-none" />
              {brandSubtitle}
            </p>
          </div>
        </div>

        {/* User Identity Display */}
        <div
          className={cn(
            'w-full p-3.5 sm:p-4 rounded-2xl border flex items-center gap-3 sm:gap-4',
            tokens.cardBg,
            tokens.cardBorder
          )}
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 flex items-center justify-center text-slate-400 shrink-0">
            <UserIcon size={20} className="sm:size-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
              {user.email || 'administrator'}
            </p>
            <p className="text-xs sm:text-sm font-black text-white truncate flex items-center gap-2">
              {user.name || user.email || 'Admin User'}
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest',
                  tokens.accentText
                )}
              >
                <ShieldCheck size={12} /> {roleDisplay}
              </span>
            </p>
          </div>
        </div>

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4" noValidate>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-slate-300 text-[11px] font-bold uppercase tracking-[0.2em]">
              <span id="lock-screen-password-label">{passwordLabel}</span>
              <button
                type="button"
                onClick={onSwitchAccount}
                className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors"
                aria-label="Switch account"
              >
                Switch Account <ChevronRight size={12} />
              </button>
            </div>
            <div className="relative">
              <input
                ref={inputRef}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                minLength={1}
                className={cn(
                  'w-full rounded-2xl px-4 py-3 text-white border focus:outline-none focus:ring-2 transition-all',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  tokens.inputBg,
                  tokens.inputBorder,
                  tokens.inputPlaceholder,
                  tokens.focusRing
                )}
                placeholder={passwordPlaceholder}
                aria-label={passwordLabel}
                aria-labelledby="lock-screen-password-label"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'lock-screen-error-alert' : undefined}
                required
              />
              <LogOut className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
          </div>

          {/* Error Message with polite screen-reader announcement */}
          {error && (
            <div
              id="lock-screen-error-alert"
              role="alert"
              aria-live="polite"
              className="text-red-400 text-[11px] font-bold uppercase tracking-[0.2em] text-center p-2 rounded-lg bg-red-900/20 border border-red-500/20"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || password.trim() === ''}
            className={cn(
              'w-full py-3.5 sm:py-4 rounded-2xl text-white font-black uppercase tracking-[0.2em] text-xs sm:text-sm',
              'hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
              tokens.primaryButtonGradient,
              tokens.primaryButtonShadow
            )}
            aria-label="Unlock terminal"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <ZLoader size="xs" className="text-white" center={false} />
                Re-establishing Session...
              </span>
            ) : (
              'Unlock Terminal'
            )}
          </button>
        </form>

        {/* Secure Logout Action */}
        <button
          type="button"
          onClick={handleLogoutClick}
          className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 hover:text-white transition-colors flex items-center gap-2"
          aria-label="Log out securely"
        >
          <LogOut size={14} /> Log out securely
        </button>
      </div>
    </div>
  );
}

