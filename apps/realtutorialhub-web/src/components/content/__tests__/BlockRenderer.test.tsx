import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BlockRenderer } from '../BlockRenderer';
import { mockTutorialContent } from '../__fixtures__/mock-content';
import { getDomainTheme } from '@/lib/domain-themes';

import { renderWithIntl, runAxe } from './test-utils';

const theme = getDomainTheme('full-stack');

describe('BlockRenderer', () => {
  it('renders all 6 blocks and passes axe', async () => {
    const { container } = renderWithIntl(
      <BlockRenderer content={mockTutorialContent} theme={theme} subtopicId="11111111-1111-1111-1111-111111111111" subtopicName="Promises" />
    );

    expect(container.querySelectorAll('[data-tutorial-block]').length).toBe(6);
    expect(screen.getByLabelText('Notes block')).toBeDefined();
    expect(await screen.findByLabelText('AI tutor block')).toBeDefined();

    const results = await runAxe(container);
    expect(results.violations).toHaveLength(0);
  }, 30000);

  it('renders the loading skeleton when requested', () => {
    renderWithIntl(
      <BlockRenderer
        content={mockTutorialContent}
        theme={theme}
        subtopicId="11111111-1111-1111-1111-111111111111"
        subtopicName="Promises"
        simulateSlowLoad
      />
    );

    expect(screen.getAllByLabelText(/loading skeleton/i)).toHaveLength(6);
  });

  it('shows the error fallback when a block throws', () => {
    const { container } = renderWithIntl(
      <BlockRenderer
        content={mockTutorialContent}
        theme={theme}
        subtopicId="11111111-1111-1111-1111-111111111111"
        subtopicName="Promises"
        simulateError
      />
    );

    expect(container.textContent).toContain('Unable to load Technical. Try refreshing.');
  });
});
