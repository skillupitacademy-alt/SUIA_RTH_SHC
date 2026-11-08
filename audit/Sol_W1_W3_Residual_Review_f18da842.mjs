// Source-only independent review runner. Does not load application environment files.
import path from 'node:path';
import { startVitest } from 'vitest/node';
for (const key of Object.keys(process.env)) {
  if (/DATABASE|DIRECT_URL|REDIS|UPSTASH|NEON|QSTASH/.test(key)) delete process.env[key];
}
const selections = {
  residual: ['audit/Sol_W1_W3_Residual_Probes_f18da842.test.ts'],
  scoring: ['audit/Sol_W1_W3_Scoring_Identity_Probe_f18da842.test.ts'],
};
const names = process.argv.slice(2);
if (!names.length) throw new Error('Specify residual and/or scoring');
for (const name of names) {
  if (!Object.hasOwn(selections, name)) throw new Error(`Unknown selection: ${name}`);
  console.log(`SOL_RESIDUAL_SELECTION ${name}`);
  const context = await startVitest('test', selections[name], {
    config: false, watch: false, maxWorkers: 1, fileParallelism: false,
    environment: 'node', reporters: ['dot'], silent: true,
    alias: { '@': path.resolve('apps/api-server/src') },
    setupFiles: [path.resolve('audit/W1_W3_Offline_Test_Network_Guard.ts')],
    exclude: ['**/node_modules/**', '**/.worktrees/**'],
  });
  if (!context) throw new Error(`Runner did not start: ${name}`);
  await context.close();
}
