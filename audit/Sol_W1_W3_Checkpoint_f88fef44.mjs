// Independent, offline Sol review runner. No application environment files are loaded.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { startVitest } from 'vitest/node';

for (const key of Object.keys(process.env)) {
  if (/DATABASE|DIRECT_URL|REDIS|UPSTASH|NEON|QSTASH/.test(key)) delete process.env[key];
}
const aliases = (app) => {
  const base = path.resolve('apps', app);
  const config = JSON.parse(readFileSync(path.join(base, 'tsconfig.json'), 'utf8'));
  return Object.entries(config.compilerOptions.paths)
    .sort(([a], [b]) => b.length - a.length)
    .map(([key, targets]) => ({
      find: new RegExp(`^${key.split('*').map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('(.*)')}$`),
      replacement: path.resolve(base, targets[0].replace('*', '$1')).replaceAll('\\', '/'),
    }));
};
const selections = {
  boundary: {
    app: 'skillup-admin', files: [
      'packages/auth/src/rbac/__tests__/sol-fnd03-tenant-boundary.test.ts',
      'packages/auth/src/rbac/__tests__/ownership.service.test.ts',
      'apps/skillup-admin/src/app/api/admin/crm/enquiries/[id]/admit/__tests__/collision.test.ts',
      'packages/db-people/src/utils/__tests__/email-normalization.test.ts',
      'apps/skillup-web/src/app/__tests__/service-worker-private-cache.test.ts',
      'apps/realtutorialhub-web/src/app/__tests__/service-worker-private-cache.test.ts',
    ],
  },
  placement: {
    app: 'skillup-web', files: [
      'apps/skillup-web/src/lib/__tests__/placement-http-truth.test.ts',
      'apps/skillup-web/src/lib/__tests__/placement-zero-control.test.ts',
      'apps/skillup-web/src/app/api/__tests__/routes.test.ts',
    ],
  },
  nested: {
    app: 'skillhubcore-admin', files: [
      'packages/types/src/tutorial-rich-document/__tests__/nested-schema-compatibility.test.ts',
      'apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/document/__tests__/storage-preparation-truth.test.ts',
    ],
  },
  analytics: {
    app: 'skillup-web', files: [
      'packages/marketing-site/src/lib/analytics/providers/__tests__/internal-http-failure.test.ts',
    ],
  },
};
const requested = process.argv.slice(2);
const names = requested.length ? requested : Object.keys(selections);
for (const name of names) {
  if (!Object.hasOwn(selections, name)) throw new Error(`Unknown review selection: ${name}`);
  const selection = selections[name];
  console.log(`SOL_REVIEW_SELECTION ${name}`);
  const context = await startVitest('test', selection.files, {
    config: false, watch: false, maxWorkers: 1, fileParallelism: false,
    environment: 'node', reporters: ['dot'], silent: true,
    setupFiles: [path.resolve('audit/W1_W3_Offline_Test_Network_Guard.ts')],
    exclude: ['**/node_modules/**', '**/.worktrees/**'],
    alias: aliases(selection.app),
  });
  if (!context) throw new Error(`Review runner did not start: ${name}`);
  await context.close();
}
