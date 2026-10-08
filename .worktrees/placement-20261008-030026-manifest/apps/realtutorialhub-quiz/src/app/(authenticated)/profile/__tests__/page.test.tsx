import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('@/hooks/queries/useUserProfile', () => ({
  useUserProfile: () => ({
    data: {
      user: {
        name: 'Student One',
        email: 'student.one@example.com',
        professionalStatus: 'Fresh Graduate',
        educationLevel: 'BSc',
        domainInterest: ['web-development', 'ai'],
      },
    },
    isLoading: false,
  }),
}));

vi.mock('@/hooks/queries/dashboard.queries', () => ({
  useDashboardQuery: () => ({
    data: {
      overview: {
        avgScore: 84,
        totalExams: 12,
        masteryPoints: 320,
        globalRank: 14,
        weeklyExamsCount: 3,
      },
      recentActivity: [
        { id: '1', title: 'Quiz 1', relativeTime: '2 days ago', score: '92%', status: 'completed' },
      ],
    },
    isLoading: false,
  }),
}));

describe('ProfilePage', () => {
  it('renders the student profile summary', async () => {
    const { default: ProfilePage } = await import('../page');

    render(React.createElement(ProfilePage));

    expect(screen.getByText('Your learning identity at a glance')).toBeInTheDocument();
    expect(screen.getByText('Student One')).toBeInTheDocument();
    expect(screen.getByText('student.one@example.com')).toBeInTheDocument();
    expect(screen.getByText('84%')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('320')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
    expect(screen.getByText('Fresh Graduate')).toBeInTheDocument();
    expect(screen.getByText('BSc')).toBeInTheDocument();
    expect(screen.getByText('web development')).toBeInTheDocument();
  });
});
