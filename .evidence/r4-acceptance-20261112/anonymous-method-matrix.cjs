const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const source = JSON.parse(fs.readFileSync(path.join(root, '.evidence/r3-acceptance-20261112/security-method-inventory.json')));
const resultPath = path.join(__dirname,'anonymous-method-matrix-results.json');
const results = process.env.R4_RESUME === '1' && fs.existsSync(resultPath) ? JSON.parse(fs.readFileSync(resultPath)).results : [];
for (const previous of results) {
  if (previous.sourcePath) continue;
  const template = previous.route.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id');
  previous.sourcePath = source.inventory.find(entry => entry.app === previous.app && entry.method === previous.method &&
    entry.path.split('/src/app')[1].replace(/\/route\.ts$/, '').replace(/\[[^\]]+\]/g, ':id') === template)?.path;
}
const fixtureId = crypto.randomUUID();
const publicAuth = new Set(['login','logout','signup','forgot-password','reset-password','refresh','verify-email']);
function isPublic(route, app) {
  if (route === '/api/health' || route === '/api/healthz') return true;
  if (route.startsWith('/api/programs') || route.startsWith('/api/certificates/verify/')) return true;
  return app !== 'skillhubcore-admin' && route.startsWith('/api/auth/') && publicAuth.has(route.split('/')[3]);
}
async function main() {
  for (const entry of source.inventory) {
    const route = entry.path.split('/src/app')[1].replace(/\/route\.ts$/, '').replace(/\[[^\]]+\]/g, fixtureId);
    if (results.some(result => result.app === entry.app && result.method === entry.method && result.sourcePath === entry.path)) continue;
    if (entry.app === 'skillhubcore-admin' && route.startsWith('/api/marketing')) {
      results.push({ app:entry.app, method:entry.method, route, sourcePath:entry.path, disposition:'HOLD', reason:'Owner Marketing exclusion' });
      continue;
    }
    const [brand,port] = entry.app === 'skillhubcore-admin' ? ['skillhubcore',3007] : entry.app === 'skillup-web' ? ['skillup',3009] : ['realtutorialhub',3003];
    const base = `http://${brand}.localhost:${port}`;
    const publicOperation = isPublic(route, entry.app);
    const record = { app:entry.app, method:entry.method, route, sourcePath:entry.path, publicOperation, expected:publicOperation ? 'Documented public/validation response' : '401/403 or retired 404/410', pass:false };
    try {
      const response = await fetch(base + route, {
        method:entry.method, redirect:'manual', signal:AbortSignal.timeout(120000),
        headers:{origin:base,'content-type':'application/json','x-user-id':fixtureId,'x-original-user-id':fixtureId,'x-user-roles':'super_admin','x-brand':brand,'x-request-id':crypto.randomUUID()},
        ...(['GET','HEAD'].includes(entry.method) ? {} : {body:'{}'}),
      });
      record.actual=response.status;
      record.cacheControl=response.headers.get('cache-control');
      record.pass=publicOperation ? [200,201,204,400,401,403,404,410,422,429].includes(response.status) : [401,403,404,410].includes(response.status);
      await response.body?.cancel();
    } catch(error) {record.error=error.name;}
    results.push(record);
    fs.writeFileSync(path.join(__dirname,'anonymous-method-matrix-results.json'),JSON.stringify({timestamp:new Date().toISOString(),boundary:'Actual local HTTP for every inventoried method except owner-held Marketing. No authentication or service secrets supplied. Forged identity headers, empty mutation bodies and run-random resource IDs only. Public validation is recorded separately. This proves selected anonymous denial behavior, with role/object/session cases covered by separate fixtures.',results},null,2));
    console.log(JSON.stringify(record));
  }
  if(results.some(result=>result.pass===false))process.exitCode=1;
}
main().catch(error=>{console.error(error.name);process.exitCode=1;});
