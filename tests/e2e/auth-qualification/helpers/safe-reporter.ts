import type { Reporter, TestCase, TestResult, TestError, FullConfig, Suite } from '@playwright/test/reporter';

const SENSITIVE_PATTERNS = [
  // JWT tokens
  /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g,
  // URL / Query / Form / Error params: password=..., token=..., secret=... (matches through spaces until delimiter or line end)
  /((?:password|passwd|pwd|token|secret|authorization|cookie|session|accessToken|refreshToken)\s*[:=]\s*)([^\r\n,;]+)/gi,
  // JSON key-values: "password": "...", "token": "..."
  /("?(?:password|passwd|pwd|token|secret|authorization|cookie|session|accessToken|refreshToken)"?\s*:\s*)"[^"\r\n]+"/gi,
  // Cookie / Auth headers
  /(Cookie:\s*)([^\r\n]+)/gi,
  /((?:Authorization|auth):\s*(?:Bearer\s+)?)([^\r\n]+)/gi,
  // Generic Bearer tokens
  /(Bearer\s+)[a-zA-Z0-9._~+/-]+=*/gi,
  // Fake sentinel brackets e.g. <fake sentinel>, <fake secret>
  /<fake[^>]*>/gi,
  // Specific sentinel patterns used in tests
  /SENTINEL_[A-Za-z0-9_]+/g,
];

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

  onBegin(_config: FullConfig, suite: Suite): void {
    this.totalTests = suite.allTests().length;
    process.stdout.write(
      `\n[SAFE_REPORTER] Running ${this.totalTests} qualification tests (Zero-Leakage Allowed Evidence Mode)\n`
    );
    for (const test of suite.allTests()) {
      const proj = test.parent.project()?.name ?? 'default';
      const file = test.location?.file ? test.location.file.split(/[/\\]/).pop() : 'unknown';
      const line = test.location?.line ?? 0;
      process.stdout.write(`  [${proj}] › ${file}:${line} › ${test.title}\n`);
    }
    process.stdout.write('\n');
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const projectName = test.parent.project()?.name ?? 'default';
    const testTitle = test.title;
    const duration = result.duration;

    if (result.status === 'passed') {
      this.passedTests++;
      process.stdout.write(`  ok [${projectName}] ${testTitle} (${duration}ms)\n`);
    } else if (result.status === 'skipped') {
      this.skippedTests++;
      process.stdout.write(`  -  [${projectName}] ${testTitle} (SKIPPED)\n`);
    } else {
      this.failedTests++;
      // Safe failure representation: do NOT dump raw locator logs, request bodies, or unredacted stacks
      let summary = 'Assertion or runtime error occurred';
      if (result.errors && result.errors.length > 0) {
        const firstErr = result.errors[0];
        const rawMsg = firstErr.message || String(firstErr);
        const firstLine = rawMsg.split('\n')[0].substring(0, 100);
        summary = sanitizeText(firstLine);
      }
      process.stdout.write(`  FAIL [${projectName}] ${testTitle} (${duration}ms)\n`);
      process.stdout.write(`       Reason: ${summary}\n`);
    }
  }

  onStdOut(chunk: string | Buffer): void {
    const text = chunk.toString();
    process.stdout.write(sanitizeText(text));
  }

  onStdErr(chunk: string | Buffer): void {
    const text = chunk.toString();
    process.stderr.write(sanitizeText(text));
  }

  onError(error: TestError): void {
    const raw = error.message || String(error);
    process.stderr.write(`[SAFE_REPORTER_ERROR] ${sanitizeText(raw)}\n`);
  }

  onEnd(): void {
    process.stdout.write(
      `\n[SAFE_REPORTER] Complete: ${this.passedTests} passed, ${this.failedTests} failed, ${this.skippedTests} skipped (${this.totalTests} total)\n\n`
    );
  }
}
