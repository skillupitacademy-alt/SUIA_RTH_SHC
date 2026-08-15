#!/usr/bin/env node
/**
 * Block Suggestion Service - Direct Test
 * 
 * Tests the BlockSuggestionService directly without HTTP layer.
 * Useful for rapid development/debugging.
 * 
 * USAGE:
 *   npx tsx scripts/test-block-suggestions-direct.mjs
 */

import { blockSuggestionService } from '../packages/db-tutorial/src/index.ts';

// ============================================================
// TEST DATA
// ============================================================

const COMPREHENSIVE_DOCUMENT = {
  schemaVersion: 1,
  blocks: [
    // Parallel concepts (Two Column trigger)
    {
      id: 'h1',
      type: 'heading',
      content: {
        level: 3,
        text: 'Client-Side JavaScript',
      },
    },
    {
      id: 'p1',
      type: 'paragraph',
      content: {
        text: 'JavaScript runs in browsers, manipulating the DOM and handling user interactions.',
      },
    },
    {
      id: 'h2',
      type: 'heading',
      content: {
        level: 3,
        text: 'Server-Side JavaScript',
      },
    },
    {
      id: 'p2',
      type: 'paragraph',
      content: {
        text: 'Node.js enables JavaScript on servers, handling HTTP requests and database operations.',
      },
    },

    // Comparison trigger
    {
      id: 'comp1',
      type: 'paragraph',
      content: {
        text: 'React vs Vue: Both are component-based frameworks, but React uses JSX while Vue uses templates.',
      },
    },

    // Callout triggers
    {
      id: 'note1',
      type: 'paragraph',
      content: {
        text: 'Note: Always validate user input before processing to prevent security vulnerabilities.',
      },
    },
    {
      id: 'warning1',
      type: 'paragraph',
      content: {
        text: 'Warning: Modifying the __proto__ property can cause serious performance issues.',
      },
    },
    {
      id: 'important1',
      type: 'paragraph',
      content: {
        text: 'Important: Use async/await for better error handling in asynchronous code.',
      },
    },

    // Example trigger
    {
      id: 'example1',
      type: 'paragraph',
      content: {
        text: 'For example, you can use Array.map() to transform each element: [1,2,3].map(x => x * 2).',
      },
    },

    // Diagram trigger
    {
      id: 'flow1',
      type: 'paragraph',
      content: {
        text: 'The authentication workflow follows these steps: step 1 user submits credentials, step 2 server validates, step 3 JWT token issued.',
      },
    },

    // Definition trigger
    {
      id: 'def1',
      type: 'paragraph',
      content: {
        text: 'A closure is a function that has access to variables in its outer (enclosing) scope, even after the outer function has returned.',
      },
    },
    {
      id: 'def2',
      type: 'paragraph',
      content: {
        text: 'Hoisting refers to the behavior where variable and function declarations are moved to the top of their scope during compilation.',
      },
    },

    // Table trigger
    {
      id: 'list1',
      type: 'list',
      content: {
        style: 'unordered',
        items: [
          { text: 'GET: Retrieves data from the server' },
          { text: 'POST: Sends data to create new resources' },
          { text: 'PUT: Updates existing resources' },
          { text: 'DELETE: Removes resources from the server' },
        ],
      },
    },

    // Concept cards trigger
    {
      id: 'card1',
      type: 'heading',
      content: {
        level: 3,
        text: 'String',
      },
    },
    {
      id: 'card2',
      type: 'heading',
      content: {
        level: 3,
        text: 'Number',
      },
    },
    {
      id: 'card3',
      type: 'heading',
      content: {
        level: 3,
        text: 'Boolean',
      },
    },
    {
      id: 'card4',
      type: 'heading',
      content: {
        level: 3,
        text: 'Object',
      },
    },

    // Timeline trigger
    {
      id: 'timeline1',
      type: 'list',
      content: {
        style: 'ordered',
        items: [
          { text: 'First, plan the application architecture and data models' },
          { text: 'Then, implement the core business logic and API endpoints' },
          { text: 'After that, add comprehensive testing and error handling' },
          { text: 'Finally, deploy to production with monitoring and logging' },
        ],
      },
    },

    // Code block (existing)
    {
      id: 'code1',
      type: 'code',
      content: {
        language: 'javascript',
        code: 'const greeting = () => console.log("Hello World");',
      },
    },

    // Quote (existing)
    {
      id: 'quote1',
      type: 'quote',
      content: {
        text: 'JavaScript is the duct tape of the Internet.',
      },
    },
  ],
};

