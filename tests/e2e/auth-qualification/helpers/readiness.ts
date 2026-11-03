import type { BrowserContext } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Execution Boundary & Readiness Validation for Authentication Qualification (W1.2-BROWSER-01).
 *
 * Enforces strict fail-closed guards before any browser fixture setup or network interaction:
 * 1. Prohibits production domains (e.g. *.skillupitacademy.com, *.realtutorialhub.com, skillhubcore.in).
 * 2. Parses URL origin via new URL(originUrl).origin and validates hostname.
 * 3. Blocks disallowed network requests and redirects before network delivery.
 * 4. Requires explicit readiness manifest (AUTH_QUALIFICATION_READY=true, isolated environment, accounts).
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

/**
 * Validates that a target URL or origin is strictly non-production and allowed for isolated test execution.
 * Fails closed immediately if missing, empty, or matching a production/unsafe domain.
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
 * Installs network-level routing guards on a Playwright browser context.
 * Intercepts every outgoing HTTP/HTTPS request and aborts immediately if pointing to an unsafe origin.
 */
export async function installNetworkOriginGuard(context: BrowserContext): Promise<void> {
  await context.route('**/*', (route) => {
    const requestUrl = route.request().url();
    try {
      validateOriginSafety(requestUrl);
      route.continue();
    } catch {
      // Abort immediately before network delivery
      route.abort('blockedbyclient');
    }
  });
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
  chromiumAvailable: boolean;
}

export function isChromiumAvailable(): boolean {
  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) return false;
  const playwrightBrowsersPath = path.join(localAppData, 'ms-playwright');
  if (!fs.existsSync(playwrightBrowsersPath)) return false;
  try {
    const entries = fs.readdirSync(playwrightBrowsersPath);
    return entries.some(entry => entry.startsWith('chromium_headless_shell-') || entry.startsWith('chromium-'));
  } catch {
    return false;
  }
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
    chromiumAvailable: isChromiumAvailable(),
  };
}

export function checkReadinessPrerequisites(
  scenarioId: string,
  requiredAccountVars: string[] = []
): { ready: boolean; reason?: string } {
  // 1. Master readiness flag
  if (process.env.AUTH_QUALIFICATION_READY !== 'true') {
    return {
      ready: false,
      reason: `${scenarioId}: Isolated environment readiness manifest (AUTH_QUALIFICATION_READY=true) not established.`,
    };
  }

  // 2. Isolated environment flag
  if (process.env.TEST_ISOLATED_ENVIRONMENT !== 'true') {
    return {
      ready: false,
      reason: `${scenarioId}: Target environment is not certified as an isolated synthetic test environment (TEST_ISOLATED_ENVIRONMENT=true missing).`,
    };
  }

  // 3. Required synthetic account credentials
  const missingAccounts = requiredAccountVars.filter(v => !process.env[v] || process.env[v]!.trim() === '');
  if (missingAccounts.length > 0) {
    return {
      ready: false,
      reason: `${scenarioId}: Synthetic test accounts missing (${missingAccounts.length} required variables unset).`,
    };
  }

  // 4. Chromium availability
  if (!isChromiumAvailable()) {
    return {
      ready: false,
      reason: `${scenarioId}: Chromium browser binary is not installed in the local Playwright cache.`,
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
  scenarioId: string,
  requiredAccountVars: string[] = []
): void {
  const result = checkReadinessPrerequisites(scenarioId, requiredAccountVars);
  if (!result.ready) {
    testInfo.skip(true, `[NOT EXECUTED] ${result.reason}`);
  }
}
