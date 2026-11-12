import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BlockRenderer } from '../BlockRenderer';
import { mockTutorialContent } from '../__fixtures__/mock-content';
import { getDomainTheme } from '../../../lib/domain-themes';

import { renderWithIntl, runAxe } from './test-utils';

const theme = getDomainTheme('full-stack');

describe('BlockRenderer', () => {
  it('renders the default notes block and passes axe', async () => {
    const { container } = renderWithIntl(
      <BlockRenderer
        content={mockTutorialContent}
        theme={theme}
        subtopicId="11111111-1111-1111-1111-111111111111"
        subtopicName="Promises"
      />
    );

    expect(container.querySelector('#block-notes')).not.toBeNull();
    expect(screen.getByLabelText('Notes block')).toBeDefined();

    const results = await runAxe(container);
    expect(results.violations).toHaveLength(0);
  }, 30000);

  it('renders the requested activeBlockType', () => {
    const { container } = renderWithIntl(
      <BlockRenderer
        activeBlockType="technical"
        content={mockTutorialContent}
        theme={theme}
        subtopicId="11111111-1111-1111-1111-111111111111"
        subtopicName="Promises"
      />
    );

    expect(container.querySelector('#block-technical')).not.toBeNull();
    expect(screen.getByLabelText('Technical block')).toBeDefined();
  });

  it('prioritizes explicit type over activeBlockType', async () => {
    const { container } = renderWithIntl(
      <BlockRenderer
        type="ai_tutor"
        activeBlockType="notes"
        content={mockTutorialContent}
        theme={theme}
        subtopicId="11111111-1111-1111-1111-111111111111"
        subtopicName="Promises"
      />
    );

    expect(container.querySelector('#block-ai_tutor')).not.toBeNull();
    expect(await screen.findByLabelText('AI tutor block')).toBeDefined();
  });
});

