import path from 'node:path';
import { startVitest } from 'vitest/node';
for (const key of Object.keys(process.env)) {
  if (/DATABASE|DIRECT_URL|REDIS|UPSTASH|NEON|QSTASH/.test(key)) delete process.env[key];
}
const context = await startVitest('test', ['audit/Sol_SQL_Authority_Probe_7f66e7eb.test.ts'], {
  config: false, watch: false, maxWorkers: 1, fileParallelism: false,
  environment: 'node', reporters: ['dot'],
  alias: { '@quiz/db-people': path.resolve('packages/db-people/src/index.ts') },
  setupFiles: [path.resolve('audit/W1_W3_Offline_Test_Network_Guard.ts')],
  exclude: ['**/node_modules/**', '**/.worktrees/**'],
});
if (!context) throw new Error('SQL authority review runner did not start');
const failed = context.state.getFiles().some(file => file.result?.state === 'fail');
await context.close();
process.exitCode = failed ? 1 : 0;
