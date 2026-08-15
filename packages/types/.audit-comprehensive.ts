/**
 * PROMPT 02A — Comprehensive Audit Script
 */

import {
  TutorialDocument,
  BLOCK_REGISTRY,
  SECTION_BLOCK_PALETTES,
  calculateNestingDepth,
  getAllBlocks,
  CURRENT_SCHEMA_VERSION,
  MAX_NESTING_DEPTH,
  SUPPORTED_CODE_LANGUAGES,
  PresentationConfigSchema,
  TwoColumnPresentationConfigSchema,
  GridPresentationConfigSchema,
} from './src/tutorial-rich-document';
import { javascriptIntroFixture } from './src/tutorial-rich-document/__tests__/fixtures/javascript-intro.fixture';
import { twoColumnLayoutFixture } from './src/tutorial-rich-document/__tests__/fixtures/two-column-layout.fixture';

console.log('═══════════════════════════════════════════════');
console.log('PROMPT 02A — COMPREHENSIVE AUDIT');
console.log('═══════════════════════════════════════════════\n');

// =====================================================
// 7. BLOCK COUNT AUDIT
// =====================================================
console.log('7. BLOCK COUNT AUDIT');
console.log('─'.repeat(50));

const allBlockTypes = Object.keys(BLOCK_REGISTRY);
const contentBlocks = Object.values(BLOCK_REGISTRY).filter(b => !b.supportsChildren);
const containerBlocks = Object.values(BLOCK_REGISTRY).filter(b => b.supportsChildren);

console.log(`Total blocks: ${allBlockTypes.length}`);
console.log(`Content blocks: ${contentBlocks.length}`);
console.log(`Container blocks: ${containerBlocks.length}`);
console.log(`\nContent block types:`);
contentBlocks.forEach(b => console.log(`  - ${b.type} (${b.category})`));
console.log(`\nContainer block types:`);
containerBlocks.forEach(b => console.log(`  - ${b.type} (${b.category})`));

const expectedTotal = 17;
const expectedContent = 13;
const expectedContainer = 4;

const blockCountCorrect = 
  allBlockTypes.length === expectedTotal &&
  contentBlocks.length === expectedContent &&
  containerBlocks.length === expectedContainer;

console.log(`\n✓ Block count verification: ${blockCountCorrect ? 'PASS' : 'FAIL'}`);
if (!blockCountCorrect) {
  console.log(`  Expected: ${expectedTotal} total (${expectedContent} content + ${expectedContainer} container)`);
  console.log(`  Got: ${allBlockTypes.length} total (${contentBlocks.length} content + ${containerBlocks.length} container)`);
}

// =====================================================
// 8. SECTION PALETTE AUDIT
// =====================================================
console.log('\n\n8. SECTION PALETTE AUDIT');
console.log('─'.repeat(50));

const sectionTypes = Object.keys(SECTION_BLOCK_PALETTES);
console.log(`Total section types: ${sectionTypes.length}`);

let paletteErrors = 0;
sectionTypes.forEach(sectionType => {
  const palette = SECTION_BLOCK_PALETTES[sectionType as keyof typeof SECTION_BLOCK_PALETTES];
  const count = palette.length;
  const uniqueCount = new Set(palette).size;
  
  console.log(`  ${sectionType.padEnd(15)} ${count} blocks`);
  
  if (count !== uniqueCount) {
    console.log(`    ⚠️  WARNING: ${count - uniqueCount} duplicate blocks in palette`);
    paletteErrors++;
  }
  
  // Check if all blocks in palette exist in registry
  palette.forEach(blockType => {
    if (!BLOCK_REGISTRY[blockType]) {
      console.log(`    ❌ ERROR: Unknown block type "${blockType}"`);
      paletteErrors++;
    }
  });
});

console.log(`\n✓ Section palette verification: ${paletteErrors === 0 ? 'PASS' : `FAIL (${paletteErrors} errors)`}`);

// =====================================================
// 9. PRESENTATION AUDIT
// =====================================================
console.log('\n\n9. PRESENTATION AUDIT');
console.log('─'.repeat(50));

// Test that presentation doesn't accept dangerous properties
const testValidPresentation = {
  width: 'full',
  alignment: 'left',
  spacing: 'normal',
};

const testInvalidPresentationCss = {
  width: 'full',
  className: 'w-full text-left',
};

const testInvalidPresentationStyle = {
  width: 'full',
  style: { padding: '20px' },
};

const validResult = PresentationConfigSchema.safeParse(testValidPresentation);
const invalidCssResult = PresentationConfigSchema.safeParse(testInvalidPresentationCss);
const invalidStyleResult = PresentationConfigSchema.safeParse(testInvalidPresentationStyle);

console.log('Valid semantic presentation:', validResult.success ? '✓ ACCEPTED' : '✗ REJECTED');
console.log('Invalid CSS className:', invalidCssResult.success ? '✗ ACCEPTED (BAD!)' : '✓ REJECTED');
console.log('Invalid style object:', invalidStyleResult.success ? '✗ ACCEPTED (BAD!)' : '✓ REJECTED');

const presentationSafe = validResult.success && !invalidCssResult.success && !invalidStyleResult.success;
console.log(`\n✓ Presentation safety: ${presentationSafe ? 'PASS' : 'FAIL'}`);

