/** @vitest-environment jsdom */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LoginPage from '../page';

const mocks = vi.hoisted(() => ({ push: vi.fn(), login: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
  useSearchParams: () => new URLSearchParams('redirect=%2Fquestions'),
}));
vi.mock('@/store/auth-store', () => ({ useAuthStore: () => ({ login: mocks.login }) }));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe('SHC login submission', () => {
  it('renders a POST fallback and disables credentials before hydration', () => {
    const root = document.createElement('div');
    root.innerHTML = renderToString(<LoginPage />);
    const form = root.querySelector('form')!;
    expect(form.method).toBe('post');
    expect(form.getAttribute('action')).toBe('/login');
    expect(root.querySelector<HTMLInputElement>('#email')!.disabled).toBe(true);
    expect(root.querySelector<HTMLInputElement>('#password')!.disabled).toBe(true);
    expect(root.querySelector<HTMLButtonElement>('button[type=submit]')!.disabled).toBe(true);
    expect(root.querySelector('noscript')?.textContent).toContain('Enable JavaScript');
  });

  it('submits hydrated credentials as JSON POST and preserves the internal redirect', async () => {
    const upstream = vi.fn().mockResolvedValue(Response.json({
      user: { id: 'synthetic-admin', email: 'fixture@example.invalid', role: 'admin', isAdmin: true },
    }));
    vi.stubGlobal('fetch', upstream);
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'fixture@example.invalid' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'synthetic-fixture-value' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Sign In to Console' }).closest('form')!);
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/questions'));
    expect(upstream).toHaveBeenCalledExactlyOnceWith('/api/auth/login', expect.objectContaining({
      method: 'POST', credentials: 'include',
      body: JSON.stringify({ email: 'fixture@example.invalid', password: 'synthetic-fixture-value', platform: 'skillhubcore' }),
    }));
  });
  it('does not display upstream authentication diagnostics', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ message: 'private-diagnostic-canary' }, { status: 500 })));
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'fixture@example.invalid' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'synthetic-fixture-value' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Sign In to Console' }).closest('form')!);
    await screen.findByText('Authentication service is unavailable. Try again.');
    expect(screen.queryByText('private-diagnostic-canary')).toBeNull();
    expect(mocks.login).not.toHaveBeenCalled();
  });
});
