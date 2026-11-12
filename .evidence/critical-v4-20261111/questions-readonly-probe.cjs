const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const dotenv = require('dotenv');
const { Pool, neonConfig } = require('@neondatabase/serverless');
neonConfig.webSocketConstructor = require('ws');

const evidenceDirectory = __dirname;
const root = path.resolve(evidenceDirectory, '../..');
const fixtureEmail = process.env.SHC_VERIFICATION_EMAIL;
if (!fixtureEmail) throw new Error('SHC_VERIFICATION_EMAIL is required');

function environment(directory) {
  const values = {};
  for (const name of ['.env', '.env.local']) {
    const filename = path.join(root, directory, name);
    if (fs.existsSync(filename)) Object.assign(values, dotenv.parse(fs.readFileSync(filename)));
  }
  return values;
}

const rootEnv = environment('.');
const shcEnv = environment('apps/skillhubcore-admin');
const secret = shcEnv.ADMIN_JWT_SECRET || shcEnv.JWT_SECRET;
if (!secret) throw new Error('Configured SHC signing secret is required');
const results = [];

async function probe(name, url, headers, expectedStatus, validateBody) {
  const requestId = crypto.randomUUID();
  let outcome;
  try {
    const response = await fetch(url, {
      headers: { ...headers, 'x-request-id': requestId },
      redirect: 'manual',
      signal: AbortSignal.timeout(120000),
    });
    const text = await response.text();
    let body;
    try { body = JSON.parse(text); } catch { body = null; }
    const items = Array.isArray(body?.data) ? body.data : body?.data?.data;
    const bodyValid = validateBody ? validateBody(body) : true;
    const rawCode = body?.code || body?.error?.code;
    outcome = {
      name, requestId, expectedStatus, actualStatus: response.status,
      pass: response.status === expectedStatus && bodyValid,
      bodyValid,
      responseRequestId: response.headers.get('x-request-id'),
      cacheControl: response.headers.get('cache-control'),
      json: body !== null,
      questionCount: Array.isArray(items) ? items.length : undefined,
      code: typeof rawCode === 'string' && /^[A-Z_0-9]{1,50}$/.test(rawCode) ? rawCode : undefined,
    };
  } catch (error) {
    outcome = { name, requestId, expectedStatus, actualStatus: null, pass: false, errorType: error.name };
  }
  results.push(outcome);
  console.log(JSON.stringify(outcome));
  fs.writeFileSync(path.join(evidenceDirectory, 'questions-readonly-results.json'), JSON.stringify({
    head: 'f245e11ee5584018a0f751080595192325e74ee6',
    generatedAt: new Date().toISOString(),
    boundary: 'Actual local HTTP BFF, gateway, identity and backend. Existing owner-designated administrator. Short-lived signed probes held in memory. Read-only identity SELECT. No login or resource mutation calls.',
    results,
  }, null, 2));
  return outcome;
}

