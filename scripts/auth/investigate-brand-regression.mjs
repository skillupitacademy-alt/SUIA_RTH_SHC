#!/usr/bin/env node

/**
 * ============================================================================
 * BRAND REGRESSION + TRUST BOUNDARY INVESTIGATION
 * ============================================================================
 *
 * READ ONLY
 *
 * Purpose:
 *
 * 1. Identify exactly when localhost multi-brand authentication changed.
 * 2. Verify the historical BRAND=skillup regression.
 * 3. Determine when hostname brand resolution was introduced.
 * 4. Determine when JWT brand validation was introduced.
 * 5. Determine whether x-original-host can safely participate in
 *    brand resolution.
 * 6. Determine whether gateway internal authentication exists.
 * 7. Verify that production mappings have not recently changed.
 *
 * NO FILES ARE MODIFIED.
 * NO GIT RESET.
 * NO GIT CHECKOUT.
 * NO DEPLOYMENT.
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '../..');

function log(message = '') {
  console.log(message);
}

function section(title) {
  log('');
  log('='.repeat(82));
  log(title);
  log('='.repeat(82));
}

function info(message) {
  console.log(`ℹ ${message}`);
}

function success(message) {
  console.log(`✓ ${message}`);
}

function warning(message) {
  console.log(`⚠ ${message}`);
}

function failure(message) {
  console.log(`✗ ${message}`);
}

function runGit(args) {
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
  } catch (error) {
    return '';
  }
}

function read(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);

  if (!fs.existsSync(absolutePath)) {
    return null;
  }

  return fs.readFileSync(absolutePath, 'utf8');
}

function printGitLog(relativePath, search = null) {
  const args = [
    'log',
    '--date=iso-strict',
    '--format=%h|%H|%ad|%an|%s',
  ];

  if (search) {
    args.push('-S', search);
  }

  args.push('--', relativePath);

  const result = runGit(args);

  if (!result) {
    warning(`No Git history found for ${relativePath}`);
    return;
  }

  for (const line of result.split(/\r?\n/)) {
    if (!line.trim()) continue;

    const [
      shortHash,
      fullHash,
      date,
      author,
      ...messageParts
    ] = line.split('|');

    log('');
    log(`Commit : ${shortHash}`);
    log(`Full   : ${fullHash}`);
    log(`Date   : ${date}`);
    log(`Author : ${author}`);
    log(`Message: ${messageParts.join('|')}`);
  }
}

function showCommit(commit) {
  return runGit([
    'show',
    '--stat',
    '--oneline',
    commit,
  ]);
}

function showDiff(commit, file) {
  return runGit([
    'show',
    '--format=fuller',
    '--',
    commit,
    '--',
    file,
  ]);
}

/**
 * ============================================================================
 * 1. Repository state
 * ============================================================================
 */

section('1. CURRENT GIT STATE');

const branch = runGit([
  'branch',
  '--show-current',
]);

const status = runGit([
  'status',
  '--short',
]);

log(`Repository: ${ROOT}`);
log(`Branch: ${branch || '(detached HEAD)'}`);

if (status) {
  warning('Working tree contains changes.');

  for (const line of status.split(/\r?\n/)) {
    if (line.trim()) {
      log(`  ${line}`);
    }
  }
} else {
  success('Working tree is clean.');
}

/**
 * ============================================================================
 * 2. Historical BRAND regression
 * ============================================================================
 */

section('2. BRAND=skillup HISTORY');

printGitLog(
  'services/api-gateway/.dev.vars',
  'BRAND=skillup',
);

log('');
info(
  'The purpose of this section is to establish the exact commit where '
  + 'the global local BRAND override was introduced or removed.',
);

/**
 * ============================================================================
 * 3. Inspect known regression commit
 * ============================================================================
 */

section('3. KNOWN REGRESSION COMMIT');

const regressionCommit =
  '6b49a7f22eb34e195b6074d10b215e11bd603b54';

const regressionDetails = runGit([
  'show',
  '--format=fuller',
  '--stat',
  regressionCommit,
]);

if (regressionDetails) {
  console.log(regressionDetails);
  success(
    `Regression commit ${regressionCommit.slice(0, 8)} is present.`,
  );
} else {
  warning(
    `Could not inspect commit ${regressionCommit}.`,
  );
}

/**
 * ============================================================================
 * 4. Exact .dev.vars diff
 * ============================================================================
 */

section('4. EXACT .DEV.VARS REGRESSION DIFF');

const previousCommit =
  `${regressionCommit}^`;

const diff = runGit([
  'diff',
  `${previousCommit}`,
  regressionCommit,
  '--',
  'services/api-gateway/.dev.vars',
]);

if (diff) {
  console.log(diff);
  success(
    'Exact .dev.vars change displayed above.',
  );
} else {
  warning(
    'No .dev.vars diff found.',
  );
}

/**
 * ============================================================================
 * 5. resolveBrandFromHostname history
 * ============================================================================
 */

section('5. HOSTNAME BRAND RESOLUTION HISTORY');

