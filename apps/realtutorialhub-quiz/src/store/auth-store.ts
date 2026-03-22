import { createAuthStore } from '@quiz/ui';

// ⚠️ ALWAYS use selectors: useStore(s => s.field), never useStore()
export const useAuthStore = createAuthStore({
  name: 'quiz-platform-auth',
});

// Selector helper (legacy compatibility)
export const getIsAuthenticated = () => useAuthStore.getState().isAuthenticated;
