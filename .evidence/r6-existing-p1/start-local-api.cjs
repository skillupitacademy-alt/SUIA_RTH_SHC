const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const configured = require('dotenv').parse(fs.readFileSync(path.join(root, 'apps/api-server/.env.local')));
const localOrigins = ['http://skillhubcore.localhost:3007', 'http://skillup.localhost:3009', 'http://realtutorialhub.localhost:3003'];
const origins = [...new Set([...(configured.ALLOWED_ORIGINS || '').split(',').filter(Boolean), ...localOrigins])];
const log = fs.openSync(path.join(__dirname, 'api-local-dev.log'), 'a');
const child = spawn(process.execPath, [path.join(os.homedir(), 'AppData/Roaming/npm/node_modules/pnpm/bin/pnpm.cjs'), '--filter', '@quiz/api-server', 'dev'], {
  cwd: root,
  windowsHide: true,
  detached: true,
  stdio: ['ignore', log, log],
  env: { ...process.env, ALLOWED_ORIGINS: origins.join(','), NEXT_TELEMETRY_DISABLED: '1' },
});
child.unref();
fs.closeSync(log);
fs.writeFileSync(path.join(__dirname, 'api-local-runtime-config.json'), JSON.stringify({ pid: child.pid, started: new Date().toISOString(), localOrigins, boundary: 'Ephemeral local process environment only. Existing configured origins retained. No environment file or deployment configuration edited.' }, null, 2));
console.log('Started local API process', child.pid);
