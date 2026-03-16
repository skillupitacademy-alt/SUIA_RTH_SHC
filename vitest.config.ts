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
    alias: [
      { find: /^@quiz\/api-client\/(.*)$/, replacement: path.resolve(__dirname, 'packages/api-client/src/$1') },
      { find: '@', replacement: path.resolve(__dirname, 'apps/api-server/src') },
      { find: '@quiz/db', replacement: path.resolve(__dirname, 'packages/db/src') },
      { find: '@quiz/api-client', replacement: path.resolve(__dirname, 'packages/api-client/src') },
      { find: '@quiz/types', replacement: path.resolve(__dirname, 'packages/types/src') },
      { find: '@quiz/observability', replacement: path.resolve(__dirname, 'packages/observability/src') },
    ],
  },
})
