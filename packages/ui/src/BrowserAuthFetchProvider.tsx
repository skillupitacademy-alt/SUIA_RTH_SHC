'use client';

import { apiClient } from '@quiz/api-client';
import { useLayoutEffect } from 'react';

import { getAuthCookieName, resolvePortalIdentityFromHostname } from './lib/auth-portal';

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

function getAccessToken(portalIdentity: ReturnType<typeof resolvePortalIdentityFromHostname>): string | null {
  return readCookie(getAuthCookieName(portalIdentity));
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

    const portalIdentity = resolvePortalIdentityFromHostname(window.location.hostname);
    apiClient.client.setPortalIdentity(portalIdentity);

    window.__quizBrowserAuthFetchWrapped__ = true;
    const originalFetch = window.fetch.bind(window);

    window.fetch = ((input: RequestInfo | URL, init: RequestInit = {}) => {
      const requestUrl = typeof input === 'string' || input instanceof URL ? input.toString() : input.url;
      const headers = new Headers(
        init.headers ?? (input instanceof Request ? input.headers : undefined)
      );
      const token = getAccessToken(portalIdentity);

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
