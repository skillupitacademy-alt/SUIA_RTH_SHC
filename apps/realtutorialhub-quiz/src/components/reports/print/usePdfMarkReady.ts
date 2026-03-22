"use client";

import { useEffect } from "react";

/**
 * usePdfMarkReady
 * Universal hook to mark a specific section or component as "Ready" in the global PDF registry.
 * Uses nested requestAnimationFrame to ensure the browser has finished layout and paint.
 */
export function usePdfMarkReady(id: string) {
  useEffect(() => {
    let raf1 = 0;
    let raf2 = 0;

    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (typeof window !== "undefined") {
          window.__PDF_READY_MARK__?.(id);
        }
      });
    });

    return () => {
      if (raf1) cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [id]);
}
