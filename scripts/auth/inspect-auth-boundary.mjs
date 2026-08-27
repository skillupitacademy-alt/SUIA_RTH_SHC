#!/usr/bin/env node

/**
 * ============================================================================
 * PHASE 1.7
 * COMPLETE AUTHENTICATION / BRAND BOUNDARY INSPECTION
 * ============================================================================
 *
 * READ ONLY
 *
 * Purpose:
 *
 *   Inspect the complete source surrounding:
 *
 *     1. resolveBrandFromHostname()
 *     2. detectRequestBrand()
 *     3. JWT brand validation
 *     4. INTERNAL_GATEWAY_SECRET
 *     5. x-brand
 *     6. x-original-host
 *     7. x-forwarded-host
 *     8. validateAuthState()
 *     9. production hostname resolution
 *    10. gateway authentication middleware ordering
 *    11. BFF -> gateway internal authentication
 *
 * NO FILES ARE MODIFIED.
 * NO GIT CHECKOUT.
 * NO GIT RESET.
 * NO DEPLOYMENT.
 *
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '../..');

function log(message = '') {
  console.log(message);
}

function section(title) {
  log('');
  log('='.repeat(86));
  log(title);
  log('='.repeat(86));
}

function success(message) {
  log(`✓ ${message}`);
}

function warning(message) {
  log(`⚠ ${message}`);
}

function info(message) {
  log(`ℹ ${message}`);
}

function failure(message) {
  log(`✗ ${message}`);
}

function read(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);

  if (!fs.existsSync(absolutePath)) {
    return null;
  }

  return fs.readFileSync(absolutePath, 'utf8');
}

function git(args) {
  try {
    return execFileSync(
      'git',
      args,
      {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    ).trim();
  } catch {
    return '';
  }
}

function printFile(relativePath) {
  const content = read(relativePath);

  if (!content) {
    warning(`File not found: ${relativePath}`);
    return null;
  }

  log('');
  log(`FILE: ${relativePath}`);
  log('-'.repeat(86));
  console.log(content);

  return content;
}

function printMatchingLines(relativePath, terms) {
  const content = read(relativePath);

  if (!content) {
    warning(`File not found: ${relativePath}`);
    return;
  }

  const lines = content.split(/\r?\n/);

  log('');
  log(`FILE: ${relativePath}`);

  for (const term of terms) {
    log('');
    log(`SEARCH: ${term}`);

    let found = false;

    for (let index = 0; index < lines.length; index += 1) {
      if (lines[index].toLowerCase().includes(term.toLowerCase())) {
        found = true;

        const start = Math.max(0, index - 5);
        const end = Math.min(lines.length, index + 6);

        log('');
        log(
          `--- lines ${start + 1}-${end} ---`,
        );

        for (let i = start; i < end; i += 1) {
          log(
            `${String(i + 1).padStart(5, ' ')} | ${lines[i]}`,
          );
        }
      }
    }

    if (!found) {
      warning(`No match for "${term}"`);
    }
  }
}

/**
 * ============================================================================
 * 1. CURRENT WORKING TREE
 * ============================================================================
 */

section('1. CURRENT WORKING TREE');

log(`Repository: ${ROOT}`);

const branch = git([
  'branch',
  '--show-current',
]);

log(`Branch: ${branch || '(detached HEAD)'}`);

const status = git([
  'status',
  '--short',
]);

if (status) {
  warning('Working tree contains changes.');

  for (const line of status.split(/\r?\n/)) {
    if (line.trim()) {
      log(`  ${line}`);
    }
  }
} else {
  success('Working tree clean.');
}

/**
 * ============================================================================
 * 2. COMPLETE AUTH MIDDLEWARE
 * ============================================================================
 */

section('2. COMPLETE GATEWAY AUTH MIDDLEWARE');

const authPath =
  'services/api-gateway/src/middleware/auth.ts';

const authSource = printFile(authPath);

if (authSource) {
  success(
    'Complete auth middleware displayed above.',
  );
}

/**
 * ============================================================================
 * 3. COMPLETE GATEWAY INDEX
 * ============================================================================
 */

section('3. COMPLETE GATEWAY INDEX');

const gatewayPath =
  'services/api-gateway/src/index.ts';

const gatewaySource = printFile(gatewayPath);

if (gatewaySource) {
  success(
    'Complete gateway entrypoint displayed above.',
  );
}

