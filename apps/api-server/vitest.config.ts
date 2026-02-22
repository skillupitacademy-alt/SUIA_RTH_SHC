import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    env: {
      DATABASE_URL: 'postgresql://neondb_owner:npg_y5iSrBlo4FMn@ep-round-cherry-a1ogr3gr-pooler.ap-southeast-1.aws.neon.tech/quiz_platform_prod?sslmode=require&channel_binding=require',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80,
      },
    },
  },
});
