// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { TutorialBlockRenderer } from '../TutorialBlockRenderer';
import type { CodeBlock } from '@quiz/types';

// Phase 2E: Introduction I1 Routing Tests
describe('Phase 2E - Introduction Block Version Routing', () => {
  it('TEST I1 — routes introduction/I1 to IntroductionI1View renderer', () => {
    const i1Block: any = {
      id: 'i1-block',
      type: 'introduction',
      version: 'I1',
      content: {
        page: {
          badge: 'JavaScript',
          title: 'Functions in JavaScript',
          subtitle: 'Master reusable code blocks',
          motto: {
            lines: ['Know', 'Your', 'Learning', 'Path'],
          },
          learningGoal: 'Understand how to create and use functions',
          topic: {
            title: 'What is it?',
            description: 'Functions are reusable code blocks',
            quote: '"Functions are the building blocks" — Expert',
          },
          whereFit: {
            title: 'Where Does It Fit?',
            description: 'Functions fit into the programming workflow',
            flowCards: [
              { title: 'Basics', subtitle: 'Foundation', icon: 'box' },
              { title: 'Functions', subtitle: 'Current', icon: 'code', highlight: true },
            ],
          },
          solution: {
            title: 'The Solution',
            description: 'Example function',
            code: {
              language: 'javascript',
              code: 'function greet(name) {\n  return `Hello, ${name}!`;\n}',
            },
          },
          whereUsed: {
            title: 'Where Is It Used?',
            description: 'Common applications',
            useCases: [
              { title: 'Web Apps', description: 'Frontend logic', icon: 'globe' },
            ],
          },
          roadmap: {
            title: 'What Will You Learn?',
            description: 'Structured learning path',
            steps: [
              { title: 'Basics', subtitle: 'Core concepts' },
              { title: 'Advanced', subtitle: 'Expert patterns' },
            ],
          },
          whyMatters: {
            title: 'Why This Matters',
            benefits: [
              { title: 'Reusability', subtitle: 'Write once, use many times', icon: 'check-circle' },
            ],
          },
          keyTakeaway: 'Functions enable code reuse and organization',
        },
      },
    };

    const theme = {
      primary: '#3b82f6',
      secondary: '#1e293b',
    };

    const { container } = render(<TutorialBlockRenderer block={i1Block} theme={theme} />);
    
    // Verify I1-specific rendering (9 sections)
    expect(screen.getByText('Functions in JavaScript')).toBeInTheDocument();
    expect(screen.getByText('Master reusable code blocks')).toBeInTheDocument();
    expect(screen.getByText('Learning Goal')).toBeInTheDocument();
    expect(screen.getByText('What is it?')).toBeInTheDocument();
    expect(screen.getByText('Where Does It Fit?')).toBeInTheDocument();
    expect(screen.getByText('Key Takeaway')).toBeInTheDocument();
    
    // Verify data attributes specific to I1
    const article = container.querySelector('article[data-block-version="I1"]');
    expect(article).toBeInTheDocument();
    expect(article?.getAttribute('data-block-type')).toBe('introduction');
  });

  it('TEST I2 — rejects introduction without version field', () => {
    const unversionedBlock: any = {
      id: 'unversioned-intro',
      type: 'introduction',
      content: {
        page: {
          badge: 'Test',
          title: 'Test',
          subtitle: 'Test',
          motto: { lines: ['A', 'B', 'C', 'D'] },
          learningGoal: 'Test',
          topic: { title: 'T', description: 'D', quote: 'Q' },
          whereFit: { title: 'T', description: 'D', flowCards: [] },
          solution: { title: 'T', description: 'D', code: { language: 'js', code: 'x' } },
          whereUsed: { title: 'T', description: 'D', useCases: [] },
          roadmap: { title: 'T', description: 'D', steps: [] },
          whyMatters: { title: 'T', benefits: [] },
          keyTakeaway: 'T',
        },
      },
    };

    const { container } = render(<TutorialBlockRenderer block={unversionedBlock} />);
    
    // Introduction requires version field
    const errorAlert = container.querySelector('[role="alert"]');
    expect(errorAlert).toBeInTheDocument();
    expect(errorAlert?.textContent).toContain('Error rendering block');
  });

  it('TEST I3 — rejects unsupported introduction versions (I2+)', () => {
    const i2Block: any = {
      id: 'i2-block',
      type: 'introduction',
      version: 'I2',
      content: {
        page: {
          badge: 'Test',
          title: 'Test',
          subtitle: 'Test',
          motto: { lines: ['A', 'B', 'C', 'D'] },
          learningGoal: 'Test',
          topic: { title: 'T', description: 'D', quote: 'Q' },
          whereFit: { title: 'T', description: 'D', flowCards: [] },
          solution: { title: 'T', description: 'D', code: { language: 'js', code: 'x' } },
          whereUsed: { title: 'T', description: 'D', useCases: [] },
          roadmap: { title: 'T', description: 'D', steps: [] },
          whyMatters: { title: 'T', benefits: [] },
          keyTakeaway: 'T',
        },
      },
    };

    const { container } = render(<TutorialBlockRenderer block={i2Block} />);
    
    // I2 not yet supported
    const errorAlert = container.querySelector('[role="alert"]');
    expect(errorAlert).toBeInTheDocument();
    expect(errorAlert?.textContent).toContain('Error rendering block');
  });

  it('TEST I4 — renders all 9 I1 sections correctly', () => {
    const completeBlock: any = {
      id: 'complete-i1',
      type: 'introduction',
      version: 'I1',
      content: {
        page: {
          badge: 'Python',
          title: 'Lists in Python',
          subtitle: 'Master dynamic collections',
          motto: {
            lines: ['Collections', 'That', 'Grow', 'Dynamically'],
          },
          learningGoal: 'Understand how to work with Python lists',
          topic: {
            title: 'What Are Lists?',
            description: 'Lists are ordered, mutable collections in Python',
            quote: '"Lists are the workhorses of Python" — Guide',
          },
          whereFit: {
            title: 'Where Do Lists Fit?',
            description: 'Lists are used throughout Python programs',
            flowCards: [
              { title: 'Variables', subtitle: 'Basics', icon: 'box' },
              { title: 'Lists', subtitle: 'Collections', icon: 'layers', highlight: true },
              { title: 'Dicts', subtitle: 'Key-value', icon: 'code' },
            ],
          },
          solution: {
            title: 'Creating Lists',
            description: 'Define lists with square brackets',
            code: {
              language: 'python',
              code: 'fruits = ["apple", "banana", "cherry"]\nprint(fruits[0])  # apple',
            },
          },
          whereUsed: {
            title: 'Common Use Cases',
            description: 'Lists power many applications',
            useCases: [
              { title: 'Data Processing', description: 'Handle datasets', icon: 'globe', highlight: true },
              { title: 'Web Apps', description: 'Dynamic content', icon: 'code' },
            ],
          },
          roadmap: {
            title: 'Learning Path',
            description: 'Progressive mastery',
            steps: [
              { title: 'Creation', subtitle: 'Making lists' },
              { title: 'Access', subtitle: 'Reading items' },
              { title: 'Modify', subtitle: 'Changing data' },
              { title: 'Methods', subtitle: 'Built-in functions' },
            ],
          },
          whyMatters: {
            title: 'Why Lists Matter',
            benefits: [
              { title: 'Flexible', subtitle: 'Grow and shrink', icon: 'zap' },
              { title: 'Versatile', subtitle: 'Many uses', icon: 'star' },
            ],
          },
          keyTakeaway: 'Lists are essential for managing collections in Python',
        },
      },
    };

    const theme = {
      primary: '#10b981',
      secondary: '#0f172a',
    };

    const { container } = render(<TutorialBlockRenderer block={completeBlock} theme={theme} />);
    
    // Section 0: Hero
    expect(screen.getByText('Lists in Python')).toBeInTheDocument();
    expect(screen.getByText('Master dynamic collections')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();
    
    // Section 1: Learning Goal
    expect(screen.getByText('Learning Goal')).toBeInTheDocument();
    expect(screen.getByText('Understand how to work with Python lists')).toBeInTheDocument();
    
    // Section 2: Topic
    expect(screen.getByText('What Are Lists?')).toBeInTheDocument();
    expect(screen.getByText('Lists are ordered, mutable collections in Python')).toBeInTheDocument();
    
    // Section 3: Where Fit
    expect(screen.getByText('Where Do Lists Fit?')).toBeInTheDocument();
    expect(screen.getByText('Variables')).toBeInTheDocument();
    expect(screen.getByText('Lists')).toBeInTheDocument();
    
    // Section 4: Solution
    expect(screen.getByText('Creating Lists')).toBeInTheDocument();
    expect(screen.getByText(/apple/)).toBeInTheDocument();
    
    // Section 5: Where Used
    expect(screen.getByText('Common Use Cases')).toBeInTheDocument();
    expect(screen.getByText('Data Processing')).toBeInTheDocument();
    
    // Section 6: Roadmap
    expect(screen.getByText('Learning Path')).toBeInTheDocument();
    expect(screen.getByText('Creation')).toBeInTheDocument();
    expect(screen.getByText('Access')).toBeInTheDocument();
    
    // Section 7: Why Matters
    expect(screen.getByText('Why Lists Matter')).toBeInTheDocument();
    expect(screen.getByText('Flexible')).toBeInTheDocument();
    
    // Section 8: Key Takeaway
    expect(screen.getByText('Key Takeaway')).toBeInTheDocument();
    expect(screen.getByText('Lists are essential for managing collections in Python')).toBeInTheDocument();
  });

  it('TEST I5 — requires theme with primary and secondary colors', () => {
    const i1Block: any = {
      id: 'themed-block',
      type: 'introduction',
      version: 'I1',
      content: {
        page: {
          badge: 'Test',
          title: 'Test',
          subtitle: 'Test',
          motto: { lines: ['A', 'B', 'C', 'D'] },
          learningGoal: 'Test',
          topic: { title: 'T', description: 'D', quote: 'Q' },
          whereFit: { title: 'T', description: 'D', flowCards: [{ title: 'C', subtitle: 'S', icon: 'box' }] },
          solution: { title: 'T', description: 'D', code: { language: 'js', code: 'x' } },
          whereUsed: { title: 'T', description: 'D', useCases: [{ title: 'U', description: 'D', icon: 'globe' }] },
          roadmap: { title: 'T', description: 'D', steps: [{ title: 'S', subtitle: 'S' }] },
          whyMatters: { title: 'T', benefits: [{ title: 'B', subtitle: 'S', icon: 'star' }] },
          keyTakeaway: 'T',
        },
      },
    };

    // Render without theme
    const { container } = render(<TutorialBlockRenderer block={i1Block} />);
    
    const errorAlert = container.querySelector('[role="alert"]');
    expect(errorAlert).toBeInTheDocument();
    expect(errorAlert?.textContent).toContain('Missing required brand theme');
  });
});

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
