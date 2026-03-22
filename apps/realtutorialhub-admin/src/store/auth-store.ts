import { createAuthStore } from '@quiz/ui';

// ⚠️ ALWAYS use selectors: useStore(s => s.field), never useStore()
export const useAuthStore = createAuthStore({
  name: 'quiz-platform-admin-auth',
  onLogout: () => {
    // SECURITY SHREDDER: Immediately purge sensitive draft data on logout
    if (typeof window !== 'undefined') {
      localStorage.removeItem('quiz-factory-storage-v1');
    }
  }
});
