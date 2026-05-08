/**
 * Tutorial Legacy System Dependency Audit Executor
 * 
 * Performs comprehensive audit of all dependencies on:
 * - /api/tutorial/content/* endpoints
 * - tutorial_content table
 * - TutorialService.getContent()
 * 
 * Usage:
 * npx tsx scripts/execute-dependency-audit.ts
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface AuditFinding {
  category: string;
  file: string;
  line: number;
  content: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  action: string;
}

interface AuditReport {
  timestamp: string;
  totalFindings: number;
  byCategory: Record<string, number>;
  byRisk: Record<string, number>;
  findings: AuditFinding[];
  recommendations: string[];
}

const AUDIT_CATEGORIES = {
  FRONTEND_API_CALL: 'Frontend API Call',
  BACKEND_SERVICE: 'Backend Service',
  DATABASE_QUERY: 'Database Query',
  SCRIPT: 'Script/Automation',
  TEST: 'Test File',
  DOCUMENTATION: 'Documentation',
  DEPRECATED_ROUTE: 'Deprecated Route (Expected)',
};

const SEARCH_PATTERNS = [
  {
    pattern: '/api/tutorial/content',
    category: AUDIT_CATEGORIES.FRONTEND_API_CALL,
    excludePaths: [
      'node_modules',
      '.next',
      '.turbo',
      'dist',
      'build',
      'audit-reports',
      'docs/tutorial-architecture-migration.md',
      'docs/tutorial-legacy-dependency-audit.md',
    ],
  },
  {
    pattern: 'TutorialService',
    category: AUDIT_CATEGORIES.BACKEND_SERVICE,
    excludePaths: [
      'node_modules',
      '.next',
      '.turbo',
      'dist',
      'build',
      'audit-reports',
    ],
  },
  {
    pattern: 'tutorialContent|tutorial_content',
    category: AUDIT_CATEGORIES.DATABASE_QUERY,
    excludePaths: [
      'node_modules',
      '.next',
      '.turbo',
      'dist',
      'build',
      'audit-reports',
      'packages/db-tutorial/src/schema',
    ],
  },
];

function executeGrep(pattern: string, excludePaths: string[]): string {
  try {
    const excludeArgs = excludePaths.map(p => `--exclude-dir=${p}`).join(' ');
    const cmd = `grep -rn "${pattern}" . ${excludeArgs} --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null || true`;
    return execSync(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
  } catch (error) {
    return '';
  }
}

function categorizeRisk(file: string, content: string): 'LOW' | 'MEDIUM' | 'HIGH' {
  // Deprecated routes are expected (LOW risk)
  if (file.includes('api/tutorial/content/[subtopicId]/route.ts')) {
    return 'LOW';
  }

  // Documentation is LOW risk
  if (file.includes('docs/') || file.includes('README')) {
    return 'LOW';
  }

  // Test files are LOW risk
  if (file.includes('__tests__') || file.includes('.test.') || file.includes('.spec.') || file.includes('scripts/test-')) {
    return 'LOW';
  }

  // Scripts are MEDIUM risk
  if (file.includes('scripts/')) {
    return 'MEDIUM';
  }

  // Production frontend code is HIGH risk
  if (file.includes('apps/') && file.includes('src/') && !file.includes('api/')) {
    return 'HIGH';
  }

  // Backend services are HIGH risk
  if (file.includes('modules/') || file.includes('services/') || file.includes('repositories/')) {
    return 'HIGH';
  }

  return 'MEDIUM';
}

function determineAction(file: string, risk: 'LOW' | 'MEDIUM' | 'HIGH'): string {
  if (file.includes('api/tutorial/content/[subtopicId]/route.ts')) {
    return 'Keep with deprecation warnings (already implemented)';
  }

  if (file.includes('docs/') || file.includes('README')) {
    return 'Update documentation to reference new system';
  }

  if (file.includes('__tests__') || file.includes('.test.') || file.includes('.spec.')) {
    return 'Update tests or mark as deprecated';
  }

  if (file.includes('scripts/')) {
    return 'Review and migrate to tutorial_sections if actively used';
  }

  if (risk === 'HIGH') {
    return 'URGENT: Migrate to /api/tutorial/sections/* system';
  }

  return 'Review and determine migration priority';
}

function parseGrepOutput(output: string, category: string): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const lines = output.split('\n').filter(l => l.trim());

  for (const line of lines) {
    const match = line.match(/^(.+?):(\d+):(.+)$/);
    if (match) {
      const [, file, lineNum, content] = match;
      const risk = categorizeRisk(file, content);
      const action = determineAction(file, risk);

      findings.push({
        category,
        file: file.replace(/^\.\//, ''),
        line: parseInt(lineNum, 10),
        content: content.trim(),
        risk,
        action,
      });
    }
  }

  return findings;
}

function generateReport(findings: AuditFinding[]): AuditReport {
  const byCategory: Record<string, number> = {};
  const byRisk: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0 };

  for (const finding of findings) {
    byCategory[finding.category] = (byCategory[finding.category] || 0) + 1;
    byRisk[finding.risk]++;
  }

  const recommendations: string[] = [];

  if (byRisk.HIGH > 0) {
    recommendations.push(`⚠️  URGENT: ${byRisk.HIGH} HIGH-RISK dependencies found - immediate migration required`);
  }

  if (byRisk.MEDIUM > 0) {
    recommendations.push(`📋 ${byRisk.MEDIUM} MEDIUM-RISK dependencies found - review and plan migration`);
  }

  if (byRisk.LOW > 0) {
    recommendations.push(`✅ ${byRisk.LOW} LOW-RISK references found - mostly expected (deprecated routes, docs, tests)`);
  }

  if (byRisk.HIGH === 0 && byRisk.MEDIUM === 0) {
    recommendations.push('✅ NO HIGH or MEDIUM risk dependencies found');
    recommendations.push('✅ Safe to proceed with Phase 5 (Final Removal) after LOW-RISK cleanup');
  }

  return {
    timestamp: new Date().toISOString(),
    totalFindings: findings.length,
    byCategory,
    byRisk,
    findings,
    recommendations,
  };
}

function printReport(report: AuditReport): void {
  console.log('\n' + '='.repeat(100));
  console.log('📊 TUTORIAL LEGACY SYSTEM DEPENDENCY AUDIT REPORT');
  console.log('='.repeat(100));
  console.log(`\n⏰ Timestamp: ${report.timestamp}`);
  console.log(`📁 Total Findings: ${report.totalFindings}`);

  console.log('\n' + '─'.repeat(100));
  console.log('📈 FINDINGS BY RISK LEVEL');
  console.log('─'.repeat(100));
  console.log(`🔴 HIGH:   ${report.byRisk.HIGH} (Requires immediate migration)`);
  console.log(`🟡 MEDIUM: ${report.byRisk.MEDIUM} (Review and plan migration)`);
  console.log(`🟢 LOW:    ${report.byRisk.LOW} (Expected references - docs, tests, deprecated routes)`);

  console.log('\n' + '─'.repeat(100));
  console.log('📊 FINDINGS BY CATEGORY');
  console.log('─'.repeat(100));
  for (const [category, count] of Object.entries(report.byCategory)) {
    console.log(`  ${category}: ${count}`);
  }

  console.log('\n' + '─'.repeat(100));
  console.log('🔍 DETAILED FINDINGS');
  console.log('─'.repeat(100));

  const groupedByRisk = {
    HIGH: report.findings.filter(f => f.risk === 'HIGH'),
    MEDIUM: report.findings.filter(f => f.risk === 'MEDIUM'),
    LOW: report.findings.filter(f => f.risk === 'LOW'),
  };

  for (const [risk, findings] of Object.entries(groupedByRisk)) {
    if (findings.length === 0) continue;

    const icon = risk === 'HIGH' ? '🔴' : risk === 'MEDIUM' ? '🟡' : '🟢';
    console.log(`\n${icon} ${risk} RISK (${findings.length} findings):`);
    console.log('─'.repeat(100));

    for (const finding of findings) {
      console.log(`\n  File: ${finding.file}:${finding.line}`);
      console.log(`  Category: ${finding.category}`);
      console.log(`  Content: ${finding.content.substring(0, 100)}${finding.content.length > 100 ? '...' : ''}`);
      console.log(`  Action: ${finding.action}`);
    }
  }

  console.log('\n' + '─'.repeat(100));
  console.log('💡 RECOMMENDATIONS');
  console.log('─'.repeat(100));
  for (const rec of report.recommendations) {
    console.log(`  ${rec}`);
  }

  console.log('\n' + '─'.repeat(100));
  console.log('📋 NEXT STEPS');
  console.log('─'.repeat(100));

  if (report.byRisk.HIGH > 0) {
    console.log('  1. ⚠️  URGENT: Review and migrate HIGH-RISK dependencies immediately');
    console.log('  2. 📋 Plan migration for MEDIUM-RISK dependencies');
    console.log('  3. 🧹 Clean up LOW-RISK references (docs, tests)');
    console.log('  4. ⏳ Defer Phase 5 (Final Removal) until migrations complete');
  } else if (report.byRisk.MEDIUM > 0) {
    console.log('  1. 📋 Review MEDIUM-RISK dependencies and create migration plan');
    console.log('  2. 🧹 Clean up LOW-RISK references (docs, tests)');
    console.log('  3. ⏳ Defer Phase 5 (Final Removal) until migrations complete');
  } else {
    console.log('  1. ✅ Clean up LOW-RISK references (docs, tests, deprecated routes)');
    console.log('  2. ✅ Proceed to Phase 5 (Final Removal) - safe to remove legacy system');
    console.log('  3. 🎉 No production code depends on legacy system');
  }

  console.log('\n' + '='.repeat(100));
}

function saveReport(report: AuditReport): void {
  const reportsDir = path.join(process.cwd(), 'audit-reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `tutorial-legacy-audit-${timestamp}.json`;
  const filepath = path.join(reportsDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Full report saved to: ${filepath}`);
}

async function main() {
  console.log('🔍 Starting Tutorial Legacy System Dependency Audit...\n');

  const allFindings: AuditFinding[] = [];

  for (const { pattern, category, excludePaths } of SEARCH_PATTERNS) {
    console.log(`Searching for: ${pattern} (${category})...`);
    const output = executeGrep(pattern, excludePaths);
    const findings = parseGrepOutput(output, category);
    allFindings.push(...findings);
    console.log(`  Found: ${findings.length} references`);
  }

  const report = generateReport(allFindings);
  printReport(report);
  saveReport(report);

  console.log('\n✅ Audit complete!\n');

  // Exit with appropriate code
  if (report.byRisk.HIGH > 0) {
    process.exit(1); // HIGH risk found - requires action
  } else if (report.byRisk.MEDIUM > 0) {
    process.exit(0); // MEDIUM risk - informational
  } else {
    process.exit(0); // Only LOW risk - safe to proceed
  }
}

main().catch(error => {
  console.error('❌ Audit failed:', error);
  process.exit(1);
});
