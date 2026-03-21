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
      { find: /^@quiz\/auth\/(.*)$/, replacement: path.resolve(__dirname, 'packages/auth/src/$1') },
      { find: /^@quiz\/events\/(.*)$/, replacement: path.resolve(__dirname, 'packages/events/src/$1') },
      { find: /^@quiz\/db-tutorial\/(.*)$/, replacement: path.resolve(__dirname, 'packages/db-tutorial/src/$1') },
      { find: /^@quiz\/api-client\/(.*)$/, replacement: path.resolve(__dirname, 'packages/api-client/src/$1') },
      { find: '@', replacement: path.resolve(__dirname, 'apps/api-server/src') },
      { find: '@quiz/auth', replacement: path.resolve(__dirname, 'packages/auth/src') },
      { find: '@quiz/events', replacement: path.resolve(__dirname, 'packages/events/src') },
      { find: '@quiz/db-tutorial', replacement: path.resolve(__dirname, 'packages/db-tutorial/src') },
      { find: '@quiz/db', replacement: path.resolve(__dirname, 'packages/db/src') },
      { find: '@quiz/api-client', replacement: path.resolve(__dirname, 'packages/api-client/src') },
      { find: '@quiz/types', replacement: path.resolve(__dirname, 'packages/types/src') },
      { find: '@quiz/observability', replacement: path.resolve(__dirname, 'packages/observability/src') },
    ],
  },
})
