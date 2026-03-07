import { createAuthStore } from '@quiz/ui';

export const useAuthStore = createAuthStore({
  name: 'quiz-platform-admin-auth',
});

// Wrapper for custom logout logic
const originalLogout = useAuthStore.getState().logout;
useAuthStore.setState({
  logout: () => {
    // SECURITY SHREDDER: Immediately purge sensitive draft data on logout
    if (typeof window !== 'undefined') {
      localStorage.removeItem('quiz-factory-storage-v1');
    }
    originalLogout();
  }
});