printGitLog(
  'services/api-gateway/src/middleware/auth.ts',
  'resolveBrandFromHostname',
);

/**
 * ============================================================================
 * 6. hostname.includes("skillup") history
 * ============================================================================
 */

section('6. SKILLUP HOSTNAME MATCHING HISTORY');

printGitLog(
  'services/api-gateway/src/middleware/auth.ts',
  'hostname.includes',
);

/**
 * ============================================================================
 * 7. JWT brand validation history
 * ============================================================================
 */

section('7. JWT BRAND VALIDATION HISTORY');

const authPath =
  'services/api-gateway/src/middleware/auth.ts';

const jwtTerms = [
  'tokenBrand',
  'brand_mismatch',
  'effectiveBrand',
  'verifyAndDecodeAuthJWT',
];

for (const term of jwtTerms) {
  log('');
  log(`SEARCH TERM: ${term}`);

  printGitLog(
    authPath,
    term,
  );
}

/**
 * ============================================================================
 * 8. Current authentication source
 * ============================================================================
 */

section('8. CURRENT AUTHENTICATION SOURCE');

const authSource = read(authPath);

if (!authSource) {
  failure(
    `${authPath} could not be read.`,
  );
} else {
  const checks = [
    [
      'resolveBrandFromHostname',
      authSource.includes(
        'resolveBrandFromHostname',
      ),
    ],
    [
      'verifyAndDecodeAuthJWT',
      authSource.includes(
        'verifyAndDecodeAuthJWT',
      ),
    ],
    [
      'brand_mismatch',
      authSource.includes(
        'brand_mismatch',
      ),
    ],
    [
      'tokenBrand',
      authSource.includes(
        'tokenBrand',
      ),
    ],
    [
      'effectiveBrand',
      authSource.includes(
        'effectiveBrand',
      ),
    ],
    [
      'x-brand',
      authSource.includes(
        'x-brand',
      ),
    ],
  ];

  for (const [name, present] of checks) {
    if (present) {
      success(`${name}: PRESENT`);
    } else {
      warning(`${name}: NOT FOUND`);
    }
  }
}

/**
 * ============================================================================
 * 9. Current gateway request-host handling
 * ============================================================================
 */

section('9. CURRENT GATEWAY HOSTNAME PROPAGATION');

const gatewayIndex =
  read('services/api-gateway/src/index.ts');

if (!gatewayIndex) {
  failure(
    'Gateway index.ts could not be read.',
  );
} else {
  const checks = [
    [
      'new URL(c.req.url)',
      gatewayIndex.includes(
        'new URL(c.req.url)',
      ),
    ],
    [
      'requestUrl.hostname',
      gatewayIndex.includes(
        'requestUrl.hostname',
      ),
    ],
    [
      'x-original-host',
      gatewayIndex.includes(
        'x-original-host',
      ),
    ],
    [
      'x-forwarded-host',
      gatewayIndex.includes(
        'x-forwarded-host',
      ),
    ],
    [
      'x-brand',
      gatewayIndex.includes(
        'x-brand',
      ),
    ],
  ];

  for (const [name, present] of checks) {
    if (present) {
      success(`${name}: PRESENT`);
    } else {
      warning(`${name}: NOT FOUND`);
    }
  }
}

/**
 * ============================================================================
 * 10. validateAuthState
 * ============================================================================
 */

section('10. VALIDATEAUTHSTATE TRUST SOURCE');

const validate =
  read('src/share-branding/auth/validateAuthState.ts');

if (!validate) {
  failure(
    'validateAuthState.ts could not be read.',
  );
} else {
  const checks = [
    [
      'next/headers',
      validate.includes(
        "next/headers",
      ),
    ],
    [
      'headers()',
      validate.includes(
        'headers()',
      ),
    ],
    [
      'x-original-host',
      validate.includes(
        'x-original-host',
      ),
    ],
    [
      'x-forwarded-host',
      validate.includes(
        'x-forwarded-host',
      ),
    ],
    [
      'host',
      validate.includes(
        ".get('host')",
      ) ||
      validate.includes(
        '.get("host")',
      ),
    ],
    [
      'gatewayUrl',
      validate.includes(
        'gatewayUrl',
      ),
    ],
    [
      '/auth/me',
      validate.includes(
        '/auth/me',
      ),
    ],
    [
      '/api/profile',
      validate.includes(
        '/api/profile',
      ),
    ],
  ];

  for (const [name, present] of checks) {
    if (present) {
      success(`${name}: PRESENT`);
    } else {
      warning(`${name}: NOT FOUND`);
    }
  }
}

/**
 * ============================================================================
 * 11. Internal secret architecture
 * ============================================================================
 */

section('11. INTERNAL REQUEST AUTHENTICATION');

const possibleInternalFiles = [
  'services/api-gateway/src/index.ts',
  'services/api-gateway/src/middleware/auth.ts',
  'services/api-gateway/src/lib/proxy.ts',
  'src/share-branding/auth/unifiedBffAuth.ts',
  'src/share-branding/auth/bffProfileHandler.ts',
];

