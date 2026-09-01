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
    exclude: [
      '**/node_modules/**',
      '**/.http-e2e-smoke.test.mjs',
    ],
  },
  resolve: {
    tsconfigPaths: true,
    alias: [
      { find: '@quiz/types', replacement: path.resolve(__dirname, '../types/src') },
      { find: '@quiz/ui', replacement: path.resolve(__dirname, 'src') },
    ],
  },
});
