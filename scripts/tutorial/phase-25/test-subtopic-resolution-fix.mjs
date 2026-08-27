#!/usr/bin/env node

/**
 * ============================================================
 * PHASE 2.5-F: TEST SUBTOPIC RESOLUTION FIX
 * ============================================================
 * 
 * Verify that URLs with tutorial_subtopics.slug now resolve correctly
 * 
 * TEST CASE:
 * URL: /tutorial-v2/.../what-is-java-12efacf1/whatisjava
 * 
 * EXPECTED FLOW:
 * 1. resolveHierarchy tries curriculum match → fails
 * 2. Falls back to tutorial_subtopics.slug match → succeeds
 * 3. Resolves external_id back to curriculum subtopic
 * 4. Returns curriculum subtopic 12efacf1...
 * 5. getTutorialByPage receives curriculum ID
 * 6. Resolves to tutorial ID 414f63eb... via external_id
 * 7. Finds section successfully
 * 
 * ============================================================
 */

import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../..');

config({ path: path.join(PROJECT_ROOT, '.env.local') });

// Import the actual delivery function
const { getPublishedTutorialPagePayload } = await import('../../../src/share-branding/LearningExperience/tutorialSidebarDelivery.js');

const TEST_PARAMS = {
  brandId: 'skillupitacademy',
  domainSlug: 'full-stack-development',
  subjectSlug: 'backend-development',
  topicSlug: 'java',
  subtopicSlug: 'what-is-java-12efacf1', // Tutorial subtopics.slug with UUID suffix
  navigationNodeId: 'whatisjava',
};

async function main() {
  console.log('');
  console.log('='.repeat(70));
  console.log('PHASE 2.5-F: SUBTOPIC RESOLUTION FIX TEST');
  console.log('='.repeat(70));
  console.log('');
  console.log('Testing URL with tutorial_subtopics.slug:');
  console.log(`  Subtopic slug: ${TEST_PARAMS.subtopicSlug}`);
  console.log(`  Navigation node: ${TEST_PARAMS.navigationNodeId}`);
  console.log('');

  try {
    console.log('Calling getPublishedTutorialPagePayload...');
    console.log('');
    
    const result = await getPublishedTutorialPagePayload(TEST_PARAMS);

    console.log('');
    console.log('='.repeat(70));
    console.log('RESULT:');
    console.log('='.repeat(70));

    if (!result) {
      console.error('');
      console.error('❌ FAIL: getPublishedTutorialPagePayload returned null');
      console.error('');
      console.error('The subtopic slug resolution still failed.');
      console.error('');
      process.exitCode = 1;
      return;
    }

    console.log('');
    console.log('✅ SUCCESS: Page payload returned');
    console.log('');
    console.log('Hierarchy:');
    console.log(`  Domain:    ${result.hierarchy.domain.name}`);
    console.log(`  Subject:   ${result.hierarchy.subject.name}`);
    console.log(`  Topic:     ${result.hierarchy.topic.name}`);
    console.log(`  Subtopic:  ${result.hierarchy.subtopic.name}`);
    console.log(`  Subtopic ID: ${result.hierarchy.subtopic.id}`);
    console.log('');
    console.log(`Active URL: ${result.activeUrl}`);
    console.log('');
    console.log('Content:');
    console.log(`  Section ID: ${result.content.sectionId}`);
    console.log(`  Block count: ${result.content.blocks?.length ?? 0}`);
    
    if (result.content.blocks && result.content.blocks.length > 0) {
      console.log('');
      console.log('First block:');
      const firstBlock = result.content.blocks[0];
      console.log(`  Type: ${firstBlock.type}`);
      console.log(`  Version: ${firstBlock.version}`);
      console.log(`  ID: ${firstBlock.id}`);
      
      if (firstBlock.type === 'code' && firstBlock.content) {
        console.log(`  Language: ${firstBlock.content.code?.language ?? 'N/A'}`);
      }
    }

    console.log('');
    console.log('='.repeat(70));
    console.log('✅ SUBTOPIC RESOLUTION FIX VERIFIED');
    console.log('='.repeat(70));
    console.log('');
    console.log('The URL with tutorial_subtopics.slug now resolves correctly!');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ TEST FAILED:');
    console.error(error.message);
    console.error('');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exitCode = 1;
  }
}

main();
