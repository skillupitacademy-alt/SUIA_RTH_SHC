import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const service = fileURLToPath(new URL('./services/api-gateway/', import.meta.url));
export default defineConfig({
  root: service,
  test: {
    environment: 'node', globals: true, testTimeout: 30000, hookTimeout: 30000,
    include: ['src/__tests__/gateway.test.ts', 'src/lib/__tests__/proxy.test.ts'],
    exclude: ['**/node_modules/**'],
  },
  resolve: { alias: [
    { find: '@quiz/auth', replacement: fileURLToPath(new URL('../../../packages/auth/src/index.ts', import.meta.url)) },
    { find: '@quiz/types', replacement: fileURLToPath(new URL('../../../packages/types/src/index.ts', import.meta.url)) },
    { find: '@', replacement: `${service}src` },
  ] },
});
