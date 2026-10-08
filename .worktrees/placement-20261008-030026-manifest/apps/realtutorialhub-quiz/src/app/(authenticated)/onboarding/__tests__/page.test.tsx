import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('../../../../../../../src/share-branding/auth/serverAuthState', () => ({
  fetchBackendAuthState: vi.fn(async () => null),
}));

vi.mock('../../../../../../../src/share-branding/onboardingPageData', () => ({
  loadOnboardingData: vi.fn(async () => ({
    initialForm: {
      fullName: '',
      educationLevel: '',
      status: '',
      primaryGoal: '',
      domain: '',
      subDomain: '',
      skillLevel: '',
      timeCommitment: '',
    },
    steps: [],
    welcome: { title: 'Welcome', subtitle: 'Hello', cards: [], skipLabel: 'Skip', nextLabel: 'Start' },
    profile: {
      title: 'Profile',
      subtitle: 'Profile subtitle',
      fullNameLabel: 'Full name',
      fullNamePlaceholder: 'Jane Doe',
      educationLevelLabel: 'Education',
      educationLevelPlaceholder: 'Select',
      educationLevels: [],
      statusLabel: 'Status',
      statusOptions: [],
    },
    goal: { title: 'Goal', subtitle: 'Goal subtitle', cards: [] },
    domain: { title: 'Domain', subtitle: 'Domain subtitle', cards: [] },
    skillLevel: {
      title: 'Skill',
      subtitle: 'Skill subtitle',
      skillLevelLabel: 'Skill level',
      timeCommitmentLabel: 'Time commitment',
      levels: [],
      timeCommitments: [],
    },
    initialization: { messages: [], subtitle: 'Preparing' },
    footer: { legalText: 'Legal' },
  })),
}));

vi.mock('../../../../../../../src/share-branding/OnboardingEngine/components/OnboardingPage', () => ({
  OnboardingPage: () => React.createElement('div', null, 'Shared Onboarding Page'),
}));

describe('OnboardingPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the shared onboarding page when onboarding is pending', async () => {
    const { default: OnboardingPage } = await import('../page');

    render(await OnboardingPage());

    expect(screen.getByText('Shared Onboarding Page')).toBeInTheDocument();
  });
});
