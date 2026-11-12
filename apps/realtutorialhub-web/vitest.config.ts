import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    testTimeout: 60000,
    hookTimeout: 60000,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    pool: 'threads',
    fileParallelism: false,
    maxWorkers: 1,
    minWorkers: 1,
  },
  resolve: {
    alias: [
      { find: /^@quiz\/api-client\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/api-client/src/$1') },
      { find: '@quiz/api-client', replacement: path.resolve(__dirname, '../../packages/api-client/src') },
      { find: /^@quiz\/ui\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/ui/src/$1') },
      { find: '@quiz/ui', replacement: path.resolve(__dirname, '../../packages/ui/src') },
      { find: /^@quiz\/auth\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/auth/src/$1') },
      { find: '@quiz/auth', replacement: path.resolve(__dirname, '../../packages/auth/src') },
      { find: /^@quiz\/types\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/types/src/$1') },
      { find: '@quiz/types', replacement: path.resolve(__dirname, '../../packages/types/src') },
      { find: /^@quiz\/db-tutorial\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/db-tutorial/src/$1') },
      { find: '@quiz/db-tutorial', replacement: path.resolve(__dirname, '../../packages/db-tutorial/src') },
      { find: /^@\/share-branding\/(.*)$/, replacement: path.resolve(__dirname, '../../src/share-branding/$1') },
      { find: '@/share-branding', replacement: path.resolve(__dirname, '../../src/share-branding') },
      { find: /^@\/(.*)$/, replacement: path.resolve(__dirname, './src/$1') },
      { find: '@', replacement: path.resolve(__dirname, './src') },
    ],
  },
});
