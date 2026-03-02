import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'apps/admin-app/vitest.config.ts',
  'apps/api-server/vitest.config.ts',
  'apps/web-app/vitest.config.ts',
]);
