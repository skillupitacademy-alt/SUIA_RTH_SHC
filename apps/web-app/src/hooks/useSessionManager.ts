
import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiClient } from '@quiz/api-client';

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const HEARTBEAT_INTERVAL_MS = 60 * 1000; // 1 minute

export function useSessionManager() {
  const router = useRouter();
  const pathname = usePathname();
  const lastActivityRef = useRef<number>(Date.now());
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const checkIdleRef = useRef<NodeJS.Timeout | null>(null);
  const isInFlightRef = useRef<boolean>(false);

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
      if (isInFlightRef.current) return;
      
      try {
        isInFlightRef.current = true;
        const now = Date.now();
        const isActiveExam = pathname?.startsWith('/exam/') || pathname?.startsWith('/quiz/active-session');
        
        // During active exam: ALWAYS send heartbeat (even if idle)
        // Otherwise: Only send if user was active recently
        const shouldSendHeartbeat = isActiveExam || (now - lastActivityRef.current < 2 * 60 * 1000);
        
        if (shouldSendHeartbeat) {
          await apiClient.auth.heartbeat();
        }
      } catch (e) {
        console.error('[Session] Heartbeat failed', e);
      } finally {
        isInFlightRef.current = false;
      }
    };
    
    heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    // 4. Idle Check Loop (Enforce Logout)
    const checkIdle = () => {
      // CRITICAL: Skip idle check during active exams
      // Prevents session expiry while user is taking assessment (even if reading long questions)
      const isActiveExam = pathname?.startsWith('/exam/') || pathname?.startsWith('/quiz/active-session');
      
      if (isActiveExam) {
        console.log('[Session] Idle check skipped: Active exam in progress');
        return;
      }

      const now = Date.now();
      if (now - lastActivityRef.current > IDLE_TIMEOUT_MS) {
        // User is Idle > 5 mins
        console.warn('[Session] User idle timeout. Logging out...');
        // Correct Logout: Session is cleared via cookies on server
        // We just need to redirect to login
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
  }, [router, pathname]);
}
