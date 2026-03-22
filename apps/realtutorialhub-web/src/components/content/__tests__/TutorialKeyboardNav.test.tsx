import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TutorialKeyboardNav } from '../TutorialKeyboardNav';
import type { ContentBlockType } from '@quiz/types';
import React from 'react';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('TutorialKeyboardNav', () => {
  const defaultParams = {
    domainSlug: 'js',
    subjectSlug: 'basics',
    topicSlug: 'promises',
    subtopicSlug: 'intro',
  };

  const blockOrder: ContentBlockType[] = ['notes', 'layman', 'real_life', 'technical', 'code', 'ai_tutor'];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('navigates to next block on Right Arrow', () => {
    render(
      <TutorialKeyboardNav
        mode="detail"
        blockType="layman"
        blockOrder={blockOrder}
        params={defaultParams}
      />
    );
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(mockPush).toHaveBeenCalledWith('/learn/js/basics/promises/intro/real_life');
  });

  it('navigates to previous block on Left Arrow', () => {
    render(
      <TutorialKeyboardNav
        mode="detail"
        blockType="layman"
        blockOrder={blockOrder}
        params={defaultParams}
      />
    );
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(mockPush).toHaveBeenCalledWith('/learn/js/basics/promises/intro/notes');
  });

  it('does nothing when mode is not detail', () => {
    render(
      <TutorialKeyboardNav
        mode="learn"
        blockType="layman"
        blockOrder={blockOrder}
        params={defaultParams}
      />
    );
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('ignores input focus', () => {
    render(
      <div>
        <input data-testid="test-input" />
        <TutorialKeyboardNav
          mode="detail"
          blockType="layman"
          blockOrder={blockOrder}
          params={defaultParams}
        />
      </div>
    );
    const input = document.querySelector('input');
    input?.focus();
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