/**
 * ============================================================================
 * 4. TARGETED AUTH SEARCH
 * ============================================================================
 */

section('4. AUTHENTICATION TARGETED SEARCH');

printMatchingLines(
  authPath,
  [
    'resolveBrandFromHostname',
    'detectRequestBrand',
    'tokenBrand',
    'effectiveBrand',
    'brand_mismatch',
    'verifyAndDecode',
    'INTERNAL_GATEWAY_SECRET',
    'x-brand',
    'x-original-host',
    'x-forwarded-host',
    'authorization',
    'cookie',
  ],
);

/**
 * ============================================================================
 * 5. GATEWAY ENTRYPOINT TARGETED SEARCH
 * ============================================================================
 */

section('5. GATEWAY ENTRYPOINT TARGETED SEARCH');

printMatchingLines(
  gatewayPath,
  [
    'INTERNAL_GATEWAY_SECRET',
    'x-gateway-secret',
    'x-internal-secret',
    'x-brand',
    'x-original-host',
    'x-forwarded-host',
    'requestUrl',
    'hostname',
    'authMiddleware',
    'middleware',
    'verify',
  ],
);

/**
 * ============================================================================
 * 6. validateAuthState COMPLETE SOURCE
 * ============================================================================
 */

section('6. COMPLETE VALIDATEAUTHSTATE');

const validatePath =
  'src/share-branding/auth/validateAuthState.ts';

const validateSource =
  printFile(validatePath);

if (validateSource) {
  success(
    'Complete validateAuthState.ts displayed above.',
  );
}

/**
 * ============================================================================
 * 7. validateAuthState TARGETED SEARCH
 * ============================================================================
 */

section('7. VALIDATEAUTHSTATE TARGETED SEARCH');

printMatchingLines(
  validatePath,
  [
    'headers()',
    'getPublicHostFromHeaders',
    'x-original-host',
    'x-forwarded-host',
    'host',
    'gatewayUrl',
    '/auth/me',
    '/api/profile',
    'fetch(',
    'Cookie',
  ],
);

/**
 * ============================================================================
 * 8. PUBLIC HOST RESOLUTION
 * ============================================================================
 */

section('8. PUBLIC HOST RESOLUTION SEARCH');

const publicHostSearch = git([
  'grep',
  '-n',
  '-I',
  '-E',
  'getPublicHostFromHeaders|publicHost|x-original-host|x-forwarded-host',
  '--',
  'src',
  'apps',
  'packages',
  'services',
]);

if (publicHostSearch) {
  console.log(publicHostSearch);
  success(
    'Repository-wide public-host references found.',
  );
} else {
  warning(
    'No repository-wide public-host references found.',
  );
}

/**
 * ============================================================================
 * 9. INTERNAL GATEWAY SECRET SEARCH
 * ============================================================================
 */

section('9. INTERNAL GATEWAY SECRET SEARCH');

const internalSearch = git([
  'grep',
  '-n',
  '-I',
  '-E',
  'INTERNAL_GATEWAY_SECRET|x-gateway-secret|x-internal-secret|createInternalHeaders|requireBffAuth',
  '--',
  '.',
]);

if (internalSearch) {
  console.log(internalSearch);
  success(
    'Internal authentication references found.',
  );
} else {
  warning(
    'No internal authentication references found.',
  );
}

/**
 * ============================================================================
 * 10. PRODUCTION HOSTNAME SEARCH — ENTIRE REPOSITORY
 * ============================================================================
 */

section('10. PRODUCTION HOSTNAME SEARCH');

const productionSearch = git([
  'grep',
  '-n',
  '-I',
  '-E',
  'skillupitacademy\\.com|realtutorialhub\\.com',
  '--',
  '.',
]);

if (productionSearch) {
  console.log(productionSearch);
  success(
    'Production hostname references found above.',
  );
} else {
  warning(
    'No production hostname references found.',
  );
}

/**
 * ============================================================================
 * 11. LOCALHOST SEARCH
 * ============================================================================
 */

section('11. LOCALHOST / LOCAL DOMAIN SEARCH');

const localhostSearch = git([
  'grep',
  '-n',
  '-I',
  '-E',
  'skillup\\.localhost|rth\\.localhost|localhost:3009|localhost:3003|127\\.0\\.0\\.1:8787',
  '--',
  '.',
]);

