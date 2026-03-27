import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

const replaceMock = vi.fn();
const OnboardingWizardMock = vi.fn(() => React.createElement('div', null, 'Onboarding Wizard'));
const authState = {
  user: null as { onboarded?: boolean } | null,
  initialized: true,
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

vi.mock('@/components/onboarding/OnboardingWizard', () => ({
  OnboardingWizard: () => OnboardingWizardMock(),
}));

vi.mock('@/store/auth-store', () => ({
  useAuthStore: (selector: (state: { user: { onboarded?: boolean } | null; initialized: boolean }) => unknown) =>
    selector(authState),
}));

describe('OnboardingPage', () => {
  afterEach(() => {
    replaceMock.mockReset();
    OnboardingWizardMock.mockClear();
    authState.user = null;
    authState.initialized = true;
  });

  it('renders the onboarding wizard when the user is not onboarded', async () => {
    authState.user = null;

    const { default: OnboardingPage } = await import('../page');

    render(React.createElement(OnboardingPage));

    expect(screen.getByText('Onboarding Wizard')).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('redirects onboarded users to the dashboard', async () => {
    authState.user = { onboarded: true };

    const { default: OnboardingPage } = await import('../page');

    render(React.createElement(OnboardingPage));

    expect(replaceMock).toHaveBeenCalledWith('/dashboard');
  });
});
