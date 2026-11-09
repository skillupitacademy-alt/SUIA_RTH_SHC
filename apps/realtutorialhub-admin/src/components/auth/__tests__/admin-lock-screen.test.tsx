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

  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal('fetch', fetchMock);

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

    const passwordInput = screen.getByLabelText(/account password/i);
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
    mockLoginPortal.mockRejectedValueOnce(new Error('Invalid credentials'));

    render(<AdminLockScreen />);

    const passwordInput = screen.getByLabelText(/account password/i);
    fireEvent.change(passwordInput, { target: { value: 'WrongPassword' } });

    const submitBtn = screen.getByRole('button', { name: /unlock terminal/i });
    fireEvent.click(submitBtn);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Invalid account password');
    expect(useAuthStore.getState().isLocked).toBe(true);
  });

  it('rejects unlock, purges session side effects, and remains locked on identity mismatch (different user ID)', async () => {
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

    const passwordInput = screen.getByLabelText(/account password/i);
    fireEvent.change(passwordInput, { target: { value: 'AnyPassword' } });

    const submitBtn = screen.getByRole('button', { name: /unlock terminal/i });
    fireEvent.click(submitBtn);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/does not match the locked session/i);
    expect(useAuthStore.getState().isLocked).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/logout',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: expect.objectContaining({ 'x-platform': 'realtutorialhub' }),
      })
    );
  });

  it('rejects unlock and purges session side effects if reauthenticated response is missing user ID', async () => {
    const mockLoginPortal = vi.mocked(loginPortalSession);
    mockLoginPortal.mockResolvedValueOnce({
      user: {
        id: '',
        email: 'rth.admin@realtutorialhub.com',
        role: 'admin',
        isAdmin: true,
      },
      expiresAt: null,
    });

    render(<AdminLockScreen />);

    const passwordInput = screen.getByLabelText(/account password/i);
    fireEvent.change(passwordInput, { target: { value: 'AnyPassword' } });
    fireEvent.click(screen.getByRole('button', { name: /unlock terminal/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Authentication response is missing user ID');
    expect(useAuthStore.getState().isLocked).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', expect.anything());
  });

  it('rejects unlock and purges session side effects if reauthenticated response is missing email', async () => {
    const mockLoginPortal = vi.mocked(loginPortalSession);
    mockLoginPortal.mockResolvedValueOnce({
      user: {
        id: 'rth-admin-99',
        email: '',
        role: 'admin',
        isAdmin: true,
      },
      expiresAt: null,
    });

    render(<AdminLockScreen />);

    const passwordInput = screen.getByLabelText(/account password/i);
    fireEvent.change(passwordInput, { target: { value: 'AnyPassword' } });
    fireEvent.click(screen.getByRole('button', { name: /unlock terminal/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Authentication response is missing user email');
    expect(useAuthStore.getState().isLocked).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', expect.anything());
  });

  it('rejects unlock without calling loginPortalSession when locked session identity is invalid', async () => {
    useAuthStore.setState({
      user: {
        id: '',
        email: '',
        role: 'admin',
        isAdmin: true,
      },
    });

    const mockLoginPortal = vi.mocked(loginPortalSession);

    render(<AdminLockScreen />);

    const passwordInput = screen.getByLabelText(/account password/i);
    fireEvent.change(passwordInput, { target: { value: 'AnyPassword' } });
    fireEvent.click(screen.getByRole('button', { name: /unlock terminal/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Locked session identity is missing or invalid');
    expect(useAuthStore.getState().isLocked).toBe(true);
    expect(mockLoginPortal).not.toHaveBeenCalled();
  });

  it('rejects unlock even if isAdmin: true when returned role is not an authorized administrator', async () => {
    const mockLoginPortal = vi.mocked(loginPortalSession);
    mockLoginPortal.mockResolvedValueOnce({
      user: {
        id: 'rth-admin-99',
        email: 'rth.admin@realtutorialhub.com',
        role: 'student', // non-admin role
        isAdmin: true, // Should be rejected because role is not admin/super_admin
      },
      expiresAt: null,
    });

    render(<AdminLockScreen />);

    const passwordInput = screen.getByLabelText(/account password/i);
    fireEvent.change(passwordInput, { target: { value: 'StudentPassword' } });

    const submitBtn = screen.getByRole('button', { name: /unlock terminal/i });
    fireEvent.click(submitBtn);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/administrator role required/i);
    expect(useAuthStore.getState().isLocked).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', expect.anything());
  });

  it('rejects contradictory administrator claims (admin role with isAdmin: false)', async () => {
    const mockLoginPortal = vi.mocked(loginPortalSession);
    mockLoginPortal.mockResolvedValueOnce({
      user: {
        id: 'rth-admin-99',
        email: 'rth.admin@realtutorialhub.com',
        role: 'admin',
        isAdmin: false, // Contradictory!
      },
      expiresAt: null,
    });

    render(<AdminLockScreen />);

    const passwordInput = screen.getByLabelText(/account password/i);
    fireEvent.change(passwordInput, { target: { value: 'Password' } });
    fireEvent.click(screen.getByRole('button', { name: /unlock terminal/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Authentication contract violation: Contradictory administrator status');
    expect(useAuthStore.getState().isLocked).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', expect.anything());
  });

  it('rejects unlock and purges session side effects when response user object is missing', async () => {
    const mockLoginPortal = vi.mocked(loginPortalSession);
    mockLoginPortal.mockResolvedValueOnce({
      user: null as unknown as { id: string; email: string },
      expiresAt: null,
    });

    render(<AdminLockScreen />);

    const passwordInput = screen.getByLabelText(/account password/i);
    fireEvent.change(passwordInput, { target: { value: 'Password' } });
    fireEvent.click(screen.getByRole('button', { name: /unlock terminal/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Invalid authentication response');
    expect(useAuthStore.getState().isLocked).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', expect.anything());
  });

  it('dispatches logout and navigates to /login on switch account, clearing session cookies', async () => {
    delete (window as unknown as { location?: unknown }).location;
    window.location = { href: '' } as unknown as Location;

    render(<AdminLockScreen />);

    const switchBtn = screen.getByRole('button', { name: /switch account/i });
    fireEvent.click(switchBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/auth/logout',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(window.location.href).toBe('/login');
    });
  });
});
