import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

function fileContains(path, needle) {
  if (!existsSync(path)) return false;
  return readFileSync(path, 'utf8').includes(needle);
}

const rows = [
  {
    app: '@quiz/api-server',
    proxyPath: 'apps/api-server/src/proxy.ts',
    appType: 'api-server',
    mutationPath: 'cross-subdomain via shared api-client',
    serverSideCsrfOwner: 'api-server',
    risk: 'fixed',
    status: 'fixed',
    notes: [
      'Owns CSRF issuance and validation for realtutorialhub cross-subdomain API writes.',
      'Now reissues csrfToken on the resolved shared parent domain.',
      'Live production verified: domain save and question save succeed after deploy.',
    ],
  },
  {
    app: '@quiz/realtutorialhub-admin',
    proxyPath: 'apps/realtutorialhub-admin/src/proxy.ts',
    appType: 'frontend-admin',
    mutationPath: 'cross-subdomain via shared api-client',
    serverSideCsrfOwner: 'api-server',
    risk: 'fixed',
    status: 'fixed',
    notes: [
      'Uses shared api-client for admin mutations against api.realtutorialhub.com.',
      'No app-local CSRF middleware required in frontend proxy.',
      'Covered by shared fetch-client retry and api-server cookie-domain fix.',
    ],
  },
  {
    app: '@quiz/realtutorialhub-quiz',
    proxyPath: 'apps/realtutorialhub-quiz/src/proxy.ts',
    appType: 'frontend-user',
    mutationPath: 'cross-subdomain via shared api-client',
    serverSideCsrfOwner: 'api-server',
    risk: 'medium',
    status: 'audited-no-change',
    notes: [
      'User exam/report mutations use shared api-client against api.realtutorialhub.com.',
      'Shared fetch-client CSRF recovery already applies here.',
      'No separate frontend proxy CSRF issuance layer exists or is needed.',
    ],
  },
  {
    app: '@quiz/realtutorialhub-web',
    proxyPath: 'apps/realtutorialhub-web/src/proxy.ts',
    appType: 'frontend-user',
    mutationPath: 'direct auth/public api only',
    serverSideCsrfOwner: 'none',
    risk: 'low',
    status: 'audited-no-change',
    notes: [
      'Direct browser posts are mostly auth/public endpoints or same-origin local API routes.',
      'No matching cross-subdomain save workflow needing the api-server CSRF middleware pattern was found.',
    ],
  },
  {
    app: '@quiz/skillup-admin',
    proxyPath: 'apps/skillup-admin/src/proxy.ts',
    appType: 'frontend-admin',
    mutationPath: 'same-origin app api routes',
    serverSideCsrfOwner: 'app-local',
    risk: 'low',
    status: 'audited-no-change',
    notes: [
      'Browser save forms post to same-origin /api/admin/* routes in the app itself.',
      'This is not the same cross-subdomain CSRF drift path seen in realtutorialhub-admin.',
      'No per-app proxy CSRF patch copied from api-server is required.',
    ],
  },
  {
    app: '@quiz/skillhubcore-admin',
    proxyPath: 'apps/skillhubcore-admin/src/proxy.ts',
    appType: 'frontend-admin',
    mutationPath: 'same-origin app api routes',
    serverSideCsrfOwner: 'app-local',
    risk: 'low',
    status: 'audited-no-change',
    notes: [
      'Uses same-origin app API routes and skillhubcore-specific auth cookies.',
      'Did not match the realtutorialhub cross-subdomain CSRF cookie drift pattern.',
    ],
  },
  {
    app: '@quiz/faculty-app',
    proxyPath: 'apps/faculty-app/src/proxy.ts',
    appType: 'frontend-faculty',
    mutationPath: 'same-origin app api routes',
    serverSideCsrfOwner: 'app-local',
    risk: 'low',
    status: 'audited-no-change',
    notes: [
      'Interactive mutations go through same-origin /api/faculty/* handlers.',
      'Upstream relay happens server-to-server, not as browser cross-subdomain saves.',
    ],
  },
  {
    app: '@quiz/skillup-web',
    proxyPath: 'apps/skillup-web/src/proxy.ts',
    appType: 'frontend-user',
    mutationPath: 'direct auth/public api only',
    serverSideCsrfOwner: 'none',
    risk: 'low',
    status: 'audited-no-change',
    notes: [
      'Protected student routes are same-origin app routes; public auth routes are cross-subdomain but auth-exempt.',
      'No matching cross-subdomain CSRF save bug found in the student portal audit.',
    ],
  },
  {
    app: '@quiz/skillhub-placement',
    proxyPath: 'apps/skillhub-placement/src/proxy.ts',
    appType: 'frontend-placement',
    mutationPath: 'direct auth/public api only',
    serverSideCsrfOwner: 'none',
    risk: 'none',
    status: 'not-applicable',
    notes: [
      'Current browser flow is primarily auth handoff and placement bridge setup.',
      'No comparable save workflow using shared api-client cross-subdomain CSRF path was found.',
    ],
  },
];

const output = {
  generatedAt: new Date().toISOString(),
  summary: {
    fixed: rows.filter((row) => row.status === 'fixed').map((row) => row.app),
    auditedNoChange: rows.filter((row) => row.status === 'audited-no-change').map((row) => row.app),
    notApplicable: rows.filter((row) => row.status === 'not-applicable').map((row) => row.app),
  },
  sharedClientCsrfRecoveryPresent: fileContains(
    resolve(root, 'packages/api-client/src/core/fetch-client.ts'),
    'retryWithFreshCsrfToken',
  ),
  apiServerSharedDomainFixPresent: fileContains(
    resolve(root, 'apps/api-server/src/proxy.ts'),
    'setCsrfToken(response, requestHostname)',
  ),
  rows,
};

console.log(JSON.stringify(output, null, 2));
