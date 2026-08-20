import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: __dirname,
  test: {
    environment: 'jsdom',
    globals: true,
    testTimeout: 30_000,
    hookTimeout: 30_000,
    setupFiles: [path.resolve(__dirname, '__tests__/setup.ts')],
  },
  resolve: {
    tsconfigPaths: true,
    alias: [
      { find: '@quiz/types', replacement: path.resolve(__dirname, '../types/src') },
      { find: '@quiz/ui', replacement: path.resolve(__dirname, 'src') },
    ],
  },
});
