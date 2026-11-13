const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const pnpm = path.join(os.homedir(), 'AppData/Roaming/npm/node_modules/pnpm/bin/pnpm.cjs');
const results = [];
const commands = [
  ['exam-and-receiver-final', ['--filter', '@quiz/api-server', 'exec', 'vitest', 'run', 'src/modules/exam-engine/__tests__', 'src/app/api/generate-report/__tests__/report-auth.test.ts', '--pool=threads', '--maxWorkers=1', '--reporter=verbose']],
  ['api-typecheck', ['--filter', '@quiz/api-server', 'exec', 'tsc', '--noEmit']],
  ['affected-lint', ['--filter', '@quiz/api-server', 'exec', 'eslint', '--no-ignore', 'src/modules/exam-engine/exam.observer.ts', 'src/modules/exam-engine/__tests__/exam.observer.tail.test.ts', 'src/app/api/generate-report/__tests__/report-auth.test.ts', '--max-warnings=0']],
];
for (const [name, args] of commands) {
  const fd = fs.openSync(path.join(__dirname, name + '.log'), 'w');
  const started = new Date().toISOString();
  const result = spawnSync(process.execPath, [pnpm, ...args], {
    cwd: root, windowsHide: true, timeout: 900000,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', fd, fd],
  });
  fs.closeSync(fd);
  results.push({ name, command: 'pnpm ' + args.join(' '), started, finished: new Date().toISOString(), exitCode: result.status, error: result.error?.code });
  fs.writeFileSync(path.join(__dirname, 'QUALITY_RESULTS.json'), JSON.stringify({ provenance: 'Owner-reported be6d1f1430304187792841ed9852616661b89a90; local file hashes in baseline.json. All HTTP in these tests is mocked.', results }, null, 2));
  console.log(name + ' exit ' + result.status);
}
if (results.some(result => result.exitCode !== 0)) process.exitCode = 1;