async function main() {
  const { SignJWT } = await import('jose');
  const pool = new Pool({
    connectionString: rootEnv.DATABASE_DIRECT_URL_PEOPLE || rootEnv.DATABASE_URL_PEOPLE,
    connectionTimeoutMillis: 10000, max: 1,
  });
  let account;
  const client = await pool.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    await client.query("SET LOCAL statement_timeout = '10000ms'");
    const response = await client.query(
      "SELECT id, role, is_active, platform FROM users WHERE email = $1 AND platform = 'skillhubcore' AND deleted_at IS NULL LIMIT 1",
      [fixtureEmail],
    );
    account = response.rows[0];
  } finally {
    await client.query('ROLLBACK');
    client.release();
    await pool.end();
  }
  if (!account || !account.is_active || !['admin', 'super_admin'].includes(account.role)) {
    throw new Error('The owner-designated account is not an active SHC administrator');
  }
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    userId: account.id, originalUserId: account.id, shadowUserId: account.id,
    roles: [account.role], isAdmin: true, tokenType: 'admin', brand: 'skillhubcore',
    iss: 'skillhubcore.in', aud: 'shc-admin', iat: now, exp: now + 600,
  };
  const sign = overrides => new SignJWT({ ...claims, ...overrides })
    .setProtectedHeader({ alg: 'HS256' }).sign(new TextEncoder().encode(secret));
  const token = await sign({});
  const headers = { Authorization: `Bearer ${token}`, Cookie: `accessToken=${token}; admin_accessToken=${token}` };
  const validIdentity = body => {
    const user = body?.user || body?.data?.user;
    return user?.id === account.id && user?.isActive === true && user?.isAdmin === true && user?.role === account.role;
  };
  const validQuestions = body => Array.isArray(body?.data) && body.data.length <= 1 && typeof body.total === 'number';
  await probe('backend_current_admin', 'http://localhost:3000/api/shc/auth/me', headers, 200, validIdentity);
  const gateway = process.env.SHC_VERIFICATION_GATEWAY || 'http://127.0.0.1:8787';
  await probe('gateway_current_admin', `${gateway}/api/shc/auth/me`, {
    ...headers, 'x-forwarded-host': 'admin.skillhubcore.in', 'x-original-host': 'admin.skillhubcore.in',
    'x-brand': 'skillhubcore', 'x-internal-secret': shcEnv.INTERNAL_GATEWAY_SECRET,
  }, 200, validIdentity);

  const trustedHeaders = {
    ...headers, 'x-portal-identity': 'shc-admin', 'x-original-host': 'admin.skillhubcore.in',
    'x-forwarded-host': 'admin.skillhubcore.in', 'x-brand': 'skillhubcore',
    'x-internal-secret': shcEnv.INTERNAL_GATEWAY_SECRET,
  };
  await probe('backend_questions_signed_admin', 'http://localhost:3000/api/admin/questions?limit=1', trustedHeaders, 200, validQuestions);
  await probe('gateway_questions_signed_admin', `${gateway}/api/admin/questions?limit=1`, trustedHeaders, 200, validQuestions);

  const questionUrl = 'http://skillhubcore.localhost:3007/api/admin/questions?limit=1';
  await probe('questions_current_admin', questionUrl, headers, 200, validQuestions);
  const adminToken = await sign({ roles: ['admin'] });
  await probe('questions_admin_role', questionUrl, { Cookie: `accessToken=${adminToken}` }, 200, validQuestions);
  await probe('questions_anonymous', questionUrl, {}, 401);
  await probe('questions_forged_headers_without_cookie', questionUrl, {
    'x-user-id': account.id, 'x-user-roles': 'super_admin', 'x-brand': 'skillhubcore',
    'x-portal-identity': 'shc-admin', 'x-gateway-secret': 'forged',
  }, 401);
  const cases = [
    ['signed_student_role', { roles: ['student'], isAdmin: false }, 403],
    ['wrong_audience', { aud: 'admin' }, 401],
    ['wrong_brand', { brand: 'realtutorialhub' }, 401],
    ['wrong_token_class', { tokenType: 'user' }, 401],
    ['expired', { exp: now - 60 }, 401],
    ['inactive_token', { isActive: false }, 401],
    ['unknown_account', { userId: crypto.randomUUID(), originalUserId: crypto.randomUUID() }, 401],
  ];
  for (const [name, overrides, expected] of cases) {
    const negativeToken = await sign(overrides);
    await probe(`questions_${name}`, questionUrl, {
      Cookie: `accessToken=${negativeToken}`,
      'x-user-roles': 'super_admin', 'x-portal-identity': 'shc-admin',
    }, expected);
  }
  const parts = token.split('.');
  parts[2] = (parts[2][0] === 'A' ? 'B' : 'A') + parts[2].slice(1);
  await probe('questions_invalid_signature', questionUrl, { Cookie: `accessToken=${parts.join('.')}` }, 401);
  if (results.some(result => !result.pass)) process.exitCode = 1;
}

main().catch(error => {
  console.error(JSON.stringify({ stage: 'probe_setup', errorType: error.name }));
  process.exitCode = 1;
});
