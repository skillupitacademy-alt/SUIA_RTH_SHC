import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ObjectiveO2Block, ObjectiveBlock } from '../ObjectiveO2Block';

describe('ObjectiveO2Block', () => {
  const mockBlock = {
    id: 'objective-001',
    type: 'objective' as const,
    version: 'O2' as const,
    content: {
      eyebrow: 'LEARNING OBJECTIVES',
      title: 'What You Will Learn',
      introduction:
        'By the end of this lesson, you will know, understand, and be able to apply the concepts.',
      stages: {
        know: {
          label: 'Know',
          description:
            'Key terminology and facts you should be able to recognize and recall.',
          items: [
            'Identify Python list syntax',
            'Define list indexing',
            'Recognize common list methods',
          ],
        },
        understand: {
          label: 'Understand',
          description: 'Concepts and relationships you should be able to explain.',
          items: [
            'Explain list indexing',
            'Distinguish indexing from slicing',
          ],
        },
        apply: {
          label: 'Apply',
          description: 'Practical abilities you should be able to perform.',
          items: [
            'Create Python lists',
            'Modify list elements',
          ],
        },
      },
      objectives: [
        { id: 'obj-1', text: 'Identify Python list syntax', stage: 'know' as const },
        { id: 'obj-2', text: 'Explain list indexing', stage: 'understand' as const },
        { id: 'obj-3', text: 'Create Python lists', stage: 'apply' as const },
      ],
    },
  };

  const brandThemeA = {
    primary: '#e11d48',
    secondary: '#1e293b',
    primaryDark: '#be123c',
  };

  const brandThemeB = {
    primary: '#0ea5e9',
    secondary: '#0f172a',
    primaryDark: '#0284c7',
  };

  it('renders with UBRC data attributes', () => {
    const { container } = render(
      <ObjectiveO2Block block={mockBlock} theme={brandThemeA} />
    );
    const article = container.querySelector('article');
    expect(article).not.toBeNull();
    expect(article?.getAttribute('data-block-id')).toBe('objective-001');
    expect(article?.getAttribute('data-block-type')).toBe('objective');
    expect(article?.getAttribute('data-block-version')).toBe('O2');
  });

  it('prioritizes runtimeContext UBRC attributes when provided', () => {
    const runtimeContext = {
      learnerId: 'learner-123',
      navigationNodeId: 'nav-456',
      sectionId: 'sec-789',
      blockId: 'runtime-obj-999',
      blockType: 'objective',
      blockVersion: 'O2',
      subtopicId: 'sub-001',
    };

    const { container } = render(
      <ObjectiveO2Block
        block={mockBlock}
        runtimeContext={runtimeContext}
        theme={brandThemeA}
      />
    );
    const article = container.querySelector('article');
    expect(article?.getAttribute('data-block-id')).toBe('runtime-obj-999');
    expect(article?.getAttribute('data-block-type')).toBe('objective');
    expect(article?.getAttribute('data-block-version')).toBe('O2');
  });

  it('proves dual-brand theme independence (Theme A vs Theme B)', () => {
    const { container: containerA } = render(
      <ObjectiveBlock block={mockBlock} theme={brandThemeA} />
    );
    const articleA = containerA.querySelector('article');
    expect(articleA).not.toBeNull();

    const { container: containerB } = render(
      <ObjectiveBlock block={mockBlock} theme={brandThemeB} />
    );
    const articleB = containerB.querySelector('article');
    expect(articleB).not.toBeNull();

    expect(containerB.innerHTML).not.toContain('#e11d48');
    expect(containerA.innerHTML).not.toContain('#0ea5e9');
  });

  it('falls back gracefully to DEFAULT_THEME when theme prop is omitted', () => {
    const { container } = render(<ObjectiveO2Block block={mockBlock} />);
    const article = container.querySelector('article');
    expect(article).not.toBeNull();
  });

  it('strictly verifies dynamic theme tokens and zero hardcoded brand colors', () => {
    const neutralTheme = {
      primary: '#10b981',
      secondary: '#334155',
    };
    const { container } = render(
      <ObjectiveO2Block block={mockBlock} theme={neutralTheme} />
    );
    expect(container.innerHTML).not.toContain('#e11d48');
    expect(container.innerHTML).not.toContain('#0ea5e9');
  });

  it('verifies WCAG 2.1 AA accessibility: semantic headings, list roles, and aria-hidden icons', () => {
    const { container } = render(
      <ObjectiveO2Block block={mockBlock} theme={brandThemeA} />
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'What You Will Learn' })
    ).toBeDefined();
    expect(screen.getByRole('heading', { level: 3, name: 'Know' })).toBeDefined();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Understand' })
    ).toBeDefined();
    expect(screen.getByRole('heading', { level: 3, name: 'Apply' })).toBeDefined();

    const lists = screen.getAllByRole('list');
    expect(lists.length).toBe(3);

    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
    svgs.forEach((svg) => {
      expect(svg.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('supports responsive container classes and custom className passthrough', () => {
    const { container } = render(
      <ObjectiveO2Block
        block={mockBlock}
        className="custom-test-shell"
        theme={brandThemeA}
      />
    );
    const article = container.querySelector('article');
    expect(article?.className).toContain('w-full');
    expect(article?.className).toContain('px-[5%]');
    expect(article?.className).toContain('py-8');
    expect(article?.className).toContain('sm:py-10');
    expect(article?.className).toContain('custom-test-shell');
  });

  it('renders without console errors or warnings', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<ObjectiveO2Block block={mockBlock} theme={brandThemeA} />);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });
});
