import path from 'node:path';
import { loadEnv } from 'vite';

import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/**/__tests__/**/*.test.ts', 'src/**/*.integration.test.ts'],
    env: loadEnv(mode, process.cwd(), ''),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // Use native TypeScript path resolution
    tsconfigPaths: true,
  },
}));
