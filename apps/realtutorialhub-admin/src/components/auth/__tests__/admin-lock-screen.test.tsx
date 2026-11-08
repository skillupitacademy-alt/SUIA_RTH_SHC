import { loginPortalSession, useThemeStore } from '@quiz/ui';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';


import { useAuthStore } from '@/store/auth-store';

import { AdminLockScreen } from '../AdminLockScreen';

vi.mock('@quiz/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@quiz/ui')>();
  return {
    ...actual,
    loginPortalSession: vi.fn(),
  };
});

describe('RTH AdminLockScreen Adapter', () => {
  const defaultAdmin = {
    id: 'rth-admin-99',
    email: 'rth.admin@realtutorialhub.com',
    name: 'RTH Administrator',
    role: 'admin',
    isAdmin: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useThemeStore.setState({ theme: 'theme-a' });
    useAuthStore.setState({
      user: defaultAdmin,
      isAuthenticated: true,
      isLocked: true,
    });
  });

  it('does not render when isLocked is false', () => {
    useAuthStore.setState({ isLocked: false });
    const { container } = render(<AdminLockScreen />);
    expect(container.firstChild).toBeNull();
  });

  it('does not render when user is null', () => {
    useAuthStore.setState({ user: null });
    const { container } = render(<AdminLockScreen />);
    expect(container.firstChild).toBeNull();
  });

  it('renders locked terminal with RTH user details and title', () => {
    render(<AdminLockScreen />);
    expect(screen.getByText('Terminal Locked')).toBeInTheDocument();
    expect(screen.getByText('rth.admin@realtutorialhub.com')).toBeInTheDocument();
    expect(screen.getByText('RTH Administrator')).toBeInTheDocument();
  });

  it('adapts visually to Theme A (pink tokens)', () => {
    useThemeStore.setState({ theme: 'theme-a' });
    render(<AdminLockScreen />);
    const submitBtn = screen.getByRole('button', { name: /unlock terminal/i });
    expect(submitBtn.className).toContain('from-[#FF4B91]');
  });

  it('adapts visually to Theme B (orange tokens)', () => {
    useThemeStore.setState({ theme: 'theme-b' });
    render(<AdminLockScreen />);
    const submitBtn = screen.getByRole('button', { name: /unlock terminal/i });
    expect(submitBtn.className).toContain('from-[#D03F00]');
  });

  it('successfully unlocks on valid reauthentication matching identity', async () => {
    const mockLoginPortal = vi.mocked(loginPortalSession);
    mockLoginPortal.mockResolvedValueOnce({
      user: {
        id: 'rth-admin-99',
        email: 'rth.admin@realtutorialhub.com',
        name: 'RTH Administrator',
        role: 'admin',
        isAdmin: true,
        onboarded: true,
      },
      expiresAt: '2026-12-31T23:59:59Z',
    });

    render(<AdminLockScreen />);

    const passwordInput = screen.getByLabelText(/master password/i);
    fireEvent.change(passwordInput, { target: { value: 'ValidPassword123' } });

    const submitBtn = screen.getByRole('button', { name: /unlock terminal/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLoginPortal).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'rth.admin@realtutorialhub.com',
          password: 'ValidPassword123',
          platform: 'realtutorialhub',
          portalIdentity: 'admin',
        })
      );
      expect(useAuthStore.getState().isLocked).toBe(false);
    });
  });

  it('rejects unlock and remains locked on incorrect password', async () => {
    const mockLoginPortal = vi.mocked(loginPortalSession);
    mockLoginPortal.mockRejectedValueOnce(new Error('Incorrect master password'));

    render(<AdminLockScreen />);

    const passwordInput = screen.getByLabelText(/master password/i);
    fireEvent.change(passwordInput, { target: { value: 'WrongPassword' } });

    const submitBtn = screen.getByRole('button', { name: /unlock terminal/i });
    fireEvent.click(submitBtn);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Incorrect master password');
    expect(useAuthStore.getState().isLocked).toBe(true);
  });

  it('rejects unlock and remains locked on identity mismatch (different user ID)', async () => {
    const mockLoginPortal = vi.mocked(loginPortalSession);
    mockLoginPortal.mockResolvedValueOnce({
      user: {
        id: 'different-attacker-id',
        email: 'attacker@realtutorialhub.com',
        role: 'admin',
        isAdmin: true,
      },
      expiresAt: null,
    });

    render(<AdminLockScreen />);

    const passwordInput = screen.getByLabelText(/master password/i);
    fireEvent.change(passwordInput, { target: { value: 'AnyPassword' } });

    const submitBtn = screen.getByRole('button', { name: /unlock terminal/i });
    fireEvent.click(submitBtn);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/does not match the locked session/i);
    expect(useAuthStore.getState().isLocked).toBe(true);
  });

  it('rejects unlock and remains locked if reauthenticated account lacks admin role', async () => {
    const mockLoginPortal = vi.mocked(loginPortalSession);
    mockLoginPortal.mockResolvedValueOnce({
      user: {
        id: 'rth-admin-99',
        email: 'rth.admin@realtutorialhub.com',
        role: 'student',
        isAdmin: false,
      },
      expiresAt: null,
    });

    render(<AdminLockScreen />);

    const passwordInput = screen.getByLabelText(/master password/i);
    fireEvent.change(passwordInput, { target: { value: 'StudentPassword' } });

    const submitBtn = screen.getByRole('button', { name: /unlock terminal/i });
    fireEvent.click(submitBtn);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/administrator role required/i);
    expect(useAuthStore.getState().isLocked).toBe(true);
  });

  it('dispatches logout and navigates to /login on switch account', () => {
    delete (window as unknown as { location?: unknown }).location;
    window.location = { href: '' } as unknown as Location;

    render(<AdminLockScreen />);

    const switchBtn = screen.getByRole('button', { name: /switch account/i });
    fireEvent.click(switchBtn);

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(window.location.href).toBe('/login');
  });
});