const MOCK_ANALYSIS = {
  statistics: {
    totalWords: 850,
    characters: 5200,
    readingTimeMinutes: 4,
    sectionsDetected: 8,
    totalBlocks: 22,
  },
  sectionOutline: [],
  qualityIndicators: {
    readability: 'good',
    structure: 'good',
    completeness: 'good',
    examples: 'good',
    codePresence: 'fair',
    visualPotential: 'good',
  },
  smartSuggestions: [],
  detectedElements: {
    headings: 8,
    paragraphs: 10,
    bulletLists: 1,
    numberedLists: 1,
    codeBlocks: 1,
    quotes: 1,
    tables: 0,
    callouts: 0,
    keyConcepts: 2,
    comparisons: 1,
    examples: 1,
  },
  overallConfidence: {
    score: 78,
    grade: 'Good',
  },
};

// ============================================================
// TEST EXECUTION
// ============================================================

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║  BLOCK SUGGESTION SERVICE - DIRECT TEST                   ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log('');

console.log('📄 Input Document:');
console.log(`  Schema Version: ${COMPREHENSIVE_DOCUMENT.schemaVersion}`);
console.log(`  Total Blocks: ${COMPREHENSIVE_DOCUMENT.blocks.length}`);
console.log('');

console.log('⚡ Running Block Suggestion Service...');
const startTime = Date.now();

const result = blockSuggestionService.generateSuggestions(
  COMPREHENSIVE_DOCUMENT,
  MOCK_ANALYSIS,
  {
    subtopicId: 'test-subtopic',
    sectionType: 'notes',
    brandId: 'skillhubcore',
  }
);

const duration = Date.now() - startTime;
console.log(`✅ Completed in ${duration}ms`);
console.log('');

// ============================================================
// RESULTS DISPLAY
// ============================================================

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║  STATISTICS                                               ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log('');
console.log(`Total Blocks:         ${result.statistics.totalBlocks}`);
console.log(`  ├─ Existing:        ${result.statistics.existingBlocks}`);
console.log(`  └─ Suggested:       ${result.statistics.suggestedBlocks}`);
console.log('');
console.log(`Confidence Breakdown:`);
console.log(`  ├─ High (≥80%):     ${result.statistics.highConfidence}`);
console.log(`  ├─ Medium (50-79%): ${result.statistics.mediumConfidence}`);
console.log(`  └─ Low (<50%):      ${result.statistics.lowConfidence}`);
console.log('');
console.log(`Sections Detected:    ${result.statistics.sectionsDetected}`);
console.log(`Overall Confidence:   ${result.overallConfidence}%`);
console.log('');

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║  SUGGESTIONS BY TYPE                                      ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log('');

const byType = result.statistics.byType;
Object.entries(byType)
  .sort((a, b) => b[1] - a[1])
  .forEach(([type, count]) => {
    console.log(`  ${type.padEnd(20)} ${count}`);
  });
console.log('');

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║  EXISTING BLOCKS (Sample)                                 ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log('');

const existingBlocks = result.blocks.filter((b) => b.kind === 'existing');
existingBlocks.slice(0, 5).forEach((block, i) => {
  console.log(`${i + 1}. ${block.title}`);
  console.log(`   Type: ${block.blockType}`);
  console.log(`   Preview: ${block.preview.substring(0, 60)}${block.preview.length > 60 ? '...' : ''}`);
  console.log(`   Confidence: ${block.confidence}% (${block.confidenceLevel})`);
  console.log('');
});

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║  INTELLIGENT SUGGESTIONS                                  ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log('');

const suggestions = result.blocks.filter((b) => b.kind === 'suggested');

if (suggestions.length === 0) {
  console.log('  No suggestions generated');
  console.log('');
} else {
  suggestions.forEach((suggestion, i) => {
    console.log(`${i + 1}. ${suggestion.title}`);
    console.log(`   Type: ${suggestion.blockType}`);
    console.log(`   Confidence: ${suggestion.confidence}% (${suggestion.confidenceLevel})`);
    console.log(`   Reason: ${suggestion.reason}`);
    console.log(`   Source Blocks: ${suggestion.sourceBlockIds.length > 0 ? suggestion.sourceBlockIds.join(', ') : 'document-level'}`);
    console.log(`   Preview: ${suggestion.preview.substring(0, 80)}${suggestion.preview.length > 80 ? '...' : ''}`);
    console.log('');
  });
}

// ============================================================
// VALIDATION CHECKS
// ============================================================

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║  VALIDATION CHECKS                                        ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log('');

