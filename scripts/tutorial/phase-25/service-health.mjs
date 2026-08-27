#!/usr/bin/env node

/**
 * Phase 2.5 — Service Health Check
 * 
 * Verifies that required services are running:
 * - API Server (3000)
 * - API Gateway (8787)
 * - SkillHubCore Admin (3007)
 */

const SERVICES = [
  {
    name: 'API Server',
    url: 'http://127.0.0.1:3000/api/shc/auth/me',
    expected: [401, 200], // 401 without auth is OK
  },
  {
    name: 'API Gateway',
    url: 'http://127.0.0.1:8787/api/shc/auth/me',
    expected: [401, 200], // 401 without auth is OK
  },
  {
    name: 'SkillHubCore Admin',
    url: 'http://127.0.0.1:3007/tools/tutorial-page-content',
    expected: [200, 302, 401], // May redirect or require auth
  },
];

async function checkService(service) {
  try {
    const response = await fetch(service.url, {
      method: 'GET',
      redirect: 'manual', // Don't follow redirects
    });

    const status = response.status;
    const isExpected = service.expected.includes(status);

    return {
      name: service.name,
      url: service.url,
      status,
      ok: isExpected,
      message: isExpected
        ? `✅ RUNNING (HTTP ${status})`
        : `✗ UNEXPECTED (HTTP ${status}, expected: ${service.expected.join(' or ')})`,
    };
  } catch (error) {
    return {
      name: service.name,
      url: service.url,
      status: null,
      ok: false,
      message: `✗ NOT RUNNING (${error.message})`,
    };
  }
}

async function main() {
  console.log('');
  console.log('═'.repeat(60));
  console.log('PHASE 2.5 — SERVICE HEALTH CHECK');
  console.log('═'.repeat(60));
  console.log('');

  const results = await Promise.all(SERVICES.map(checkService));

  for (const result of results) {
    console.log(`${result.name}:`);
    console.log(`  URL: ${result.url}`);
    console.log(`  ${result.message}`);
    console.log('');
  }

  const allOk = results.every((r) => r.ok);

  console.log('═'.repeat(60));
  if (allOk) {
    console.log('✅ ALL SERVICES RUNNING');
  } else {
    console.log('✗ SOME SERVICES NOT RUNNING');
    console.log('');
    console.log('To start services:');
    console.log('  pnpm --filter @quiz/api-server dev');
    console.log('  pnpm --filter @quiz/api-gateway dev');
    console.log('  pnpm --filter @quiz/skillhubcore-admin dev');
  }
  console.log('═'.repeat(60));
  console.log('');

  process.exit(allOk ? 0 : 1);
}

main().catch((error) => {
  console.error('');
  console.error('SERVICE HEALTH CHECK FAILED');
  console.error(error.message);
  process.exit(1);
});
