/**
 * Phase 2: Tutorial Tracking Service Unit Tests
 * 
 * Tests the page_view -> VisitEvent persistence integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trackTutorialEvent } from '../tutorialTrackingService';
import * as sessionService from '../tutorialSessionService';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('tutorialTrackingService - Phase 2 page_view', () => {
  
  beforeEach(() => {
    mockFetch.mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════════
  // TEST U1: Existing session is READ, not created
  // ═══════════════════════════════════════════════════════════════════════
  
  it('U1: page_view reads existing session ID without creating new', async () => {
    const expectedSessionId = '7f8e9abc-1234-4def-89ab-123456789abc';
    
    // Mock readTutorialLearningSessionId to return known UUID
    vi.spyOn(sessionService, 'readTutorialLearningSessionId').mockReturnValue(expectedSessionId);
    
    // Spy on getOrCreateTutorialLearningSessionId to confirm it's NOT called
    const createSpy = vi.spyOn(sessionService, 'getOrCreateTutorialLearningSessionId');
    
    // Mock successful fetch
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);
    
    // Execute page_view
    await trackTutorialEvent({
      eventType: 'page_view',
      learnerId: 'learner-123',
      navigationNodeId: 'nav-node-1',
      subtopicId: 'subtopic-1',
      sectionId: 'section-1',
    });
    
    // Verify readTutorialLearningSessionId WAS called
    expect(sessionService.readTutorialLearningSessionId).toHaveBeenCalled();
    
    // Verify getOrCreateTutorialLearningSessionId WAS NOT called
    expect(createSpy).not.toHaveBeenCalled();
    
    // Verify fetch WAS called with the read session ID
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/tutorial/ils/visit',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-session-id': expectedSessionId,
        }),
        body: expect.stringContaining(expectedSessionId),
      })
    );
  });

  // ═══════════════════════════════════════════════════════════════════════
  // TEST U2: Both session channels contain the same UUID
  // ═══════════════════════════════════════════════════════════════════════
  
  it('U2: page_view sends identical session ID in header AND body', async () => {
    const sessionId = 'aaaabbbb-cccc-4ddd-eeee-ffffaaaabbbb';
    
    vi.spyOn(sessionService, 'readTutorialLearningSessionId').mockReturnValue(sessionId);
    
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);
    
    await trackTutorialEvent({
      eventType: 'page_view',
      learnerId: 'learner-123',
      navigationNodeId: 'nav-node-1',
      subtopicId: 'subtopic-1',
      sectionId: null,
    });
    
    expect(mockFetch).toHaveBeenCalledTimes(1);
    
    const [url, options] = mockFetch.mock.calls[0];
    
    // Verify URL
    expect(url).toBe('/api/tutorial/ils/visit');
    
    // Verify header contains session ID
    expect(options.headers['x-session-id']).toBe(sessionId);
    
    // Verify body contains same session ID
    const body = JSON.parse(options.body);
    expect(body.sessionId).toBe(sessionId);
    
    // Verify they are EXACTLY identical
    expect(options.headers['x-session-id']).toBe(body.sessionId);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // TEST U3: No learning session means no Visit request
  // ═══════════════════════════════════════════════════════════════════════
  
  it('U3: page_view does NOT call Visit API when session unavailable', async () => {
    // Mock readTutorialLearningSessionId to return null (SSR or storage unavailable)
    vi.spyOn(sessionService, 'readTutorialLearningSessionId').mockReturnValue(null);
    
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Execute page_view
    await trackTutorialEvent({
      eventType: 'page_view',
      learnerId: 'learner-123',
      navigationNodeId: 'nav-node-1',
      subtopicId: 'subtopic-1',
      sectionId: null,
    });
    
    // Verify fetch WAS NOT called
    expect(mockFetch).not.toHaveBeenCalled();
    
    // Verify warning was logged
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('No learning session available')
    );
    
    consoleWarnSpy.mockRestore();
  });
  
  it('U3b: page_view does NOT throw when session unavailable', async () => {
    vi.spyOn(sessionService, 'readTutorialLearningSessionId').mockReturnValue(null);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Should not throw
    await expect(
      trackTutorialEvent({
        eventType: 'page_view',
        learnerId: 'learner-123',
        navigationNodeId: 'nav-node-1',
        subtopicId: 'subtopic-1',
        sectionId: null,
      })
    ).resolves.toBeUndefined();
  });

  // ═══════════════════════════════════════════════════════════════════════
  // TEST U4: Visit API failure is isolated
  // ═══════════════════════════════════════════════════════════════════════
  
  it('U4: page_view does NOT throw when Visit API returns 500', async () => {
    vi.spyOn(sessionService, 'readTutorialLearningSessionId').mockReturnValue('session-123');
    
    // Mock fetch to return 500
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);
    
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Should not throw
    await expect(
      trackTutorialEvent({
        eventType: 'page_view',
        learnerId: 'learner-123',
        navigationNodeId: 'nav-node-1',
        subtopicId: 'subtopic-1',
        sectionId: null,
      })
    ).resolves.toBeUndefined();
    
    // Verify failure was logged
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Visit API returned 500')
    );
    
    consoleWarnSpy.mockRestore();
  });
  
  it('U4b: page_view does NOT throw on network error', async () => {
    vi.spyOn(sessionService, 'readTutorialLearningSessionId').mockReturnValue('session-123');
    
    // Mock fetch to throw network error
    mockFetch.mockRejectedValue(new Error('Network error'));
    
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Should not throw
    await expect(
      trackTutorialEvent({
        eventType: 'page_view',
        learnerId: 'learner-123',
        navigationNodeId: 'nav-node-1',
        subtopicId: 'subtopic-1',
        sectionId: null,
      })
    ).resolves.toBeUndefined();
  });

  // ═══════════════════════════════════════════════════════════════════════
  // TEST U5: block_complete regression
  // ═══════════════════════════════════════════════════════════════════════
  
  it('U5: block_complete still works with complete block identity', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);
    
    // Execute block_complete
    await trackTutorialEvent({
      eventType: 'block_complete',
      learnerId: 'learner-123',
      navigationNodeId: 'nav-node-1',
      subtopicId: 'subtopic-1',
      sectionId: 'section-1',
      blockId: 'block-d1-intro',
      blockType: 'definition',
      blockVersion: 'D1',
    });
    
    // Verify fetch called block-completion endpoint
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/tutorial/ils/block-completion',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        credentials: 'include',
      })
    );
    
    // Verify body contains complete block identity
    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    
    expect(body).toEqual(
      expect.objectContaining({
        navigationNodeId: 'nav-node-1',
        subtopicId: 'subtopic-1',
        sectionId: 'section-1',
        blockId: 'block-d1-intro',
        blockType: 'technical', // mapped from 'definition'
        blockVersion: 'D1',
      })
    );
  });
  
  it('U5b: page_view does NOT interfere with block_complete', async () => {
    vi.spyOn(sessionService, 'readTutorialLearningSessionId').mockReturnValue('session-123');
    
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);
    
    // Execute page_view first
    await trackTutorialEvent({
      eventType: 'page_view',
      learnerId: 'learner-123',
      navigationNodeId: 'nav-node-1',
      subtopicId: 'subtopic-1',
      sectionId: null,
    });
    
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('/api/tutorial/ils/visit', expect.any(Object));
    
    mockFetch.mockClear();
    
    // Execute block_complete
    await trackTutorialEvent({
      eventType: 'block_complete',
      learnerId: 'learner-123',
      navigationNodeId: 'nav-node-1',
      subtopicId: 'subtopic-1',
      sectionId: null,
      blockId: 'block-1',
      blockType: 'code',
      blockVersion: 'C1',
    });
    
    // Verify block_complete endpoint was called
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('/api/tutorial/ils/block-completion', expect.any(Object));
  });
  
  // ═══════════════════════════════════════════════════════════════════════
  // ADDITIONAL: Missing required fields validation
  // ═══════════════════════════════════════════════════════════════════════
  
  it('page_view validates required fields (missing navigationNodeId)', async () => {
    vi.spyOn(sessionService, 'readTutorialLearningSessionId').mockReturnValue('session-123');
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    await trackTutorialEvent({
      eventType: 'page_view',
      learnerId: 'learner-123',
      navigationNodeId: '', // Missing
      subtopicId: 'subtopic-1',
      sectionId: null,
    } as any);
    
    // Verify fetch WAS NOT called
    expect(mockFetch).not.toHaveBeenCalled();
    
    // Verify warning was logged
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Missing required fields'),
      expect.any(Object)
    );
    
    consoleWarnSpy.mockRestore();
  });
  
  it('page_view validates required fields (missing subtopicId)', async () => {
    vi.spyOn(sessionService, 'readTutorialLearningSessionId').mockReturnValue('session-123');
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    await trackTutorialEvent({
      eventType: 'page_view',
      learnerId: 'learner-123',
      navigationNodeId: 'nav-node-1',
      subtopicId: undefined, // Missing
      sectionId: null,
    });
    
    // Verify fetch WAS NOT called
    expect(mockFetch).not.toHaveBeenCalled();
    
    expect(consoleWarnSpy).toHaveBeenCalled();
    
    consoleWarnSpy.mockRestore();
  });
});
