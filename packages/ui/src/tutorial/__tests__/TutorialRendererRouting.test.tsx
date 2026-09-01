// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { TutorialBlockRenderer } from '../TutorialBlockRenderer';
import type { CodeBlock } from '@quiz/types';

// Phase 2D: Code C1/Legacy Routing Tests
describe('Phase 2D - Code Block Version Routing', () => {
  it('TEST R1 — routes code/C1 to CodeC1Block renderer', () => {
    const c1Block: any = {
      id: 'c1-block',
      type: 'code',
      version: 'C1',
      content: {
        page: {
          type: 'code',
          title: 'Python Print Statement',
          introduction: 'The print() function displays output to the console in Python programs.',
          language: 'python',
          code: 'print("Hello, World!")',
          explanation: [
            {
              focus: 'print() function',
              description: 'Built-in function that outputs text to the console for debugging.',
            },
            {
              focus: 'String argument',
              description: 'The text "Hello, World!" is passed as a string parameter to print().',
            },
          ],
          takeaway: 'Use print() to display output and debug Python programs.',
        },
      },
    };

    const { container } = render(<TutorialBlockRenderer block={c1Block} />);
    
    // Verify C1-specific rendering (title, introduction, explanation sections)
    expect(screen.getByText('Python Print Statement')).toBeInTheDocument();
    expect(screen.getByText(/The print\(\) function displays output/)).toBeInTheDocument();
    expect(screen.getByText('print() function')).toBeInTheDocument();
    expect(screen.getByText('String argument')).toBeInTheDocument();
    
    // Verify data attributes specific to C1
    const article = container.querySelector('article[data-block-version="C1"]');
    expect(article).toBeInTheDocument();
  });

  it('TEST R2 — rejects legacy code without version (strict C1 architecture)', () => {
    const legacyBlock: CodeBlock = {
      id: 'legacy-code',
      type: 'code',
      content: {
        language: 'python',
        code: 'print("legacy")',
        filename: 'legacy.py',
        caption: 'Legacy code example',
      },
    };

    const { container } = render(<TutorialBlockRenderer block={legacyBlock} />);
    
    // Current architecture requires C1 version, so unversioned code produces error
    const errorAlert = container.querySelector('[role="alert"]');
    expect(errorAlert).toBeInTheDocument();
    expect(errorAlert?.textContent).toContain('Error rendering block');
  });

  it('TEST R3 — does not route C1 block to legacy renderer', () => {
    const c1Block: any = {
      id: 'c1-verify',
      type: 'code',
      version: 'C1',
      content: {
        page: {
          type: 'code',
          title: 'JavaScript Variable',
          introduction: 'The const keyword creates a block-scoped constant variable that cannot be reassigned.',
          language: 'javascript',
          code: 'const x = 42;',
          explanation: [
            {
              focus: 'const keyword',
              description: 'Declares a constant that cannot be reassigned after initialization.',
            },
            {
              focus: 'Block scope',
              description: 'The variable x is only accessible within its containing block.',
            },
          ],
          takeaway: 'Use const for values that should not be reassigned.',
        },
      },
    };

    const theme = {
      primary: '#3b82f6',
      primaryDark: '#1e40af',
      secondary: '#0b1b3d',
    };
    const { container } = render(<TutorialBlockRenderer block={c1Block} theme={theme} />);
    
    // Verify C1 renderer is used (has version attribute)
    const article = container.querySelector('article[data-block-version="C1"]');
    expect(article).toBeInTheDocument();
    
    // Verify C1-specific structure (title as H1, not just caption)
    expect(screen.getByText('JavaScript Variable')).toBeInTheDocument();
    expect(screen.getByText('const keyword')).toBeInTheDocument();
    
    // Verify semantic heading structure - C1 uses H1 for title
    const h1 = container.querySelector('h1');
    expect(h1).toBeInTheDocument();
    expect(h1?.textContent).toContain('JavaScript Variable');
  });

  it('TEST R4 — rejects unsupported code version (unknown version)', () => {
    const unknownVersionBlock: any = {
      id: 'unknown-version',
      type: 'code',
      version: 'C999',
      content: {},
    };

    const { container } = render(<TutorialBlockRenderer block={unknownVersionBlock} />);
    
    // Should render error state, not fallback to legacy
    const errorAlert = container.querySelector('[role="alert"]');
    expect(errorAlert).toBeInTheDocument();
    
    // Verify it does NOT silently use legacy renderer
    const c1Article = container.querySelector('article[data-block-version="C1"]');
    expect(c1Article).not.toBeInTheDocument();
  });
});
