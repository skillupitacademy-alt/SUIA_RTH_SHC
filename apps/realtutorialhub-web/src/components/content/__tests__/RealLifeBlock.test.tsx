import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RealLifeBlock } from '../RealLifeBlock';
import { mockTutorialContent } from '../__fixtures__/mock-content';
import { getDomainTheme } from '@/lib/domain-themes';

import { renderWithIntl, runAxe } from './test-utils';

const theme = getDomainTheme('full-stack');

describe('RealLifeBlock', () => {
  it('renders content, exposes an aria-label, and passes axe', async () => {
    const { container } = renderWithIntl(<RealLifeBlock data={mockTutorialContent.real_life} theme={theme} />);

    expect(screen.getByLabelText('Real life block')).toBeDefined();
    expect(screen.getByText('Ordering Food with a Delivery App')).toBeDefined();

    const results = await runAxe(container);
    expect(results.violations).toHaveLength(0);
  });

  it('handles null and empty content without crashing', () => {
    const { rerender } = renderWithIntl(<RealLifeBlock data={null} theme={theme} />);

    expect(screen.getByLabelText('Real life block')).toBeDefined();

    rerender(
      <RealLifeBlock
        data={{ title: '', scenario: '', bullets: [], tip: '', image: null }}
        theme={theme}
      />
    );

    expect(screen.getByLabelText('Real life block')).toBeDefined();
  });
});
