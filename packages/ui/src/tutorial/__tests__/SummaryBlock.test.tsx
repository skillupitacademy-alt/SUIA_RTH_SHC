// @vitest-environment jsdom

import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SummaryBlock } from '../blocks/SummaryBlock';

describe('SummaryBlock', () => {
  it('renders rich S1 content and sanitizes external HTML', () => {
    const { container } = render(
      <SummaryBlock
        block={{
          id: 'summary-s1',
          type: 'summary',
          version: 'S1',
          content: {
            page: { title: 'Revision', introduction: 'Review the essentials.' },
            summary: [{ text: 'Safe <code>const answer = 42</code><img src=x onerror=alert(1) />' }],
          },
        } as any}
        theme={{ primary: '#124fd6', secondary: '#0b1b3d' }}
      />
    );

    expect(screen.getByText('Revision')).toBeInTheDocument();
    expect(screen.getByText('const answer = 42')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });
});
