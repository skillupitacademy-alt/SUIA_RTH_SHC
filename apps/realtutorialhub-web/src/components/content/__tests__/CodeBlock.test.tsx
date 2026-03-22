import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CodeBlock } from '../CodeBlock';
import React from 'react';

describe('CodeBlock', () => {
  const mockData = {
    language: 'javascript',
    intro: 'This is a test introduction',
    code: 'console.log("Hello, World!");',
    steps: ['Step 1: Open terminal', 'Step 2: Run node script.js'],
    image: null,
  };

  const mockTheme = {
    blockCode: '#000',
    blockCodeHeader: '#fff',
  };

  it('renders correctly with given data', () => {
    render(<CodeBlock data={mockData} theme={mockTheme} />);

    // Check header
    expect(screen.getByText('Code (javascript)')).toBeDefined();

    // Check intro text
    expect(screen.getByText('This is a test introduction')).toBeDefined();

    // Check code snippet
    expect(screen.getByText('console.log("Hello, World!");')).toBeDefined();

    // Check steps
    expect(screen.getByText('Step 1: Open terminal')).toBeDefined();
    expect(screen.getByText('Step 2: Run node script.js')).toBeDefined();
  });
});