// Show allowed presentation properties
console.log('\nAllowed base presentation properties:');
console.log('  - width: "narrow" | "normal" | "wide" | "full"');
console.log('  - alignment: "left" | "center" | "right" | "justify"');
console.log('  - spacing: "none" | "tight" | "normal" | "relaxed" | "loose"');
console.log('  - emphasized: boolean');
console.log('  - styleVariant: string (semantic identifier, max 50 chars)');
console.log('  - responsive: { mobile?, tablet?, desktop? }');

console.log('\nContainer-specific extensions:');
console.log('  - gap: BlockSpacing');
console.log('  - stretch: boolean');
console.log('  - ratio: "50-50" | "60-40" | "40-60" | "70-30" | "30-70" (two-column)');
console.log('  - columns: 1 | 2 | 3 | 4 (grid)');
console.log('  - equalHeight: boolean (grid)');

// =====================================================
// 10. NESTING DEPTH AUDIT
// =====================================================
console.log('\n\n10. NESTING DEPTH AUDIT');
console.log('─'.repeat(50));

console.log(`Max nesting depth constant: ${MAX_NESTING_DEPTH}`);

// Test JavaScript intro (no nesting)
const jsDepth = calculateNestingDepth(javascriptIntroFixture.blocks);
console.log(`\nJavaScript intro fixture depth: ${jsDepth}`);
console.log(`  Expected: 0 (no container blocks)`);
console.log(`  ✓ ${jsDepth === 0 ? 'PASS' : 'FAIL'}`);

// Test two-column layout (depth 1)
const twoColDepth = calculateNestingDepth(twoColumnLayoutFixture.blocks);
console.log(`\nTwo-column layout fixture depth: ${twoColDepth}`);
console.log(`  Expected: 1 (one level of containers)`);
console.log(`  ✓ ${twoColDepth === 1 ? 'PASS' : 'FAIL'}`);

// Create test for depth 3 (max allowed)
const depth3Doc: TutorialDocument = {
  schemaVersion: 1,
  blocks: [
    {
      id: 'col1',
      type: 'two-column',
      content: {
        left: {
          blocks: [
            {
              id: 'grid1',
              type: 'card-grid',
              content: {
                cards: [
                  {
                    id: 'card1',
                    blocks: [
                      {
                        id: 'col2',
                        type: 'two-column',
                        content: {
                          left: {
                            blocks: [
                              {
                                id: 'p1',
                                type: 'paragraph',
                                content: { text: 'Nested at depth 3' },
                              },
                            ],
                          },
                          right: { blocks: [] },
                        },
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
        right: { blocks: [] },
      },
    },
  ],
};

const depth3 = calculateNestingDepth(depth3Doc.blocks);
console.log(`\nDepth 3 test (max allowed) depth: ${depth3}`);
console.log(`  Expected: 3`);
console.log(`  ✓ ${depth3 === 3 ? 'PASS' : 'FAIL'}`);

console.log('\nNesting rules:');
console.log('  - Container blocks count toward depth');
console.log('  - Leaf/content blocks do NOT increase depth');
console.log('  - List item nesting is separate (uses ListItem children)');
console.log('  - Maximum container depth: 3');

// =====================================================
// 11. CONSTANTS AUDIT
// =====================================================
console.log('\n\n11. CONSTANTS AUDIT');
console.log('─'.repeat(50));

console.log(`Schema version: ${CURRENT_SCHEMA_VERSION}`);
console.log(`Max nesting depth: ${MAX_NESTING_DEPTH}`);
console.log(`Supported languages: ${SUPPORTED_CODE_LANGUAGES.length}`);
console.log('  Languages:', SUPPORTED_CODE_LANGUAGES.join(', '));

// =====================================================
// 12. FIXTURE VALIDATION
// =====================================================
console.log('\n\n12. FIXTURE VALIDATION');
console.log('─'.repeat(50));

const jsBlocks = getAllBlocks(javascriptIntroFixture.blocks);
console.log(`JavaScript intro fixture:`);
console.log(`  Total blocks (including nested): ${jsBlocks.length}`);
console.log(`  Block types used:`, [...new Set(jsBlocks.map(b => b.type))].join(', '));

const twoColBlocks = getAllBlocks(twoColumnLayoutFixture.blocks);
console.log(`\nTwo-column layout fixture:`);
console.log(`  Total blocks (including nested): ${twoColBlocks.length}`);
console.log(`  Block types used:`, [...new Set(twoColBlocks.map(b => b.type))].join(', '));

// =====================================================
// FINAL SUMMARY
// =====================================================
console.log('\n\n═══════════════════════════════════════════════');
console.log('AUDIT SUMMARY');
console.log('═══════════════════════════════════════════════');

const allChecks = [
  { name: 'Block count', passed: blockCountCorrect },
  { name: 'Section palettes', passed: paletteErrors === 0 },
  { name: 'Presentation safety', passed: presentationSafe },
  { name: 'Nesting depth', passed: jsDepth === 0 && twoColDepth === 1 && depth3 === 3 },
];

const totalPassed = allChecks.filter(c => c.passed).length;
const totalChecks = allChecks.length;

console.log(`\nChecks passed: ${totalPassed}/${totalChecks}`);
allChecks.forEach(check => {
  console.log(`  ${check.passed ? '✓' : '✗'} ${check.name}`);
});

console.log(`\n${'═'.repeat(50)}`);
console.log(`OVERALL: ${totalPassed === totalChecks ? '✅ PASS' : '❌ FAIL'}`);
console.log('═'.repeat(50));
