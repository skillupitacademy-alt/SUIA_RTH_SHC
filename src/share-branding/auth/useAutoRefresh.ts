'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getDeviceHeaders } from '@quiz/auth';

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
        
        const response = await fetch('/api/auth/refresh', {
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
          console.warn('[AUTO_REFRESH] Token refresh failed, redirecting to login');
          
          // Clear interval before redirect
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          
          // Redirect to login
          router.replace('/login?reason=session_expired');
          return;
        }

        console.log('[AUTO_REFRESH] Tokens refreshed successfully');
      } catch (error) {
        console.error('[AUTO_REFRESH] Refresh error:', error);
        
        // Clear interval on error
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        
        // Redirect to login
        router.replace('/login?reason=session_expired');
      }
    };

    // 🔥 Set up automatic refresh every 10 minutes
    // Access tokens expire in 15 minutes, so 10 min gives 5 min buffer
    const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

    intervalRef.current = setInterval(refreshTokens, REFRESH_INTERVAL);

    // 🔥 Also refresh immediately on mount (in case token is close to expiry)
    // But delay by 1 second to avoid race conditions with initial page load
    const initialRefreshTimeout = setTimeout(() => {
      void refreshTokens();
    }, 1000);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      clearTimeout(initialRefreshTimeout);
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
    
    const response = await fetch('/api/auth/refresh', {
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
