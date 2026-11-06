// Isolated source review; never starts application servers or loads application env files.
import fs from 'node:fs';
import path from 'node:path';
import { startVitest } from 'vitest/node';
for (const key of Object.keys(process.env)) {
  if (/DATABASE|DIRECT_URL|REDIS|UPSTASH|NEON|QSTASH/.test(key)) delete process.env[key];
}
const base = path.resolve('apps/api-server');
const config = JSON.parse(fs.readFileSync(path.join(base, 'tsconfig.json'), 'utf8'));
const alias = Object.entries(config.compilerOptions.paths).sort(([a], [b]) => b.length - a.length)
  .map(([key, values]) => ({
    find: new RegExp(`^${key.split('*').map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('(.*)')}$`),
    replacement: path.resolve(base, values[0].replace('*', '$1')).replaceAll('\\', '/'),
  }));
const selections = {
  probes: ['audit/Sol_W1_W3_Integrated_Probes_f574daa5.test.ts'],
  scoring: ['audit/Sol_W1_W3_Scoring_Probe_f574daa5.test.ts'],
  exports: [
    'apps/api-server/src/app/api/export/trigger/__tests__/batch-08-trigger-authority.test.ts',
    'apps/api-server/src/app/api/export/urls/__tests__/batch-08-url-authority.test.ts',
    'apps/api-server/src/app/api/export/status/[jobId]/__tests__/batch-08-ownership.test.ts',
    'apps/api-server/src/app/api/export/download/__tests__/batch-08-ownership.test.ts',
  ],
  admin: ['apps/api-server/src/modules/auth/__tests__/batch-08-resource-guard-boundary.test.ts'],
  analytics: [
    'packages/marketing-site/src/lib/analytics/__tests__/',
    'packages/marketing-site/src/lib/analytics/providers/__tests__/',
    'audit/Sol_TC20A_Merge_Boundary_7f6f788d.test.ts',
  ],
};
const names = process.argv.slice(2);
if (!names.length) throw new Error('Specify probes, scoring, exports, admin or analytics');
for (const name of names) {
  if (!Object.hasOwn(selections, name)) throw new Error(`Unknown selection: ${name}`);
  console.log(`SOL_INTEGRATED_SELECTION ${name}`);
  const context = await startVitest('test', selections[name], {
    config: false, watch: false, maxWorkers: 1, fileParallelism: false,
    environment: 'node', reporters: ['dot'], silent: true, alias,
    setupFiles: [path.resolve('audit/W1_W3_Offline_Test_Network_Guard.ts')],
    exclude: ['**/node_modules/**', '**/.worktrees/**'],
  });
  if (!context) throw new Error(`Runner did not start: ${name}`);
  await context.close();
}
