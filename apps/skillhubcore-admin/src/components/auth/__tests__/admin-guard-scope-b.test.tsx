/** @vitest-environment jsdom */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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

describe('AdminGuard — Scope B1 Client Guard Verification', () => {
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
});
