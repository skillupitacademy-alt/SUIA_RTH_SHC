const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const pnpm = path.join(os.homedir(), 'AppData/Roaming/npm/node_modules/pnpm/bin/pnpm.cjs');
const results = [];
const commands = [
  ['api-final-typecheck', ['--filter', '@quiz/api-server', 'exec', 'tsc', '--noEmit']],
  ['api-final-lint', ['--filter', '@quiz/api-server', 'exec', 'eslint', 'src/modules/exam-engine/exam.engine.ts', 'src/modules/auth/admin-audience.util.ts', '--max-warnings=0']],
  ['api-final-build', ['--filter', '@quiz/api-server', 'build']],
];
for (const [name, args] of commands) {
  const fd = fs.openSync(path.join(__dirname, name + '.log'), 'w');
  const started = new Date().toISOString();
  const result = spawnSync(process.execPath, [pnpm, ...args], {
    cwd: root, windowsHide: true, timeout: 900000,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1', PROJECT_LLM_EXECUTION_MODE: 'isolated_worker', SENTRY_AUTH_TOKEN: '' },
    stdio: ['ignore', fd, fd],
  });
  fs.closeSync(fd);
  results.push({ name, command: 'pnpm ' + args.join(' '), started, finished: new Date().toISOString(), exitCode: result.status, error: result.error?.code });
  fs.writeFileSync(path.join(__dirname, 'API_FINAL_RESULTS.json'), JSON.stringify({ baseline: '62f920f4782b8bbb277f88dc27930cd3b86f1b15', boundary: 'Local quality gates after final exam authorization changes. No Docker image or release.', results }, null, 2));
  console.log(name + ' exit ' + result.status);
}
if (results.some(result => result.exitCode !== 0)) process.exitCode = 1;
