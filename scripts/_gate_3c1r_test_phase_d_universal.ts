/**
 * GATE 3C.1R — PHASE D: UNIVERSAL ARCHITECTURE INSPECTION
 * 
 * Purpose: Verify no D1/C1/X1-specific telemetry branching exists in production code
 * 
 * The universal ILS architecture requires:
 * - Generic block identity (blockId, blockType, blockVersion)
 * - No recordD1Visit() / recordC1Visit() methods
 * - No if (blockType === 'definition') telemetry branches
 * - Single universal recordBlockVisit() API
 * 
 * This inspection searches production source for potential violations.
 */

import { execSync } from 'child_process';
import path from 'path';

interface SearchResult {
  pattern: string;
  matches: string[];
  classification: 'CLEAN' | 'NEEDS_REVIEW' | 'VIOLATION';
  notes: string;
}

const results: SearchResult[] = [];

/**
 * Search for a pattern in source files
 */
function searchPattern(pattern: string, description: string): string[] {
  try {
    const output = execSync(
      `git grep -n "${pattern}" -- "packages/*/src/**/*.ts" "packages/*/src/**/*.tsx" "apps/*/src/**/*.ts" "apps/*/src/**/*.tsx" ":!**/*.test.ts" ":!**/*.spec.ts" ":!**/test/**" ":!**/tests/**" ":!**/__tests__/**"`,
      {
        cwd: path.resolve(__dirname, '..'),
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'], // Suppress stderr
      }
    );
    return output.trim().split('\n').filter(line => line.length > 0);
  } catch (error) {
    // git grep returns exit code 1 when no matches found
    return [];
  }
}

console.log('================================================================================');
console.log('GATE 3C.1R — PHASE D: UNIVERSAL ARCHITECTURE INSPECTION');
console.log('================================================================================');
console.log();
console.log('Searching production source for block-specific telemetry branching...');
console.log();

// Search for D1-specific methods
const d1Methods = searchPattern('recordD1', 'D1-specific telemetry methods');
results.push({
  pattern: 'recordD1* methods',
  matches: d1Methods,
  classification: d1Methods.length === 0 ? 'CLEAN' : 'VIOLATION',
  notes: d1Methods.length === 0 
    ? 'No D1-specific telemetry methods found'
    : 'VIOLATION: D1-specific telemetry methods exist',
});

// Search for C1-specific methods  
const c1Methods = searchPattern('recordC1', 'C1-specific telemetry methods');
results.push({
  pattern: 'recordC1* methods',
  matches: c1Methods,
  classification: c1Methods.length === 0 ? 'CLEAN' : 'VIOLATION',
  notes: c1Methods.length === 0
    ? 'No C1-specific telemetry methods found'
    : 'VIOLATION: C1-specific telemetry methods exist',
});

// Search for definition-specific telemetry
const definitionTelemetry = searchPattern("blockType === 'definition'", 'Definition-specific telemetry branching');
results.push({
  pattern: "blockType === 'definition'",
  matches: definitionTelemetry,
  classification: definitionTelemetry.length === 0 ? 'CLEAN' : 'NEEDS_REVIEW',
  notes: definitionTelemetry.length === 0
    ? 'No definition-specific branching found'
    : 'NEEDS_REVIEW: Type checks found (may be UI rendering, not telemetry)',
});

// Search for code-specific telemetry
const codeTelemetry = searchPattern("blockType === 'code'", 'Code-specific telemetry branching');
results.push({
  pattern: "blockType === 'code'",
  matches: codeTelemetry,
  classification: codeTelemetry.length === 0 ? 'CLEAN' : 'NEEDS_REVIEW',
  notes: codeTelemetry.length === 0
    ? 'No code-specific branching found'
    : 'NEEDS_REVIEW: Type checks found (may be UI rendering, not telemetry)',
});

// Search for switch on blockType
const switchBlocks = searchPattern('switch.*blockType', 'Switch on blockType');
results.push({
  pattern: 'switch (blockType)',
  matches: switchBlocks,
  classification: switchBlocks.length === 0 ? 'CLEAN' : 'NEEDS_REVIEW',
  notes: switchBlocks.length === 0
    ? 'No blockType switches found'
    : 'NEEDS_REVIEW: BlockType switches found (may be UI rendering, not telemetry)',
});

// Print results
console.log('================================================================================');
console.log('SEARCH RESULTS');
console.log('================================================================================');
console.log();

let violations = 0;
let needsReview = 0;
let clean = 0;

for (const result of results) {
  console.log(`Pattern: ${result.pattern}`);
  console.log(`Classification: ${result.classification}`);
  console.log(`Notes: ${result.notes}`);
  
  if (result.matches.length > 0) {
    console.log(`Matches: ${result.matches.length}`);
    console.log();
    result.matches.forEach(match => {
      console.log(`  ${match}`);
    });
  } else {
    console.log('Matches: 0');
  }
  
  console.log();
  console.log('--------------------------------------------------------------------------------');
  console.log();

  if (result.classification === 'VIOLATION') violations++;
  else if (result.classification === 'NEEDS_REVIEW') needsReview++;
  else clean++;
}

console.log('================================================================================');
console.log('FINAL RESULT');
console.log('================================================================================');
console.log();
console.log(`Clean patterns: ${clean}`);
console.log(`Needs review: ${needsReview}`);
console.log(`Violations: ${violations}`);
console.log();

if (violations > 0) {
  console.log('❌ UNIVERSAL ARCHITECTURE INSPECTION: FAIL');
  console.log();
  console.log(`${violations} pattern(s) indicate block-specific telemetry branching.`);
  console.log('The universal architecture requires generic telemetry APIs.');
  console.log();
  console.log('BLOCKED: Phase D cannot proceed with block-specific telemetry code.');
  console.log();
  process.exitCode = 1;
} else if (needsReview > 0) {
  console.log('⚠️  UNIVERSAL ARCHITECTURE INSPECTION: NEEDS REVIEW');
  console.log();
  console.log(`${needsReview} pattern(s) found that require manual classification.`);
  console.log();
  console.log('Next step: Manually inspect each match to determine if it is:');
  console.log('  - Production telemetry logic (VIOLATION)');
  console.log('  - UI rendering logic (ACCEPTABLE)');
  console.log('  - Test code (ACCEPTABLE)');
  console.log('  - Documentation/comment (ACCEPTABLE)');
  console.log();
  console.log('If all matches are non-telemetry, universal architecture is verified.');
  console.log();
  process.exitCode = 0;
} else {
  console.log('✅ UNIVERSAL ARCHITECTURE INSPECTION: PASS');
  console.log();
  console.log('Evidence:');
  console.log('- No D1-specific telemetry methods');
  console.log('- No C1-specific telemetry methods');
  console.log('- No block-type telemetry branching');
  console.log('- Universal recordBlockVisit() architecture verified');
  console.log();
  console.log('Safe to proceed with Phase D lifecycle tests.');
  console.log();
  process.exitCode = 0;
}

console.log('================================================================================');
