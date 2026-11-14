const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const dotenv = require('dotenv');

async function main() {
  const { SignJWT } = await import('jose');
  const environment = dotenv.parse(fs.readFileSync(path.resolve('.env.local')));
  const secret = environment.ADMIN_JWT_SECRET || environment.JWT_SECRET;
  if (typeof secret !== 'string' || secret.length === 0) throw new Error('Signing configuration unavailable');
  const identity = crypto.randomUUID();
  const token = await new SignJWT({
    userId: identity, originalUserId: identity, shadowUserId: identity,
    email: 'expired-control@example.invalid', roles: ['admin'], isAdmin: true,
    tokenType: 'admin', brand: 'skillhubcore', sessionBinding: 'a'.repeat(64),
  }).setProtectedHeader({ alg: 'HS256' }).setIssuer('skillhubcore.in')
    .setAudience('shc-admin').setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
    .setExpirationTime(Math.floor(Date.now() / 1000) - 120)
    .sign(new TextEncoder().encode(secret));
  const origin = 'http://skillhubcore.localhost:3007';
  const result = {
    capturedUtc: new Date().toISOString(), origin,
    boundary: 'Actual localhost GET requests with an expired synthetic-principal credential. No login, session creation or database mutation.',
    checks: [],
  };
  for (const route of ['/dashboard', '/api/admin/auth/me', '/api/admin/domains']) {
    const response = await fetch(origin + route, {
      headers: { cookie: `accessToken=${token}; admin_accessToken=${token}` },
      redirect: 'manual', signal: AbortSignal.timeout(45000),
    });
    await response.arrayBuffer();
    const location = response.headers.get('location');
    const redirectPath = location ? new URL(location, origin).pathname : null;
    const pass = route === '/dashboard'
      ? [302, 303, 307, 308].includes(response.status) && redirectPath === '/login'
      : response.status === 401;
    result.checks.push({ route, status: response.status, redirectPath, pass });
  }
  fs.writeFileSync(path.resolve('.evidence/r6-shc-revocation/EXPIRY_LOCALHOST_RESULTS.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
  if (result.checks.some(check => !check.pass)) process.exitCode = 1;
}
main().catch(() => {
  console.error('Sanitized localhost expiry control failed');
  process.exitCode = 1;
});
