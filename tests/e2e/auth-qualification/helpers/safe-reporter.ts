import type { Reporter, TestCase, TestResult, TestError, FullConfig, Suite } from '@playwright/test/reporter';
import fs from 'fs';
import path from 'path';
import {
  isSafelyContainedInOwnedDir,
  safeCleanupRunDirectory,
  FIXED_HARNESS_ARTIFACTS_PARENT,
} from './output-ownership';

export { isSafelyContainedInOwnedDir } from './output-ownership';

const ALLOWED_PROJECTS = [
  'sentinel-checks',
  'suia-chromium',
  'rth-chromium',
  'shc-chromium',
];

const SCENARIO_ID_PATTERN = /^(AQ-\d{2}(?:-[A-Z]+)?|SENTINEL-\d{2})/;

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

export interface SafeReporterOptions {
  outputDir?: string;
  runId?: string;
  ownershipToken?: string;
  parentDir?: string;
}

export default class SafeQualificationReporter implements Reporter {
  private totalTests = 0;
  private passedTests = 0;
  private failedTests = 0;
  private skippedTests = 0;
  private ownedOutputDir?: string;
  private runId?: string;
  private ownershipToken?: string;
  private parentDir: string;

  constructor(options?: SafeReporterOptions) {
    this.ownedOutputDir = options?.outputDir;
    this.runId = options?.runId || process.env.AUTH_QUALIFICATION_RUN_ID;
    this.ownershipToken = options?.ownershipToken || process.env.AUTH_QUALIFICATION_OWNERSHIP_TOKEN;
    this.parentDir = options?.parentDir
      ? path.resolve(options.parentDir)
      : FIXED_HARNESS_ARTIFACTS_PARENT;
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
    if (result.attachments && result.attachments.length > 0 && this.ownedOutputDir) {
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

    // Clean up only the verified, genuine run-owned directory using ownership token validation.
    // NEVER touches the shared workspace test-results, and NEVER deletes the fixed parent containing sibling runs.
    if (this.ownedOutputDir) {
      safeCleanupRunDirectory(
        this.ownedOutputDir,
        this.runId,
        this.ownershipToken,
        this.parentDir
      );

      // Register exit hook to clean up any terminal .last-run.json re-created by Playwright runner at process termination
      process.once('exit', () => {
        try {
          if (this.ownedOutputDir && fs.existsSync(this.ownedOutputDir)) {
            const rel = path.relative(this.parentDir, this.ownedOutputDir);
            if (!rel.startsWith('..') && !path.isAbsolute(rel) && rel !== '') {
              const files = fs.readdirSync(this.ownedOutputDir);
              if (files.length <= 1 && (files.length === 0 || files[0] === '.last-run.json')) {
                fs.rmSync(this.ownedOutputDir, { recursive: true, force: true });
              }
            }
          }
        } catch {
          // Ignore exit errors
        }
      });
    }
  }
}
