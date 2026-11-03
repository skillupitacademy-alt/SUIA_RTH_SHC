import type { BrowserContext } from '@playwright/test';
import { chromium } from '@playwright/test';
import fs from 'fs';

/**
 * Execution Boundary & Readiness Validation for Authentication Qualification (W1.2-BROWSER-01).
 *
 * Enforces strict fail-closed guards before any browser fixture setup or network interaction:
 * 1. Prohibits production domains (e.g. *.skillupitacademy.com, *.realtutorialhub.com, skillhubcore.in).
 * 2. Rejects userinfo credentials (user:pass@host) in configured URLs.
 * 3. Enforces exact approved project origins for all browser and API requests (rejects unapproved local ports/hosts).
 * 4. Requires explicit project origins (no guessed-port execution defaults).
 * 5. Requires tested build revision (TEST_BUILD_REVISION) and isolated environment certification.
 * 6. Wires project-to-account requirements into pre-fixture validation before browser launch.
 * 7. Validates Playwright Chromium executable presence via chromium.executablePath().
 */

const FORBIDDEN_PRODUCTION_PATTERNS = [
  /\.skillupitacademy\.com$/i,
  /\.realtutorialhub\.com$/i,
  /^skillhubcore\.in$/i,
  /production/i,
  /staging/i,
];

const ALLOWED_LOCAL_HOSTNAMES = [
  'localhost',
  '127.0.0.1',
];

export const KNOWN_PROJECTS = [
  'sentinel-checks',
  'suia-chromium',
  'rth-chromium',
  'shc-chromium',
] as const;

export const PROJECT_ACCOUNT_MAP: Record<string, string[]> = {
  'suia-chromium': [
    'TEST_SUIA_LEARNER_EMAIL',
    'TEST_SUIA_LEARNER_PASSWORD',
  ],
  'rth-chromium': [
    'TEST_RTH_LEARNER_EMAIL',
    'TEST_RTH_LEARNER_PASSWORD',
  ],
  'shc-chromium': [
    'TEST_SHC_ADMIN_EMAIL',
    'TEST_SHC_ADMIN_PASSWORD',
  ],
};

/**
 * Validates that a target URL or origin is strictly non-production, free of userinfo credentials,
 * and allowed for local test execution.
 */
export function validateOriginSafety(originUrl?: string): void {
  if (!originUrl || typeof originUrl !== 'string' || originUrl.trim() === '') {
    throw new Error(
      '[BROWSER-01 SAFETY VIOLATION] Target origin is missing or empty. Execution halted fail-closed.'
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(originUrl);
  } catch {
    throw new Error(
      `[BROWSER-01 SAFETY VIOLATION] Invalid URL format for target origin: ${originUrl}. Execution halted.`
    );
  }

  // Reject userinfo credentials
  if (parsed.username || parsed.password) {
    throw new Error(
      `[BROWSER-01 SAFETY VIOLATION] Userinfo credentials not permitted in configured URL: ${originUrl}. Execution halted.`
    );
  }

  // Enforce protocol safety
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(
      `[BROWSER-01 SAFETY VIOLATION] Disallowed protocol: ${parsed.protocol}. Execution halted.`
    );
  }

  const hostname = parsed.hostname.toLowerCase();

  // Check forbidden production domains
  for (const pattern of FORBIDDEN_PRODUCTION_PATTERNS) {
    if (pattern.test(hostname)) {
      throw new Error(
        `[BROWSER-01 SAFETY VIOLATION] Target origin matches forbidden production domain: ${parsed.origin}. Execution halted.`
      );
    }
  }

  // Check allowed local test domains
  const isDirectLocal = ALLOWED_LOCAL_HOSTNAMES.includes(hostname);
  const isSubdomainLocal = hostname.endsWith('.localhost') || hostname.endsWith('.local');

  if (!isDirectLocal && !isSubdomainLocal) {
    throw new Error(
      `[BROWSER-01 SAFETY VIOLATION] Target origin is not a qualified local test domain: ${parsed.origin}. Allowed: localhost, *.localhost, 127.0.0.1.`
    );
  }
}

/**
 * Checks whether the Chromium executable expected by the installed Playwright package exists on disk.
 * Uses chromium.executablePath() without attempting to download or launch.
 */
export function isChromiumExecutableAvailable(): boolean {
  try {
    const execPath = chromium.executablePath();
    return Boolean(execPath && fs.existsSync(execPath));
  } catch {
    return false;
  }
}

/**
 * Installs exact-origin network routing guard on a Playwright browser context.
 * Intercepts every outgoing request and strictly rejects any host or port outside the project's
 * explicit qualified allowed origin list (rejects unapproved local ports/hosts, userinfo, and foreign destinations).
 */
export async function installNetworkOriginGuard(
  context: BrowserContext,
  allowedOrigins: string[]
): Promise<void> {
  const normalizedAllowed = allowedOrigins.map(o => {
    validateOriginSafety(o);
    return new URL(o).origin.toLowerCase();
  });

  await context.route('**/*', async (route) => {
    try {
      const requestUrl = route.request().url();
      const parsed = new URL(requestUrl);

      // Reject userinfo credentials
      if (parsed.username || parsed.password) {
        await route.abort('blockedbyclient');
        return;
      }

      const targetOrigin = parsed.origin.toLowerCase();

      // Reject if not strictly in the project's exact allowed origin list
      if (!normalizedAllowed.includes(targetOrigin)) {
        await route.abort('blockedbyclient');
        return;
      }

      // Validate origin safety fail-closed
      validateOriginSafety(targetOrigin);

      await route.continue();
    } catch {
      await route.abort('blockedbyclient');
    }
  });
}