if (localhostSearch) {
  console.log(localhostSearch);
  success(
    'Local hostname references found above.',
  );
} else {
  warning(
    'No explicit local hostname references found.',
  );
}

/**
 * ============================================================================
 * 12. X-BRAND SEARCH
 * ============================================================================
 */

section('12. X-BRAND USAGE');

const xBrandSearch = git([
  'grep',
  '-n',
  '-I',
  '-E',
  'x-brand|x-platform',
  '--',
  'services',
  'src',
  'apps',
  'packages',
]);

if (xBrandSearch) {
  console.log(xBrandSearch);
  success(
    'x-brand/x-platform references found above.',
  );
} else {
  warning(
    'No x-brand/x-platform references found.',
  );
}

/**
 * ============================================================================
 * 13. BFF AUTH SOURCE
 * ============================================================================
 */

section('13. BFF AUTH HANDLER');

const bffPath =
  'src/share-branding/auth/bffProfileHandler.ts';

printFile(bffPath);

/**
 * ============================================================================
 * 14. INTERNAL AUTH SOURCE
 * ============================================================================
 */

section('14. UNIFIED BFF AUTH');

const unifiedPath =
  'src/share-branding/auth/unifiedBffAuth.ts';

printFile(unifiedPath);

/**
 * ============================================================================
 * 15. PROXY SOURCE
 * ============================================================================
 */

section('15. GATEWAY PROXY SOURCE');

const proxyPath =
  'services/api-gateway/src/lib/proxy.ts';

printFile(proxyPath);

/**
 * ============================================================================
 * 16. ROUTING TABLE
 * ============================================================================
 */

section('16. GATEWAY ROUTING TABLE');

const routingPath =
  'services/api-gateway/src/routes/routing-table.ts';

printFile(routingPath);

/**
 * ============================================================================
 * 17. CURRENT .DEV.VARS
 * ============================================================================
 */

section('17. CURRENT GATEWAY .DEV.VARS');

const devVarsPath =
  'services/api-gateway/.dev.vars';

const devVars = read(devVarsPath);

