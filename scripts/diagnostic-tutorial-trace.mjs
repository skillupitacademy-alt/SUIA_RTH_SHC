#!/usr/bin/env node
/**
 * DIAGNOSTIC: Tutorial V2 Execution Path Tracer
 * 
 * Purpose: Add temporary logging to prove EXACT 404 origin
 * 
 * This script temporarily instruments the Tutorial V2 route to capture:
 * - Whether page.tsx is entered
 * - Whether extractLearnerIdFromHeaders() is called
 * - What headers are present
 * - Whether redirect() is called
 * - Whether resolveRuntimeContext() is called
 * - Whether notFound() is called
 * 
 * RULES:
 * - Minimal instrumentation
 * - No behavior changes
 * - Clear markers for temporary code
 * - No password/token logging
 */

import { readFileSync, writeFileSync } from 'fs';

const PAGE_PATH = 'apps/skillup-web/src/app/tutorial-v2/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/[navigationNodeId]/page.tsx';
const RESOLVER_PATH = 'src/share-branding/LearningExperience/runtime/tutorialRuntimeResolver.ts';

console.log('Adding diagnostic logging to Tutorial V2 route...\n');

// Backup original files
const pageOriginal = readFileSync(PAGE_PATH, 'utf-8');
const resolverOriginal = readFileSync(RESOLVER_PATH, 'utf-8');

writeFileSync(PAGE_PATH + '.backup', pageOriginal);
writeFileSync(RESOLVER_PATH + '.backup', resolverOriginal);

// Add logging to page.tsx
const pageInstrumented = pageOriginal.replace(
  'export default async function TutorialV2SubtopicPage({ params }: PageProps) {',
  `export default async function TutorialV2SubtopicPage({ params }: PageProps) {
  console.log('[DIAGNOSTIC] TutorialV2SubtopicPage ENTERED');`
);

const pageInstrumented2 = pageInstrumented.replace(
  'const learnerId = extractLearnerIdFromHeaders(headersList);',
  `const learnerId = extractLearnerIdFromHeaders(headersList);
  console.log('[DIAGNOSTIC] extractLearnerIdFromHeaders returned:', learnerId ? 'PRESENT' : 'NULL');`
);

const pageInstrumented3 = pageInstrumented2.replace(
  'if (!learnerId) {',
  `if (!learnerId) {
    console.log('[DIAGNOSTIC] REDIRECTING TO LOGIN - no learnerId');`
);

const pageInstrumented4 = pageInstrumented3.replace(
  'if (!result.success) {',
  `console.log('[DIAGNOSTIC] resolveRuntimeContext result:', result.success ? 'SUCCESS' : 'FAILURE');
  if (!result.success) {
    console.log('[DIAGNOSTIC] CALLING notFound() - resolver failed');`
);

writeFileSync(PAGE_PATH, pageInstrumented4);

// Add logging to extractLearnerIdFromHeaders
const resolverInstrumented = resolverOriginal.replace(
  'export function extractLearnerIdFromHeaders(',
  `export function extractLearnerIdFromHeaders(`
).replace(
  'const userId = headers.get(\'x-user-id\');',
  `const userId = headers.get('x-user-id');
  const shadowUserId = headers.get('x-shadow-user-id');
  console.log('[DIAGNOSTIC] extractLearnerIdFromHeaders called:', {
    hasXUserId: !!userId,
    hasXShadowUserId: !!shadowUserId,
  });`
);

writeFileSync(RESOLVER_PATH, resolverInstrumented);

console.log('✓ Diagnostic logging added');
console.log('✓ Backups created (.backup files)');
console.log('\nRun E2E certification now, then run restore script.\n');
