import type { Reporter, TestCase, TestResult, TestError, FullConfig, Suite } from '@playwright/test/reporter';
import fs from 'fs';
import path from 'path';

const ALLOWED_PROJECTS = [
  'sentinel-checks',
  'suia-chromium',
  'rth-chromium',
  'shc-chromium',
];

const SCENARIO_ID_PATTERN = /^(AQ-\d{2}(?:-[A-Z]+)?|SENTINEL-\d{2})/;

/**
 * Checks whether targetPath is strictly inside ownedOutputDir without escaping via
 * directory traversal ('..') or symbolic links.
 */
export function isSafelyContainedInOwnedDir(targetPath: string, ownedDir: string): boolean {
  if (!targetPath || !ownedDir) return false;
  try {
    const resolvedTarget = path.resolve(targetPath);
    const resolvedOwned = path.resolve(ownedDir);

    // Prevent matching the directory itself or root
    if (resolvedTarget === resolvedOwned) return false;

    // Check traversal escape
    const relative = path.relative(resolvedOwned, resolvedTarget);
    if (relative.startsWith('..') || path.isAbsolute(relative) || relative === '') {
      return false;
    }

    // Reject symbolic links or junctions
    if (fs.existsSync(resolvedTarget)) {
      const lstat = fs.lstatSync(resolvedTarget);
      if (lstat.isSymbolicLink()) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Derives a strictly allowlisted scenario identifier from test metadata.
 * Strips all dynamic error messages, credentials, or arbitrary user titles to prevent
 * secret leakage through title formatting.
 */
export function getAllowlistedScenarioId(rawTitle: string): string {
  if (!rawTitle) return '[UNLISTED_SCENARIO]';
  const match = rawTitle.match(SCENARIO_ID_PATTERN);
  return match ? match[1] : '[UNLISTED_SCENARIO]';
}

export function getAllowlistedProject(rawProject?: string): string {
  if (!rawProject) return '[UNKNOWN_PROJECT]';
  return ALLOWED_PROJECTS.includes(rawProject) ? rawProject : '[UNKNOWN_PROJECT]';
}

const SENSITIVE_PATTERNS = [
  /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g,
  /((?:password|passwd|pwd|token|secret|authorization|cookie|session|accessToken|refreshToken)\s*[:=]\s*)([^\r\n,;]+)/gi,
  /("?(?:password|passwd|pwd|token|secret|authorization|cookie|session|accessToken|refreshToken)"?\s*:\s*)"[^"\r\n]+"/gi,
  /(Cookie:\s*)([^\r\n]+)/gi,
  /((?:Authorization|auth):\s*(?:Bearer\s+)?)([^\r\n]+)/gi,
  /(Bearer\s+)[a-zA-Z0-9._~+/-]+=*/gi,
  /<fake[^>]*>/gi,
  /SENTINEL_[A-Za-z0-9_]+/g,
];

/**
 * Offline utility function for in-memory string redaction checks.
 */
export function sanitizeText(text: string): string {
  if (!text) return text;
  let sanitized = String(text);
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, (match, prefix) => {
      if (prefix) return `${prefix}[REDACTED]`;
      return '[REDACTED_SENTINEL]';
    });
  }
  return sanitized;
}

export function sanitizeErrorText(text: string): string {
  return sanitizeText(text);
}

export default class SafeQualificationReporter implements Reporter {
  private totalTests = 0;
  private passedTests = 0;
  private failedTests = 0;
  private skippedTests = 0;
  private ownedOutputDir: string;

  constructor(options?: { outputDir?: string }) {
    this.ownedOutputDir = options?.outputDir
      ? path.resolve(options.outputDir)
      : (process.env.AUTH_QUALIFICATION_OUTPUT_DIR
          ? path.resolve(process.env.AUTH_QUALIFICATION_OUTPUT_DIR)
          : path.resolve(__dirname, '..', '.run-artifacts'));
  }

  onBegin(_config: FullConfig, suite: Suite): void {
    this.totalTests = suite.allTests().length;
    process.stdout.write(
      `\n[QUALIFICATION_REPORTER] Discovered ${this.totalTests} tests across projects\n`
    );
    for (const test of suite.allTests()) {
      const proj = getAllowlistedProject(test.parent.project()?.name);
      const scenarioId = getAllowlistedScenarioId(test.title);
      const file = test.location?.file ? path.basename(test.location.file) : 'unknown';
      const line = test.location?.line ?? 0;
      process.stdout.write(`  [${proj}] › ${file}:${line} › ${scenarioId}\n`);
    }
    process.stdout.write('\n');
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const projectName = getAllowlistedProject(test.parent.project()?.name);
    const scenarioId = getAllowlistedScenarioId(test.title);
    const duration = result.duration;

    if (result.status === 'passed') {
      this.passedTests++;
      process.stdout.write(`  ok [${projectName}] ${scenarioId} (${duration}ms)\n`);
    } else if (result.status === 'skipped') {
      this.skippedTests++;
      process.stdout.write(`  -  [${projectName}] ${scenarioId} (SKIPPED / NOT EXECUTED)\n`);
    } else {
      this.failedTests++;
      // FIXED allowlisted reason code only.
      // Suppresses arbitrary raw error text, dynamic titles, locator stacks, DOM dumps, and request bodies.
      let reasonCode = 'INTENDED_OR_ASSERTION_FAILURE';
      if (result.status === 'timedOut') {
        reasonCode = 'TEST_TIMEOUT';
      }
      process.stdout.write(`  FAIL [${projectName}] ${scenarioId} (${duration}ms)\n`);
      process.stdout.write(`       Reason: [${reasonCode}]\n`);
    }

    // Clean up test attachments ONLY if they are strictly contained inside ownedOutputDir
    if (result.attachments && result.attachments.length > 0) {
      for (const attachment of result.attachments) {
        if (attachment.path && isSafelyContainedInOwnedDir(attachment.path, this.ownedOutputDir)) {
          try {
            fs.unlinkSync(attachment.path);
          } catch {
            // Ignore deletion errors
          }
        }
      }
    }
  }

  onStdOut(_chunk: string | Buffer): void {
    // Suppress arbitrary test stdout to guarantee zero credential/chunk leakage
  }

  onStdErr(_chunk: string | Buffer): void {
    // Suppress arbitrary test stderr to guarantee zero credential/chunk leakage
  }

  onError(_error: TestError): void {
    // Emit only fixed generic notice, never raw error message, dynamic title, or call stack
    process.stderr.write(`[QUALIFICATION_REPORTER] Global execution notice\n`);
  }

  onEnd(): void {
    process.stdout.write(
      `\n[QUALIFICATION_REPORTER] Complete: ${this.passedTests} passed, ${this.failedTests} failed, ${this.skippedTests} skipped (${this.totalTests} total)\n`
    );
    if (this.skippedTests > 0) {
      process.stdout.write(
        `[QUALIFICATION_REPORTER] Notice: ${this.skippedTests} tests marked SKIPPED / NOT EXECUTED (Prerequisites unfulfilled - Not a full runtime pass)\n\n`
      );
    }

    // Clean up only the dedicated owned output directory; NEVER touch the shared workspace test-results
    if (fs.existsSync(this.ownedOutputDir) && this.ownedOutputDir !== path.resolve(process.cwd())) {
      try {
        fs.rmSync(this.ownedOutputDir, { recursive: true, force: true });
      } catch {
        // Ignore
      }
    }
  }
}
