const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const pnpm = path.join(os.homedir(), 'AppData/Roaming/npm/node_modules/pnpm/bin/pnpm.cjs');
const fd = fs.openSync(path.join(__dirname, 'api-build.log'), 'w');
const started = new Date().toISOString();
const result = spawnSync(process.execPath, [pnpm, '--filter', '@quiz/api-server', 'build'], {
  cwd: root, windowsHide: true, timeout: 900000,
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1', PROJECT_LLM_EXECUTION_MODE: 'isolated_worker', SENTRY_AUTH_TOKEN: '' },
  stdio: ['ignore', fd, fd],
});
fs.closeSync(fd);
fs.writeFileSync(path.join(__dirname, 'BUILD_RESULT.json'), JSON.stringify({
  command: 'pnpm --filter @quiz/api-server build', started, finished: new Date().toISOString(),
  exitCode: result.status, error: result.error?.code,
  boundary: 'Local production compile only. Existing Project LLM isolated execution setting and empty Sentry upload credential prevent provider execution/upload. No database commands, Docker image or deployment.',
}, null, 2));
console.log('API build exit', result.status);
if (result.status !== 0) process.exitCode = 1;
