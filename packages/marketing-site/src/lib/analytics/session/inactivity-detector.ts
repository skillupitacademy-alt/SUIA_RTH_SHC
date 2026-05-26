const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000;

export function isSessionInactive(lastActivityAt: string, timeoutMs = DEFAULT_TIMEOUT_MS) {
  return Date.now() - Date.parse(lastActivityAt) > timeoutMs;
}

export function getIdleTimeMs(lastActivityAt: string) {
  return Math.max(0, Date.now() - Date.parse(lastActivityAt));
}

