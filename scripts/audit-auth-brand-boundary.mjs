#!/usr/bin/env node
'use strict';

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const args = process.argv.slice(2);

const arg = (name, defaultValue) => {
  const index = args.indexOf(name);
  return index < 0 ? defaultValue : (args[index + 1] ?? defaultValue);
};

const ROOT = path.resolve(
  arg('--root', process.cwd()),
);

const STRICT = args.includes('--strict');
const JSON_OUT = args.includes('--json');

const results = [];
const notes = [];

const pass = (name, details = '') =>
  results.push({
    status: 'PASS',
    name,
    details,
  });

const fail = (name, details = '') =>
  results.push({
    status: 'FAIL',
    name,
    details,
  });

const warn = (name, details = '') =>
  results.push({
    status: 'WARN',
    name,
    details,
  });

const exists = (relativePath) =>
  fs.existsSync(
    path.join(ROOT, relativePath),
  );

const read = (relativePath) =>
  exists(relativePath)
    ? fs.readFileSync(
        path.join(ROOT, relativePath),
        'utf8',
      )
    : null;

const find = (paths) =>
  paths.find(exists) || null;

const test = (name, fn) => {
  try {
    fn();
    pass(name);
  } catch (error) {
    fail(
      name,
      error?.message || String(error),
    );
  }
};

const eq = (actual, expected, message) =>
  assert.equal(
    actual,
    expected,
    message,
  );

const ok = (value, message) =>
  assert.equal(
    value,
    true,
    message,
  );

const no = (value, message) =>
  assert.equal(
    value,
    false,
    message,
  );

const section = (title) => {
  if (!JSON_OUT) {
    console.log(
      `\n${'='.repeat(78)}\n${title}\n${'='.repeat(78)}`,
    );
  }
};


/**
 * ============================================================================
 * INDEPENDENT BRAND RESOLUTION TEST MODEL
 * ============================================================================
 *
 * This intentionally mirrors the canonical contract instead of importing
 * application source code directly. That allows this script to run without
 * requiring the application's TypeScript aliases, Wrangler runtime, Hono
 * runtime, or Next.js runtime.
 * ============================================================================
 */

function normHost(hostname) {
  return String(hostname ?? '')
    .trim()
    .toLowerCase()
    .replace(/\.$/, '');
}

function resolve(hostname) {
  const normalized = normHost(hostname);

  if (!normalized) {
    return undefined;
  }

  /**
   * --------------------------------------------------------------------------
   * LOCAL DEVELOPMENT
   * --------------------------------------------------------------------------
   */

  if (
    normalized ===
    'skillup.localhost'
  ) {
    return 'skillup';
  }

  if (
    normalized ===
    'rth.localhost'
  ) {
    return 'realtutorialhub';
  }

  /**
   * --------------------------------------------------------------------------
   * SKILLUP PRODUCTION
   * --------------------------------------------------------------------------
   */

  if (
    normalized ===
      'skillupitacademy.com' ||
    normalized.endsWith(
      '.skillupitacademy.com',
    )
  ) {
    return 'skillup';
  }

  /**
   * --------------------------------------------------------------------------
   * REALTUTORIALHUB PRODUCTION
   * --------------------------------------------------------------------------
   */

  if (
    normalized ===
      'realtutorialhub.com' ||
    normalized.endsWith(
      '.realtutorialhub.com',
    )
  ) {
    return 'realtutorialhub';
  }

  /**
   * --------------------------------------------------------------------------
   * UNKNOWN / AMBIGUOUS
   * --------------------------------------------------------------------------
   */

  return undefined;
}

const supported = (value) =>
  value === 'skillup' ||
  value === 'realtutorialhub';


/**
 * ============================================================================
 * HOST HEADER NORMALIZATION
 * ============================================================================
 */

function normHeader(value) {
  const trimmed =
    String(value ?? '').trim();

  if (!trimmed) {
    return undefined;
  }

  try {
    return new URL(
      `http://${trimmed}`,
    )
      .hostname
      .toLowerCase()
      .replace(/\.$/, '');
  } catch {
    return undefined;
  }
}


/**
 * ============================================================================
 * TRUSTED REQUEST BRAND MODEL
 * ============================================================================
 */

