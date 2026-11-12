import path from 'path';
import dotenv from 'dotenv';
import { defineConfig } from 'vitest/config';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

export default defineConfig({
  root: __dirname,
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: [
      { find: /^@\/share-branding\/(.*)$/, replacement: path.resolve(__dirname, '../../src/share-branding/$1') },
      { find: /^@\/(.*)$/, replacement: path.resolve(__dirname, './src/$1') },
      { find: '@', replacement: path.resolve(__dirname, './src') },
      { find: /^@quiz\/auth\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/auth/src/$1') },
      { find: '@quiz/auth', replacement: path.resolve(__dirname, '../../packages/auth/src') },
      { find: /^@quiz\/types\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/types/src/$1') },
      { find: '@quiz/types', replacement: path.resolve(__dirname, '../../packages/types/src') },
      { find: '@quiz/db-people', replacement: path.resolve(__dirname, '../../packages/db-people/src/index.ts') },
      { find: /^@quiz\/db-people\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/db-people/src/$1') },
    ],
  },
});