const checks = [
  {
    name: 'Has statistics',
    pass: !!result.statistics,
  },
  {
    name: 'Has blocks array',
    pass: Array.isArray(result.blocks),
  },
  {
    name: 'Has existing blocks',
    pass: result.statistics.existingBlocks > 0,
  },
  {
    name: 'Has suggested blocks',
    pass: result.statistics.suggestedBlocks > 0,
  },
  {
    name: 'Total blocks = existing + suggested',
    pass: result.statistics.totalBlocks === result.statistics.existingBlocks + result.statistics.suggestedBlocks,
  },
  {
    name: 'Confidence sum = total blocks',
    pass: result.statistics.highConfidence + result.statistics.mediumConfidence + result.statistics.lowConfidence === result.statistics.totalBlocks,
  },
  {
    name: 'Overall confidence in valid range',
    pass: result.overallConfidence >= 0 && result.overallConfidence <= 100,
  },
  {
    name: 'All blocks have id',
    pass: result.blocks.every((b) => b.id && b.id.length > 0),
  },
  {
    name: 'All blocks have kind',
    pass: result.blocks.every((b) => ['existing', 'suggested'].includes(b.kind)),
  },
  {
    name: 'All blocks have blockType',
    pass: result.blocks.every((b) => b.blockType && b.blockType.length > 0),
  },
  {
    name: 'All blocks have title',
    pass: result.blocks.every((b) => b.title && b.title.length > 0),
  },
  {
    name: 'All blocks have preview',
    pass: result.blocks.every((b) => b.preview && b.preview.length > 0),
  },
  {
    name: 'All blocks have confidence',
    pass: result.blocks.every((b) => typeof b.confidence === 'number' && b.confidence >= 0 && b.confidence <= 100),
  },
  {
    name: 'All blocks have confidenceLevel',
    pass: result.blocks.every((b) => ['high', 'medium', 'low'].includes(b.confidenceLevel)),
  },
  {
    name: 'All blocks have reason',
    pass: result.blocks.every((b) => b.reason && b.reason.length > 0),
  },
  {
    name: 'All blocks have sourceBlockIds',
    pass: result.blocks.every((b) => Array.isArray(b.sourceBlockIds)),
  },
  {
    name: 'Confidence bands correct (high ≥80)',
    pass: result.blocks.filter((b) => b.confidenceLevel === 'high').every((b) => b.confidence >= 80),
  },
  {
    name: 'Confidence bands correct (medium 50-79)',
    pass: result.blocks.filter((b) => b.confidenceLevel === 'medium').every((b) => b.confidence >= 50 && b.confidence < 80),
  },
  {
    name: 'Confidence bands correct (low <50)',
    pass: result.blocks.filter((b) => b.confidenceLevel === 'low').every((b) => b.confidence < 50),
  },
  {
    name: 'Has metadata',
    pass: !!result.metadata,
  },
  {
    name: 'Has source preview',
    pass: !!result.sourcePreview && !!result.sourcePreview.raw,
  },
  // Rule-specific assertions
  {
    name: 'RULE 1: Two-Column suggestion exists',
    pass: suggestions.some((s) => s.blockType === 'two-column'),
  },
  {
    name: 'RULE 2: Comparison suggestion exists',
    pass: suggestions.some((s) => s.blockType === 'comparison'),
  },
  {
    name: 'RULE 3: Callout suggestion exists',
    pass: suggestions.some((s) => s.blockType === 'callout'),
  },
  {
    name: 'RULE 4: Example suggestion exists',
    pass: suggestions.some((s) => s.blockType === 'example'),
  },
  {
    name: 'RULE 5: Diagram suggestion exists',
    pass: suggestions.some((s) => s.blockType === 'diagram'),
  },
  {
    name: 'RULE 6: Summary suggestion exists',
    pass: suggestions.some((s) => s.blockType === 'summary'),
  },
  {
    name: 'RULE 7: Definition suggestion exists',
    pass: suggestions.some((s) => s.blockType === 'definition'),
  },
  {
    name: 'RULE 8: Table suggestion exists',
    pass: suggestions.some((s) => s.blockType === 'table'),
  },
  {
    name: 'RULE 9: Concept-cards suggestion exists',
    pass: suggestions.some((s) => s.blockType === 'concept-cards'),
  },
  {
    name: 'RULE 10: Timeline suggestion exists',
    pass: suggestions.some((s) => s.blockType === 'timeline'),
  },
  {
    name: 'NO Diagram/Timeline duplication on same block',
    pass: (() => {
      const timelineBlockIds = new Set(
        suggestions.filter((s) => s.blockType === 'timeline').flatMap((s) => s.sourceBlockIds)
      );
      const diagramSuggestions = suggestions.filter((s) => s.blockType === 'diagram');
      return !diagramSuggestions.some((s) => s.sourceBlockIds.some((id) => timelineBlockIds.has(id)));
    })(),
  },
];

checks.forEach((check) => {
  console.log(`${check.pass ? '✅' : '❌'} ${check.name}`);
});

console.log('');

const allPassed = checks.every((c) => c.pass);
const passedCount = checks.filter((c) => c.pass).length;

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║  SUMMARY                                                  ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log('');
console.log(`Total Checks: ${checks.length}`);
console.log(`✅ Passed: ${passedCount}`);
console.log(`❌ Failed: ${checks.length - passedCount}`);
console.log('');

if (allPassed) {
  console.log('🎉 All validation checks passed!');
  console.log('');
  process.exit(0);
} else {
  console.log('⚠️  Some validation checks failed');
  console.log('');
  process.exit(1);
}