for (const relativePath of possibleInternalFiles) {
  const source = read(relativePath);

  if (!source) {
    continue;
  }

  log('');
  log(`FILE: ${relativePath}`);

  const terms = [
    'INTERNAL_GATEWAY_SECRET',
    'x-gateway-secret',
    'x-internal-secret',
    'x-internal-key',
    'createInternalHeaders',
    'requireBffAuth',
  ];

  for (const term of terms) {
    const count =
      source.split(term).length - 1;

    if (count > 0) {
      success(
        `${term}: ${count} occurrence(s)`,
      );
    }
  }
}

/**
 * ============================================================================
 * 12. Current .dev.vars
 * ============================================================================
 */

section('12. CURRENT GATEWAY .DEV.VARS');

const devVars =
  read('services/api-gateway/.dev.vars');

if (!devVars) {
  warning(
    '.dev.vars does not exist.',
  );
} else {
  const activeBrand =
    /^\s*BRAND\s*=\s*([^\r\n#]+)/m.exec(
      devVars,
    );

  if (activeBrand) {
    warning(
      `Active BRAND=${activeBrand[1].trim()}`,
    );
  } else {
    success(
      'No active global BRAND assignment.',
    );
  }
}

/**
 * ============================================================================
 * 13. Local environment URLs
 * ============================================================================
 */

section('13. LOCAL APPLICATION ENVIRONMENT');

const environments = [
  'apps/skillup-web/.env.local',
  'apps/realtutorialhub-web/.env.local',
];

for (const relativePath of environments) {
  const source = read(relativePath);

  if (!source) {
    warning(
      `${relativePath}: not found`,
    );
    continue;
  }

  log('');
  log(`FILE: ${relativePath}`);

  const gateway =
    /^\s*GATEWAY_URL\s*=\s*"?([^"\r\n]+)"?/m.exec(
      source,
    );

  const brand =
    /^\s*NEXT_PUBLIC_BRAND\s*=\s*([^\r\n#]+)/m.exec(
      source,
    );

  if (gateway) {
    log(`  GATEWAY_URL = ${gateway[1].trim()}`);
  } else {
    warning(
      '  GATEWAY_URL not found',
    );
  }

  if (brand) {
    log(`  NEXT_PUBLIC_BRAND = ${brand[1].trim()}`);
  } else {
    warning(
      '  NEXT_PUBLIC_BRAND not found',
    );
  }
}

/**
 * ============================================================================
 * 14. Production hostname protection
 * ============================================================================
 */

section('14. PRODUCTION HOSTNAME PROTECTION');

if (authSource) {
  const productionHosts = [
    'skillupitacademy.com',
    'realtutorialhub.com',
  ];

  for (const hostname of productionHosts) {
    if (authSource.includes(hostname)) {
      success(
        `Production hostname present: ${hostname}`,
      );
    } else {
      warning(
        `Production hostname NOT found: ${hostname}`,
      );
    }
  }
}

/**
 * ============================================================================
 * 15. Search recent auth commits
 * ============================================================================
 */

section('15. RECENT AUTHENTICATION COMMITS');

const recentAuth =
  runGit([
    'log',
    '--date=iso-strict',
    '--format=%h|%ad|%an|%s',
    '-30',
    '--',
    'services/api-gateway/src/middleware/auth.ts',
    'services/api-gateway/src/index.ts',
    'src/share-branding/auth/validateAuthState.ts',
    'src/share-branding/auth/unifiedBffAuth.ts',
    'src/share-branding/auth/bffProfileHandler.ts',
  ]);

if (recentAuth) {
  for (const line of recentAuth.split(/\r?\n/)) {
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
}

/**
 * ============================================================================
 * 16. Current Git diff
 * ============================================================================
 */

section('16. CURRENT WORKING-TREE DIFF — AUTH FILES ONLY');

const currentDiff =
  runGit([
    'diff',
    '--',
    'services/api-gateway/src/middleware/auth.ts',
    'services/api-gateway/src/index.ts',
    'services/api-gateway/.dev.vars',
    'src/share-branding/auth/validateAuthState.ts',
  ]);

if (currentDiff) {
  console.log(currentDiff);
} else {
  success(
    'No current diff in the inspected authentication files.',
  );
}

/**
 * ============================================================================
 * 17. Security conclusion
 * ============================================================================
 */

section('17. PRELIMINARY SECURITY CONCLUSION');

log(`
This script intentionally DOES NOT conclude that x-original-host
is trusted merely because validateAuthState() creates it.

The following must be true before the gateway trusts it:

  1. The request must come from a trusted application/server path.
  2. An external browser must not be able to directly impersonate that path.
  3. Internal authentication must be established where applicable.
  4. The hostname must belong to an explicitly allowed domain.
  5. JWT brand must continue to match the resolved brand.
  6. Ambiguous localhost / 127.0.0.1 must never silently become RTH.
  7. Production hostname mappings must remain unchanged.

Therefore:

  DO NOT deploy the x-original-host change yet.

First review the evidence printed above.
`);

section('INVESTIGATION COMPLETE');

success('No files were modified.');
success('No commits were created.');
success('No deployment was performed.');
