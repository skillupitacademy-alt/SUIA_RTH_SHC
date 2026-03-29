import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

const replaceMock = vi.fn();
const loginMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === 'redirect' ? '/dashboard' : null),
  }),
}));

vi.mock('@/utils/apiBase', () => ({
  getApiBase: () => '/api',
}));

vi.mock('@/utils/clientLogger', () => ({
  clientLogger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/store/auth-store', () => ({
  useAuthStore: (selector: (state: { login: typeof loginMock }) => unknown) => selector({ login: loginMock }),
}));

describe('Login page', () => {
  afterEach(() => {
    replaceMock.mockReset();
    loginMock.mockReset();
    vi.restoreAllMocks();
  });

  it('shows a friendly access-denied message instead of raw Forbidden text', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Forbidden' }),
      } as Response)
    );

    const { default: LoginPage } = await import('../page');

    render(React.createElement(LoginPage));

    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'ajayshah@gmail.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Access denied: this account is not permitted for this portal.')).toBeInTheDocument();
    });
    expect(screen.queryByText('Forbidden')).not.toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
