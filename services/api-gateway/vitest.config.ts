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
