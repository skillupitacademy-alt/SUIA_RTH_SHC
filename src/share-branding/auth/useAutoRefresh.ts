'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getDeviceHeaders } from '@quiz/auth';
import { unifiedFetch } from '../lib/unifiedFetch';

/**
 * 🔐 ENTERPRISE AUTH: Automatic Token Refresh Hook
 * 
 * Automatically refreshes access tokens before they expire to maintain
 * seamless user sessions without unexpected logouts.
 * 
 * Strategy:
 * - Access tokens expire in 15 minutes
 * - Refresh every 10 minutes (5 min buffer)
 * - On failure, redirect to login
 * - Includes device context in refresh requests
 */
export function useAutoRefresh() {
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 🔐 Refresh function with device context
    const refreshTokens = async () => {
      try {
        const deviceHeaders = getDeviceHeaders();
        
        const response = await unifiedFetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'content-type': 'application/json',
            accept: 'application/json',
            'x-portal-identity': 'user',
            ...deviceHeaders, // 🔥 Include device context
          },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          // 🔥 PRODUCTION FIX: Only redirect on 401 (expired session)
          // Network errors and 5xx should not immediately log out user
          if (response.status === 401) {
            console.warn('[AUTO_REFRESH] Session expired (401), redirecting to login');
            
            // Clear interval before redirect
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            
            // 🔥 FIX: Use window.location to avoid polluting browser history
            // router.replace() in App Router adds to history, causing back button issues
            // Full page reload clears auth state and prevents back navigation to protected pages
            if (typeof window !== 'undefined') {
              window.location.href = '/login?reason=session_expired';
            } else {
              // Fallback for SSR (shouldn't happen, but safety)
              router.replace('/login?reason=session_expired');
            }
          } else {
            // Transient failure - log but don't redirect
            console.warn(`[AUTO_REFRESH] Refresh failed with status ${response.status}, will retry on next interval`);
          }
          return;
        }

        console.log('[AUTO_REFRESH] Tokens refreshed successfully');
      } catch (error) {
        // 🔥 PRODUCTION FIX: Network errors should not immediately log out user
        // These could be temporary connectivity issues
        console.error('[AUTO_REFRESH] Refresh error (network/timeout), will retry on next interval:', error);
        // Do NOT redirect - let the interval retry
      }
    };

    // 🔥 Set up automatic refresh every 10 minutes
    // Access tokens expire in 15 minutes, so 10 min gives 5 min buffer
    const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

    intervalRef.current = setInterval(refreshTokens, REFRESH_INTERVAL);

    // 🔥 PRODUCTION FIX: Check for fresh session flag
    // If user just logged in, skip initial refresh to avoid race conditions
    const skipInitialRefresh = typeof window !== 'undefined' 
      ? sessionStorage.getItem('skip_initial_refresh')
      : null;

    if (skipInitialRefresh) {
      // Remove flag after reading
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('skip_initial_refresh');
      }
      console.log('[AUTO_REFRESH] Skipping initial refresh for fresh session');
    } else {
      // 🔥 PRODUCTION FIX: Delay initial refresh to 30 seconds
      // This prevents race conditions with page load and profile data fetching
      // 30 seconds is safe since tokens expire in 15 minutes
      const initialRefreshTimeout = setTimeout(() => {
        console.log('[AUTO_REFRESH] Running delayed initial refresh');
        void refreshTokens();
      }, 30000); // 30 seconds

      // Store timeout for cleanup
      const cleanupTimeout = initialRefreshTimeout;
      
      // Update cleanup to clear the timeout
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        clearTimeout(cleanupTimeout);
      };
    }

    // Cleanup on unmount (for skip case)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [router]);
}

/**
 * 🔐 Manual refresh function for explicit refresh needs
 * (e.g., before critical operations)
 */
export async function manualRefresh(): Promise<boolean> {
  try {
    const deviceHeaders = getDeviceHeaders();
    
    const response = await unifiedFetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        'x-portal-identity': 'user',
        ...deviceHeaders,
      },
      body: JSON.stringify({}),
    });

    return response.ok;
  } catch (error) {
    console.error('[MANUAL_REFRESH] Error:', error);
    return false;
  }
}
