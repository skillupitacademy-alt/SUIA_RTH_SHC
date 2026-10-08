import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('../../../../../../../src/share-branding/AuthPage', () => ({
  default: ({ brand, initialMode }: { brand: string; initialMode?: string }) =>
    React.createElement('div', null, `AuthPage:${brand}:${initialMode ?? 'login'}`),
}));

describe('Login page', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the shared auth page for RealTutorialHub login', async () => {
    const { default: LoginPage } = await import('../page');

    render(React.createElement(LoginPage));

    expect(screen.getByText('AuthPage:realtutorialhub:login')).toBeInTheDocument();
  });
});
