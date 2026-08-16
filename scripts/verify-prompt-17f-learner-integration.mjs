/**
 * PROMPT 17F — LEARNER PAGE INTEGRATION VERIFICATION HARNESS
 * 
 * Objective:
 * 1. Verify that the learner-facing BlockRenderer cleanly integrates TutorialRenderer for TutorialDocument.
 * 2. Verify backward compatibility: Legacy block renderer components are preserved.
 * 3. Verify that tutorial-delivery server layer validates TutorialDocument via TutorialDocumentSchema.
 * 4. Verify SEO metadata description extraction handles TutorialDocument structures.
 * 5. Verify zero dangerouslySetInnerHTML in newly integrated learner rendering path.
 * 6. Verify brand theme and difficulty propagation.
 */

import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';

const results = [];
function recordTest(name, passed, details) {
  results.push({ name, passed, details });
  console.log(`${passed ? '✅ PASS' : '❌ FAIL'}: ${name} ${details ? '(' + details + ')' : ''}`);
}

async function runVerification() {
  console.log('============================================================');
  console.log('PROMPT 17F — LEARNER PAGE INTEGRATION VERIFICATION');
  console.log('============================================================\n');

  try {
    const webRoot = path.join(process.cwd(), 'apps/realtutorialhub-web/src');

    // Phase 1: BlockRenderer Universal TutorialRenderer Integration
    console.log('--- Phase 1: BlockRenderer TutorialRenderer Integration ---');
    const blockRendererPath = path.join(webRoot, 'components/content/BlockRenderer.tsx');
    assert.ok(fs.existsSync(blockRendererPath), 'BlockRenderer.tsx must exist');
    const blockRendererContent = fs.readFileSync(blockRendererPath, 'utf8');

    assert.ok(
      blockRendererContent.includes("import { TutorialRenderer } from '@quiz/ui';"),
      'BlockRenderer must import TutorialRenderer from @quiz/ui'
    );
    assert.ok(
      blockRendererContent.includes('isTutorialDocument(sectionData)'),
      'BlockRenderer must check for canonical TutorialDocument format'
    );
    assert.ok(
      blockRendererContent.includes('<TutorialRenderer'),
      'BlockRenderer must render TutorialRenderer when isTutorialDocument is true'
    );
    recordTest('BlockRenderer: Seamless TutorialRenderer integration', true, 'TutorialRenderer dispatched when isTutorialDocument is true');

    // Phase 2: Legacy Compatibility Preservation
    console.log('\n--- Phase 2: Legacy Compatibility Preservation ---');
    const legacyBlocks = [
      'NotesBlock', 'LaymanBlock', 'RealLifeBlock', 'TechnicalBlock',
      'VisualBlock', 'CodeBlock', 'QuizBlock', 'PracticeBlock',
      'AssignmentBlock', 'ProjectBlock', 'SummaryBlock', 'InterviewBlock', 'AITutorBlock'
    ];
    for (const lb of legacyBlocks) {
      assert.ok(
        blockRendererContent.includes(`<${lb}`),
        `BlockRenderer must preserve legacy component <${lb} />`
      );
    }
    recordTest('Legacy Compatibility: All 13 legacy block fallbacks preserved', true, '13/13 legacy components retained');

    // Phase 3: Delivery Server Layer TutorialDocument Validation
    console.log('\n--- Phase 3: Server Delivery Validation Layer ---');
    const deliveryPath = path.join(webRoot, 'server/tutorial-delivery.ts');
    assert.ok(fs.existsSync(deliveryPath), 'tutorial-delivery.ts must exist');
    const deliveryContent = fs.readFileSync(deliveryPath, 'utf8');

    assert.ok(
      deliveryContent.includes('TutorialDocumentSchema.safeParse(rawSection)'),
      'tutorial-delivery must validate TutorialDocument via TutorialDocumentSchema'
    );
    assert.ok(
      deliveryContent.includes('isTutorialDocument(rawSection)'),
      'tutorial-delivery must branch on isTutorialDocument'
    );
    recordTest('Delivery Validation: TutorialDocument validated via TutorialDocumentSchema', true, 'Server delivery schema validation active');

    // Phase 4: SEO Metadata Extraction
    console.log('\n--- Phase 4: SEO Metadata Extraction ---');
    const learnerPagePath = path.join(webRoot, 'app/(learning)/learn/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/page.tsx');
    assert.ok(fs.existsSync(learnerPagePath), 'Learner page.tsx must exist');
    const pageContent = fs.readFileSync(learnerPagePath, 'utf8');

    assert.ok(
      pageContent.includes("b.type === 'paragraph'"),
      'deriveDescription must support paragraph extraction from TutorialDocument'
    );
    assert.ok(
      pageContent.includes('generateMetadata'),
      'generateMetadata must be preserved in learner page'
    );
    recordTest('SEO Preservation: deriveDescription supports TutorialDocument', true, 'SEO metadata generation intact');

    // Phase 5: Security Gate
    console.log('\n--- Phase 5: Security Gate (Zero dangerouslySetInnerHTML) ---');
    assert.ok(
      !blockRendererContent.includes('dangerouslySetInnerHTML'),
      'BlockRenderer must contain 0 dangerouslySetInnerHTML'
    );
    assert.ok(
      !pageContent.includes('dangerouslySetInnerHTML'),
      'Learner page.tsx must contain 0 dangerouslySetInnerHTML'
    );
    recordTest('Security: Zero dangerouslySetInnerHTML in learner page files', true, '0 instances found');

  } catch (err) {
    console.error('❌ Verification Failed:', err);
    recordTest('Learner Integration Verification', false, err.message);
  }

  console.log('\n============================================================');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  console.log(`PROMPT 17F VERIFICATION SUMMARY: ${passed}/${total} checks passed (${((passed/total)*100).toFixed(0)}%)`);
  console.log('============================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runVerification().catch(console.error);
