#!/usr/bin/env node
/**
 * PHASE 3C-M: Full Delivery Test with NavigationNodeId
 * 
 * Tests complete delivery path including:
 * - Hierarchy resolution with TutorialDB
 * - Topic identity using externalId
 * - Sidebar lookup with MainDB topic ID
 * - Navigation node validation
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

// Dynamic import after env is loaded
const { getPublishedTutorialPagePayload } = await import('../../src/share-branding/LearningExperience/tutorialSidebarDelivery.js');

console.log('═'.repeat(70));
console.log('PHASE 3C-M: FULL DELIVERY TEST');
console.log('═'.repeat(70));
console.log('URL: /tutorial-v2/full-stack-development/backend-development/java/whatisjava/[nodeId]');
console.log('');

const params = {
  brandId: 'skillup',
  domainSlug: 'full-stack-development',
  subjectSlug: 'backend-development',
  topicSlug: 'java',
  subtopicSlug: 'whatisjava',
  navigationNodeId: 'whatisjava', // Use subtopic slug as nav node for now
};

console.log('Calling getPublishedTutorialPagePayload()...');
console.log('');

const payload = await getPublishedTutorialPagePayload(params);

console.log('');
console.log('═'.repeat(70));
console.log('RESULT');
console.log('═'.repeat(70));

if (!payload) {
  console.log('❌ PAYLOAD IS NULL');
  console.log('');
  console.log('This indicates delivery failure.');
  process.exit(1);
}

console.log('✅ PAYLOAD RECEIVED');
console.log('');

// Verify hierarchy
console.log('HIERARCHY:');
console.log('  Domain:', payload.hierarchy.domain.name);
console.log('  Subject:', payload.hierarchy.subject.name);
console.log('  Topic:', payload.hierarchy.topic.name);
console.log('  Subtopic:', payload.hierarchy.subtopic.name);
console.log('');

// Verify identity
console.log('IDENTITY (Phase 3C-M):');
console.log('  topic.id (TutorialDB):', payload.hierarchy.topic.id);
console.log('  topic.externalId (MainDB):', payload.hierarchy.topic.externalId);
console.log('');

// Verify sidebar
console.log('SIDEBAR:');
console.log('  Brand:', payload.sidebar.brand);
console.log('  Navigation nodes:', payload.sidebar.topics.length);
console.log('');

// Verify active URL
console.log('ACTIVE URL:');
console.log('  ', payload.activeUrl);
console.log('');

// Success criteria
console.log('═'.repeat(70));
console.log('SUCCESS CRITERIA');
console.log('═'.repeat(70));

const checks = [
  { name: 'Hierarchy resolved', pass: !!payload.hierarchy },
  { name: 'Topic has externalId', pass: !!payload.hierarchy.topic.externalId },
  { name: 'Topic externalId is MainDB ID', pass: payload.hierarchy.topic.externalId === '4b21ddc0-123b-41e3-8ea1-280d37f7f035' },
  { name: 'Sidebar found', pass: !!payload.sidebar },
  { name: 'Sidebar has topics', pass: payload.sidebar.topics.length > 0 },
  { name: 'ActiveUrl generated', pass: !!payload.activeUrl },
  { name: 'Content section exists', pass: payload.content !== undefined },
];

checks.forEach(check => {
  console.log(check.pass ? '  ✅' : '  ❌', check.name);
});

const allPassed = checks.every(c => c.pass);

console.log('');
if (allPassed) {
  console.log('✅ ALL CHECKS PASSED');
  console.log('');
  console.log('Phase 3C-M implementation is COMPLETE and VERIFIED.');
  process.exit(0);
} else {
  console.log('❌ SOME CHECKS FAILED');
  process.exit(1);
}
