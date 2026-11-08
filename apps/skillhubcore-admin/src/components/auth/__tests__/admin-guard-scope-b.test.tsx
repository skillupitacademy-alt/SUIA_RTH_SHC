/** @vitest-environment jsdom */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { AdminGuard } from '../AdminGuard';
import { useAuthStore } from '@/store/auth-store';

const mockApiClient = vi.hoisted(() => ({
  auth: {
    getAdminSession: vi.fn(),
  },
  client: {
    setPortalIdentity: vi.fn(),
  },
}));

vi.mock('@quiz/api-client', () => ({
  apiClient: mockApiClient,
  ApiRequestError: class ApiRequestError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

vi.mock('@quiz/observability', () => ({
  recordCounter: vi.fn(),
}));

vi.mock('@quiz/ui', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useAuthSync: vi.fn(),
  };
});

vi.mock('@/utils/clientLogger', () => ({
  clientLogger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

let currentPathname = '/dashboard';
vi.mock('next/navigation', () => ({
  usePathname: () => currentPathname,
}));

describe('AdminGuard & SHC Lock Screen — Scope B1 Final Closure', () => {
  let currentHref = '';

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().logout();
    currentPathname = '/dashboard';
    currentHref = '';

    Object.defineProperty(window, 'location', {
      value: {
        get href() {
          return currentHref;
        },
        set href(val: string) {
          currentHref = val;
        },
        pathname: '/dashboard',
        assign: vi.fn(),
        replace: vi.fn(),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children directly on /login without calling session check', () => {
    currentPathname = '/login';
    render(
      <AdminGuard>
        <div data-testid="login-content">Login Form</div>
      </AdminGuard>
    );

    expect(screen.getByTestId('login-content')).toBeDefined();
    expect(mockApiClient.auth.getAdminSession).not.toHaveBeenCalled();
  });

  it('renders children directly on /forbidden without calling session check', () => {
    currentPathname = '/forbidden';
    render(
      <AdminGuard>
        <div data-testid="forbidden-content">Access Denied Page</div>
      </AdminGuard>
    );

    expect(screen.getByTestId('forbidden-content')).toBeDefined();
    expect(mockApiClient.auth.getAdminSession).not.toHaveBeenCalled();
  });

  it('enforces session validation on /questions (confirming removal of dev bypass)', async () => {
    currentPathname = '/questions';
    mockApiClient.auth.getAdminSession.mockResolvedValueOnce({
      user: {
        id: 'admin-1',
        email: 'admin@shc.in',
        role: 'admin',
        isAdmin: true,
      },
    });

    render(
      <AdminGuard>
        <div data-testid="protected-questions">Questions Content</div>
      </AdminGuard>
    );

    // Confirms that session is checked and NOT bypassed on /questions
    expect(mockApiClient.auth.getAdminSession).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getByTestId('protected-questions')).toBeDefined();
    });
  });

  it('does NOT render protected children before revalidation even if Zustand store has admin role (Tasks 14 & 20)', async () => {
    // Stale Zustand state from previous session
    useAuthStore.getState().login({
      id: 'stale-admin-1',
      name: 'Stale Admin',
      email: 'stale@shc.in',
      role: 'admin',
      isAdmin: true,
    });

    // Revalidation is in flight and resolves to demoted student
    let resolveSession: (value: unknown) => void = () => { };
    const pendingPromise = new Promise((resolve) => {
      resolveSession = resolve;
    });
    mockApiClient.auth.getAdminSession.mockReturnValueOnce(pendingPromise);

    render(
      <AdminGuard>
        <div data-testid="sensitive-admin-data">Secret Admin Financials</div>
      </AdminGuard>
    );

    // Assert: while revalidation is in-flight, protected children MUST NOT be displayed!
    expect(screen.queryByTestId('sensitive-admin-data')).toBeNull();
    expect(screen.getByText('Loading SkillHubCore Admin...')).toBeDefined();

    // Now resolve revalidation as a revoked/demoted role
    resolveSession({
      user: {
        id: 'stale-admin-1',
        email: 'stale@shc.in',
        role: 'student',
        isAdmin: false,
      },
    });

    await waitFor(() => {
      expect(window.location.href).toBe('/forbidden');
    });

    // Content was NEVER rendered to the DOM
    expect(screen.queryByTestId('sensitive-admin-data')).toBeNull();
  });

  it('redirects to /login when session revalidation returns 401 Unauthorized', async () => {
    currentPathname = '/dashboard';
    mockApiClient.auth.getAdminSession.mockRejectedValueOnce({
      status: 401,
      message: 'Unauthorized',
    });

    render(
      <AdminGuard>
        <div data-testid="protected-content">Secret Content</div>
      </AdminGuard>
    );

    await waitFor(() => {
      expect(window.location.href).toBe('/login');
    });
  });

  it('redirects to /forbidden when session revalidation returns non-admin role (e.g. student)', async () => {
    currentPathname = '/dashboard';
    mockApiClient.auth.getAdminSession.mockResolvedValueOnce({
      user: {
        id: 'student-1',
        email: 'student@shc.in',
        role: 'student',
        isAdmin: false,
      },
    });

    render(
      <AdminGuard>
        <div data-testid="protected-content">Secret Content</div>
      </AdminGuard>
    );

    await waitFor(() => {
      expect(window.location.href).toBe('/forbidden');
    });
  });

  it('redirects to /forbidden when session revalidation returns 403 Forbidden', async () => {
    currentPathname = '/metrics';
    mockApiClient.auth.getAdminSession.mockRejectedValueOnce({
      status: 403,
      message: 'Forbidden: Insufficient privileges',
    });

    render(
      <AdminGuard>
        <div data-testid="metrics-content">Metrics Content</div>
      </AdminGuard>
    );

    await waitFor(() => {
      expect(window.location.href).toBe('/forbidden');
    });
  });

  // --- Tasks 6–12: SHC Lock Screen Authentication & Safe Unlock Flow ---
  describe('SHC AdminLockScreen — Safe Re-authentication and Unlock Flow', () => {
    it('mounts lock screen with password field and focus trap when session is locked', () => {
      useAuthStore.getState().login({
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@skillhubcore.in',
        role: 'admin',
        isAdmin: true,
      });
      useAuthStore.getState().lock();

      render(
        <AdminGuard>
          <div data-testid="protected-content">Secret Content</div>
        </AdminGuard>
      );

      expect(screen.getByPlaceholderText('Enter master password')).toBeDefined();
      expect(screen.getByText('SkillHubCore Security Protocol')).toBeDefined();
      expect(screen.getByText('admin@skillhubcore.in')).toBeDefined();
      expect(screen.getByText('Unlock Terminal')).toBeDefined();
    });

    it('successfully unlocks when SHC login BFF validates password and matching identity (Tasks 6–9)', async () => {
      useAuthStore.getState().login({
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@skillhubcore.in',
        role: 'admin',
        isAdmin: true,
      });
      useAuthStore.getState().lock();

      // Mock authentic SHC BFF fetch response
      const fetchMock = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          user: {
            id: 'admin-1',
            email: 'admin@skillhubcore.in',
            role: 'admin',
            isAdmin: true,
          },
        }),
      });
      vi.stubGlobal('fetch', fetchMock);

      render(
        <AdminGuard>
          <div data-testid="protected-content">Secret Content</div>
        </AdminGuard>
      );

      const passwordInput = screen.getByPlaceholderText('Enter master password');
      fireEvent.change(passwordInput, { target: { value: 'testing' } });

      const unlockBtn = screen.getByText('Unlock Terminal');
      fireEvent.click(unlockBtn);

      await waitFor(() => {
        // Assert fetch was called with correct SHC endpoint and headers (Task 6 & 7)
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/auth/login',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'x-brand': 'skillhubcore',
            }),
            body: JSON.stringify({
              email: 'admin@skillhubcore.in',
              password: 'testing',
              platform: 'skillhubcore',
            }),
          })
        );

        // Lock state must be released (Task 8)
        expect(useAuthStore.getState().isLocked).toBe(false);
      });
    });

    it('rejects wrong password and keeps terminal locked (Tasks 8 & 12)', async () => {
      useAuthStore.getState().login({
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@skillhubcore.in',
        role: 'admin',
        isAdmin: true,
      });
      useAuthStore.getState().lock();

      const fetchMock = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid credentials' }),
      });
      vi.stubGlobal('fetch', fetchMock);

      render(
        <AdminGuard>
          <div data-testid="protected-content">Secret Content</div>
        </AdminGuard>
      );

      const passwordInput = screen.getByPlaceholderText('Enter master password');
      fireEvent.change(passwordInput, { target: { value: 'wrong-password' } });

      const unlockBtn = screen.getByText('Unlock Terminal');
      fireEvent.click(unlockBtn);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeDefined();
        // Crucial: terminal MUST remain locked
        expect(useAuthStore.getState().isLocked).toBe(true);
      });
    });

    it('rejects identity mismatch and keeps terminal locked (Task 9)', async () => {
      useAuthStore.getState().login({
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@skillhubcore.in',
        role: 'admin',
        isAdmin: true,
      });
      useAuthStore.getState().lock();

      // Return a completely different admin ID
      const fetchMock = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          user: {
            id: 'admin-attacker-99',
            email: 'attacker@other.in',
            role: 'admin',
            isAdmin: true,
          },
        }),
      });
      vi.stubGlobal('fetch', fetchMock);

      render(
        <AdminGuard>
          <div data-testid="protected-content">Secret Content</div>
        </AdminGuard>
      );

      const passwordInput = screen.getByPlaceholderText('Enter master password');
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const unlockBtn = screen.getByText('Unlock Terminal');
      fireEvent.click(unlockBtn);

      await waitFor(() => {
        expect(screen.getByText('Reauthenticated user does not match the locked session')).toBeDefined();
        expect(useAuthStore.getState().isLocked).toBe(true);
      });
    });

    it('rejects non-admin role returned from login (Task 10)', async () => {
      useAuthStore.getState().login({
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@skillhubcore.in',
        role: 'admin',
        isAdmin: true,
      });
      useAuthStore.getState().lock();

      const fetchMock = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          user: {
            id: 'admin-1',
            email: 'admin@skillhubcore.in',
            role: 'student', // non-admin role
            isAdmin: false,
          },
        }),
      });
      vi.stubGlobal('fetch', fetchMock);

      render(
        <AdminGuard>
          <div data-testid="protected-content">Secret Content</div>
        </AdminGuard>
      );

      const passwordInput = screen.getByPlaceholderText('Enter master password');
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const unlockBtn = screen.getByText('Unlock Terminal');
      fireEvent.click(unlockBtn);

      await waitFor(() => {
        expect(screen.getByText('Insufficient permissions: Administrator role required')).toBeDefined();
        expect(useAuthStore.getState().isLocked).toBe(true);
      });
    });

    it('handles network failure safely without unlocking (Task 12)', async () => {
      useAuthStore.getState().login({
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@skillhubcore.in',
        role: 'admin',
        isAdmin: true,
      });
      useAuthStore.getState().lock();

      const fetchMock = vi.fn().mockRejectedValueOnce(new Error('Network error'));
      vi.stubGlobal('fetch', fetchMock);

      render(
        <AdminGuard>
          <div data-testid="protected-content">Secret Content</div>
        </AdminGuard>
      );

      const passwordInput = screen.getByPlaceholderText('Enter master password');
      fireEvent.change(passwordInput, { target: { value: 'testing' } });

      const unlockBtn = screen.getByText('Unlock Terminal');
      fireEvent.click(unlockBtn);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeDefined();
        expect(useAuthStore.getState().isLocked).toBe(true);
      });
    });

    it('switch account button logs out and redirects to /login (Task 11)', async () => {
      useAuthStore.getState().login({
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@skillhubcore.in',
        role: 'admin',
        isAdmin: true,
      });
      useAuthStore.getState().lock();

      render(
        <AdminGuard>
          <div data-testid="protected-content">Secret Content</div>
        </AdminGuard>
      );

      const switchBtn = screen.getByLabelText('Switch account');
      fireEvent.click(switchBtn);

      await waitFor(() => {
        expect(useAuthStore.getState().isAuthenticated).toBe(false);
        expect(window.location.href).toBe('/login');
      });
    });
  });
});
