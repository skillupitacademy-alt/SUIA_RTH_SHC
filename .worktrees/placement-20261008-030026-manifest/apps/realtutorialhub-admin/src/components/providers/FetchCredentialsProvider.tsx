"use client";

import { useEffect } from "react";

/**
 * Ensures all browser fetch calls include credentials by default.
 * This fixes cross-site requests to the API (admin.realtutorialhub.com -> api.realtutorialhub.com)
 * where cookies would otherwise be dropped, causing spurious 401s and session timeouts.
 */
export function FetchCredentialsProvider() {
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = (input, init = {}) =>
      originalFetch(input as RequestInfo, {
        credentials: "include",
        ...init,
      } as RequestInit);

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
