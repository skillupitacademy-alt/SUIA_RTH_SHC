/**
 * BlockTelemetryProvider Tests - Phase 4.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import React from 'react';
import { BlockTelemetryProvider } from '../BlockTelemetryProvider';
import * as ActiveBlockModule from '../ActiveBlockContext';

// Mock ActiveBlockContext
vi.mock('../ActiveBlockContext', async () => {
  const actual = await vi.importActual<typeof ActiveBlockModule>('../ActiveBlockContext');
  return {
    ...actual,
    useActiveBlock: vi.fn(() => ({ activeBlock: null })),
  };
});

// Mock fetch
global.fetch = vi.fn();

// Mock performance.now()
const mockPerformanceNow = vi.fn();
global.performance.now = mockPerformanceNow;

// Mock document.visibilityState
let mockVisibilityState: 'visible' | 'hidden' = 'visible';
Object.defineProperty(document, 'visibilityState', {
  configurable: true,
  get: () => mockVisibilityState,
});

const mockNavigationNodeId = 'whatisjava';
const mockSubtopicId = '5326eeb6-c4c8-4218-9687-2b46f94a9bb4';
const mockSectionId = 'section-uuid-789';
const mockSessionId = 'test-session-uuid';

describe('BlockTelemetryProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVisibilityState = 'visible';
    mockPerformanceNow.mockReturnValue(0);
    
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders without crashing', () => {
    const { container } = render(
      <BlockTelemetryProvider
        navigationNodeId={mockNavigationNodeId}
        subtopicId={mockSubtopicId}
        sectionId={mockSectionId}
        sessionId={mockSessionId}
      >
        <div>Content</div>
      </BlockTelemetryProvider>
    );

    expect(container).toBeTruthy();
  });

  it('handles null session gracefully', async () => {
    vi.mocked(ActiveBlockModule.useActiveBlock).mockReturnValue({
      activeBlock: { blockId: 'block-1', blockType: 'paragraph', blockVersion: undefined },
    });

    render(
      <BlockTelemetryProvider
        navigationNodeId={mockNavigationNodeId}
        subtopicId={mockSubtopicId}
        sectionId={null}
        sessionId={null}
      >
        <div>Content</div>
      </BlockTelemetryProvider>
    );

    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  it('emits visit when block becomes active', async () => {
    vi.mocked(ActiveBlockModule.useActiveBlock).mockReturnValue({
      activeBlock: { blockId: 'block-1', blockType: 'paragraph', blockVersion: 'D1' },
    });

    render(
      <BlockTelemetryProvider
        navigationNodeId={mockNavigationNodeId}
        subtopicId={mockSubtopicId}
        sectionId={mockSectionId}
        sessionId={mockSessionId}
      >
        <div>Content</div>
      </BlockTelemetryProvider>
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/tutorial/ils/block-visit',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"blockId":"block-1"'),
        })
      );
    });

    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(call[1].body);
    
    expect(body).toEqual({
      navigationNodeId: mockNavigationNodeId,
      subtopicId: mockSubtopicId,
      blockId: 'block-1',
      blockVersion: 'D1',
      sessionId: mockSessionId,
      sectionId: mockSectionId,
    });
  });

  it('coerces undefined blockVersion to "unversioned"', async () => {
    vi.mocked(ActiveBlockModule.useActiveBlock).mockReturnValue({
      activeBlock: { blockId: 'block-1', blockType: 'paragraph', blockVersion: undefined },
    });

    render(
      <BlockTelemetryProvider
        navigationNodeId={mockNavigationNodeId}
        subtopicId={mockSubtopicId}
        sectionId={null}
        sessionId={mockSessionId}
      >
        <div>Content</div>
      </BlockTelemetryProvider>
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(call[1].body);
    
    expect(body.blockVersion).toBe('unversioned');
  });

  it('handles fetch failures without crashing', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

    vi.mocked(ActiveBlockModule.useActiveBlock).mockReturnValue({
      activeBlock: { blockId: 'block-1', blockType: 'paragraph', blockVersion: undefined },
    });

    const { container } = render(
      <BlockTelemetryProvider
        navigationNodeId={mockNavigationNodeId}
        subtopicId={mockSubtopicId}
        sectionId={null}
        sessionId={mockSessionId}
      >
        <div>Content</div>
      </BlockTelemetryProvider>
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(container.textContent).toBe('Content');
  });

  it('does not emit telemetry when enabled=false', async () => {
    vi.mocked(ActiveBlockModule.useActiveBlock).mockReturnValue({
      activeBlock: { blockId: 'block-1', blockType: 'paragraph', blockVersion: undefined },
    });

    render(
      <BlockTelemetryProvider
        navigationNodeId={mockNavigationNodeId}
        subtopicId={mockSubtopicId}
        sectionId={null}
        sessionId={mockSessionId}
        enabled={false}
      >
        <div>Content</div>
      </BlockTelemetryProvider>
    );

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('does not emit telemetry when activeBlock is null', async () => {
    vi.mocked(ActiveBlockModule.useActiveBlock).mockReturnValue({
      activeBlock: null,
    });

    render(
      <BlockTelemetryProvider
        navigationNodeId={mockNavigationNodeId}
        subtopicId={mockSubtopicId}
        sectionId={null}
        sessionId={mockSessionId}
      >
        <div>Content</div>
      </BlockTelemetryProvider>
    );

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
