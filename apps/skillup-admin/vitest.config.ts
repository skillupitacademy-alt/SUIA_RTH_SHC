import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import path from 'path';
import { defineConfig } from 'vitest/config';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: [
      { find: /^@quiz\/auth\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/auth/src/$1') },
      { find: /^@quiz\/db-people\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/db-people/src/$1') },
      { find: /^@quiz\/events\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/events/src/$1') },
      { find: /^@quiz\/types\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/types/src/$1') },
      { find: '@quiz/auth', replacement: path.resolve(__dirname, '../../packages/auth/src') },
      { find: '@quiz/db-people', replacement: path.resolve(__dirname, '../../packages/db-people/src') },
      { find: '@quiz/events', replacement: path.resolve(__dirname, '../../packages/events/src') },
      { find: '@quiz/types', replacement: path.resolve(__dirname, '../../packages/types/src') },
      { find: /^@\/(.*)$/, replacement: path.resolve(__dirname, './src/$1') },
      { find: '@', replacement: path.resolve(__dirname, './src') },
    ],
  },
});
