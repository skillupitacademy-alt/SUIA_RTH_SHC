'use client';

import { apiClient } from '@quiz/api-client';
import { useEffect, useCallback } from 'react';

interface AuthSyncOptions {
  portal: 'admin' | 'user';
  isAuthenticated: boolean;
  isLocked?: boolean;
  logout: () => void;
  onUnauthorized?: (e: Event) => void;
}

/**
 * Shared hook to synchronize portal identity and handle global unauthorized events.
 * Provides a circuitry for the " CIRCUIT BREAKER" pattern.
 */
export function useAuthSync({ 
  portal, 
  isAuthenticated, 
  isLocked = false, 
  logout,
  onUnauthorized 
}: AuthSyncOptions) {
  
  useEffect(() => {
    // 1. Establish Portal Identity Hint for all outgoing requests
    apiClient.client.setPortalIdentity(portal);
  }, [portal]);

  const handleUnauthorized = useCallback((e: Event) => {
     // If the portal provides a custom handler (e.g. Admin deferring to Lock Protocol)
     if (onUnauthorized) {
       onUnauthorized(e);
       return;
     }

     // Default behavior: Force logout and let the Guard handle redirection
     logout();
  }, [logout, onUnauthorized]);

  useEffect(() => {
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [handleUnauthorized]);

  return {
    handleUnauthorized
  };
}
