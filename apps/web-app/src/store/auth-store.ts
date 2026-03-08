import { createAuthStore } from '@quiz/ui';

export const useAuthStore = createAuthStore({
  name: 'quiz-platform-auth',
});

// Selector helper (legacy compatibility)
export const getIsAuthenticated = () => useAuthStore.getState().isAuthenticated;
