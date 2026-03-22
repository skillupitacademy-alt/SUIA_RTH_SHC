"use client";

declare global {
  interface Window {
    __PDF_READY_EXPECTED__?: number;
    __PDF_READY_COUNT__?: number;
    __PDF_READY_IDS__?: Record<string, true>;
    __PDF_READY_SET_EXPECTED__?: (n: number) => void;
    __PDF_READY_MARK__?: (id: string) => void;
    __PDF_READY_IS_DONE__?: () => boolean;
  }
}

export function initPdfReadyRegistry() {
  if (typeof window === "undefined") return;

  if (window.__PDF_READY_COUNT__ === undefined) window.__PDF_READY_COUNT__ = 0;
  if (window.__PDF_READY_IDS__ === undefined) window.__PDF_READY_IDS__ = {};

  window.__PDF_READY_SET_EXPECTED__ = (n: number) => {
    window.__PDF_READY_EXPECTED__ = n;
    window.__PDF_READY_COUNT__ = 0;
    window.__PDF_READY_IDS__ = {};
  };

  window.__PDF_READY_MARK__ = (id: string) => {
    if (!window.__PDF_READY_IDS__) window.__PDF_READY_IDS__ = {};
    if (window.__PDF_READY_IDS__[id]) return;

    window.__PDF_READY_IDS__[id] = true;
    window.__PDF_READY_COUNT__ = (window.__PDF_READY_COUNT__ ?? 0) + 1;
  };

  window.__PDF_READY_IS_DONE__ = () => {
    const expected = window.__PDF_READY_EXPECTED__ ?? 0;
    const ready = window.__PDF_READY_COUNT__ ?? 0;
    
    if (expected === 0) return true;
    return ready >= expected;
  };
}