function trusted({
  gatewayHostname,
  originalHost,
  internalSecret,
  expectedSecret,
}) {
  /**
   * X-Original-Host is trusted ONLY when the internal secret matches.
   */

  if (
    originalHost &&
    expectedSecret &&
    internalSecret === expectedSecret
  ) {
    const hostname =
      normHeader(originalHost);

    const brand =
      resolve(hostname);

    if (brand) {
      return {
        brand,
        hostname,
        source:
          'trusted-original-host',
      };
    }
  }

  /**
   * Otherwise fall back to the actual gateway hostname.
   *
   * 127.0.0.1 / localhost deliberately resolve to undefined.
   */

  const brand =
    resolve(gatewayHostname);

  if (brand) {
    return {
      brand,
      hostname:
        normHost(gatewayHostname),
      source:
        'gateway-hostname',
    };
  }

  return undefined;
}


/**
 * ============================================================================
 * 1. CANONICAL BRAND RESOLUTION
 * ============================================================================
 */

section(
  '1. CANONICAL BRAND RESOLUTION',
);

const canonicalTests = [
  [
    'skillup.localhost',
    'skillup',
  ],
  [
    'rth.localhost',
    'realtutorialhub',
  ],

  [
    'skillupitacademy.com',
    'skillup',
  ],

  [
    'user.skillupitacademy.com',
    'skillup',
  ],

  [
    'admin.skillupitacademy.com',
    'skillup',
  ],

  [
    'realtutorialhub.com',
    'realtutorialhub',
  ],

  [
    'user.realtutorialhub.com',
    'realtutorialhub',
  ],

  [
    'admin.realtutorialhub.com',
    'realtutorialhub',
  ],

  [
    'SKILLUP.LOCALHOST',
    'skillup',
  ],

  [
    'RTH.LOCALHOST.',
    'realtutorialhub',
  ],
];

for (
  const [hostname, brand]
  of canonicalTests
) {
  test(
    `${hostname} -> ${brand}`,
    () => {
      eq(
        resolve(hostname),
        brand,
      );
    },
  );
}


/**
 * ============================================================================
 * 2. UNKNOWN / AMBIGUOUS HOSTNAMES
 * ============================================================================
 */

section(
  '2. UNKNOWN / AMBIGUOUS HOSTNAMES',
);

const unknownHosts = [
  '',
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'unknown.example.com',
  'evil.com',
  'skillup.example.com',
  'skillupitacademy.co',
  'realtutorialhub.co',
  'evilskillupitacademy.com',
  'skillupitacademy.com.evil.com',
  'realtutorialhub.com.evil.com',
];

for (const hostname of unknownHosts) {
  test(
    `${hostname || '<empty>'} -> undefined`,
    () => {
      eq(
        resolve(hostname),
        undefined,
        'Unknown host must fail closed',
      );
    },
  );
}


/**
 * ============================================================================
 * 3. DNS BOUNDARY PROTECTION
 * ============================================================================
 */

section(
  '3. DNS BOUNDARY',
);

const boundaryHosts = [
  'notskillupitacademy.com',
  'skillupitacademy.com.evil.com',
  'evil.skillupitacademy.com.evil.com',
  'notrealtutorialhub.com',
  'realtutorialhub.com.evil.com',
  'evil.realtutorialhub.com.evil.com',
];

for (const hostname of boundaryHosts) {
  test(
    `Boundary: ${hostname}`,
    () => {
      eq(
        resolve(hostname),
        undefined,
        'Substring matching must never establish a brand',
      );
    },
  );
}


/**
 * ============================================================================
 * 4. SUPPORTED BRAND
 * ============================================================================
 */

section(
  '4. SUPPORTED BRAND',
);

for (
  const brand of [
    'skillup',
    'realtutorialhub',
  ]
) {
  test(
    `${brand} supported`,
    () => {
      ok(
        supported(brand),
      );
    },
  );
}

for (
  const value of [
    undefined,
    null,
    '',
    'admin',
    'user',
    'skillup ',
    'evil',
  ]
) {
  test(
    `${String(value)} unsupported`,
    () => {
      no(
        supported(value),
      );
    },
  );
}


/**
 * ============================================================================
 * 5. HOST HEADER NORMALIZATION
 * ============================================================================
 */

section(
  '5. HOST HEADER NORMALIZATION',
);

const hostHeaderTests = [
  [
    'skillup.localhost',
    'skillup.localhost',
  ],

  [
    'skillup.localhost:3009',
    'skillup.localhost',
  ],

  [
    'rth.localhost:3003',
    'rth.localhost',
  ],

  [
    'SkillUp.Localhost:3009',
    'skillup.localhost',
  ],

  [
    'rth.localhost.',
    'rth.localhost',
  ],
];

