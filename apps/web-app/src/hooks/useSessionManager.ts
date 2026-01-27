
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@quiz/api-client';

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const HEARTBEAT_INTERVAL_MS = 60 * 1000; // 1 minute

export function useSessionManager() {
  const router = useRouter();
  const lastActivityRef = useRef<number>(Date.now());
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const checkIdleRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 1. Define Activity Handler
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // 2. Attach Listeners
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    // 3. Heartbeat Loop (Tell server we are alive)
    const sendHeartbeat = async () => {
      try {
        const now = Date.now();
        // Only send heartbeat if active recently (e.g. within last 2 minutes)
        if (now - lastActivityRef.current < 2 * 60 * 1000) {
            await fetch('/api/auth/heartbeat', { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } });
        }
      } catch (e) {
        console.error('Heartbeat failed', e);
      }
    };
    
    heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    // 4. Idle Check Loop (Enforce Logout)
    const checkIdle = () => {
      const now = Date.now();
      if (now - lastActivityRef.current > IDLE_TIMEOUT_MS) {
        // User is Idle > 5 mins
        console.warn('User idle timeout. Logging out...');
        // Clear tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // Redirect
        router.push('/login?reason=idle');
      }
    };

    checkIdleRef.current = setInterval(checkIdle, 10000); // Check every 10s

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (checkIdleRef.current) clearInterval(checkIdleRef.current);
    };
  }, [router]);
}
