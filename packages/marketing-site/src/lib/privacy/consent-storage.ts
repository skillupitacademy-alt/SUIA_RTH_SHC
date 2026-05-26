import { defaultConsentState, type ConsentState } from "./privacy-flags";

const CONSENT_STORAGE_KEY = "quiz.analytics.consent";

export function loadConsentState(): ConsentState {
  if (typeof window === "undefined") {
    return defaultConsentState;
  }

  const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  if (!raw) {
    return defaultConsentState;
  }

  try {
    return JSON.parse(raw) as ConsentState;
  } catch {
    return defaultConsentState;
  }
}

export function saveConsentState(state: ConsentState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
}

