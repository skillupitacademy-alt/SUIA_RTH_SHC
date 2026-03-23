import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TechnicalBlock } from '../TechnicalBlock';
import { mockTutorialContent } from '../__fixtures__/mock-content';
import { getDomainTheme } from '@/lib/domain-themes';

import { renderWithIntl, runAxe } from './test-utils';

const theme = getDomainTheme('full-stack');

describe('TechnicalBlock', () => {
  it('renders content, exposes an aria-label, and passes axe', async () => {
    const { container } = renderWithIntl(<TechnicalBlock data={mockTutorialContent.technical} theme={theme} />);

    expect(screen.getByLabelText('Technical block')).toBeDefined();
    expect(screen.getByText(/A promise can be pending/)).toBeDefined();

    const results = await runAxe(container);
    expect(results.violations).toHaveLength(0);
  });

  it('handles null and empty content without crashing', () => {
    const { rerender } = renderWithIntl(<TechnicalBlock data={null} theme={theme} />);

    expect(screen.getByLabelText('Technical block')).toBeDefined();

    rerender(<TechnicalBlock data={{ markdown: '', bullets: [], tip: '', image: null }} theme={theme} />);
    expect(screen.getByLabelText('Technical block')).toBeDefined();
  });
});
