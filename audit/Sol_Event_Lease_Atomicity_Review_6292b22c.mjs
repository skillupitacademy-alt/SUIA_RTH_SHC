import path from 'node:path';
import { startVitest } from 'vitest/node';
for (const key of Object.keys(process.env)) {
  if (/DATABASE|DIRECT_URL|REDIS|UPSTASH|NEON|QSTASH/.test(key)) delete process.env[key];
}
const context = await startVitest('test', ['audit/Sol_Event_Lease_Atomicity_Probe_6292b22c.test.ts'], {
  config: false, watch: false, maxWorkers: 1, fileParallelism: false,
  environment: 'node', reporters: ['dot'],
  setupFiles: [path.resolve('audit/W1_W3_Offline_Test_Network_Guard.ts')],
  exclude: ['**/node_modules/**', '**/.worktrees/**'],
});
if (!context) throw new Error('Lease atomicity runner did not start');
const failed = context.state.getFiles().some(file => file.result?.state === 'fail');
await context.close();
process.exitCode = failed ? 1 : 0;
