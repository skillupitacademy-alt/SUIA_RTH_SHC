'use client';

import { useEffect } from 'react';

export function FacultyServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/faculty-sw.js', { scope: '/' });
      } catch {
        // Offline support should never block the portal shell.
      }
    };

    void register();
  }, []);

  return null;
}
