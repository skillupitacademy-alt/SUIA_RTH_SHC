'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

export function useClientShell() {
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [headerTitle, setHeaderTitle] = useState('');
  const [headerSubtitle, setHeaderSubtitle] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    console.log('[SHC_LOGOUT] Starting logout process...');

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      console.log('[SHC_LOGOUT] Logout API called, clearing auth store...');
      logout();
      console.log('[SHC_LOGOUT] Auth store cleared, redirecting to login...');
      router.push('/login');
    } catch (error) {
      console.error('[SHC_LOGOUT] Logout failed:', error);
      logout();
      router.push('/login');
    }
  };

  return {
    isLeftSidebarOpen,
    setIsLeftSidebarOpen,
    isRightSidebarOpen,
    setIsRightSidebarOpen,
    headerTitle,
    setHeaderTitle,
    headerSubtitle,
    setHeaderSubtitle,
    isLoggingOut,
    pathname,
    handleLogout
  };
}
