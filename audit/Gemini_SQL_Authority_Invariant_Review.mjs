import path from 'node:path';
import { startVitest } from 'vitest/node';

for (const key of Object.keys(process.env)) {
  if (/DATABASE|DIRECT_URL|REDIS|UPSTASH|NEON|QSTASH/.test(key)) delete process.env[key];
}

const context = await startVitest('test', ['audit/Gemini_SQL_Authority_Invariant_Review.test.ts'], {
  config: false,
  watch: false,
  maxWorkers: 1,
  fileParallelism: false,
  environment: 'node',
  reporters: ['dot'],
  alias: {
    '@quiz/db-people': path.resolve('packages/db-people/src/index.ts'),
    '@quiz/db-tutorial': path.resolve('packages/db-tutorial/src/index.ts'),
    '@': path.resolve('apps/skillup-admin/src'),
  },
  setupFiles: [path.resolve('audit/W1_W3_Offline_Test_Network_Guard.ts')],
  exclude: ['**/node_modules/**', '**/.worktrees/**'],
});

if (!context) throw new Error('Gemini SQL authority invariant review runner did not start');
const failed = context.state.getFiles().some((file) => file.result?.state === 'fail');
await context.close();
process.exitCode = failed ? 1 : 0;
