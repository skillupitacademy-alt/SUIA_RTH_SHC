/**
 * Execution Boundary & Readiness Validation for Authentication Qualification (W1.2-BROWSER-01).
 *
 * Enforces strict fail-closed guards before any browser fixture setup or network interaction:
 * 1. Prohibits production domains (e.g. *.skillupitacademy.com, *.realtutorialhub.com, skillhubcore.in).
 * 2. Requires explicit readiness manifest flag (AUTH_QUALIFICATION_READY=true).
 * 3. Deterministically skips scenarios as NOT EXECUTED when prerequisites are missing.
 */

const FORBIDDEN_PRODUCTION_PATTERNS = [
  /\.skillupitacademy\.com/i,
  /\.realtutorialhub\.com/i,
  /skillhubcore\.in/i,
  /^https?:\/\/[^\/]*production/i,
  /^https?:\/\/[^\/]*staging/i,
];

const ALLOWED_LOCAL_PATTERNS = [
  /^https?:\/\/localhost(:\d+)?$/i,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/i,
  /^https?:\/\/[a-z0-9-]+\.localhost(:\d+)?$/i,
  /^https?:\/\/[a-z0-9-]+\.local(:\d+)?$/i,
];

/**
 * Validates that a target URL is strictly non-production and allowed for isolated test execution.
 * Fails closed immediately if a production or unsafe domain is encountered.
 */
export function validateOriginSafety(originUrl?: string): void {
  if (!originUrl) return;

  for (const pattern of FORBIDDEN_PRODUCTION_PATTERNS) {
    if (pattern.test(originUrl)) {
      throw new Error(
        `[BROWSER-01 SAFETY VIOLATION] Target origin matches forbidden production domain: ${originUrl}. Execution halted.`
      );
    }
  }

  const isAllowed = ALLOWED_LOCAL_PATTERNS.some(p => p.test(originUrl));
  if (!isAllowed) {
    throw new Error(
      `[BROWSER-01 SAFETY VIOLATION] Target origin is not a qualified local test domain: ${originUrl}. Allowed: localhost, *.localhost, 127.0.0.1.`
    );
  }
}

/**
 * Checks readiness manifest before running an authenticated browser scenario.
 * If isolated synthetic environment or accounts are not established, skips the test cleanly
 * recording status as NOT EXECUTED.
 */
export function enforceReadinessBoundary(
  testInfo: { skip: (condition: boolean, reason: string) => void },
  scenarioId: string,
  requiredAccountVars: string[] = []
): void {
  // 1. Check master readiness flag
  const isReady = process.env.AUTH_QUALIFICATION_READY === 'true';
  if (!isReady) {
    testInfo.skip(
      true,
      `[NOT EXECUTED] ${scenarioId}: Isolated environment readiness manifest (AUTH_QUALIFICATION_READY=true) not established.`
    );
    return;
  }

  // 2. Check required synthetic credentials without leaking names or values
  const missingAccounts = requiredAccountVars.filter(v => !process.env[v] || process.env[v]!.trim() === '');
  if (missingAccounts.length > 0) {
    testInfo.skip(
      true,
      `[NOT EXECUTED] ${scenarioId}: Synthetic test accounts missing (${missingAccounts.length} required variables unset).`
    );
  }
}
