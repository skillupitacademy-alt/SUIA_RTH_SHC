import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        statements: 95,
        branches: 95,
        functions: 95,
        lines: 95,
      },
    },
  },
  resolve: {
    alias: [
      { find: /^@quiz\/auth\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/auth/src/$1') },
      { find: /^@quiz\/events\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/events/src/$1') },
      { find: /^@quiz\/db-tutorial\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/db-tutorial/src/$1') },
      { find: /^@quiz\/types\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/types/src/$1') },
      { find: '@', replacement: path.resolve(__dirname, './src') },
      { find: '@quiz/api-client', replacement: path.resolve(__dirname, '../../packages/api-client/src') },
      { find: '@quiz/auth', replacement: path.resolve(__dirname, '../../packages/auth/src') },
      { find: '@quiz/events', replacement: path.resolve(__dirname, '../../packages/events/src') },
      { find: '@quiz/db-tutorial', replacement: path.resolve(__dirname, '../../packages/db-tutorial/src') },
      { find: '@quiz/types', replacement: path.resolve(__dirname, '../../packages/types/src') },
      { find: '@quiz/observability', replacement: path.resolve(__dirname, '../../packages/observability/src') },
      { find: '@quiz/ui', replacement: path.resolve(__dirname, '../../packages/ui/src') },
    ],
  },
})
