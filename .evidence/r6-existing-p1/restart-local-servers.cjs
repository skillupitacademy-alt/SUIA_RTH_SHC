const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const net = require('node:net');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const pnpm = path.join(os.homedir(), 'AppData/Roaming/npm/node_modules/pnpm/bin/pnpm.cjs');
const configured = require('dotenv').parse(fs.readFileSync(path.join(root, 'apps/api-server/.env.local')));
const apps = [
  ['api-server', 3000, 'localhost'],
  ['skillhubcore-admin', 3007, 'skillhubcore.localhost'],
  ['skillup-web', 3009, 'skillup.localhost'],
  ['realtutorialhub-web', 3003, 'realtutorialhub.localhost'],
];
const localOrigins = apps.filter(([app]) => app !== 'api-server').map(([, port, host]) => `http://${host}:${port}`);
const allowedOrigins = [...new Set([...(configured.ALLOWED_ORIGINS || '').split(',').filter(Boolean), ...localOrigins])].join(',');
const selected = process.env.R6_START_APPS?.split(',');
function listening(port) {
  return new Promise(resolve => {
    const socket = net.connect({ port, host: '127.0.0.1' });
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('error', () => resolve(false));
  });
}
(async () => {
  const results = [];
  for (const [app, port, host] of apps) {
    if (selected && !selected.includes(app)) continue;
    if (await listening(port)) {
      results.push({ app, port, alreadyListening: true });
      continue;
    }
    const fd = fs.openSync(path.join(__dirname, app + '-dev-final.log'), 'a');
    const child = spawn(process.execPath, [pnpm, '--filter', '@quiz/' + app, 'dev'], {
      cwd: root, windowsHide: true, detached: true, stdio: ['ignore', fd, fd],
      env: {
        ...process.env, NEXT_TELEMETRY_DISABLED: '1', ALLOWED_ORIGINS: allowedOrigins,
        ...(app === 'api-server' ? {} : { NEXT_PUBLIC_WEB_APP_URL: `http://${host}:${port}`, NEXT_PUBLIC_LOGIN_URL: `http://${host}:${port}/login` }),
      },
    });
    child.unref();
    fs.closeSync(fd);
    results.push({ app, port, pid: child.pid, url: `http://${host}:${port}` });
  }
  fs.writeFileSync(path.join(__dirname, 'local-server-restart-' + (selected ? 'selected' : 'all') + '.json'), JSON.stringify({ started: new Date().toISOString(), results, boundary: 'Authorized local development processes and ephemeral canonical localhost origin configuration.' }, null, 2));
  console.log(results);
})().catch(error => { console.error({ name: error.name, code: error.code }); process.exitCode = 1; });