if (devVars) {
  console.log(devVars);

  const brandMatch =
    /^\s*BRAND\s*=\s*([^\r\n#]+)/m.exec(
      devVars,
    );

  if (brandMatch) {
    warning(
      `ACTIVE GLOBAL BRAND = ${brandMatch[1].trim()}`,
    );

    warning(
      'This must remain diagnostic only and must not become '
      + 'the permanent multi-brand architecture.',
    );
  } else {
    success(
      'No active global BRAND assignment.',
    );
  }
} else {
  warning(
    '.dev.vars not found.',
  );
}

/**
 * ============================================================================
 * 18. CURRENT LOCAL APPLICATION ENVIRONMENT
 * ============================================================================
 */

section('18. LOCAL APPLICATION ENVIRONMENT');

for (const envPath of [
  'apps/skillup-web/.env.local',
  'apps/realtutorialhub-web/.env.local',
]) {
  const source = read(envPath);

  if (!source) {
    warning(`${envPath}: not found`);
    continue;
  }

  log('');
  log(`FILE: ${envPath}`);
  log('-'.repeat(86));

  const lines = source.split(/\r?\n/);

  for (const line of lines) {
    if (
      line.includes('GATEWAY_URL') ||
      line.includes('NEXT_PUBLIC_BRAND') ||
      line.includes('AUTH') ||
      line.includes('HOST')
    ) {
      log(line);
    }
  }
}

/**
 * ============================================================================
 * 19. GIT HISTORY — AUTH SECURITY
 * ============================================================================
 */

section('19. AUTH SECURITY GIT HISTORY');

const securityLog = git([
  'log',
  '--date=iso-strict',
  '--format=%h|%ad|%an|%s',
  '-40',
  '--',
  'services/api-gateway/src/middleware/auth.ts',
  'services/api-gateway/src/index.ts',
  'src/share-branding/auth/validateAuthState.ts',
  'src/share-branding/auth/unifiedBffAuth.ts',
  'src/share-branding/auth/bffProfileHandler.ts',
]);

if (securityLog) {
  for (const line of securityLog.split(/\r?\n/)) {
    if (!line.trim()) continue;

    const [
      hash,
      date,
      author,
      ...message
    ] = line.split('|');

    log('');
    log(`Commit : ${hash}`);
    log(`Date   : ${date}`);
    log(`Author : ${author}`);
    log(`Message: ${message.join('|')}`);
  }
} else {
  warning(
    'No authentication Git history found.',
  );
}

/**
 * ============================================================================
 * 20. IMPORTANT COMMITS
 * ============================================================================
 */

section('20. IMPORTANT HISTORICAL COMMITS');

const importantCommits = [
  'acf77df3',
  'd5fc593c',
  '422ad429',
  'f73547df',
  '742c2f94',
  '6b49a7f2',
];

for (const commit of importantCommits) {
  const details = git([
    'show',
    '--format=fuller',
    '--stat',
    commit,
  ]);

  if (!details) {
    warning(
      `Could not inspect ${commit}`,
    );
    continue;
  }

  log('');
  console.log(details);
}

/**
 * ============================================================================
 * 21. CURRENT DIFF OF AUTH FILES
 * ============================================================================
 */

section('21. CURRENT AUTH FILE DIFF');

const authDiff = git([
  'diff',
  '--',
  'services/api-gateway/src/middleware/auth.ts',
  'services/api-gateway/src/index.ts',
  'services/api-gateway/.dev.vars',
  'src/share-branding/auth/validateAuthState.ts',
  'src/share-branding/auth/unifiedBffAuth.ts',
  'src/share-branding/auth/bffProfileHandler.ts',
]);

if (authDiff) {
  console.log(authDiff);
} else {
  success(
    'No current changes in inspected auth source files.',
  );
}

/**
 * ============================================================================
 * 22. ARCHITECTURAL QUESTIONS
 * ============================================================================
 */

section('22. ARCHITECTURAL QUESTIONS TO ANSWER');

log(`
The implementation must not begin until these questions are answered:

1. What is the authoritative source for production brand resolution?

2. Does resolveBrandFromHostname() itself contain production mappings,
   or does another layer provide them?

3. What exactly does detectRequestBrand() do?

4. Does x-brand override hostname resolution?

5. Can x-brand be supplied by an external browser?

6. What exactly does INTERNAL_GATEWAY_SECRET protect?

7. Is INTERNAL_GATEWAY_SECRET required before accepting
   x-original-host?

8. Does validateAuthState() copy a browser-controlled header into
   x-original-host?

9. Does getPublicHostFromHeaders() trust:
     - x-original-host?
     - x-forwarded-host?
     - host?
   and in what order?

10. Does the gateway authenticate the JWT before or after resolving
    the effective brand?

11. Can an attacker choose a brand before JWT validation?

12. What happens for:
      localhost
      127.0.0.1
      skillup.localhost
      rth.localhost

13. What happens if hostname cannot be resolved?

14. Is unknown hostname rejected, or does it default to RTH?

15. Are production routes dependent on the same hostname resolver?

16. Can we introduce localhost hostname resolution without changing
    production behavior?

17. Does the application server need GATEWAY_URL changed at all?

18. Can both applications continue using:
      http://127.0.0.1:8787

    while preserving their public browser hostname?

19. Does the gateway already have an authenticated internal-server
    request path that can safely carry the public hostname?

20. Can the permanent solution avoid a global BRAND environment variable?
`);

/**
 * ============================================================================
 * 23. FINAL STATUS
 * ============================================================================
 */

section('23. INVESTIGATION STATUS');

log(`
CURRENTLY PROVEN:

  ✓ August 26 commit removed BRAND=skillup.
  ✓ That removal exposed the localhost brand-resolution problem.
  ✓ SkillUp JWT contains brand=skillup.
  ✓ Shared gateway receives 127.0.0.1:8787.
  ✓ Current gateway does not use x-original-host.
  ✓ validateAuthState() generates x-original-host.
  ✓ Internal authentication mechanisms exist.
  ✓ Current BRAND=skillup is only a temporary diagnostic change.

NOT YET PROVEN:

  ? Exact trusted source for public hostname.
  ? Complete production hostname resolution path.
  ? Exact trust boundary for x-original-host.
  ? Exact ordering of brand resolution and JWT verification.
  ? Whether x-brand is externally controllable.
  ? Whether INTERNAL_GATEWAY_SECRET is mandatory for this path.

THEREFORE:

  DO NOT DEPLOY ANY AUTH CHANGE YET.

The next implementation should be based on the complete source
shown by this investigation.
`);

section('INVESTIGATION COMPLETE');

success('Read-only investigation finished.');
success('No files were modified.');
success('No commits were created.');
success('No deployment was performed.');
