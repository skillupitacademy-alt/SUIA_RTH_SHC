#!/usr/bin/env node
/**
 * Fix Phase 1 Test Files - Add navigationNodeId
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const testFiles = [
  'packages/db-tutorial/src/services/__tests__/v2-delivery-integration.test.ts',
  'packages/db-tutorial/src/services/__tests__/c1-018-composer-delivery.integration.test.ts',
  'packages/db-tutorial/src/services/__tests__/gate-4-concurrency.integration.test.ts',
  'packages/db-tutorial/src/services/__tests__/phase-1h-definition-d1-persistence.integration.test.ts',
  'packages/db-tutorial/src/services/__tests__/v2-composer-integration.test.ts',
];

console.log('Fixing test files to add navigationNodeId...\n');

for (const file of testFiles) {
  const filePath = resolve(process.cwd(), file);
  let content = readFileSync(filePath, 'utf-8');
  
  // Add constant after SHARED_BRAND declaration
  if (!content.includes('TEST_NAV_NODE_ID')) {
    content = content.replace(
      /(const SHARED_BRAND = [^;]+;)/,
      '$1\n  const TEST_NAV_NODE_ID = \'test-page\';'
    );
  }
  
  // Add navigationNodeId to createTutorial calls
  content = content.replace(
    /(\s+subtopicId: [^,\n]+,)(\s+brandId:)/g,
    '$1\n          navigationNodeId: TEST_NAV_NODE_ID,$2'
  );
  
  writeFileSync(filePath, content, 'utf-8');
  console.log(`✓ Fixed: ${file}`);
}

console.log('\n✅ All test files fixed!');
