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
 * Phase 2D - Code C1 Clipboard Interaction Tests
 * 
 * Tests clipboard copy functionality and graceful failure handling
 * 
 * CRITICAL TESTS:
 * - Button accessibility
 * - Successful copy with payload verification
 * - Graceful handling when clipboard unavailable
 * - Graceful handling when clipboard write rejected
 */

describe('Phase 2D - Code C1 Clipboard Interaction', () => {
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

  it('TEST 47 — copy button is functional and accessible', async () => {
    const block = createC1Block(validC1Content);
    const { user } = setup(<CodeC1Block block={block} />);
    
    const copyButton = screen.getByRole('button', { name: /copy code to clipboard/i });
    expect(copyButton).toBeInTheDocument();
    expect(copyButton).not.toBeDisabled();
    
    // Verify button is clickable without errors
    await expect(user.click(copyButton)).resolves.not.toThrow();
  });

  it('TEST 48 — copies code and shows confirmation after successful copy', async () => {
    const block = createC1Block(validC1Content);
    const { user } = setup(<CodeC1Block block={block} />);
    
    const writeText = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined);

    try {
      const copyButton = screen.getByRole('button', {
        name: /copy code to clipboard/i,
      });
      
      await user.click(copyButton);
      
      // Verify clipboard API was called
      expect(writeText).toHaveBeenCalledTimes(1);
      
      // Verify exact code payload
      expect(writeText).toHaveBeenCalledWith(
        validC1Content.page.code
      );
      
      // Verify successful-copy UI
      expect(screen.getByText('✓ Copied')).toBeInTheDocument();
      
      expect(
        screen.getByRole('button', {
          name: /code copied to clipboard/i,
        })
      ).toBeInTheDocument();
    } finally {
      writeText.mockRestore();
    }
  });

  it('TEST 49 — gracefully handles clipboard unavailable', async () => {
    const clipboardSpy = vi
      .spyOn(navigator, 'clipboard', 'get')
      .mockReturnValue(undefined as any);

    try {
      const block = createC1Block(validC1Content);
      const { user} = setup(<CodeC1Block block={block} />);
      
      const copyButton = screen.getByRole('button', {
        name: /copy code to clipboard/i,
      });
      
      // Must not crash when clipboard unavailable
      await expect(user.click(copyButton)).resolves.not.toThrow();
      
      // Component must remain functional
      expect(
        screen.getByText('Python Print Statement')
      ).toBeInTheDocument();
    } finally {
      clipboardSpy.mockRestore();
    }
  });

  it('TEST 50 — gracefully handles clipboard rejection', async () => {
    const block = createC1Block(validC1Content);
    const { user } = setup(<CodeC1Block block={block} />);
    
    const writeText = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockRejectedValue(new Error('Permission denied'));

    try {
      const copyButton = screen.getByRole('button', {
        name: /copy code to clipboard/i,
      });
      
      await expect(user.click(copyButton)).resolves.not.toThrow();
      
      // Verify clipboard API was actually attempted
      expect(writeText).toHaveBeenCalledTimes(1);
      
      expect(writeText).toHaveBeenCalledWith(
        validC1Content.page.code
      );
      
      // Component must remain functional after rejection
      expect(
        screen.getByText('Python Print Statement')
      ).toBeInTheDocument();
      
      // Successful state must NOT be shown
      expect(screen.queryByText('✓ Copied')).not.toBeInTheDocument();
    } finally {
      writeText.mockRestore();
    }
  });
});
