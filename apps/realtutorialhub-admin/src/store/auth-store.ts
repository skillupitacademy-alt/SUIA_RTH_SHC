import { createAuthStore } from '@quiz/ui';

// ⚠️ ALWAYS use selectors: useStore(s => s.field), never useStore()
export const useAuthStore = createAuthStore({
  name: 'quiz-platform-admin-auth',
});
