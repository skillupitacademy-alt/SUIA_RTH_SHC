import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React, { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SharedAdminLockScreen } from '../SharedAdminLockScreen';
import type { BrandThemeMode, SharedAdminLockScreenUser } from '../lock-screen-types';

describe('SharedAdminLockScreen Presentation Component', () => {
  const mockUser: SharedAdminLockScreenUser = {
    id: 'admin-42',
    email: 'sol.admin@skillhubcore.in',
    name: 'Sol Administrator',
    role: 'super_admin',
    isAdmin: true,
  };

  const defaultProps = {
    isLocked: true,
    user: mockUser,
    onUnlock: vi.fn(),
    onSwitchAccount: vi.fn(),
    onLogout: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders null when isLocked is false', () => {
    const { container } = render(<SharedAdminLockScreen {...defaultProps} isLocked={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders null when user is null or undefined', () => {
    const { container } = render(<SharedAdminLockScreen {...defaultProps} user={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders locked UI with user identity, title, subtitle, and accessible attributes', () => {
    render(
      <SharedAdminLockScreen
        {...defaultProps}
        brandTitle="Terminal Locked"
        brandSubtitle="SkillHubCore Security Protocol"
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'shared-lock-screen-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'shared-lock-screen-subtitle');

    expect(screen.getByText('Terminal Locked')).toBeInTheDocument();
    expect(screen.getByText('SkillHubCore Security Protocol')).toBeInTheDocument();
    expect(screen.getByText('sol.admin@skillhubcore.in')).toBeInTheDocument();
    expect(screen.getByText('Sol Administrator')).toBeInTheDocument();
    expect(screen.getByText(/super admin/i)).toBeInTheDocument();
  });

  it('autofocuses the password input on mount', async () => {
    render(<SharedAdminLockScreen {...defaultProps} />);
    const passwordInput = screen.getByLabelText(/account password/i);

    await waitFor(() => {
      expect(document.activeElement).toBe(passwordInput);
    });
  });

  it('handles password entry and successful unlock dispatch', async () => {
    const onUnlockMock = vi.fn().mockResolvedValue(undefined);
    render(<SharedAdminLockScreen {...defaultProps} onUnlock={onUnlockMock} />);

    const passwordInput = screen.getByLabelText(/account password/i);
    fireEvent.change(passwordInput, { target: { value: 'SecretPassword123!' } });

    const submitBtn = screen.getByRole('button', { name: /unlock terminal/i });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onUnlockMock).toHaveBeenCalledWith('SecretPassword123!');
    });
  });

  it('captures async rejection from onUnlock and renders polite error alert', async () => {
    const onUnlockMock = vi.fn().mockRejectedValue(new Error('Invalid account password'));
    render(<SharedAdminLockScreen {...defaultProps} onUnlock={onUnlockMock} />);

    const passwordInput = screen.getByLabelText(/account password/i);
    fireEvent.change(passwordInput, { target: { value: 'WrongPassword' } });

    const submitBtn = screen.getByRole('button', { name: /unlock terminal/i });
    fireEvent.click(submitBtn);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Invalid account password');
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });

  it('respects external loading and error props when controlled', () => {
    render(
      <SharedAdminLockScreen
        {...defaultProps}
        isLoading={true}
        error="Account mismatch detected"
      />
    );

    expect(screen.getByText(/re-establishing session/i)).toBeInTheDocument();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Account mismatch detected');
  });

  it('dispatches onSwitchAccount when Switch Account link is clicked', () => {
    const onSwitchAccount = vi.fn();
    render(<SharedAdminLockScreen {...defaultProps} onSwitchAccount={onSwitchAccount} />);

    const switchBtn = screen.getByRole('button', { name: /switch account/i });
    fireEvent.click(switchBtn);
    expect(onSwitchAccount).toHaveBeenCalledTimes(1);
  });

  it('dispatches onLogout when Log out securely is clicked', () => {
    const onLogout = vi.fn();
    render(<SharedAdminLockScreen {...defaultProps} onLogout={onLogout} />);

    const logoutBtn = screen.getByRole('button', { name: /log out securely/i });
    fireEvent.click(logoutBtn);
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('falls back to onSwitchAccount if onLogout is not provided', () => {
    const onSwitchAccount = vi.fn();
    render(
      <SharedAdminLockScreen
        {...defaultProps}
        onSwitchAccount={onSwitchAccount}
        onLogout={undefined}
      />
    );

    const logoutBtn = screen.getByRole('button', { name: /log out securely/i });
    fireEvent.click(logoutBtn);
    expect(onSwitchAccount).toHaveBeenCalledTimes(1);
  });

  describe('Runtime Brand-Aware Theming', () => {
    it('applies Theme A design tokens (pink/rose gradient)', () => {
      const { container } = render(
        <SharedAdminLockScreen {...defaultProps} theme="theme-a" />
      );

      const button = screen.getByRole('button', { name: /unlock terminal/i });
      expect(button.className).toContain('from-[#FF4B91]');
      expect(button.className).toContain('to-[#FF8E9E]');
    });

    it('applies Theme B design tokens (sunset orange gradient & dark background)', () => {
      render(
        <SharedAdminLockScreen {...defaultProps} theme="theme-b" />
      );

      const button = screen.getByRole('button', { name: /unlock terminal/i });
      expect(button.className).toContain('from-[#D03F00]');
      expect(button.className).toContain('to-[#FF7043]');

      const dialog = screen.getByRole('dialog');
      expect(dialog.className).toContain('bg-[#0B132B]');
    });

    it('applies SkillHubCore design tokens', () => {
      render(
        <SharedAdminLockScreen {...defaultProps} theme="skillhubcore" />
      );

      const button = screen.getByRole('button', { name: /unlock terminal/i });
      expect(button.className).toContain('from-[#F54A8D]');
    });

    it('applies SkillUp IT Academy design tokens (cyan theme)', () => {
      render(
        <SharedAdminLockScreen {...defaultProps} theme="skillup" />
      );

      const button = screen.getByRole('button', { name: /unlock terminal/i });
      expect(button.className).toContain('from-[#0891B2]');
      expect(button.className).toContain('to-[#06B6D4]');
    });

    it('accepts granular theme token overrides', () => {
      render(
        <SharedAdminLockScreen
          {...defaultProps}
          themeTokens={{
            primaryButtonGradient: 'bg-emerald-600',
            primaryButtonShadow: 'shadow-emerald-500/50',
          }}
        />
      );

      const button = screen.getByRole('button', { name: /unlock terminal/i });
      expect(button.className).toContain('bg-emerald-600');
      expect(button.className).toContain('shadow-emerald-500/50');
    });

    it('dynamically adapts when theme prop changes at runtime without unmounting', () => {
      function ThemeSwitcherHarness() {
        const [theme, setTheme] = useState<BrandThemeMode>('theme-a');
        return (
          <div>
            <button onClick={() => setTheme('theme-b')}>Switch to Theme B</button>
            <SharedAdminLockScreen {...defaultProps} theme={theme} />
          </div>
        );
      }

      render(<ThemeSwitcherHarness />);

      let button = screen.getByRole('button', { name: /unlock terminal/i });
      expect(button.className).toContain('from-[#FF4B91]');

      // Switch theme at runtime
      fireEvent.click(screen.getByText('Switch to Theme B'));

      button = screen.getByRole('button', { name: /unlock terminal/i });
      expect(button.className).toContain('from-[#D03F00]');
    });
  });
});

