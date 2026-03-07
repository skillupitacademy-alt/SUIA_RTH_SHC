import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

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
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@quiz/ui': path.resolve(__dirname, '../../packages/ui/src/index.ts'),
      '@quiz/api-client': path.resolve(__dirname, '../../packages/api-client/src/index.ts'),
      '@quiz/config': path.resolve(__dirname, '../../packages/config/envPaths.ts'),
      '@quiz/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
      '@quiz/observability': path.resolve(__dirname, '../../packages/observability/src/index.ts'),
    },
  },
})
