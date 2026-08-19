import dotenv from 'dotenv';
import path from 'path';
import { defineConfig } from 'vitest/config';

// Load environment variables from .env.local for integration tests
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

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
      { find: '@quiz/db', replacement: path.resolve(__dirname, '../db/src') },
      { find: '@quiz/db-tutorial', replacement: path.resolve(__dirname, 'src') },
      { find: '@quiz/types', replacement: path.resolve(__dirname, '../types/src') },
    ],
  },
  coverage: {
    provider: 'v8',
    reporter: ['text', 'html'],
    include: ['src/repositories/**/*.ts'],
    exclude: [
      'src/repositories/index.ts',
    ],
  },
});