for (
  const [input, expected]
  of hostHeaderTests
) {
  test(
    `${input} -> ${expected}`,
    () => {
      eq(
        normHeader(input),
        expected,
      );
    },
  );
}


/**
 * ============================================================================
 * 6. TRUSTED X-ORIGINAL-HOST
 * ============================================================================
 */

section(
  '6. TRUSTED X-ORIGINAL-HOST',
);

const SECRET = 'S';

const trustedTests = [
  [
    'Valid SkillUp',
    'skillup.localhost:3009',
    'S',
    'S',
    'skillup',
    'trusted-original-host',
  ],

  [
    'Valid RTH',
    'rth.localhost:3003',
    'S',
    'S',
    'realtutorialhub',
    'trusted-original-host',
  ],

  [
    'No secret',
    'skillup.localhost',
    undefined,
    'S',
    undefined,
    undefined,
  ],

  [
    'Wrong secret',
    'skillup.localhost',
    'bad',
    'S',
    undefined,
    undefined,
  ],

  [
    'Unknown host',
    'evil.example.com',
    'S',
    'S',
    undefined,
    undefined,
  ],
];

for (
  const [
    name,
    originalHost,
    internalSecret,
    expectedSecret,
    expectedBrand,
    expectedSource,
  ]
  of trustedTests
) {
  test(
    name,
    () => {
      const result =
        trusted({
          gatewayHostname:
            '127.0.0.1',
          originalHost,
          internalSecret,
          expectedSecret,
        });

      eq(
        result?.brand,
        expectedBrand,
      );

      eq(
        result?.source,
        expectedSource,
      );
    },
  );
}


/**
 * ============================================================================
 * 7. GATEWAY HOST
 * ============================================================================
 */

section(
  '7. GATEWAY HOST',
);

test(
  '127.0.0.1 is not a brand',
  () => {
    eq(
      resolve('127.0.0.1'),
      undefined,
    );
  },
);

test(
  'localhost is not a brand',
  () => {
    eq(
      resolve('localhost'),
      undefined,
    );
  },
);

test(
  'logical SkillUp gateway host resolves',
  () => {
    eq(
      resolve(
        'skillup.localhost',
      ),
      'skillup',
    );
  },
);


/**
 * ============================================================================
 * 8. X-BRAND ASSERTION
 * ============================================================================
 */

section(
  '8. X-BRAND ASSERTION',
);

const assertion = (
  assertedBrand,
  resolvedBrand,
) =>
  assertedBrand === undefined
    ? true
    : supported(assertedBrand) &&
      assertedBrand === resolvedBrand;

test(
  'missing assertion allowed',
  () => {
    ok(
      assertion(
        undefined,
        'skillup',
      ),
    );
  },
);

test(
  'matching SkillUp allowed',
  () => {
    ok(
      assertion(
        'skillup',
        'skillup',
      ),
    );
  },
);

test(
  'matching RTH allowed',
  () => {
    ok(
      assertion(
        'realtutorialhub',
        'realtutorialhub',
      ),
    );
  },
);

test(
  'cross-brand rejected',
  () => {
    no(
      assertion(
        'skillup',
        'realtutorialhub',
      ),
    );
  },
);

test(
  'unsupported rejected',
  () => {
    no(
      assertion(
        'admin',
        'skillup',
      ),
    );
  },
);


/**
 * ============================================================================
 * 9. SOURCE AUDIT
 * ============================================================================
 */

section(
  '9. SOURCE AUDIT',
);

const files = {
  brand: find([
    'services/api-gateway/src/lib/brand-resolution.ts',
  ]),

  request: find([
    'services/api-gateway/src/lib/request-brand.ts',
  ]),

  assertion: find([
    'services/api-gateway/src/lib/brand-assertion.ts',
  ]),

  auth: find([
    'services/api-gateway/src/middleware/auth.ts',
  ]),

  index: find([
    'services/api-gateway/src/index.ts',
  ]),

  proxy: find([
    'services/api-gateway/src/lib/proxy.ts',
  ]),

  ssr: find([
    'src/share-branding/auth/validateAuthState.ts',
    'src/share-branding/auth/validate-auth-state.ts',
  ]),

  bffRoute: find([
    'src/share-branding/auth/authBffRoute.ts',
  ]),

  bffAuth: find([
    'src/share-branding/auth/unifiedBffAuth.ts',
  ]),

  bffProfile: find([
    'src/share-branding/auth/bffProfileHandler.ts',
  ]),

  routing: find([
    'services/api-gateway/src/routes/routing-table.ts',
  ]),
};

