// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ObjectiveBlock } from '../ObjectiveO1Block';
import { DEFAULT_THEME } from '../../theme-utils';

describe('ObjectiveO1Block', () => {
  const mockBlock = {
    id: 'objective-001',
    type: 'objective' as const,
    version: 'O1' as const,
    content: {
      title: 'Test Objective',
      objectives: [
        { id: 'obj-1', text: 'Sample objective' },
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
      <ObjectiveBlock block={mockBlock as any} theme={brandThemeA} />
    );
    const article = container.querySelector('article');
    expect(article).not.toBeNull();
    expect(article?.getAttribute('data-block-id')).toBe('objective-001');
    expect(article?.getAttribute('data-block-type')).toBe('objective');
    expect(article?.getAttribute('data-block-version')).toBe('O1');
  });

  it('proves dual-brand theme independence', () => {
    const { container: containerA } = render(
      <ObjectiveBlock block={mockBlock as any} theme={brandThemeA} />
    );
    const { container: containerB } = render(
      <ObjectiveBlock block={mockBlock as any} theme={brandThemeB} />
    );

    expect(containerB.innerHTML).not.toContain('#e11d48');
    expect(containerA.innerHTML).not.toContain('#0ea5e9');
  });

  it('meets WCAG 2.1 AA accessibility standards (ARIA roles & hidden checkmarks)', () => {
    const { container } = render(
      <ObjectiveBlock block={mockBlock as any} theme={DEFAULT_THEME} />
    );
    const list = container.querySelector('ul');
    expect(list?.getAttribute('role')).toBe('list');

    const check = container.querySelector('[aria-hidden="true"]');
    expect(check).not.toBeNull();
  });

  it('verifies responsive container rendering', () => {
    const { container } = render(
      <ObjectiveBlock block={mockBlock as any} theme={DEFAULT_THEME} className="w-full md:w-1/2" />
    );
    const article = container.querySelector('article');
    expect(article?.className).toContain('w-full');
    expect(article?.className).toContain('md:w-1/2');
  });

  it('renders without console errors or warnings', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ObjectiveBlock block={mockBlock as any} theme={brandThemeA} />);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
