'use client';

import { apiClient } from '@quiz/api-client';
import type { PortalIdentity } from '@quiz/types';
import { useEffect } from 'react';

export interface BrowserAuthFetchProviderProps {
  portalIdentity: PortalIdentity;
}

export function BrowserAuthFetchProvider({ portalIdentity }: BrowserAuthFetchProviderProps) {
  useEffect(() => {
    apiClient.client.setPortalIdentity(portalIdentity);
  }, [portalIdentity]);

  return null;
}
