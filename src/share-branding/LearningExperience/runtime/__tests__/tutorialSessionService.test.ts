/**
 * Unit tests for tutorialSessionService
 *
 * Tests the Tutorial Learning Session independently from auth session.
 * Uses jsdom (vitest environment) for sessionStorage simulation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getOrCreateTutorialLearningSessionId,
  readTutorialLearningSessionId,
  generateSessionId,
  isValidSessionId,
  TUTORIAL_LEARNING_SESSION_KEY,
} from '../tutorialSessionService';

// ── Helpers ──────────────────────────────────────────────────────────────────

function clearSession() {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(TUTORIAL_LEARNING_SESSION_KEY);
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('tutorialSessionService', () => {
  beforeEach(() => {
    clearSession();
  });

  afterEach(() => {
    clearSession();
  });

  // ── generateSessionId ────────────────────────────────────────────────────

  describe('generateSessionId()', () => {
    it('returns a valid UUID v4 string', () => {
      const id = generateSessionId();
      expect(isValidSessionId(id)).toBe(true);
    });

    it('returns a different ID on each call', () => {
      const a = generateSessionId();
      const b = generateSessionId();
      expect(a).not.toBe(b);
    });
  });

  // ── isValidSessionId ─────────────────────────────────────────────────────

  describe('isValidSessionId()', () => {
    it('accepts a valid UUID v4', () => {
      expect(isValidSessionId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('accepts crypto.randomUUID() output', () => {
      const id = crypto.randomUUID();
      expect(isValidSessionId(id)).toBe(true);
    });

    it('rejects null', () => {
      expect(isValidSessionId(null)).toBe(false);
    });

    it('rejects undefined', () => {
      expect(isValidSessionId(undefined)).toBe(false);
    });

    it('rejects empty string', () => {
      expect(isValidSessionId('')).toBe(false);
    });

    it('rejects a learnerId-style value', () => {
      expect(isValidSessionId('user-123')).toBe(false);
    });

    it('rejects navigationNodeId-style values', () => {
      expect(isValidSessionId('whatisjava')).toBe(false);
    });

    it('rejects subtopicId-style UUID v1 (wrong version digit)', () => {
      // UUID v1 has '1' in the version position, not '4'
      expect(isValidSessionId('550e8400-e29b-11d4-a716-446655440000')).toBe(false);
    });
  });

  // ── getOrCreateTutorialLearningSessionId ─────────────────────────────────

  describe('getOrCreateTutorialLearningSessionId()', () => {
    it('creates and returns a valid UUID when sessionStorage is empty', () => {
      const id = getOrCreateTutorialLearningSessionId();
      expect(id).not.toBeNull();
      expect(isValidSessionId(id)).toBe(true);
    });

    it('stores the UUID in sessionStorage under the canonical key', () => {
      const id = getOrCreateTutorialLearningSessionId();
      const stored = sessionStorage.getItem(TUTORIAL_LEARNING_SESSION_KEY);
      expect(stored).toBe(id);
    });

    it('returns the SAME UUID on repeated calls (idempotent)', () => {
      const first = getOrCreateTutorialLearningSessionId();
      const second = getOrCreateTutorialLearningSessionId();
      const third = getOrCreateTutorialLearningSessionId();
      expect(first).toBe(second);
      expect(second).toBe(third);
    });

    it('returns existing UUID if one is already in sessionStorage', () => {
      const preset = crypto.randomUUID();
      sessionStorage.setItem(TUTORIAL_LEARNING_SESSION_KEY, preset);

      const result = getOrCreateTutorialLearningSessionId();
      expect(result).toBe(preset);
    });

    it('generates a new UUID if sessionStorage contains an invalid value', () => {
      sessionStorage.setItem(TUTORIAL_LEARNING_SESSION_KEY, 'corrupted-value');

      const result = getOrCreateTutorialLearningSessionId();
      expect(result).not.toBeNull();
      expect(isValidSessionId(result)).toBe(true);
      expect(result).not.toBe('corrupted-value');
    });

    it('does NOT use learnerId as the session ID', () => {
      const learnerId = 'user-abc-123';
      // Simulate if someone accidentally stored learnerId in sessionStorage
      sessionStorage.setItem(TUTORIAL_LEARNING_SESSION_KEY, learnerId);

      const result = getOrCreateTutorialLearningSessionId();
      // learnerId is not a valid UUID -> it should be replaced
      expect(result).not.toBe(learnerId);
      expect(isValidSessionId(result)).toBe(true);
    });

    it('does NOT use navigationNodeId as the session ID', () => {
      sessionStorage.setItem(TUTORIAL_LEARNING_SESSION_KEY, 'whatisjava');
      const result = getOrCreateTutorialLearningSessionId();
      expect(result).not.toBe('whatisjava');
      expect(isValidSessionId(result)).toBe(true);
    });

    it('stores in sessionStorage, NOT localStorage', () => {
      getOrCreateTutorialLearningSessionId();
      // Must NOT appear in localStorage
      const inLocalStorage = localStorage.getItem(TUTORIAL_LEARNING_SESSION_KEY);
      expect(inLocalStorage).toBeNull();
    });

    it('Strict Mode double-invoke: second call reads first call stored ID', () => {
      // Simulate React Strict Mode: component mounts twice
      const id1 = getOrCreateTutorialLearningSessionId();
      const id2 = getOrCreateTutorialLearningSessionId();
      expect(id1).toBe(id2);
      // Only one key should exist
      expect(sessionStorage.getItem(TUTORIAL_LEARNING_SESSION_KEY)).toBe(id1);
    });

    describe('SSR guard', () => {
      it('returns null when window is undefined (SSR context)', () => {
        const originalWindow = global.window;
        // @ts-expect-error intentional SSR simulation
        delete global.window;
        try {
          const result = getOrCreateTutorialLearningSessionId();
          expect(result).toBeNull();
        } finally {
          global.window = originalWindow;
        }
      });
    });
  });

  // ── readTutorialLearningSessionId ─────────────────────────────────────────

  describe('readTutorialLearningSessionId()', () => {
    it('returns null when no session exists', () => {
      const result = readTutorialLearningSessionId();
      expect(result).toBeNull();
    });

    it('returns existing session ID after creation', () => {
      const created = getOrCreateTutorialLearningSessionId();
      const read = readTutorialLearningSessionId();
      expect(read).toBe(created);
    });

    it('does NOT create a new session when called on empty storage', () => {
      readTutorialLearningSessionId();
      const stored = sessionStorage.getItem(TUTORIAL_LEARNING_SESSION_KEY);
      expect(stored).toBeNull();
    });

    it('returns null for invalid stored value', () => {
      sessionStorage.setItem(TUTORIAL_LEARNING_SESSION_KEY, 'not-a-uuid');
      const result = readTutorialLearningSessionId();
      expect(result).toBeNull();
    });
  });

  // ── Storage isolation ─────────────────────────────────────────────────────

  describe('Storage isolation', () => {
    it('uses sessionStorage key: tutorialLearningSessionId', () => {
      expect(TUTORIAL_LEARNING_SESSION_KEY).toBe('tutorialLearningSessionId');
    });

    it('does not pollute localStorage', () => {
      getOrCreateTutorialLearningSessionId();
      expect(localStorage.getItem(TUTORIAL_LEARNING_SESSION_KEY)).toBeNull();
    });

    it('does not use any auth-related key names', () => {
      getOrCreateTutorialLearningSessionId();
      const authKeys = ['accessToken', 'refreshToken', 'sessionId', 'authSession', 'userId'];
      for (const key of authKeys) {
        expect(sessionStorage.getItem(key)).toBeNull();
      }
    });
  });
});
