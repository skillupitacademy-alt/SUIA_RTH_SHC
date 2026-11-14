const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const root = process.cwd();
const stateFile = '.local-secrets/r6-e2e-runtime.json';
const state = JSON.parse(fs.readFileSync(stateFile));
const ports = { api: 3300, gateway: 8887, skillhubcore: 3307, skillup: 3309, realtutorialhub: 3303 };
const origin = brand => `http://${brand}.localhost:${ports[brand]}`;
const secret = () => crypto.randomBytes(32).toString('hex');
const commonSecret = secret();
const initialBrand = process.env.R6_E2E_BRAND || 'skillhubcore';
if (!['skillhubcore', 'skillup', 'realtutorialhub'].includes(initialBrand)) throw new Error('Invalid initial browser brand');
const common = {
  ...process.env, NODE_ENV: 'development', NEXT_TELEMETRY_DISABLED: '1',
  PROJECT_LLM_EXECUTION_MODE: 'isolated_worker', LOG_LEVEL: 'silent',
  JWT_SECRET: secret(), ADMIN_JWT_SECRET: secret(), JWT_REFRESH_SECRET: secret(),
  INTERNAL_API_SECRET: commonSecret, INTERNAL_GATEWAY_SECRET: commonSecret,
  GATEWAY_TRUST_SECRET: commonSecret, INTERNAL_API_KEY: secret(),
  QUEUE_ENABLED: 'false', DISABLE_BACKGROUND_WORKERS: 'true',
  NEXT_PUBLIC_API_URL: '/api', NEXT_PUBLIC_ADMIN_URL: origin('skillhubcore'),
  GATEWAY_URL: `http://127.0.0.1:${ports.gateway}`,
  API_GATEWAY_URL: `http://127.0.0.1:${ports.gateway}`,
  INTERNAL_API_URL: `http://127.0.0.1:${ports.api}/api`,
  SHC_IDENTITY_SERVICE_URL: `http://127.0.0.1:${ports.gateway}`,
  ALLOWED_ORIGINS: ['skillhubcore', 'skillup', 'realtutorialhub'].map(origin).join(','),
  TEST_SAFETY_MODE: 'true',
  SHC_ADMIN_ORIGIN: origin('skillhubcore'),
};
for (const key of Object.keys(common)) {
  if (/DATABASE|UPSTASH|QSTASH|REDIS|SMTP|RESEND|GEMINI|OPENAI|SENTRY|R6_NEON_TEST_URL/.test(key)) delete common[key];
}
const bindings = [['main', 'DATABASE_URL'], ['people', 'DATABASE_URL_PEOPLE'], ['skillup', 'DATABASE_URL_SKILLUP'], ['realtutorialhub', 'DATABASE_URL_RTH'], ['tutorial', 'DATABASE_URL_TUTORIAL']];
for (const [kind, key] of bindings) {
  const url = new URL(state.databases[kind]);
  if (url.hostname !== 'ep-fragrant-brook-a1mhx5dm.ap-southeast-1.aws.neon.tech' || !url.pathname.startsWith('/' + state.run + '_')) throw new Error('Unexpected isolated binding');
  common[key] = url.toString();
  common[key.replace('DATABASE_URL', 'DATABASE_DIRECT_URL')] = url.toString();
}
common.SKILLHUBCORE_DATABASE_URL = state.databases.tutorial;
common.SKILLHUBCORE_DATABASE_DIRECT_URL = state.databases.tutorial;
state.ports = ports;
state.runtimeEnv = common;
state.origins = Object.fromEntries(['skillhubcore', 'skillup', 'realtutorialhub'].map(brand => [brand, origin(brand)]));
const backend = `http://127.0.0.1:${ports.api}`;
state.gatewayBindings = {
  ENVIRONMENT: 'development', JWT_SECRET: common.JWT_SECRET, ADMIN_JWT_SECRET: common.ADMIN_JWT_SECRET,
  INTERNAL_GATEWAY_SECRET: commonSecret, EXAM_SERVICE_URL: backend,
  TUTORIAL_SERVICE_URL: backend + '/api', SKILLHUBCORE_URL: backend,
  QUIZ_WEB_URL: backend, SKILLUP_WEB_URL: origin('skillup'), SKILLUP_ADMIN_URL: origin('skillhubcore'),
  RTH_ADMIN_URL: origin('skillhubcore'), SKILLHUBCORE_ADMIN_URL: origin('skillhubcore'),
  FACULTY_URL: 'http://127.0.0.1:1', STUDENT_FACULTY_URL: 'http://127.0.0.1:1',
  PAYMENT_SERVICE_URL: 'http://127.0.0.1:1', CRM_SERVICE_URL: 'http://127.0.0.1:1',
  NOTIFICATION_URL: backend, PLACEMENT_URL: 'http://127.0.0.1:1',
};
const save = () => fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
function ensureFree(port) { return new Promise((resolve, reject) => { const s = net.createServer(); s.once('error', reject); s.listen(port, '127.0.0.1', () => s.close(resolve)); }); }
function spawnOwned(name, args, cwd, env) {
  const fd = fs.openSync(path.join(root, '.evidence/r6-e2e', name + '.log'), 'a');
  const child = spawn(process.execPath, args, { cwd, env, detached: true, windowsHide: true, stdio: ['ignore', fd, fd] });
  child.unref(); fs.closeSync(fd); state.processes.push({ name, pid: child.pid }); save();
}
(async () => {
  for (const port of Object.values(ports)) await ensureFree(port);
  for (const [app, brand, port] of [['api-server', null, ports.api], ['skillhubcore-admin', 'skillhubcore', ports.skillhubcore], ['skillup-web', 'skillup', ports.skillup], ['realtutorialhub-web', 'realtutorialhub', ports.realtutorialhub]]) {
    const from = path.join(root, 'apps', app);
    const to = path.join(root, 'apps', '.r6-e2e-' + state.run + '-' + app);
    fs.mkdirSync(to); state.copies.push(to); save();
    fs.cpSync(path.join(from, 'src'), path.join(to, 'src'), { recursive: true });
    if (fs.existsSync(path.join(from, 'scripts'))) fs.cpSync(path.join(from, 'scripts'), path.join(to, 'scripts'), { recursive: true });
    if (fs.existsSync(path.join(from, 'public'))) fs.cpSync(path.join(from, 'public'), path.join(to, 'public'), { recursive: true });
    if (fs.existsSync(path.join(from, 'messages'))) fs.cpSync(path.join(from, 'messages'), path.join(to, 'messages'), { recursive: true });
    for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
      if (entry.isFile() && /\.(json|mjs|cjs|js|ts)$/.test(entry.name)) fs.copyFileSync(path.join(from, entry.name), path.join(to, entry.name));
    }
    fs.symlinkSync(path.join(from, 'node_modules'), path.join(to, 'node_modules'), 'junction');
    const env = { ...common, ...(brand ? { NEXT_PUBLIC_WEB_APP_URL: origin(brand), NEXT_PUBLIC_LOGIN_URL: origin(brand) + '/login' } : {}) };
    if (brand === null || brand === initialBrand) {
      spawnOwned(app, [path.join(root, 'node_modules/next/dist/bin/next'), 'dev', '--webpack', '-p', String(port), '-H', '0.0.0.0'], to, env);
    }
  }
  save();
  spawnOwned('gateway', [path.join(root, 'node_modules/tsx/dist/cli.mjs'), '--tsconfig', 'services/api-gateway/tsconfig.json', '.evidence/r6-e2e/gateway.cts'], root, common);
  fs.writeFileSync('.evidence/r6-e2e/ISOLATED_PROCESSES.json', JSON.stringify({ run: state.run, ports, origins: state.origins, processes: state.processes, allDatabaseEndpoints: 'ep-fragrant-brook-a1mhx5dm', protectedProcessesModified: false }, null, 2));
  console.log('Isolated localhost process group started');
})().catch(() => { console.error('Isolated process setup failed; diagnostic sanitized'); process.exitCode = 1; });
