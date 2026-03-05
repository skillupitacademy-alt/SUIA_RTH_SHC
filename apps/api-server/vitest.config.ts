import { defineConfig } from 'vitest/config'
import path from 'path'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  root: __dirname,
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
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
      reporter: ['text', 'json', 'html'],
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70,
        autoUpdate: false,
        perFile: true,
        'src/modules/auth/**': {
          statements: 90,
          branches: 90,
          functions: 90,
          lines: 90,
        },
        'src/modules/exam-engine/**': {
          statements: 85,
          branches: 85,
          functions: 85,
          lines: 85,
        },
        'src/modules/scoring-engine/**': {
          statements: 85,
          branches: 85,
          functions: 85,
          lines: 85,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
