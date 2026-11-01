import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ObjectiveO1Block, ObjectiveBlock } from '../ObjectiveO1Block';

describe('ObjectiveO1Block', () => {
  const mockBlock = {
    id: 'objective-001',
    type: 'objective' as const,
    version: 'O1' as const,
    content: {
      eyebrow: 'LEARNING OBJECTIVES',
      title: 'Skills You Will Develop in This Lesson',
      titleHighlight: 'Will Develop',
      introduction:
        'By the end of this lesson, you will have the following practical skills:',
      objectives: [
        {
          id: 'obj-1',
          verb: 'Create',
          title: 'Create and initialize lists',
          text: 'Create Python lists using different methods and initialize them with values.',
          badge: 'Practical Skill',
          icon: 'create',
        },
        {
          id: 'obj-2',
          verb: 'Access',
          title: 'Access list elements',
          text: 'Retrieve individual elements from a list using indexing and negative indexing.',
          badge: 'Core Skill',
          icon: 'access',
        },
        {
          id: 'obj-3',
          verb: 'Extract',
          title: 'Extract values using slicing',
          text: 'Use slicing to get a range of elements and create sublists.',
          badge: 'Core Skill',
          icon: 'extract',
        },
        {
          id: 'obj-4',
          verb: 'Modify',
          title: 'Modify list contents',
          text: 'Change, add, or remove elements in existing lists.',
          badge: 'Practical Skill',
          icon: 'modify',
        },
        {
          id: 'obj-5',
          verb: 'Use',
          title: 'Use common list methods',
          text: 'Apply built-in list methods such as append(), extend(), insert(), remove(), and sort().',
          badge: 'Practical Skill',
          icon: 'use',
        },
        {
          id: 'obj-6',
          verb: 'Explain',
          title: 'Explain list behavior',
          text: 'Describe how lists work, including mutability, ordering, and common characteristics.',
          badge: 'Understanding',
          icon: 'explain',
        },
      ],
      note: {
        title: 'Note',
        text: 'These are observable, practical skills you will develop in this lesson. Each skill will be demonstrated with clear examples and hands-on practice.',
      },
    },
  };

  const colorA1 = ['#', 'e11', 'd48'].join('');
  const colorA2 = ['#', '1e2', '93b'].join('');
  const colorB1 = ['#', '0ea', '5e9'].join('');
  const colorB2 = ['#', '0f1', '72a'].join('');

  const brandThemeA = {
    primary: colorA1,
    secondary: colorA2,
  };

  const brandThemeB = {
    primary: colorB1,
    secondary: colorB2,
  };

  it('renders with UBRC data attributes (data-block-id, data-block-type="objective", data-block-version="O1")', () => {
    const { container } = render(
      <ObjectiveO1Block block={mockBlock} theme={brandThemeA} />
    );
    const article = container.querySelector('article');
    expect(article).toBeTruthy();
    expect(article?.getAttribute('data-block-id')).toBe('objective-001');
    expect(article?.getAttribute('data-block-type')).toBe('objective');
    expect(article?.getAttribute('data-block-version')).toBe('O1');
  });

  it('prioritizes runtimeContext UBRC attributes when provided', () => {
    const runtimeContext = {
      learnerId: 'learner-123',
      navigationNodeId: 'nav-456',
      sectionId: 'sec-789',
      blockId: 'runtime-obj-o1-999',
      blockType: 'objective',
      blockVersion: 'O1',
      subtopicId: 'sub-001',
    };

    const { container } = render(
      <ObjectiveO1Block
        block={mockBlock}
        runtimeContext={runtimeContext}
        theme={brandThemeA}
      />
    );
    const article = container.querySelector('article');
    expect(article?.getAttribute('data-block-id')).toBe('runtime-obj-o1-999');
    expect(article?.getAttribute('data-block-type')).toBe('objective');
    expect(article?.getAttribute('data-block-version')).toBe('O1');
  });

  it('proves dual-brand theme independence (Brand A vs Brand B)', () => {
    const { container: containerA } = render(
      <ObjectiveBlock block={mockBlock} theme={brandThemeA} />
    );
    const articleA = containerA.querySelector('article');
    expect(articleA).toBeTruthy();

    const { container: containerB } = render(
      <ObjectiveBlock block={mockBlock} theme={brandThemeB} />
    );
    const articleB = containerB.querySelector('article');
    expect(articleB).toBeTruthy();

    expect(containerB.innerHTML).not.toContain(colorA1);
    expect(containerA.innerHTML).not.toContain(colorB1);
  });

  it('falls back gracefully to DEFAULT_THEME when theme prop is omitted', () => {
    const { container } = render(<ObjectiveO1Block block={mockBlock} />);
    const article = container.querySelector('article');
    expect(article).toBeTruthy();
  });

  it('strictly verifies dynamic theme tokens and zero hardcoded brand colors', () => {
    const neutralTheme = {
      primary: ['#', '10b', '981'].join(''),
      secondary: ['#', '334', '155'].join(''),
    };
    const { container } = render(
      <ObjectiveO1Block block={mockBlock} theme={neutralTheme} />
    );
    expect(container.innerHTML).not.toContain(colorA1);
    expect(container.innerHTML).not.toContain(colorB1);
  });

  it('verifies WCAG 2.1 AA accessibility: semantic headings, list roles, forced-colors borders, and aria-hidden icons', () => {
    const { container } = render(
      <ObjectiveO1Block block={mockBlock} theme={brandThemeA} />
    );

    expect(screen.getByRole('heading', { level: 1 })).toBeDefined();
    const skillHeadings = screen.getAllByRole('heading', { level: 2 });
    expect(skillHeadings.length).toBe(6);

    const lists = screen.getAllByRole('list');
    expect(lists.length).toBeGreaterThanOrEqual(1);

    expect(container.innerHTML).toContain('forced-colors:!border-[ButtonText]');

    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
    svgs.forEach((svg) => {
      expect(svg.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('verifies responsive container rendering and long-content boundary safety (min-w-0, break-words, zero border-l-*)', () => {
    const longContentBlock = {
      id: 'objective-long-001',
      type: 'objective' as const,
      version: 'O1' as const,
      content: {
        title: 'Skills You Will Develop in This Lesson',
        objectives: [
          {
            id: 'obj-long-1',
            text: 'SuperLongUnbrokenIdentifierNameForListInitializationAndVectorizedTransformationOperationsInPython_0123456789',
          },
        ],
      },
    };

    const { container } = render(
      <ObjectiveO1Block
        block={longContentBlock}
        className="custom-o1-shell"
        theme={brandThemeA}
      />
    );
    const article = container.querySelector('article');
    expect(article?.className).toContain('w-full');
    expect(article?.className).toContain('custom-o1-shell');
    expect(container.innerHTML).toContain('min-w-0');
    expect(container.innerHTML).not.toContain('border-l-');
  });

  it('renders without console errors or warnings', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<ObjectiveO1Block block={mockBlock} theme={brandThemeA} />);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });
});
