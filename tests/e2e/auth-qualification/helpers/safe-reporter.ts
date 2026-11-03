import type { Reporter, TestCase, TestResult, TestError } from '@playwright/test/reporter';

const SENSITIVE_PATTERNS = [
  /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g, // JWTs
  /(password|secret|authorization|cookie|token)=([^&\s]+)/gi,         // Secret params
  /("?(?:password|token|secret|accessToken|refreshToken)"?\s*:\s*)"[^"]+"/gi, // JSON secrets
];

export function sanitizeErrorText(text: string): string {
  if (!text) return text;
  let sanitized = text;
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '$1[REDACTED]');
  }
  return sanitized;
}

export default class SafeQualificationReporter implements Reporter {
  onTestEnd(test: TestCase, result: TestResult): void {
    if (result.errors && result.errors.length > 0) {
      for (const err of result.errors) {
        if (err.message) {
          err.message = sanitizeErrorText(err.message);
        }
        if (err.stack) {
          err.stack = sanitizeErrorText(err.stack);
        }
        if (err.value) {
          err.value = sanitizeErrorText(String(err.value));
        }
      }
    }
  }

  onError(error: TestError): void {
    if (error.message) {
      error.message = sanitizeErrorText(error.message);
    }
    if (error.stack) {
      error.stack = sanitizeErrorText(error.stack);
    }
    if (error.value) {
      error.value = sanitizeErrorText(String(error.value));
    }
  }
}
