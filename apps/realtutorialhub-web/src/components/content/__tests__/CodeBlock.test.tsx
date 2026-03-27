import { cleanup, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CodeBlock } from '../CodeBlock';
import { mockTutorialContent } from '../__fixtures__/mock-content';
import { getDomainTheme } from '@/lib/domain-themes';

import { renderWithIntl, runAxe } from './test-utils';

const theme = getDomainTheme('full-stack');

describe('CodeBlock', () => {
  it('renders content, exposes an aria-label, and passes axe', async () => {
    const { container } = renderWithIntl(<CodeBlock data={mockTutorialContent.code} theme={theme} />);

    expect(screen.getByLabelText('Code example block')).toBeDefined();
    expect(screen.getAllByText(/This example shows how a promise resolves/)).toHaveLength(1);

    const results = await runAxe(container);
    expect(results.violations).toHaveLength(0);
  });

  it('handles null and empty content without crashing', () => {
    renderWithIntl(<CodeBlock data={null} theme={theme} />);
    expect(screen.getByLabelText('Code example block')).toBeDefined();

    cleanup();

    renderWithIntl(
      <CodeBlock
        data={{
          language: 'javascript',
          intro: '',
          code: '',
          steps: [],
          image: null,
        }}
        theme={theme}
      />
    );

    expect(screen.getByLabelText('Code example block')).toBeDefined();
  });
});
