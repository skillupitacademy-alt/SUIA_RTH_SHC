import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  root: __dirname,
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 30000,
    hookTimeout: 30000,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/coverage.*.test.ts',
      '**/coverage.*.spec.ts',
      'src/modules/**/coverage.*.test.ts',
      'src/modules/**/coverage.*.spec.ts',
      'src/modules/__tests__/coverage.*.test.ts',
      'src/modules/__tests__/coverage.*.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      // Allow legacy/invalid CLI provider values (e.g. --coverage.provider c8)
      // by supplying a valid custom provider module fallback.
      customProviderModule: '@vitest/coverage-v8',
      reporter: ['json', 'html'],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 89,
        lines: 90,
        autoUpdate: false,
        perFile: false,
      },
    },
  },
  resolve: {
    tsconfigPaths: true,
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@quiz/db': path.resolve(__dirname, '../../packages/db/src'),
      '@quiz/api-client': path.resolve(__dirname, '../../packages/api-client/src'),
      '@quiz/types': path.resolve(__dirname, '../../packages/types/src'),
      '@quiz/observability': path.resolve(__dirname, '../../packages/observability/src'),
    },
  },
})
