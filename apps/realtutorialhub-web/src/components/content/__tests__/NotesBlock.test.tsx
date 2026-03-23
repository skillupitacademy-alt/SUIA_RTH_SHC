import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NotesBlock } from '../NotesBlock';
import { mockTutorialContent } from '../__fixtures__/mock-content';
import { getDomainTheme } from '@/lib/domain-themes';

import { renderWithIntl, runAxe } from './test-utils';

const theme = getDomainTheme('full-stack');

describe('NotesBlock', () => {
  it('renders content, exposes an aria-label, and passes axe', async () => {
    const { container } = renderWithIntl(<NotesBlock data={mockTutorialContent.notes} theme={theme} />);

    expect(screen.getByLabelText('Notes block')).toBeDefined();
    expect(screen.getByText(/Promises are placeholders/)).toBeDefined();

    const results = await runAxe(container);
    expect(results.violations).toHaveLength(0);
  });

  it('handles null and empty content without crashing', () => {
    const { rerender } = renderWithIntl(<NotesBlock data={null} theme={theme} />);

    expect(screen.getByLabelText('Notes block')).toBeDefined();

    rerender(<NotesBlock data={{ markdown: '', image: null }} theme={theme} />);
    expect(screen.getByLabelText('Notes block')).toBeDefined();
  });
});
