const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const evidence = __dirname;
const env = {
  ...process.env, NEXT_TELEMETRY_DISABLED: '1', NODE_ENV: 'test',
  JWT_SECRET: crypto.randomBytes(32).toString('hex'),
  JWT_REFRESH_SECRET: crypto.randomBytes(32).toString('hex'),
  ADMIN_JWT_SECRET: crypto.randomBytes(32).toString('hex'),
  PROJECT_LLM_EXECUTION_MODE: 'isolated_worker', SENTRY_AUTH_TOKEN: '',
};
for (const key of Object.keys(env)) {
  if (/DATABASE|UPSTASH|QSTASH|REDIS|SMTP|RESEND|OPENAI|GEMINI/.test(key)) delete env[key];
}
env.NODE_OPTIONS = `--require=${path.join(root, '.evidence/r6-quality-closure/offline-guard.cjs')}`;
const results = [];
function run(name, script, args, cwd, extra = {}) {
  const started = new Date().toISOString();
  const fd = fs.openSync(path.join(evidence, name + '.log'), 'w');
  const result = spawnSync(process.execPath, [path.join(root, script), ...args], {
    cwd, env: { ...env, ...extra }, windowsHide: true, timeout: name === 'api-build' ? 1200000 : 600000,
    stdio: ['ignore', fd, fd],
  });
  fs.closeSync(fd);
  results.push({ name, command: 'node ' + script + ' ' + args.join(' '), cwd: path.relative(root, cwd), started, finished: new Date().toISOString(), exitCode: result.status, error: result.error?.code });
  fs.writeFileSync(path.join(evidence, 'QUALITY_RESULTS.json'), JSON.stringify({ network: 'Transport blocked by inherited preload', results }, null, 2));
  console.log(name + ' exit ' + result.status);
}
const api = path.join(root, 'apps/api-server');
const people = path.join(root, 'packages/db-people');
if (process.env.R6_BUILD_ONLY !== 'true') {
run('api-typecheck', 'node_modules/typescript/bin/tsc', ['--noEmit'], api);
run('people-typecheck', 'node_modules/typescript/bin/tsc', ['--noEmit', '-p', 'tsconfig.json'], people);
run('api-lint', 'node_modules/eslint/bin/eslint.js', ['--max-warnings=0',
  'src/modules/auth/shc-auth.service.ts', 'src/modules/auth/admin-audience.util.ts',
  'src/app/api/shc/auth/me/route.ts', 'src/app/api/shc/auth/logout/route.ts',
  'src/app/api/shc/auth/login/route.ts',
], api);
run('changed-test-lint', 'node_modules/eslint/bin/eslint.js', ['--no-ignore', '--max-warnings=0',
  'src/modules/auth/__tests__/batch-08-shc-session-binding.test.ts',
  'src/modules/auth/__tests__/batch-08-admin-verification.test.ts',
  'src/modules/auth/__tests__/fixture-02-admin-guard.test.ts',
  'src/app/api/shc/auth/me/__tests__/route.test.ts',
  'src/app/api/shc/auth/logout/__tests__/route.test.ts',
], api);
run('people-test-lint', 'node_modules/eslint/bin/eslint.js', ['--no-ignore', '--max-warnings=0', 'src/__tests__/normalized-email-migration.test.ts'], people);
run('migration-metadata', 'node_modules/drizzle-kit/bin.cjs', ['check'], people);
run('people-build', 'node_modules/typescript/bin/tsc', ['-p', 'tsconfig.json'], people);
}

// A disposable app copy keeps Next output away from the running dev server.
const copy = path.join(root, 'apps', '.r6-shc-build-' + crypto.randomBytes(5).toString('hex'));
fs.mkdirSync(copy);
const dependencies = path.join(copy, 'node_modules');
try {
  fs.symlinkSync(path.join(api, 'node_modules'), dependencies, 'junction');
  fs.cpSync(path.join(api, 'src'), path.join(copy, 'src'), { recursive: true, dereference: true });
  for (const entry of fs.readdirSync(api, { withFileTypes: true })) {
    if (entry.isFile() && /\.(json|mjs|cjs|js|ts)$/.test(entry.name)) fs.copyFileSync(path.join(api, entry.name), path.join(copy, entry.name));
  }
  const config = path.join(copy, 'next.config.mjs');
  fs.writeFileSync(config, fs.readFileSync(config, 'utf8').replace('    compress: true,',
    '    compress: true,\n    experimental: { cpus: 2 },'));
  run('api-build', 'node_modules/next/dist/bin/next', ['build', '--webpack'], copy, { NODE_ENV: 'production' });
} finally {
  if (fs.existsSync(dependencies)) fs.unlinkSync(dependencies);
  const absolute = path.resolve(copy);
  if (!absolute.startsWith(path.join(root, 'apps', '.r6-shc-build-'))) throw new Error('Unexpected cleanup target');
  fs.rmSync(absolute, { recursive: true, force: true });
}
if (results.some(r => r.exitCode !== 0)) process.exitCode = 1;
