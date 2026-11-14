import path from 'node:path';
import { defineConfig } from 'vitest/config';
export default defineConfig({
  root: path.resolve(import.meta.dirname, '../..'),
  test: { environment: 'node', include: ['.evidence/r6-final-migration/final.test.ts'], testTimeout: 120000, hookTimeout: 120000, fileParallelism: false },
});
