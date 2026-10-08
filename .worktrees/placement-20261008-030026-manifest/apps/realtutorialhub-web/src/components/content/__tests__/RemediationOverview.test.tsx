import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RemediationOverview } from '../RemediationOverview';
import { getDomainTheme } from '@/lib/domain-themes';

const theme = getDomainTheme('full-stack');

describe('RemediationOverview', () => {
  it('renders the hierarchy trail and tutorial-note excerpt', () => {
    render(
      <RemediationOverview
        theme={theme}
        historyCount={1}
        currentPlan={{
          examResultId: 'exam-1',
          status: 'in_progress',
          overallProgress: { completed: 1, total: 2 },
          weakSubtopics: [
            {
              subtopicId: 'subtopic-1',
              subtopicName: 'Promise Chains',
              score: 41,
              threshold: 60,
              progress: 'in_progress',
              notesExcerpt: 'Promise notes belong to the tutorial flow and should be reviewed first.',
              hierarchy: {
                domainSlug: 'full-stack',
                subjectSlug: 'javascript',
                topicSlug: 'asynchronous-programming',
                subtopicSlug: 'promises',
              },
              href: '/learn/full-stack/javascript/asynchronous-programming/promises',
            },
          ],
        }}
      />
    );

    expect(screen.getByText('Promise Chains')).toBeDefined();
    expect(screen.getByText('Full Stack')).toBeDefined();
    expect(screen.getByText('Javascript')).toBeDefined();
    expect(screen.getByText('Asynchronous Programming')).toBeDefined();
    expect(screen.getByText('Promises')).toBeDefined();
    expect(screen.getByText(/Tutorial notes:/)).toBeDefined();
    expect(screen.getByRole('link', { name: 'Open notes' })).toBeDefined();
  });

  it('renders the empty state when no remediation plan is available', () => {
    render(<RemediationOverview theme={theme} historyCount={0} currentPlan={null} />);

    expect(screen.getByText('No remediation plan yet')).toBeDefined();
  });
});