for (
  const [key, filePath]
  of Object.entries(files)
) {
  if (filePath) {
    pass(
      `${key} source exists`,
      filePath,
    );
  } else {
    warn(
      `${key} source exists`,
      'Not found at expected path; inspect manually',
    );
  }
}

const S = Object.fromEntries(
  Object.entries(files).map(
    ([key, filePath]) => [
      key,
      filePath
        ? read(filePath)
        : '',
    ],
  ),
);


/**
 * --------------------------------------------------------------------------
 * Canonical resolver source audit
 * --------------------------------------------------------------------------
 */

if (S.brand) {
  test(
    'canonical resolver defines supported brands',
    () => {
      ok(
        /SUPPORTED_BRANDS[\s\S]*skillup[\s\S]*realtutorialhub/
          .test(S.brand),
      );
    },
  );

  test(
    'canonical resolver returns undefined',
    () => {
      ok(
        /return\s+undefined\s*;/
          .test(S.brand),
      );
    },
  );

  test(
    'no unsafe skillup substring matching',
    () => {
      no(
        /hostname\.includes\s*\(\s*['"]skillup/i
          .test(S.brand),
        'Unsafe substring matching detected',
      );
    },
  );

  test(
    'no unsafe RTH substring matching',
    () => {
      no(
        /hostname\.includes\s*\(\s*['"]realtutorialhub/i
          .test(S.brand),
        'Unsafe substring matching detected',
      );
    },
  );

  test(
    'SkillUp DNS boundary exists',
    () => {
      ok(
        /\.skillupitacademy\.com/
          .test(S.brand),
      );
    },
  );

  test(
    'RTH DNS boundary exists',
    () => {
      ok(
        /\.realtutorialhub\.com/
          .test(S.brand),
      );
    },
  );

  test(
    'skillup.localhost mapping exists',
    () => {
      ok(
        /skillup\.localhost/
          .test(S.brand),
      );
    },
  );

  test(
    'rth.localhost mapping exists',
    () => {
      ok(
        /rth\.localhost/
          .test(S.brand),
      );
    },
  );
}


/**
 * --------------------------------------------------------------------------
 * Trusted request source audit
 * --------------------------------------------------------------------------
 */

if (S.request) {
  test(
    'request-brand checks internal secret',
    () => {
      ok(
        /x-internal-secret/i
          .test(S.request),
      );
    },
  );

  test(
    'request-brand handles original host',
    () => {
      ok(
        /x-original-host/i
          .test(S.request),
      );
    },
  );

  test(
    'request-brand uses canonical resolver',
    () => {
      ok(
        /resolveBrandFromHostname/
          .test(S.request),
      );
    },
  );
}


/**
 * --------------------------------------------------------------------------
 * Gateway source audit
 * --------------------------------------------------------------------------
 */

if (S.index) {
  test(
    'gateway uses trusted resolver',
    () => {
      ok(
        /resolveTrustedRequestBrand/
          .test(S.index),
      );
    },
  );

  test(
    'gateway rejects unresolved brand',
    () => {
      ok(
        /brand_unresolved/
          .test(S.index),
      );
    },
  );

  test(
    'gateway sets resolved X-Brand',
    () => {
      ok(
        /headers\.set\s*\(\s*['"]x-brand['"]\s*,\s*brand\s*\)/i
          .test(S.index),
      );
    },
  );

  test(
    'gateway passes brand to auth',
    () => {
      ok(
        /authenticateRequest[\s\S]*brand/
          .test(S.index),
      );
    },
  );
}


/**
 * --------------------------------------------------------------------------
 * Authentication source audit
 * --------------------------------------------------------------------------
 */

if (S.auth) {
  test(
    'auth rejects unresolved brand',
    () => {
      ok(
        /brand_unresolved/
          .test(S.auth),
      );
    },
  );

  test(
    'auth validates token brand',
    () => {
      ok(
        /tokenBrand[\s\S]*resolvedBrand/
          .test(S.auth),
      );
    },
  );

  test(
    'auth has brand mismatch rejection',
    () => {
      ok(
        /brand_mismatch/
          .test(S.auth),
      );
    },
  );

  test(
    'roles have no user fallback',
    () => {
      ok(
        /Array\.from\s*\(\s*new Set\s*\(\s*roles/
          .test(S.auth),
      );
    },
  );
}


/**
 * --------------------------------------------------------------------------
 * Proxy source audit
 * --------------------------------------------------------------------------
 */

if (S.proxy) {
  test(
    'proxy forwards X-Internal-Secret',
    () => {
      ok(
        /headers\.set\s*\(\s*['"]X-Internal-Secret['"]/i
          .test(S.proxy),
      );
    },
  );

  test(
    'proxy forwards roles',
    () => {
      ok(
        /X-User-Roles/i
          .test(S.proxy),
      );
    },
  );
}


/**
 * --------------------------------------------------------------------------
 * SSR source audit
 * --------------------------------------------------------------------------
 */

if (S.ssr) {
  test(
    'SSR reads actual host',
    () => {
      ok(
        /headerList\.get\s*\(\s*['"]host['"]\s*\)/
          .test(S.ssr),
      );
    },
  );

  test(
    'SSR forwards original host',
    () => {
      ok(
        /x-original-host/i
          .test(S.ssr),
      );
    },
  );

  test(
    'SSR forwards INTERNAL_GATEWAY_SECRET as X-Internal-Secret',
    () => {
      ok(
        /const\s+internalGatewaySecret\s*=\s*process\.env\.INTERNAL_GATEWAY_SECRET/
          .test(S.ssr),
        'SSR must read INTERNAL_GATEWAY_SECRET',
      );

      ok(
        /headers\[['"]x-internal-secret['"]\]\s*=\s*internalGatewaySecret/
          .test(S.ssr),
        'SSR must forward the server secret as x-internal-secret',
      );
    },
  );

  test(
    'SSR fails closed when INTERNAL_GATEWAY_SECRET is missing',
    () => {
      ok(
        /INTERNAL_GATEWAY_SECRET[\s\S]{0,500}return\s+null/
          .test(S.ssr),
        'SSR must return null when the internal gateway secret is unavailable',
      );
    },
  );

  test(
    'SSR derives X-Original-Host from actual Host header',
    () => {
      ok(
        /headerList\.get\s*\(\s*['"]host['"]\s*\)/
          .test(S.ssr),
      );

      ok(
        /headers\[['"]x-original-host['"]\]\s*=\s*authRequestContext\.publicHost/
          .test(S.ssr),
      );
    },
  );

  test(
    'SSR does not read x-forwarded-host',
    () => {
      no(
        /headerList\.get\s*\(\s*['"]x-forwarded-host['"]\s*\)/i
          .test(S.ssr),
        'SSR must not read browser-controlled x-forwarded-host',
      );
    },
  );

  test(
    'SSR does not read x-original-host',
    () => {
      no(
        /headerList\.get\s*\(\s*['"]x-original-host['"]\s*\)/i
          .test(S.ssr),
        'SSR must not read browser-controlled x-original-host',
      );
    },
  );

  test(
    'SSR has no /api/auth/me fallback',
    () => {
      no(
        /\?\s*`[^`]*\/auth\/me`\s*:\s*['"]\/api\/auth\/me['"]/s
          .test(S.ssr),
        'SSR should fail closed when gateway URL is unavailable',
      );
    },
  );
}


/**
 * --------------------------------------------------------------------------
 * BFF source audit
 * --------------------------------------------------------------------------
 */

if (S.bffAuth) {
  test(
    'BFF uses INTERNAL_GATEWAY_SECRET for gateway authentication',
    () => {
      ok(
        /process\.env\.INTERNAL_GATEWAY_SECRET/.test(S.bffRoute),
        'BFF must use INTERNAL_GATEWAY_SECRET for BFF → Gateway authentication',
      );

      no(
        /process\.env\.INTERNAL_API_SECRET/.test(S.bffRoute),
        'BFF must not use INTERNAL_API_SECRET for Gateway authentication',
      );
    },
  );

  test(
    'BFF does not trust x-forwarded-host',
    () => {
      no(
        /getRequestHost[\s\S]{0,300}x-forwarded-host/i
          .test(S.bffRoute),
        'BFF must not trust browser-controlled x-forwarded-host',
      );
    },
  );

  test(
    'BFF sends X-Original-Host to gateway',
    () => {
      ok(
        /headers\.set\s*\(\s*['"]x-original-host['"]/i
          .test(S.bffRoute),
        'BFF must send actual public host as X-Original-Host',
      );
    },
  );

  test(
    'BFF uses shared gateway URL',
    () => {
      ok(
        /const\s+gatewayUrl\s*=\s*process\.env\.GATEWAY_URL\b/
          .test(S.bffRoute),
        'BFF must read shared GATEWAY_URL',
      );

      no(
        /GATEWAY_URL_SKILLUP|GATEWAY_URL_SKILLHUBCORE/
          .test(S.bffRoute),
        'BFF must not use brand-specific gateway URLs',
      );
    },
  );

  test(
    'unified BFF uses x-internal-secret',
    () => {
      ok(
        /x-internal-secret/i
          .test(S.bffAuth),
      );
    },
  );
}

if (S.bffProfile) {
  test(
    'BFF profile uses x-internal-secret',
    () => {
      ok(
        /x-internal-secret/i
          .test(S.bffProfile),
      );
    },
  );

  test(
    'BFF profile has no legacy x-gateway-secret',
    () => {
      no(
        /x-gateway-secret/i
          .test(S.bffProfile),
        'Legacy header name detected',
      );
    },
  );
}


/**
 * ============================================================================
 * 10. ENVIRONMENT AUDIT
 * ============================================================================
 */

section(
  '10. ENVIRONMENT AUDIT',
);

const devVars =
  read(
    'services/api-gateway/.dev.vars',
  );

if (devVars) {
  test(
    'no global BRAND override',
    () => {
      no(
        /^\s*BRAND\s*=/m
          .test(devVars),
        'Global BRAND override must remain removed',
      );
    },
  );

  test(
    'gateway has INTERNAL_GATEWAY_SECRET',
    () => {
      const secretLine = devVars
        .split(/\r?\n/)
        .find((line) =>
          /^\s*INTERNAL_GATEWAY_SECRET\s*=/.test(line),
        );

      ok(
        !!secretLine,
        'INTERNAL_GATEWAY_SECRET must be defined in services/api-gateway/.dev.vars',
      );

      const [, value = ''] =
        secretLine?.match(
          /^\s*INTERNAL_GATEWAY_SECRET\s*=\s*(.*)\s*$/,
        ) || [];

      ok(
        value.trim().length > 0,
        'INTERNAL_GATEWAY_SECRET must not be empty',
      );
    },
  );
} else {
  warn(
    '.dev.vars exists',
    'Not found',
  );
}

const skillupEnv = read('apps/skillup-web/.env.local');
const rthEnv = read('apps/realtutorialhub-web/.env.local');

if (skillupEnv) {
  test(
    'SkillUp uses INTERNAL_GATEWAY_SECRET',
    () => {
      ok(
        /^\s*INTERNAL_GATEWAY_SECRET\s*=/m.test(skillupEnv),
        'SkillUp must use INTERNAL_GATEWAY_SECRET for BFF → Gateway auth',
      );

      no(
        /^\s*INTERNAL_API_SECRET\s*=/m.test(skillupEnv),
        'SkillUp should not use INTERNAL_API_SECRET for gateway auth',
      );
    },
  );
}

if (rthEnv) {
  test(
    'RTH uses INTERNAL_GATEWAY_SECRET',
    () => {
      ok(
        /^\s*INTERNAL_GATEWAY_SECRET\s*=/m.test(rthEnv),
        'RTH must use INTERNAL_GATEWAY_SECRET for BFF → Gateway auth',
      );

      no(
        /^\s*INTERNAL_API_SECRET\s*=/m.test(rthEnv),
        'RTH should not use INTERNAL_API_SECRET for gateway auth',
      );
    },
  );
}


/**
 * ============================================================================
 * APPLICATION ENVIRONMENT
 * ============================================================================
 */

const appEnvFiles = [
  'apps/skillup-web/.env.local',
  'apps/realtutorialhub-web/.env.local',
];

for (const filePath of appEnvFiles) {
  const source =
    read(filePath);

  if (!source) {
    warn(
      `${filePath} exists`,
      'Not found',
    );

    continue;
  }

  test(
    `${filePath} uses shared gateway`,
    () => {
      ok(
        /GATEWAY_URL\s*=\s*["']?http:\/\/127\.0\.0\.1:8787/
          .test(source),
      );
    },
  );
}


/**
 * ============================================================================
 * 11. SECRET LOGGING AUDIT
 * ============================================================================
 */

section(
  '11. SECRET LOGGING AUDIT',
);

const allSources =
  Object.values(S).join('\n');


/**
 * Detect explicit logging of secret values.
 *
 * These are dangerous because the actual secret value can reach logs.
 */
const dangerousSecretLoggingPatterns = [
  /console\.(?:log|info|warn|error|debug)\s*\(\s*process\.env\.(?:INTERNAL_GATEWAY_SECRET|INTERNAL_API_SECRET)\b/i,

  /console\.(?:log|info|warn|error|debug)\s*\(\s*internalGatewaySecret\b/i,

  /console\.(?:log|info|warn|error|debug)\s*\(\s*internalApiSecret\b/i,

  /console\.(?:log|info|warn|error|debug)\s*\(\s*\{[\s\S]{0,300}\bsecret\s*:\s*(?:internalGatewaySecret|internalApiSecret)\b/i,

  /console\.(?:log|info|warn|error|debug)\s*\(\s*\{[\s\S]{0,300}\b(?:internalSecret|gatewaySecret|apiSecret)\s*:\s*(?:internalGatewaySecret|internalApiSecret|process\.env\.)/i,
];

for (
  const [index, pattern]
  of dangerousSecretLoggingPatterns.entries()
) {
  test(
    `no dangerous secret logging [pattern ${index + 1}]`,
    () => {
      no(
        pattern.test(allSources),
        'Potential secret value exposure through logging detected',
      );
    },
  );
}


/**
 * Explicitly reject partial secret logging such as:
 *
 * secret?.slice(0, 8)
 * secret.substring(0, 8)
 * trimmedInternalSecret.substring(0, 10)
 * internalGatewaySecret.slice(0, 10)
 */
const partialSecretLoggingPattern =
  /console\.(?:log|info|warn|error|debug)\s*\([\s\S]{0,200}\b\w*[Ss]ecret\w*\b[\s\S]{0,100}\.(?:slice|substring|substr)\s*\(/i;

test(
  'no partial secret value logging',
  () => {
    no(
      partialSecretLoggingPattern.test(
        allSources,
      ),
      'Potential partial secret exposure through logging detected',
    );
  },
);


/**
 * The identifier itself may legitimately appear in configuration checks,
 * comments, or safe "configured/not configured" messages.
 */
test(
  'INTERNAL_GATEWAY_SECRET identifier usage is allowed',
  () => {
    ok(
      /INTERNAL_GATEWAY_SECRET/i.test(
        allSources,
      ),
    );
  },
);


test(
  'no BFF legacy secret header',
  () => {
    no(
      /x-gateway-secret/i.test(
        S.bffAuth +
        S.bffProfile,
      ),
      'Legacy header name detected',
    );
  },
);


/**
 * ============================================================================
 * 12. RUNTIME BRAND MATRIX
 * ============================================================================
 */

section(
  '12. RUNTIME MATRIX',
);

const runtimeCases = [
  [
    'SkillUp SSR',
    '127.0.0.1',
    'skillup.localhost:3009',
    'S',
    'S',
    'skillup',
  ],

  [
    'RTH SSR',
    '127.0.0.1',
    'rth.localhost:3003',
    'S',
    'S',
    'realtutorialhub',
  ],

  [
    'Fake browser original host',
    '127.0.0.1',
    'skillup.localhost',
    undefined,
    'S',
    undefined,
  ],

  [
    'Wrong secret',
    '127.0.0.1',
    'skillup.localhost',
    'bad',
    'S',
    undefined,
  ],

  [
    'Unknown trusted host',
    '127.0.0.1',
    'evil.example.com',
    'S',
    'S',
    undefined,
  ],

  [
    'Ambiguous localhost',
    'localhost',
    undefined,
    undefined,
    'S',
    undefined,
  ],

  [
    'Ambiguous IP',
    '127.0.0.1',
    undefined,
    undefined,
    'S',
    undefined,
  ],
];

for (
  const [
    name,
    gatewayHostname,
    originalHost,
    internalSecret,
    expectedSecret,
    expectedBrand,
  ]
  of runtimeCases
) {
  test(
    name,
    () => {
      const result =
        trusted({
          gatewayHostname,
          originalHost,
          internalSecret,
          expectedSecret,
        });

      eq(
        result?.brand,
        expectedBrand,
      );
    },
  );
}


/**
 * ============================================================================
 * 13. JWT BRAND MATRIX
 * ============================================================================
 */

section(
  '13. JWT BRAND MATRIX',
);

const jwt = (
  tokenBrand,
  resolvedBrand,
) =>
  !!resolvedBrand &&
  supported(tokenBrand) &&
  tokenBrand === resolvedBrand;

const jwtCases = [
  [
    'skillup',
    'skillup',
    true,
  ],

  [
    'realtutorialhub',
    'realtutorialhub',
    true,
  ],

  [
    'skillup',
    'realtutorialhub',
    false,
  ],

  [
    'realtutorialhub',
    'skillup',
    false,
  ],

  [
    undefined,
    'skillup',
    false,
  ],

  [
    'admin',
    'skillup',
    false,
  ],

  [
    '',
    'skillup',
    false,
  ],
];

for (
  const [
    tokenBrand,
    resolvedBrand,
    expected,
  ]
  of jwtCases
) {
  test(
    `JWT ${String(tokenBrand)} vs ${resolvedBrand}`,
    () => {
      eq(
        jwt(
          tokenBrand,
          resolvedBrand,
        ),
        expected,
      );
    },
  );
}


/**
 * ============================================================================
 * 14. FINAL SECURITY INVARIANTS
 * ============================================================================
 */

section(
  '14. FINAL INVARIANTS',
);

const invariants = [
  [
    'Infrastructure host never a brand',

    resolve('127.0.0.1') ===
      undefined &&

    resolve('localhost') ===
      undefined,
  ],

  [
    'Unknown host fails closed',

    resolve(
      'evil.example.com',
    ) === undefined,
  ],

  [
    'SkillUp localhost resolves SkillUp',

    resolve(
      'skillup.localhost',
    ) === 'skillup',
  ],

  [
    'RTH localhost resolves RTH',

    resolve(
      'rth.localhost',
    ) === 'realtutorialhub',
  ],

  [
    'Fake original host without secret rejected',

    trusted({
      gatewayHostname:
        '127.0.0.1',

      originalHost:
        'skillup.localhost',

      expectedSecret:
        SECRET,
    }) === undefined,
  ],
];

for (
  const [name, condition]
  of invariants
) {
  test(
    name,
    () => {
      ok(condition);
    },
  );
}


/**
 * ============================================================================
 * FINAL REPORT
 * ============================================================================
 */

const passed =
  results.filter(
    (result) =>
      result.status === 'PASS',
  ).length;

const failed =
  results.filter(
    (result) =>
      result.status === 'FAIL',
  ).length;

const warnings =
  results.filter(
    (result) =>
      result.status === 'WARN',
  ).length;

const report = {
  timestamp:
    new Date().toISOString(),

  root: ROOT,

  strict: STRICT,

  summary: {
    total:
      results.length,

    passed,

    failed,

    warnings,

    status:
      failed === 0 &&
      (!STRICT || warnings === 0)
        ? 'PASS'
        : 'FAIL',
  },

  results,

  notes,
};


/**
 * ============================================================================
 * JSON OUTPUT
 * ============================================================================
 */

if (JSON_OUT) {
  console.log(
    JSON.stringify(
      report,
      null,
      2,
    ),
  );
} else {
  section('SUMMARY');

  console.log(
    `Total: ${results.length}`,
  );

  console.log(
    `PASS : ${passed}`,
  );

  console.log(
    `FAIL : ${failed}`,
  );

  console.log(
    `WARN : ${warnings}`,
  );

  for (const result of results) {
    const symbol =
      result.status === 'PASS'
        ? '✓'
        : result.status === 'FAIL'
          ? '✗'
          : '⚠';

    console.log(
      `${symbol} ${result.name}` +
      (
        result.details
          ? ` — ${result.details}`
          : ''
      ),
    );
  }

  console.log('');

  if (
    report.summary.status ===
    'PASS'
  ) {
    console.log(
      '✓ AUTH / MULTI-BRAND AUDIT PASSED',
    );
  } else {
    console.log(
      '✗ AUTH / MULTI-BRAND AUDIT FAILED',
    );
  }
}


/**
 * ============================================================================
 * EXIT CODE
 * ============================================================================
 */

process.exitCode =
  report.summary.status ===
  'PASS'
    ? 0
    : 1;
