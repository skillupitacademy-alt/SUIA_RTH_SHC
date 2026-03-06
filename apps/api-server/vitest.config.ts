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
      reporter: ['json', 'html'],
      thresholds: {
        statements: 95,
        branches: 95,
        functions: 95,
        lines: 95,
        autoUpdate: false,
        perFile: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
