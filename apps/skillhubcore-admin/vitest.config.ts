import path from 'node:path';
import { loadEnv } from 'vite';

import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
  // Next.js preserves JSX; the standalone test runner must transform it.
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/**/__tests__/**/*.test.ts', 'src/**/*.integration.test.ts'],
    env: loadEnv(mode, process.cwd(), ''),
  },
  resolve: {
    alias: [
      { find: /^@quiz\/auth\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/auth/src/$1') },
      { find: '@quiz/auth', replacement: path.resolve(__dirname, '../../packages/auth/src') },
      { find: /^@quiz\/types\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/types/src/$1') },
      { find: '@quiz/types', replacement: path.resolve(__dirname, '../../packages/types/src') },
      { find: /^@quiz\/validation\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/validation/src/$1') },
      { find: '@quiz/validation', replacement: path.resolve(__dirname, '../../packages/validation/src') },
      { find: /^@quiz\/db-tutorial\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/db-tutorial/src/$1') },
      { find: '@quiz/db-tutorial', replacement: path.resolve(__dirname, '../../packages/db-tutorial/src') },
      { find: /^@quiz\/db\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/db/src/$1') },
      { find: '@quiz/db', replacement: path.resolve(__dirname, '../../packages/db/src') },
      { find: /^@quiz\/api-client\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/api-client/src/$1') },
      { find: '@quiz/api-client', replacement: path.resolve(__dirname, '../../packages/api-client/src') },
      { find: /^@quiz\/observability\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/observability/src/$1') },
      { find: '@quiz/observability', replacement: path.resolve(__dirname, '../../packages/observability/src') },
      { find: /^@\/share-branding\/(.*)$/, replacement: path.resolve(__dirname, '../../src/share-branding/$1') },
      { find: '@/share-branding', replacement: path.resolve(__dirname, '../../src/share-branding') },
      { find: /^@\/(.*)$/, replacement: path.resolve(__dirname, './src/$1') },
      { find: '@', replacement: path.resolve(__dirname, './src') },
    ],
  },
}));
