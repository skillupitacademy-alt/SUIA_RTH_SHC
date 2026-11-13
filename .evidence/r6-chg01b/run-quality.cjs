const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const pnpm = path.join(os.homedir(), 'AppData/Roaming/npm/node_modules/pnpm/bin/pnpm.cjs');
const tests = [
  'src/lib/student-auth.test.ts', 'src/lib/student-auth-callers.test.ts', 'src/lib/student-auth-token-contract.test.ts',
  'src/lib/__tests__/current-learner-session.test.ts', 'src/lib/__tests__/read-fallback-boundary.test.ts',
  'src/__tests__/proxy.test.ts', 'src/app/api/__tests__/routes.test.ts',
  'src/app/api/student/__tests__/private-cache.test.ts',
  'src/app/api/tutorial/progress/route.test.ts', 'src/app/api/tutorial/ils/block-completion/route.test.ts',
  'src/app/api/tutorial/ils/navigation/[nodeId]/__tests__/boundary.test.ts',
  'src/app/api/tutorial/ils/subtopic/[subtopicId]/progress/__tests__/boundary.test.ts',
];
const results = [];
for (const [name, args] of [
  ['targeted-final', ['--filter', '@quiz/skillup-web', 'exec', 'vitest', 'run', ...tests, '--pool=threads', '--maxWorkers=1', '--reporter=verbose']],
  ['typecheck-final', ['--filter', '@quiz/skillup-web', 'type-check']],
  ['lint-final', ['--filter', '@quiz/skillup-web', 'lint', '--max-warnings=0']],
]) {
  const fd = fs.openSync(path.join(__dirname, name + '.log'), 'w');
  const started = new Date().toISOString();
  const result = spawnSync(process.execPath, [pnpm, ...args], {
    cwd: root, windowsHide: true, timeout: 900000,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', fd, fd],
  });
  fs.closeSync(fd);
  results.push({ name, command: 'pnpm ' + args.join(' '), started, finished: new Date().toISOString(), exitCode: result.status, error: result.error?.code });
  fs.writeFileSync(path.join(__dirname, 'QUALITY_RESULTS.json'), JSON.stringify({ results, boundary: 'Mocked tests and static gates. Shared existing app suites incidentally cover held cases through controlled doubles. No live database/provider calls authorized.' }, null, 2));
  console.log(name + ' exit ' + result.status);
}
if (results.some(result => result.exitCode !== 0)) process.exitCode = 1;
