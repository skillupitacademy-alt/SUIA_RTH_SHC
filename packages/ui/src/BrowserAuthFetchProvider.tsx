'use client';

import { useLayoutEffect } from 'react';

declare global {
  interface Window {
    __quizBrowserAuthFetchWrapped__?: boolean;
  }
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length !== 2) return null;
  return decodeURIComponent(parts.pop()?.split(';').shift() ?? '');
}

function getAccessToken(): string | null {
  return readCookie('accessToken');
}

function shouldAttachAuthHeader(requestUrl: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const resolved = new URL(requestUrl, window.location.href);
    const hostname = resolved.hostname.toLowerCase();
    return (
      resolved.origin === window.location.origin ||
      hostname === 'api.realtutorialhub.com' ||
      hostname.endsWith('.realtutorialhub.com')
    );
  } catch {
    return false;
  }
}

export function BrowserAuthFetchProvider() {
  useLayoutEffect(() => {
    if (typeof window === 'undefined' || window.__quizBrowserAuthFetchWrapped__ === true) {
      return;
    }

    window.__quizBrowserAuthFetchWrapped__ = true;
    const originalFetch = window.fetch.bind(window);

    window.fetch = ((input: RequestInfo | URL, init: RequestInit = {}) => {
      const requestUrl = typeof input === 'string' || input instanceof URL ? input.toString() : input.url;
      const headers = new Headers(
        init.headers ?? (input instanceof Request ? input.headers : undefined)
      );
      const token = getAccessToken();

      if (token !== null && token.trim().length > 0 && headers.has('Authorization') === false && shouldAttachAuthHeader(requestUrl)) {
        headers.set('Authorization', `Bearer ${token.trim()}`);
      }

      return originalFetch(input, {
        ...init,
        headers,
        credentials: 'include',
      });
    }) as typeof window.fetch;

    return () => {
      window.fetch = originalFetch;
      window.__quizBrowserAuthFetchWrapped__ = false;
    };
  }, []);

  return null;
}
