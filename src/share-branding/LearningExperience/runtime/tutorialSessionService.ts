/**
 * Tutorial Learning Session Service
 *
 * ARCHITECTURAL PRINCIPLE:
 * The Tutorial Learning Session is SEPARATE from the Auth Session.
 *
 * Auth Session (existing, UNCHANGED by this module):
 *   - DB-backed, created at login
 *   - Manages access/refresh lifecycle, device management, revocation
 *
 * Tutorial Learning Session (this module):
 *   - Browser-tab-scoped, created on first Tutorial Page mount
 *   - Semantics: one continuous learning context within one browser tab
 *   - Persisted in: sessionStorage (NOT localStorage, NOT cookie)
 *   - Survives: page reload, in-tab navigation
 *   - Destroyed on: tab close, new tab open
 *   - Independent of: Auth Session.id, learnerId, navigationNodeId, subtopicId
 *
 * IDENTITY TABLE:
 *   Auth Session.id    -> NEVER used as learning session
 *   learnerId          -> NEVER used as learning session
 *   navigationNodeId   -> NEVER used as learning session
 *   subtopicId         -> NEVER used as learning session
 *   crypto.randomUUID  -> YES (one per tab, independent)
 *
 * SEQUENCING (single authoritative initialization path):
 *   Tutorial runtime mounts
 *       ↓
 *   getOrCreateTutorialLearningSessionId()
 *       ↓
 *   sessionStorage["tutorialLearningSessionId"]
 *       ↓
 *   telemetry consumers (visit, active-time, block-completion)
 *
 * CLIENT/SERVER BOUNDARY:
 *   All exported functions guard against SSR via typeof window checks.
 *   Never call from Server Components or module top-level.
 *
 * REACT STRICT MODE SAFETY:
 *   All operations are idempotent. Double-invocation is safe.
 */

/** The ONE canonical sessionStorage key. Do not duplicate this string. */
export const TUTORIAL_LEARNING_SESSION_KEY = 'tutorialLearningSessionId';

/**
 * Generate a UUID v4.
 * Prefers crypto.randomUUID(); falls back to Math.random() for rare environments.
 * Exported for testability only — callers should use getOrCreateTutorialLearningSessionId().
 */
export function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: RFC 4122 v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Validate that a value looks like a UUID v4 (for integrity checking). */
export function isValidSessionId(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Get or create the Tutorial Learning Session ID for the current browser tab.
 *
 * Behavior matrix:
 *   First call in tab           -> generate UUID, store, return it
 *   Subsequent calls            -> read from sessionStorage, return same UUID
 *   Page reload                 -> sessionStorage survives -> same UUID
 *   New browser tab             -> sessionStorage is isolated -> different UUID
 *   Tab close + reopen          -> sessionStorage cleared -> new UUID
 *   Auth refresh                -> not affected (independent session)
 *   SSR / server rendering      -> returns null (no sessionStorage)
 *   Strict Mode double-invoke   -> idempotent (second call reads first call's stored ID)
 *   sessionStorage quota error  -> returns in-memory UUID (non-persistent, graceful)
 *
 * @returns UUID string, or null if called during SSR.
 */
export function getOrCreateTutorialLearningSessionId(): string | null {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return null;
  }

  try {
    const existing = sessionStorage.getItem(TUTORIAL_LEARNING_SESSION_KEY);
    if (existing !== null && isValidSessionId(existing)) {
      return existing;
    }
    const sessionId = generateSessionId();
    sessionStorage.setItem(TUTORIAL_LEARNING_SESSION_KEY, sessionId);
    return sessionId;
  } catch {
    // Graceful degradation for private-browsing / quota errors.
    return generateSessionId();
  }
}

/**
 * Read the current Tutorial Learning Session ID without creating one.
 * Returns null if no session exists yet, or if called during SSR.
 */
export function readTutorialLearningSessionId(): string | null {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return null;
  }
  try {
    const value = sessionStorage.getItem(TUTORIAL_LEARNING_SESSION_KEY);
    return isValidSessionId(value) ? value : null;
  } catch {
    return null;
  }
}
