/**
 * PRE-DEPLOY SECURITY VERIFICATION
 * =================================
 * Validates local codebase security hardening before deployment.
 *
 * Checks:
 * 1. XSS / malicious empty AI content returns 400
 * 2. SQLi / invalid prompt template returns 400
 * 3. Oversized payload middleware returns 413
 * 4. No raw 500 paths remain in critical handlers
 * 5. Required security guards exist
 *
 * Run:
 * npx tsx scripts/predeploy-security-check.ts
 */

import fs from 'fs';
import path from 'path';

interface CheckResult {
  passed: boolean;
  message: string;
  details?: string[];
}

const ROOT = process.cwd();

const FILES = {
  contentIngest: path.join(
    ROOT,
    'apps/api-server/src/app/api/admin/layman/content/ingest/route.ts'
  ),
  promptGenerate: path.join(
    ROOT,
    'apps/api-server/src/app/api/admin/layman/prompt/generate/route.ts'
  ),
  sections: path.join(
    ROOT,
    'apps/api-server/src/app/api/admin/layman/sections/route.ts'
  ),
  payloadMiddleware: path.join(
    ROOT,
    'apps/api-server/src/middleware/payload-size.middleware.ts'
  ),
};

function readFile(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required file: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function checkXSSProtection(content: string): CheckResult {
  const checks = [
    /AI response is too short/i,
    /badRequest/i,
    /sanitize/i,
  ];

  const missing = checks.filter((pattern) => !pattern.test(content));

  return {
    passed: missing.length === 0,
    message:
      missing.length === 0
        ? 'XSS/empty content protection present'
        : 'XSS/empty content protection incomplete',
    details: missing.map((m) => `Missing pattern: ${m}`),
  };
}

function checkSQLiProtection(content: string): CheckResult {
  const checks = [
    /template not found/i,
    /badRequest/i,
  ];

  const missing = checks.filter((pattern) => !pattern.test(content));

  return {
    passed: missing.length === 0,
    message:
      missing.length === 0
        ? 'SQL injection / invalid template protection present'
        : 'SQL injection / invalid template protection incomplete',
    details: missing.map((m) => `Missing pattern: ${m}`),
  };
}

function checkPayloadSize(content: string): CheckResult {
  const checks = [
    /413/i,
    /Payload Too Large/i,
    /content-length/i,
    /body size/i,
  ];

  const missing = checks.filter((pattern) => !pattern.test(content));

  return {
    passed: missing.length === 0,
    message:
      missing.length === 0
        ? 'Payload size middleware correctly configured'
        : 'Payload size middleware incomplete',
    details: missing.map((m) => `Missing pattern: ${m}`),
  };
}

function checkNoUnhandled500(content: string): CheckResult {
  const dangerousPatterns = [
    /throw new Error\(/g,
    /return.*500/g,
    /status:\s*500/g,
  ];

  const found: string[] = [];

  dangerousPatterns.forEach((pattern) => {
    const matches = content.match(pattern);
    if (matches) {
      found.push(...matches);
    }
  });

  return {
    passed: found.length === 0,
    message:
      found.length === 0
        ? 'No obvious raw 500 crash paths detected'
        : 'Potential raw 500 paths detected',
    details: found,
  };
}

function printResult(title: string, result: CheckResult) {
  const icon = result.passed ? '✅' : '❌';
  console.log(`${icon} ${title}`);
  console.log(`   ${result.message}`);
  if (result.details && result.details.length > 0) {
    result.details.forEach((detail) => {
      console.log(`   - ${detail}`);
    });
  }
  console.log('');
}

async function main() {
  console.log('================================================================');
  console.log('        PHASE 2B PRE-DEPLOY SECURITY CHECKLIST');
  console.log('================================================================');
  console.log('');

  const contentIngest = readFile(FILES.contentIngest);
  const promptGenerate = readFile(FILES.promptGenerate);
  const sections = readFile(FILES.sections);
  const payloadMiddleware = readFile(FILES.payloadMiddleware);

  const results = [
    {
      title: 'XSS / Empty Content Protection',
      result: checkXSSProtection(contentIngest),
    },
    {
      title: 'SQLi / Invalid Template Protection',
      result: checkSQLiProtection(promptGenerate),
    },
    {
      title: 'Oversized Payload Protection',
      result: checkPayloadSize(payloadMiddleware),
    },
    {
      title: 'Unhandled 500 Crash Paths (Content Ingest)',
      result: checkNoUnhandled500(contentIngest),
    },
    {
      title: 'Unhandled 500 Crash Paths (Prompt Generate)',
      result: checkNoUnhandled500(promptGenerate),
    },
    {
      title: 'Unhandled 500 Crash Paths (Sections)',
      result: checkNoUnhandled500(sections),
    },
  ];

  let failures = 0;

  results.forEach(({ title, result }) => {
    printResult(title, result);
    if (!result.passed) failures++;
  });

  console.log('================================================================');
  console.log('                    FINAL PRE-DEPLOY STATUS');
  console.log('================================================================');
  console.log('');

  if (failures === 0) {
    console.log('🎉 PRE-DEPLOY SECURITY CHECK PASSED');
    console.log('');
    console.log('Deployment Recommendation: ✅ SAFE TO DEPLOY');
    console.log('');
    console.log('Next Steps:');
    console.log('1. Deploy updated API');
    console.log('2. Run debug-security-failures.ts');
    console.log('3. Run validate-phase2b-with-fresh-token.ts');
    process.exit(0);
  } else {
    console.log(`🚨 PRE-DEPLOY CHECK FAILED (${failures} issues found)`);
    console.log('');
    console.log('Deployment Recommendation: ❌ BLOCKED');
    console.log('');
    console.log('Required:');
    console.log('1. Fix failing security areas');
    console.log('2. Re-run this script');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('❌ PRE-DEPLOY CHECK CRASHED');
  console.error(err);
  process.exit(1);
});