export interface ProjectReadinessRequirements {
  projectName: string;
  projectOrigin?: string;
  requiredAccountVars?: string[];
}

export interface ReadinessRecord {
  authQualificationReady: boolean;
  buildRevision?: string;
  isolatedEnvironment: boolean;
  projectOrigins: {
    suia?: string;
    rth?: string;
    shc?: string;
  };
  accountsAvailable: string[];
  chromiumExecutableAvailable: boolean;
}

export function getReadinessRecord(): ReadinessRecord {
  return {
    authQualificationReady: process.env.AUTH_QUALIFICATION_READY === 'true',
    buildRevision: process.env.TEST_BUILD_REVISION,
    isolatedEnvironment: process.env.TEST_ISOLATED_ENVIRONMENT === 'true',
    projectOrigins: {
      suia: process.env.SUIA_BASE_URL,
      rth: process.env.RTH_BASE_URL,
      shc: process.env.SHC_BASE_URL,
    },
    accountsAvailable: Object.keys(process.env).filter(
      k => k.startsWith('TEST_') && k.endsWith('_EMAIL') && Boolean(process.env[k])
    ),
    chromiumExecutableAvailable: isChromiumExecutableAvailable(),
  };
}

/**
 * Concrete fail-closed readiness check validating:
 * 1. Known project name validation (unknown projects fail closed)
 * 2. Master readiness manifest (AUTH_QUALIFICATION_READY=true)
 * 3. Tested build provenance (TEST_BUILD_REVISION)
 * 4. Isolated synthetic test environment certification (TEST_ISOLATED_ENVIRONMENT=true)
 * 5. Explicit non-empty project origin (no guessed-port fallback)
 * 6. Origin domain safety compliance
 * 7. Project-to-account prerequisite mapping BEFORE browser launch
 * 8. Installed Playwright Chromium executable availability
 */
export function checkReadinessPrerequisites(
  req: ProjectReadinessRequirements
): { ready: boolean; reason?: string } {
  // 1. Unknown project validation
  if (!KNOWN_PROJECTS.includes(req.projectName as any)) {
    return {
      ready: false,
      reason: `[NOT EXECUTED] ${req.projectName}: Unknown project name not recognized in qualification matrix.`,
    };
  }

  // Sentinel offline suite does not require network origins or accounts
  if (req.projectName === 'sentinel-checks') {
    return { ready: true };
  }

  // 2. Master readiness flag
  if (process.env.AUTH_QUALIFICATION_READY !== 'true') {
    return {
      ready: false,
      reason: `[NOT EXECUTED] ${req.projectName}: Master readiness manifest (AUTH_QUALIFICATION_READY=true) not established.`,
    };
  }

  // 3. Tested build provenance
  const buildRev = process.env.TEST_BUILD_REVISION;
  if (!buildRev || buildRev.trim() === '') {
    return {
      ready: false,
      reason: `[NOT EXECUTED] ${req.projectName}: Tested build revision (TEST_BUILD_REVISION) not specified.`,
    };
  }

  // 4. Isolated environment certification
  if (process.env.TEST_ISOLATED_ENVIRONMENT !== 'true') {
    return {
      ready: false,
      reason: `[NOT EXECUTED] ${req.projectName}: Isolated synthetic test environment not certified (TEST_ISOLATED_ENVIRONMENT=true missing).`,
    };
  }

  // 5. Explicit project origin (guessed-port default prohibited)
  if (!req.projectOrigin || req.projectOrigin.trim() === '') {
    return {
      ready: false,
      reason: `[NOT EXECUTED] ${req.projectName}: Explicit project base URL unset in environment (guessed-port default prohibited).`,
    };
  }

  // 6. Origin domain safety
  try {
    validateOriginSafety(req.projectOrigin);
  } catch (err: any) {
    return {
      ready: false,
      reason: `[NOT EXECUTED] ${req.projectName}: Configured origin violates safety boundary: ${err.message}`,
    };
  }

  // 7. Project-to-account requirements mapping evaluated BEFORE launch
  const requiredAccounts = req.requiredAccountVars !== undefined
    ? req.requiredAccountVars
    : (PROJECT_ACCOUNT_MAP[req.projectName] ?? []);

  if (requiredAccounts.length > 0) {
    const missingAccounts = requiredAccounts.filter(
      v => !process.env[v] || process.env[v]!.trim() === ''
    );
    if (missingAccounts.length > 0) {
      return {
        ready: false,
        reason: `[NOT EXECUTED] ${req.projectName}: Approved synthetic account credentials missing (${missingAccounts.length} required variables unset).`,
      };
    }
  }

  // 8. Installed Playwright Chromium executable
  if (!isChromiumExecutableAvailable()) {
    return {
      ready: false,
      reason: `[NOT EXECUTED] ${req.projectName}: Installed Playwright Chromium executable is not present on disk.`,
    };
  }

  return { ready: true };
}

/**
 * Enforces readiness boundary for a test, cleanly marking it skipped / NOT EXECUTED
 * before any browser activity occurs if prerequisites are unfulfilled.
 */
export function enforceReadinessBoundary(
  testInfo: { skip: (condition: boolean, reason: string) => void },
  req: ProjectReadinessRequirements
): void {
  const result = checkReadinessPrerequisites(req);
  if (!result.ready) {
    testInfo.skip(true, result.reason || '[NOT EXECUTED] Prerequisites unfulfilled');
  }
}
