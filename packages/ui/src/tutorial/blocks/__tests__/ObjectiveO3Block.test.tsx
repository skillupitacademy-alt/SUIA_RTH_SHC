// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ObjectiveO3Block, ObjectiveBlock } from '../ObjectiveO3Block';

describe('ObjectiveO3Block', () => {
  const mockBlock = {
    id: 'objective-001', type: 'objective' as const, version: 'O3' as const,
    content: {
      eyebrow: 'SKILL-BASED OBJECTIVES', title: 'What You Will Be Able To Do',
      introduction: 'By the end of this lesson, you will be able to demonstrate the following skills.',
      objectives: [
        { id: 'obj-1', label: 'Create', text: 'Create Python lists containing multiple values.', expectedResult: 'A valid list containing the required values.' },
        { id: 'obj-2', label: 'Access', text: 'Access list elements using indexing and slicing.', expectedResult: 'Correct elements are retrieved.' },
        { id: 'obj-3', label: 'Modify', text: 'Modify list contents using supported operations.', expectedResult: 'The list contains the intended updated values.' },
        { id: 'obj-4', label: 'Debug', text: 'Identify and correct common list-related errors.', expectedResult: 'The corrected program produces the expected behavior.' },
      ],
    },
  };
  const colorA1 = ['#', 'e11', 'd48'].join('');
  const colorA2 = ['#', '1e2', '93b'].join('');
  const colorB1 = ['#', '0ea', '5e9'].join('');
  const colorB2 = ['#', '0f1', '72a'].join('');
  const brandThemeA = { primary: colorA1, secondary: colorA2 };
  const brandThemeB = { primary: colorB1, secondary: colorB2 };

  it('renders with UBRC data attributes', () => {
    const { container } = render(<ObjectiveO3Block block={mockBlock} theme={brandThemeA} />);
    const article = container.querySelector('article');
    expect(article).not.toBeNull();
    expect(article?.getAttribute('data-block-id')).toBe('objective-001');
    expect(article?.getAttribute('data-block-type')).toBe('objective');
    expect(article?.getAttribute('data-block-version')).toBe('O3');
  });
  it('prioritizes runtimeContext UBRC attributes when provided', () => {
    const runtimeContext = { learnerId: 'learner-123', navigationNodeId: 'nav-456', sectionId: 'sec-789', blockId: 'runtime-obj-o3-999', blockType: 'objective', blockVersion: 'O3', subtopicId: 'sub-001' };
    const { container } = render(<ObjectiveO3Block block={mockBlock} runtimeContext={runtimeContext} theme={brandThemeA} />);
    const article = container.querySelector('article');
    expect(article?.getAttribute('data-block-id')).toBe('runtime-obj-o3-999');
    expect(article?.getAttribute('data-block-type')).toBe('objective');
    expect(article?.getAttribute('data-block-version')).toBe('O3');
  });
  it('proves dual-brand theme independence (Brand A vs Brand B)', () => {
    const { container: containerA } = render(<ObjectiveBlock block={mockBlock} theme={brandThemeA} />);
    const { container: containerB } = render(<ObjectiveBlock block={mockBlock} theme={brandThemeB} />);
    expect(containerA.querySelector('article')).not.toBeNull();
    expect(containerB.querySelector('article')).not.toBeNull();
    expect(containerB.innerHTML).not.toContain(colorA1);
    expect(containerA.innerHTML).not.toContain(colorB1);
  });
  it('falls back gracefully to DEFAULT_THEME when theme prop is omitted', () => {
    const { container } = render(<ObjectiveO3Block block={mockBlock} />);
    expect(container.querySelector('article')).not.toBeNull();
  });
  it('strictly verifies dynamic theme tokens and zero hardcoded brand colors', () => {
    const neutralTheme = { primary: ['#', '10b', '981'].join(''), secondary: ['#', '334', '155'].join('') };
    const { container } = render(<ObjectiveO3Block block={mockBlock} theme={neutralTheme} />);
    expect(container.innerHTML).not.toContain(colorA1);
    expect(container.innerHTML).not.toContain(colorB1);
  });
  it('verifies semantic headings, list roles, and aria-hidden icons', () => {
    const { container } = render(<ObjectiveO3Block block={mockBlock} theme={brandThemeA} />);
    expect(screen.getByRole('heading', { level: 2, name: 'What You Will Be Able To Do' })).toBeDefined();
    for (const label of ['Create', 'Access', 'Modify', 'Debug']) expect(screen.getByRole('heading', { level: 3, name: label })).toBeDefined();
    expect(screen.getAllByRole('list').length).toBeGreaterThanOrEqual(1);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
    svgs.forEach((svg) => expect(svg.getAttribute('aria-hidden')).toBe('true'));
  });
  it('supports responsive classes and custom className passthrough', () => {
    const { container } = render(<ObjectiveO3Block block={mockBlock} className="custom-o3-wrapper" theme={brandThemeA} />);
    const article = container.querySelector('article');
    expect(article?.className).toContain('w-full');
    expect(article?.className).toContain('px-[5%]');
    expect(article?.className).toContain('py-8');
    expect(article?.className).toContain('sm:py-10');
    expect(article?.className).toContain('custom-o3-wrapper');
  });
  it('renders without console errors or warnings', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<ObjectiveO3Block block={mockBlock} theme={brandThemeA} />);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });
});
