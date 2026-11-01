import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: path.resolve(__dirname, '../..'),
  test: {
    environment: 'node',
    include: ['apps/skillhubcore-admin/__tests__/lib/project-llm/*.test.ts'],
  },
  resolve: {
    tsconfigPaths: true,
    alias: { '@': path.resolve(__dirname, '../../apps/skillhubcore-admin/src') },
  },
});
