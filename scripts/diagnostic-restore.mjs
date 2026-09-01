#!/usr/bin/env node
/**
 * DIAGNOSTIC: Restore Original Files
 * 
 * Removes temporary diagnostic logging
 */

import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';

const PAGE_PATH = 'apps/skillup-web/src/app/tutorial-v2/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/[navigationNodeId]/page.tsx';
const RESOLVER_PATH = 'src/share-branding/LearningExperience/runtime/tutorialRuntimeResolver.ts';

console.log('Restoring original files...\n');

if (existsSync(PAGE_PATH + '.backup')) {
  const pageOriginal = readFileSync(PAGE_PATH + '.backup', 'utf-8');
  writeFileSync(PAGE_PATH, pageOriginal);
  unlinkSync(PAGE_PATH + '.backup');
  console.log('✓ Restored page.tsx');
}

if (existsSync(RESOLVER_PATH + '.backup')) {
  const resolverOriginal = readFileSync(RESOLVER_PATH + '.backup', 'utf-8');
  writeFileSync(RESOLVER_PATH, resolverOriginal);
  unlinkSync(RESOLVER_PATH + '.backup');
  console.log('✓ Restored tutorialRuntimeResolver.ts');
}

console.log('\n✓ Diagnostic cleanup complete\n');
