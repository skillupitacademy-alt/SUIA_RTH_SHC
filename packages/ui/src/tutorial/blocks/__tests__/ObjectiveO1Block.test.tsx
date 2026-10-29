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
      ],
      note: {
        title: 'Note',
        text: 'These are observable, practical skills you will develop in this lesson.',
      },
    },
  };

  const brandThemeA = { primary: '#e11d48', secondary: '#1e293b' };

  it('renders with UBRC data attributes', () => {
    const { container } = render(<ObjectiveO1Block block={mockBlock} theme={brandThemeA} />);
    const article = container.querySelector('article');
    expect(article).toBeTruthy();
    expect(article?.getAttribute('data-block-id')).toBe('objective-001');
    expect(article?.getAttribute('data-block-type')).toBe('objective');
    expect(article?.getAttribute('data-block-version')).toBe('O1');
  });

  it('renders without console errors', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ObjectiveO1Block block={mockBlock} theme={brandThemeA} />);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
