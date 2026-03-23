import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LaymanBlock } from '../LaymanBlock';
import { mockTutorialContent } from '../__fixtures__/mock-content';
import { getDomainTheme } from '@/lib/domain-themes';

import { renderWithIntl, runAxe } from './test-utils';

const theme = getDomainTheme('full-stack');

describe('LaymanBlock', () => {
  it('renders content, exposes an aria-label, and passes axe', async () => {
    const { container } = renderWithIntl(<LaymanBlock data={mockTutorialContent.layman} theme={theme} />);

    expect(screen.getByLabelText('Layman block')).toBeDefined();
    expect(screen.getByText(/A promise is like placing an order/)).toBeDefined();

    const results = await runAxe(container);
    expect(results.violations).toHaveLength(0);
  });

  it('handles null and empty content without crashing', () => {
    const { rerender } = renderWithIntl(<LaymanBlock data={null} theme={theme} />);

    expect(screen.getByLabelText('Layman block')).toBeDefined();

    rerender(
      <LaymanBlock
        data={{
          simpleExplanation: '',
          analogyOrStory: '',
          example1: { company: '', content: '' },
          example2: { company: '', content: '' },
          image: null,
        }}
        theme={theme}
      />
    );

    expect(screen.getByLabelText('Layman block')).toBeDefined();
  });
});
