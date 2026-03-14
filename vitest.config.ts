import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: __dirname,
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 30000,
    hookTimeout: 30000,
    setupFiles: [path.resolve(__dirname, 'apps/api-server/src/test/setup.ts')],
  },
  resolve: {
    tsconfigPaths: true,
    alias: {
      '@': path.resolve(__dirname, 'apps/api-server/src'),
      '@quiz/db': path.resolve(__dirname, 'packages/db/src'),
      '@quiz/api-client': path.resolve(__dirname, 'packages/api-client/src'),
      '@quiz/types': path.resolve(__dirname, 'packages/types/src'),
      '@quiz/observability': path.resolve(__dirname, 'packages/observability/src'),
    },
  },
})
