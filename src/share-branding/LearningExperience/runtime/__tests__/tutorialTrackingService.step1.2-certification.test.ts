/**
 * Phase 2B.18 Step 1.2 - Tracking Service Contract Certification
 * 
 * PURPOSE:
 * Certify the delivery-result contract implemented in Step 1.2 at the service boundary.
 * Tests prove that trackTutorialEvent and markBlockComplete return explicit delivery results.
 * 
 * SCOPE:
 * Tests G-H: Session contract tests
 * Tests A-C: Basic delivery result tests
 * 
 * CONSTRAINTS:
 * - Tests only (no production code modifications)
 * - HTTP-level mocking (fetch API)
 * - Evidence-based certification
 * 
 * TESTS:
 * A. HTTP 200 Success → delivered:true
 * B. HTTP 500 Failure → delivered:false with reason:http
 * C. Network Failure → delivered:false with reason:network
 * G. Completion Session Contract → no sessionId in POST body
 * H. Visit Session Contract → sessionId in POST body
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { markBlockComplete, trackTutorialEvent } from '../tutorialTrackingService';
import type { TrackingDeliveryResult } from '../TutorialRuntimeContext';
import * as tutorialSessionService from '../tutorialSessionService';

// Mock tutorialSessionService
vi.mock('../tutorialSessionService', () => ({
  readTutorialLearningSessionId: vi.fn(() => 'session-123'),
}));

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ═══════════════════════════════════════════════════════════════════════════

describe('Phase 2B.18 Step 1.2 - Tracking Service Certification', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Mock fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST A: HTTP 200 SUCCESS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('TEST A: HTTP 200 Success', () => {
    it('A1: markBlockComplete with HTTP 200 returns delivered:true', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: {} }),
      } as Response);

      const result: TrackingDeliveryResult = await markBlockComplete(
        'learner-test-1',  // learnerId
        'subtopic-1',      // subtopicId
        'page-1',          // navigationNodeId
        'section-1',       // sectionId
        'block-1',         // blockId
        'definition',      // blockType
        'D1'               // blockVersion
      );

      expect(result).toEqual({ delivered: true });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('A2: trackTutorialEvent with HTTP 200 returns delivered:true', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: {} }),
      } as Response);

      const result: TrackingDeliveryResult = await trackTutorialEvent({
        eventType: 'page_view',
        learnerId: 'learner-test-1',
        navigationNodeId: 'page-1',
        subtopicId: 'subtopic-1',
        sectionId: 'section-1',
        blockId: 'block-1',
        blockVersion: 'D1',
      });

      expect(result).toEqual({ delivered: true });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST B: HTTP 500 FAILURE
  // ═══════════════════════════════════════════════════════════════════════════

  describe('TEST B: HTTP 500 Failure', () => {
    it('B1: markBlockComplete with HTTP 500 returns delivered:false with reason:http', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Internal Server Error' }),
      } as Response);

      const result: TrackingDeliveryResult = await markBlockComplete(
        'learner-test-1',
        'subtopic-1',
        'page-1',
        'section-1',
        'block-1',
        'definition',
        'D1'
      );

      expect(result).toEqual({ delivered: false, reason: 'http' });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('B2: trackTutorialEvent with HTTP 500 returns delivered:false with reason:http', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Internal Server Error' }),
      } as Response);

      const result: TrackingDeliveryResult = await trackTutorialEvent({
        eventType: 'block_complete',
        learnerId: 'learner-test-1',
        navigationNodeId: 'page-1',
        subtopicId: 'subtopic-1',
        sectionId: 'section-1',
        blockId: 'block-1',
        blockType: 'definition',
        blockVersion: 'D1',
      });

      expect(result).toEqual({ delivered: false, reason: 'http' });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST C: NETWORK FAILURE
  // ═══════════════════════════════════════════════════════════════════════════

  describe('TEST C: Network Failure', () => {
    it('C1: markBlockComplete with network error returns delivered:false with reason:network', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result: TrackingDeliveryResult = await markBlockComplete(
        'learner-test-1',
        'subtopic-1',
        'page-1',
        'section-1',
        'block-1',
        'definition',
        'D1'
      );

      expect(result).toEqual({ delivered: false, reason: 'network' });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('C2: trackTutorialEvent with network error returns delivered:false with reason:network', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result: TrackingDeliveryResult = await trackTutorialEvent({
        eventType: 'block_complete',
        learnerId: 'learner-test-1',
        navigationNodeId: 'page-1',
        subtopicId: 'subtopic-1',
        sectionId: 'section-1',
        blockId: 'block-1',
        blockType: 'definition',
        blockVersion: 'D1',
      });

      expect(result).toEqual({ delivered: false, reason: 'network' });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST G: COMPLETION SESSION CONTRACT
  // ═══════════════════════════════════════════════════════════════════════════

  describe('TEST G: Completion Session Contract', () => {
    it('G1: markBlockComplete does NOT include sessionId in request body', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: {} }),
      } as Response);

      await markBlockComplete(
        'learner-test-1',
        'subtopic-1',
        'page-1',
        'section-1',
        'block-1',
        'definition',
        'D1'
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      // Verify sessionId is NOT in body
      expect(requestBody).not.toHaveProperty('sessionId');
      // Verify block type is mapped (definition → technical)
      expect(requestBody.blockType).toBe('technical');
      expect(requestBody).toMatchObject({
        navigationNodeId: 'page-1',
        subtopicId: 'subtopic-1',
        sectionId: 'section-1',
        blockId: 'block-1',
        blockVersion: 'D1',
      });
    });

    it('G2: markBlockComplete does NOT include x-session-id header', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: {} }),
      } as Response);

      await markBlockComplete(
        'learner-test-1',
        'subtopic-1',
        'page-1',
        'section-1',
        'block-1',
        'definition',
        'D1'
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1].headers;

      // Verify x-session-id header is NOT present
      expect(headers).not.toHaveProperty('x-session-id');
      expect(headers).not.toHaveProperty('X-Session-ID');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST H: VISIT SESSION CONTRACT
  // ═══════════════════════════════════════════════════════════════════════════

  describe('TEST H: Visit Session Contract', () => {
    beforeEach(() => {
      // Mock sessionStorage for learning session
      const mockSessionStorage: Record<string, string> = {
        'tutorial_learning_session_id': 'session-123'
      };
      
      global.sessionStorage = {
        getItem: vi.fn((key: string) => mockSessionStorage[key] || null),
        setItem: vi.fn((key: string, value: string) => { mockSessionStorage[key] = value; }),
        removeItem: vi.fn((key: string) => { delete mockSessionStorage[key]; }),
        clear: vi.fn(() => { Object.keys(mockSessionStorage).forEach(k => delete mockSessionStorage[k]); }),
        key: vi.fn((index: number) => Object.keys(mockSessionStorage)[index] || null),
        length: Object.keys(mockSessionStorage).length,
      } as Storage;
    });

    it('H1: trackTutorialEvent page_view DOES include sessionId in request body', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: {} }),
      } as Response);

      await trackTutorialEvent({
        eventType: 'page_view',
        learnerId: 'learner-test-1',
        navigationNodeId: 'page-1',
        subtopicId: 'subtopic-1',
        sectionId: 'section-1',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      // Verify sessionId IS in body
      expect(requestBody).toHaveProperty('sessionId', 'session-123');
      expect(requestBody).toMatchObject({
        navigationNodeId: 'page-1',
        subtopicId: 'subtopic-1',
        sectionId: 'section-1',
        sessionId: 'session-123',
      });
    });

    it('H2: trackTutorialEvent page_view includes sessionId in X-Session-ID header', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: {} }),
      } as Response);

      await trackTutorialEvent({
        eventType: 'page_view',
        learnerId: 'learner-test-1',
        navigationNodeId: 'page-1',
        subtopicId: 'subtopic-1',
        sectionId: 'section-1',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1].headers;

      // Verify X-Session-ID header (lowercase as per code)
      expect(headers).toHaveProperty('x-session-id', 'session-123');
    });
  });
});
