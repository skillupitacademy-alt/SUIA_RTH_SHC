const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const results = [];

async function probe(name, url, method, headers, expected) {
  let result;
  try {
    const response = await fetch(url, { method, headers: { ...headers, 'x-request-id': crypto.randomUUID() },
      ...(method === 'POST' ? { body: '{}' } : {}), redirect: 'manual', signal: AbortSignal.timeout(180000),
    });
    await response.arrayBuffer();
    result = { name, expected, actual: response.status, pass: expected.includes(response.status) };
  } catch (error) { result = { name, expected, actual: null, pass: false, errorType: error.name }; }
  results.push(result);
  console.log(JSON.stringify(result));
  fs.writeFileSync(path.join(__dirname, 'security-http-negative.json'), JSON.stringify({
    timestamp: new Date().toISOString(),
    boundary: 'Actual local HTTP denial probes only. No valid queue signatures or authenticated mutations are sent.', results,
  }, null, 2));
}

async function main() {
  for (const [brand, port] of [['skillup', 3009], ['realtutorialhub', 3003]]) {
    const base = `http://${brand}.localhost:${port}`;
    await probe(`${brand}_forged_identity_headers`, `${base}/api/tutorial/progress`, 'GET', {
      'x-user-id': 'forged', 'x-user-roles': 'super_admin', 'x-brand': brand,
    }, [401]);
    await probe(`${brand}_cross_origin_cookie_mutation`, `${base}/api/tutorial/ils/block-completion`, 'POST', {
      origin: 'https://evil.example', cookie: 'accessToken=invalid-fixture',
      'x-user-roles': 'super_admin', 'content-type': 'application/json',
    }, [403]);
    await probe(`${brand}_same_origin_invalid_token`, `${base}/api/tutorial/ils/block-completion`, 'POST', {
      origin: base, cookie: 'accessToken=invalid-fixture', 'content-type': 'application/json',
    }, [401]);
  }
  await probe('backend_csrf_spoofed_host_substring', 'http://localhost:3000/api/tutorial/progress', 'POST', {
    origin: 'http://localhost.evil.example:3000', cookie: 'csrfToken=synthetic', 'x-csrf-token': 'synthetic',
  }, [403]);
  await probe('shc_cross_origin_mutation', 'http://skillhubcore.localhost:3007/api/auth/login', 'POST', {
    origin: 'https://evil.example', 'content-type': 'application/json',
  }, [403]);
  await probe('fixture_without_authorization', 'http://skillup.localhost:3009/api/auth/test-fixture-session', 'POST', {
    origin: 'http://skillup.localhost:3009', 'content-type': 'application/json',
  }, [403, 503]);
  const workers = ['notify-session-requested', 'notify-session-accepted', 'notify-session-scheduled', 'sync-hierarchy',
    'refresh-weak-areas-view', 'review-project', 'issue-certificate', 'award-project-badge',
    'handle-exam-completed', 'send-remediation-notification', 'index-content-vector'];
  for (const worker of workers) {
    await probe(`worker_${worker}_missing_signature`, `http://realtutorialhub.localhost:3003/api/workers/${worker}`,
      'POST', { 'content-type': 'application/json' }, [401]);
  }
  if (results.some(result => !result.pass)) process.exitCode = 1;
}
main().catch(error => { console.error(error.name); process.exitCode = 1; });
