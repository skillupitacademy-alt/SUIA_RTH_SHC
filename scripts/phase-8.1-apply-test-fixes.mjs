#!/usr/bin/env node
/**
 * PHASE 8.1 — Apply test fixes to remaining integration test files
 * Automates the corrections that were successfully applied to phase-1h test
 */

import { readFileSync, writeFileSync } from 'fs';

const files = [
  'packages/db-tutorial/src/services/__tests__/c1-018-composer-delivery.integration.test.ts',
  'packages/db-tutorial/src/services/__tests__/v2-composer-integration.test.ts',
  'packages/db-tutorial/src/services/__tests__/v2-delivery-integration.test.ts',
  'packages/db-tutorial/src/services/__tests__/gate-4-concurrency.integration.test.ts',
];

console.log('🔧 Applying Phase 8.1 test fixes...\n');

for (const file of files) {
  console.log(`Processing: ${file}`);
  
  let content = readFileSync(file, 'utf-8');
  let changes = 0;
  
  // 1. Replace getNextBrand() calls with TEST_BRAND
  const getNextBrandPattern = /getNextBrand\(\)/g;
  if (content.match(getNextBrandPattern)) {
    content = content.replace(getNextBrandPattern, 'TEST_BRAND');
    changes++;
    console.log('  ✓ Replaced getNextBrand() with TEST_BRAND');
  }
  
  // 2. Replace brand variable declarations with TEST_BRAND
  const brandVarPattern = /const brand = TEST_BRAND;?\s*$/gm;
  if (content.match(/const brand = /)) {
    content = content.replace(/const brand = TEST_BRAND;/g, '// Using TEST_BRAND');
    changes++;
    console.log('  ✓ Removed brand variable declarations');
  }
  
  // 3. Replace brandId: brand with brandId: TEST_BRAND in object literals
  const brandIdPattern = /brandId:\s*brand(?=\s*[,}])/g;
  if (content.match(brandIdPattern)) {
    content = content.replace(brandIdPattern, 'brandId: TEST_BRAND');
    changes++;
    console.log('  ✓ Replaced brandId: brand with brandId: TEST_BRAND');
  }
  
  // 4. Replace expect(X.brandId).toBe(brand) with expect(X.brandId).toBe('shared')
  const expectBrandPattern = /expect\(([^)]+\.brandId)\)\.toBe\(brand\)/g;
  if (content.match(expectBrandPattern)) {
    content = content.replace(expectBrandPattern, "expect($1).toBe('shared')");
    changes++;
    console.log('  ✓ Updated expect brandId assertions');
  }
  
  // 5. Replace TEST_BRANDS array and getNextBrand function
  const testBrandsPattern = /\/\/ Use different brands for test isolation\s*\n\s*const TEST_BRANDS = \['realtutorialhub', 'skillup'\] as const;\s*\n.*\n.*\n\s*let brandIndex = 0;\s*\n\s*\n\s*function getNextBrand\(\) \{[^}]+\}/s;
  if (content.match(testBrandsPattern)) {
    content = content.replace(
      testBrandsPattern,
      `const TEST_BRAND = 'shared'; // Only brand with existing sidebar`
    );
    changes++;
    console.log('  ✓ Replaced TEST_BRANDS array with TEST_BRAND constant');
  }
  
  writeFileSync(file, content, 'utf-8');
  
  if (changes > 0) {
    console.log(`  ✅ Applied ${changes} fix(es)\n`);
  } else {
    console.log(`  ℹ️  No changes needed\n`);
  }
}

console.log('✅ All files processed\n');
console.log('Next: Run tests to verify fixes');
