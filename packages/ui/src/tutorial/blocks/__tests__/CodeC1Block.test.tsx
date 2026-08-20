// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { CodeC1Block } from '../CodeC1Block';
import type { CodeC1Block as ICodeC1Block, CodeC1AuthorContent } from '@quiz/types';

// Helper to setup render with user event
const setup = (jsx: React.ReactElement) => {
  return {
    user: userEvent.setup(),
    ...render(jsx),
  };
};

/**
 * Phase 2D - Code C1 Renderer Tests
 * 
 * Tests the Code C1 UI renderer implementation
 * 
 * CRITICAL TESTS:
 * - C1 content rendering
 * - Optional field handling
 * - Security (code as text, not executable)
 * - Legacy compatibility verification
 * - Content preservation
 * - Accessibility
 */

describe('Phase 2D - Code C1 Renderer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  // Valid C1 fixture following Phase 2A constraints
  const validC1Content: CodeC1AuthorContent = {
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
  };

  const createC1Block = (content: CodeC1AuthorContent): ICodeC1Block => ({
    id: 'test-c1-block-id',
    type: 'code',
    version: 'C1',
    content,
  });

  describe('A. Required Content Rendering', () => {
    it('TEST 1 — renders C1 block', () => {
      const block = createC1Block(validC1Content);
      render(<CodeC1Block block={block} />);
      
      expect(screen.getByText('Python Print Statement')).toBeInTheDocument();
    });

    it('TEST 2 — renders title', () => {
      const block = createC1Block(validC1Content);
      render(<CodeC1Block block={block} />);
      
      const title = screen.getByText('Python Print Statement');
      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe('SPAN');
    });

    it('TEST 3 — renders introduction', () => {
      const block = createC1Block(validC1Content);
      render(<CodeC1Block block={block} />);
      
      expect(screen.getByText(/The print\(\) function displays output/)).toBeInTheDocument();
    });

    it('TEST 4 — renders code content', () => {
      const block = createC1Block(validC1Content);
      render(<CodeC1Block block={block} />);
      
      expect(screen.getByText('print("Hello, World!")')).toBeInTheDocument();
    });

    it('TEST 5 — uses language correctly', () => {
      const block = createC1Block(validC1Content);
      const { container } = render(<CodeC1Block block={block} />);
      
      const codeElement = container.querySelector('code[data-language="python"]');
      expect(codeElement).toBeInTheDocument();
      expect(codeElement).toHaveClass('language-python');
    });

    it('TEST 6 — renders all explanation items', () => {
      const block = createC1Block(validC1Content);
      render(<CodeC1Block block={block} />);
      
      expect(screen.getByText('print() function')).toBeInTheDocument();
      expect(screen.getByText(/Built-in function that outputs text/)).toBeInTheDocument();
      expect(screen.getByText('String argument')).toBeInTheDocument();
      expect(screen.getByText(/The text "Hello, World!" is passed/)).toBeInTheDocument();
    });

    it('TEST 7 — renders takeaway', () => {
      const block = createC1Block(validC1Content);
      render(<CodeC1Block block={block} />);
      
      expect(screen.getByText(/Use print\(\) to display output/)).toBeInTheDocument();
    });
  });

  describe('B. Optional Field Handling', () => {
    it('TEST 8 — renders filename when present', () => {
      const contentWithFilename: CodeC1AuthorContent = {
        page: {
          ...validC1Content.page,
          filename: 'hello.py',
        },
      };
      const block = createC1Block(contentWithFilename);
      render(<CodeC1Block block={block} />);
      
      expect(screen.getByText('hello.py')).toBeInTheDocument();
    });

    it('TEST 9 — does not render filename when absent', () => {
      const block = createC1Block(validC1Content);
      const { container } = render(<CodeC1Block block={block} />);
      
      // Should show language instead
      expect(screen.getByText('python')).toBeInTheDocument();
      // Should not have filename text
      expect(container.textContent).not.toContain('hello.py');
    });

    it('TEST 10 — renders output when present', () => {
      const contentWithOutput: CodeC1AuthorContent = {
        page: {
          ...validC1Content.page,
          output: {
            value: 'Hello, World!',
            description: 'The text is printed to the console.',
          },
        },
      };
      const block = createC1Block(contentWithOutput);
      render(<CodeC1Block block={block} />);
      
      expect(screen.getByText('Hello, World!')).toBeInTheDocument();
      expect(screen.getByText(/The text is printed to the console/)).toBeInTheDocument();
    });

    it('TEST 11 — does not render output when absent', () => {
      const block = createC1Block(validC1Content);
      const { container } = render(<CodeC1Block block={block} />);
      
      expect(container.textContent).not.toContain('Output');
    });

    it('TEST 12 — renders output without description', () => {
      const contentWithOutputNoDesc: CodeC1AuthorContent = {
        page: {
          ...validC1Content.page,
          output: {
            value: 'Hello, World!',
          },
        },
      };
      const block = createC1Block(contentWithOutputNoDesc);
      render(<CodeC1Block block={block} />);
      
      expect(screen.getByText('Hello, World!')).toBeInTheDocument();
    });

    it('TEST 13 — renders practiceHint when present', () => {
      const contentWithHint: CodeC1AuthorContent = {
        page: {
          ...validC1Content.page,
          practiceHint: 'Try changing the message and running the code again.',
        },
      };
      const block = createC1Block(contentWithHint);
      render(<CodeC1Block block={block} />);
      
      expect(screen.getByText(/Try changing the message/)).toBeInTheDocument();
    });

    it('TEST 14 — does not render practiceHint when absent', () => {
      const block = createC1Block(validC1Content);
      const { container } = render(<CodeC1Block block={block} />);
      
      expect(container.textContent).not.toContain('Practice');
    });

    it('TEST 15 — handles all optional fields present', () => {
      const contentWithAllOptionals: CodeC1AuthorContent = {
        page: {
          ...validC1Content.page,
          filename: 'hello.py',
          output: {
            value: 'Hello, World!',
            description: 'Console output',
          },
          practiceHint: 'Try it yourself!',
        },
      };
      const block = createC1Block(contentWithAllOptionals);
      render(<CodeC1Block block={block} />);
      
      expect(screen.getByText('hello.py')).toBeInTheDocument();
      expect(screen.getByText('Hello, World!')).toBeInTheDocument();
      expect(screen.getByText('Console output')).toBeInTheDocument();
      expect(screen.getByText('Try it yourself!')).toBeInTheDocument();
    });
  });

  describe('C. Explanation Array Handling', () => {
    it('TEST 16 — supports 2 explanation items', () => {
      const block = createC1Block(validC1Content);
      const { container } = render(<CodeC1Block block={block} />);
      
      const explanationItems = container.querySelectorAll('[class*="border-l-2"]');
      expect(explanationItems).toHaveLength(2);
    });

    it('TEST 17 — supports 6 explanation items', () => {
      const contentWith6Explanations: CodeC1AuthorContent = {
        page: {
          ...validC1Content.page,
          explanation: [
            { focus: 'Item 1', description: 'First explanation item description here.' },
            { focus: 'Item 2', description: 'Second explanation item description here.' },
            { focus: 'Item 3', description: 'Third explanation item description here.' },
            { focus: 'Item 4', description: 'Fourth explanation item description here.' },
            { focus: 'Item 5', description: 'Fifth explanation item description here.' },
            { focus: 'Item 6', description: 'Sixth explanation item description here.' },
          ],
        },
      };
      const block = createC1Block(contentWith6Explanations);
      const { container } = render(<CodeC1Block block={block} />);
      
      const explanationItems = container.querySelectorAll('[class*="border-l-2"]');
      expect(explanationItems).toHaveLength(6);
      
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 6')).toBeInTheDocument();
    });

    it('TEST 18 — preserves explanation ordering', () => {
      const block = createC1Block(validC1Content);
      const { container } = render(<CodeC1Block block={block} />);
      
      const text = container.textContent || '';
      const idx1 = text.indexOf('print() function');
      const idx2 = text.indexOf('String argument');
      
      expect(idx1).toBeLessThan(idx2);
    });
  });

  describe('D. Content Preservation', () => {
    it('TEST 19 — preserves multiline code', () => {
      const contentWithMultilineCode: CodeC1AuthorContent = {
        page: {
          ...validC1Content.page,
          code: 'def greet(name):\n    print(f"Hello, {name}!")\n\ngreet("World")',
        },
      };
      const block = createC1Block(contentWithMultilineCode);
      const { container } = render(<CodeC1Block block={block} />);
      
      const codeElement = container.querySelector('code');
      expect(codeElement?.textContent).toContain('def greet(name):');
      expect(codeElement?.textContent).toContain('print(f"Hello, {name}!")');
      expect(codeElement?.textContent).toContain('greet("World")');
    });

    it('TEST 20 — preserves indentation', () => {
      const contentWithIndentation: CodeC1AuthorContent = {
        page: {
          ...validC1Content.page,
          code: 'if True:\n    print("indented")',
        },
      };
      const block = createC1Block(contentWithIndentation);
      const { container } = render(<CodeC1Block block={block} />);
      
      const codeElement = container.querySelector('code');
      expect(codeElement?.textContent).toBe('if True:\n    print("indented")');
    });

    it('TEST 21 — preserves special characters', () => {
      const contentWithSpecialChars: CodeC1AuthorContent = {
        page: {
          ...validC1Content.page,
          code: 'print("<>&\'")',
        },
      };
      const block = createC1Block(contentWithSpecialChars);
      render(<CodeC1Block block={block} />);
      
      expect(screen.getByText('print("<>&\'")' )).toBeInTheDocument();
    });

    it('TEST 22 — does not mutate block', () => {
      const block = createC1Block(validC1Content);
      const originalContent = JSON.parse(JSON.stringify(block.content));
      
      render(<CodeC1Block block={block} />);
      
      expect(block.content).toEqual(originalContent);
    });
  });

  describe('E. Security - Code Rendered as Text', () => {
    it('TEST 23 — script payload rendered as text', () => {
      const maliciousContent: CodeC1AuthorContent = {
        page: {
          ...validC1Content.page,
          code: '<script>alert("XSS")</script>',
        },
      };
      const block = createC1Block(maliciousContent);
      const { container } = render(<CodeC1Block block={block} />);
      
      // Should render as text, not execute
      expect(screen.getByText('<script>alert("XSS")</script>')).toBeInTheDocument();
      
      // Should NOT create script element
      const scripts = container.querySelectorAll('script');
      expect(scripts).toHaveLength(0);
    });

    it('TEST 24 — HTML payload rendered as text', () => {
      const htmlContent: CodeC1AuthorContent = {
        page: {
          ...validC1Content.page,
          code: '<img src=x onerror=alert("XSS")>',
        },
      };
      const block = createC1Block(htmlContent);
      const { container } = render(<CodeC1Block block={block} />);
      
      expect(screen.getByText('<img src=x onerror=alert("XSS")>')).toBeInTheDocument();
      
      // Should NOT create img element from code
      const imgs = container.querySelectorAll('img');
      expect(imgs).toHaveLength(0);
    });

    it('TEST 25 — javascript protocol rendered as text', () => {
      const jsProtocol: CodeC1AuthorContent = {
        page: {
          ...validC1Content.page,
          code: 'javascript:alert("XSS")',
        },
      };
      const block = createC1Block(jsProtocol);
      render(<CodeC1Block block={block} />);
      
      expect(screen.getByText('javascript:alert("XSS")')).toBeInTheDocument();
    });

    it('TEST 26 — closing tag payload rendered as text', () => {
      const closingTag: CodeC1AuthorContent = {
        page: {
          ...validC1Content.page,
          code: '</script><script>alert(1)</script>',
        },
      };
      const block = createC1Block(closingTag);
      const { container } = render(<CodeC1Block block={block} />);
      
      expect(screen.getByText('</script><script>alert(1)</script>')).toBeInTheDocument();
      
      const scripts = container.querySelectorAll('script');
      expect(scripts).toHaveLength(0);
    });
  });

  describe('F. Language Support', () => {
    const languages = [
      'javascript', 'typescript', 'python', 'java', 'sql',
      'bash', 'scala', 'go', 'rust', 'cpp',
      'csharp', 'php', 'ruby', 'swift', 'kotlin',
    ];

    languages.forEach((lang, index) => {
      it(`TEST ${27 + index} — renders ${lang} safely`, () => {
        const langContent: CodeC1AuthorContent = {
          page: {
            ...validC1Content.page,
            language: lang,
            code: `// ${lang} code example`,
          },
        };
        const block = createC1Block(langContent);
        const { container } = render(<CodeC1Block block={block} />);
        
        const codeElement = container.querySelector(`code[data-language="${lang}"]`);
        expect(codeElement).toBeInTheDocument();
        expect(screen.getByText(`// ${lang} code example`)).toBeInTheDocument();
      });
    });
  });

  describe('G. Accessibility', () => {
    it('TEST 42 — uses semantic article structure', () => {
      const block = createC1Block(validC1Content);
      const { container } = render(<CodeC1Block block={block} />);
      
      const article = container.querySelector('article');
      expect(article).toBeInTheDocument();
      expect(article).toHaveAttribute('id', 'test-c1-block-id');
    });

    it('TEST 43 — code block is accessible', () => {
      const block = createC1Block(validC1Content);
      const { container } = render(<CodeC1Block block={block} />);
      
      const codeElement = container.querySelector('code');
      expect(codeElement).toBeInTheDocument();
      
      const preElement = container.querySelector('pre');
      expect(preElement).toBeInTheDocument();
    });

    it('TEST 44 — copy button has accessible label', () => {
      const block = createC1Block(validC1Content);
      render(<CodeC1Block block={block} />);
      
      const copyButton = screen.getByRole('button', { name: /copy code to clipboard/i });
      expect(copyButton).toBeInTheDocument();
    });

    it('TEST 45 — uses semantic headings', () => {
      const block = createC1Block(validC1Content);
      const { container } = render(<CodeC1Block block={block} />);
      
      const h3 = container.querySelector('h3');
      expect(h3).toBeInTheDocument();
      expect(h3?.textContent).toContain('Python Print Statement');
      
      const h4s = container.querySelectorAll('h4');
      expect(h4s.length).toBeGreaterThan(0);
    });
  });

  describe('H. Data Attributes', () => {
    it('TEST 46 — includes block type and version attributes', () => {
      const block = createC1Block(validC1Content);
      const { container } = render(<CodeC1Block block={block} />);
      
      const article = container.querySelector('article');
      expect(article).toHaveAttribute('data-block-type', 'code');
      expect(article).toHaveAttribute('data-block-version', 'C1');
    });
  });
});

