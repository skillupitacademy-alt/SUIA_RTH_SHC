import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: __dirname,
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
  resolve: {
    tsconfigPaths: true,
    alias: [
      { find: '@quiz/db', replacement: path.resolve(__dirname, '../../packages/db/src') },
      { find: '@quiz/db-people', replacement: path.resolve(__dirname, '../../packages/db-people/src') },
      { find: '@quiz/types', replacement: path.resolve(__dirname, '../../packages/types/src') },
      { find: '@', replacement: path.resolve(__dirname, 'src') },
    ],
  },
  coverage: {
    provider: 'v8',
    reporter: ['text', 'html'],
    include: ['src/**/*.ts'],
    exclude: ['src/index.ts'],
  },
});
