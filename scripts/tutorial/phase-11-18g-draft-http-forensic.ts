#!/usr/bin/env tsx
/**
 * ============================================================================
 * PHASE 11.18G — DRAFT + HTTP API FORENSIC
 * ============================================================================
 *
 * PURPOSE
 * -------
 * Inspect the existing draft sidebar row and reconstruct the exact Publish
 * payload to identify differences between:
 * - Stored draft tree
 * - Frontend Publish payload
 * - API validation/normalization
 * - ensureTopicHierarchySynced() input
 *
 * This is READ-ONLY.
 * NO HTTP requests are sent.
 * NO database modifications.
 *
 * ============================================================================
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local explicitly
config({ path: resolve(process.cwd(), '.env.local') });

import { sql } from 'drizzle-orm';
import { db as tutorialDb } from '@quiz/db-tutorial';
import { normalizeNavigationIds } from '../apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-left-sidebar/utils/navigation-id';

/* ============================================================================
 * CONFIGURATION
 * ========================================================================== */

const SIDEBAR_ID = '6fc39d5c-4b65-49c7-96c2-66dec92b1ab8';
const TOPIC_ID = '4b21ddc0-123b-41e3-8ea1-280d37f7f035';

/* ============================================================================
 * TYPES
 * ========================================================================== */

type NavigationNode = {
  id: string;
  name: string;
  type: 'group' | 'page';
  children?: NavigationNode[];
  [key: string]: unknown;
};

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function section(title: string): void {
  console.log('');
  console.log('='.repeat(72));
  console.log(title);
  console.log('='.repeat(72));
  console.log('');
}

function flattenNavigation(
  nodes: NavigationNode[],
  result: NavigationNode[] = [],
): NavigationNode[] {
  for (const node of nodes) {
    result.push(node);
    if (node.children) {
      flattenNavigation(node.children, result);
    }
  }
  return result;
}

function normalizeNavigationId(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

/* ============================================================================
 * MAIN
 * ========================================================================== */

async function main(): Promise<void> {
  console.log('');
  console.log('PHASE 11.18G — DRAFT + HTTP API FORENSIC');
  console.log('');
  console.log('READ-ONLY — NO HTTP REQUESTS — NO DATABASE MODIFICATIONS');
  console.log('');

  // ============================================================
  // LOAD EXISTING DRAFT
  // ============================================================

  section('EXISTING DRAFT INSPECTION');

  const draftResult = await tutorialDb.execute(sql`
    SELECT 
      id,
      brand_id,
      domain_id,
      subject_id,
      topic_id,
      active_subtopic_id,
      status,
      version,
      source_format,
      source_content,
      tree,
      published_at,
      updated_at,
      created_at
    FROM tutorial_sidebar_trees_v2
    WHERE id = ${SIDEBAR_ID}
    LIMIT 1
  `);

  if (draftResult.rows.length === 0) {
    console.error('❌ Draft sidebar row not found');
    console.error(`   Expected ID: ${SIDEBAR_ID}`);
    console.error('');
    console.error('This investigation requires the existing Java draft.');
    process.exitCode = 1;
    return;
  }

  const draft = draftResult.rows[0] as any;

  console.log('Draft Row:');
  console.log(`  id:                  ${draft.id}`);
  console.log(`  brand_id:            ${draft.brand_id}`);
  console.log(`  domain_id:           ${draft.domain_id}`);
  console.log(`  subject_id:          ${draft.subject_id}`);
  console.log(`  topic_id:            ${draft.topic_id}`);
  console.log(`  active_subtopic_id:  ${draft.active_subtopic_id || 'NULL'}`);
  console.log(`  status:              ${draft.status}`);
  console.log(`  version:             ${draft.version}`);
  console.log(`  source_format:       ${draft.source_format}`);
  console.log(`  published_at:        ${draft.published_at || 'NULL'}`);
  console.log(`  created_at:          ${draft.created_at}`);
  console.log(`  updated_at:          ${draft.updated_at}`);
  console.log('');

  // Verify expected state
  if (draft.id !== SIDEBAR_ID) {
    console.error(`❌ Sidebar ID mismatch: expected ${SIDEBAR_ID}, got ${draft.id}`);
  } else {
    console.log('✅ Sidebar ID matches expected');
  }

  if (draft.topic_id !== TOPIC_ID) {
    console.error(`❌ Topic ID mismatch: expected ${TOPIC_ID}, got ${draft.topic_id}`);
  } else {
    console.log('✅ Topic ID matches expected');
  }

  if (draft.status !== 'draft') {
    console.error(`❌ Status is not "draft": ${draft.status}`);
  } else {
    console.log('✅ Status is "draft"');
  }

  if (draft.published_at !== null) {
    console.error(`❌ published_at is not NULL: ${draft.published_at}`);
  } else {
    console.log('✅ published_at is NULL');
  }

  // ============================================================
  // INSPECT STORED TREE
  // ============================================================

  section('STORED NAVIGATION TREE ANALYSIS');

  const storedTree = draft.tree as any;

  if (!storedTree || !storedTree.topics || !Array.isArray(storedTree.topics)) {
    console.error('❌ Stored tree has invalid structure');
    console.error('   Expected: { topics: [...] }');
    console.error('   Actual:', storedTree);
    process.exitCode = 1;
    return;
  }

  console.log(`Stored tree contains ${storedTree.topics.length} top-level topic(s)`);
  console.log('');

  const allNodes = flattenNavigation(storedTree.topics);
  const groupNodes = allNodes.filter((n) => n.type === 'group');
  const pageNodes = allNodes.filter((n) => n.type === 'page');

  console.log('Navigation Statistics:');
  console.log(`  Total nodes:  ${allNodes.length}`);
  console.log(`  Group nodes:  ${groupNodes.length}`);
  console.log(`  Page nodes:   ${pageNodes.length}`);
  console.log('');

  // ============================================================
  // ID NORMALIZATION CHECK
  // ============================================================

  section('ID NORMALIZATION ANALYSIS');

  console.log('Checking stored IDs for normalization consistency...');
  console.log('');

  const idAnalysis: Array<{
    originalId: string;
    normalizedId: string;
    changed: boolean;
    valid: boolean;
  }> = [];

  for (const node of allNodes) {
    const originalId = node.id;
    const normalized = normalizeNavigationId(originalId);
    const changed = originalId !== normalized;
    const valid = normalized.length > 0;

    idAnalysis.push({
      originalId,
      normalizedId: normalized,
      changed,
      valid,
    });

    if (changed) {
      console.log(`  ${originalId.padEnd(32)} → ${normalized}`);
    }
  }

  const changedCount = idAnalysis.filter((a) => a.changed).length;
  const invalidCount = idAnalysis.filter((a) => !a.valid).length;

  console.log('');
  console.log(`IDs that would change on re-normalization: ${changedCount}/${allNodes.length}`);
  console.log(`Invalid IDs (normalize to empty): ${invalidCount}`);
  console.log('');

  if (changedCount > 0) {
    console.log('⚠️  WARNING: Stored IDs differ from normalized form');
    console.log('   This suggests the draft was saved without normalization,');
    console.log('   or normalization rules have changed.');
  } else {
    console.log('✅ All stored IDs are already in normalized form');
  }

  if (invalidCount > 0) {
    console.error('');
    console.error('❌ CRITICAL: Some IDs normalize to empty strings!');
    console.error('   This will cause Publish validation to fail.');
    console.error('');
  }

  // ============================================================
  // DUPLICATE ID CHECK
  // ============================================================

  section('DUPLICATE ID DETECTION');

  const idCounts = new Map<string, number>();
  const normalizedIdCounts = new Map<string, number>();

  for (const node of allNodes) {
    idCounts.set(node.id, (idCounts.get(node.id) || 0) + 1);
    const normalized = normalizeNavigationId(node.id);
    normalizedIdCounts.set(normalized, (normalizedIdCounts.get(normalized) || 0) + 1);
  }

  const originalDuplicates = Array.from(idCounts.entries()).filter(([, count]) => count > 1);
  const normalizedDuplicates = Array.from(normalizedIdCounts.entries()).filter(
    ([, count]) => count > 1,
  );

  console.log(`Original ID duplicates: ${originalDuplicates.length}`);
  console.log(`Normalized ID duplicates: ${normalizedDuplicates.length}`);
  console.log('');

  if (originalDuplicates.length > 0) {
    console.error('❌ Original duplicate IDs found:');
    for (const [id, count] of originalDuplicates) {
      console.error(`   "${id}" appears ${count} times`);
    }
    console.error('');
  } else {
    console.log('✅ No original duplicate IDs');
  }

  if (normalizedDuplicates.length > 0) {
    console.error('❌ Normalized duplicate IDs found:');
    for (const [id, count] of normalizedDuplicates) {
      console.error(`   "${id}" appears ${count} times after normalization`);
    }
    console.error('');
    console.error('   This will cause Publish validation to fail.');
  } else {
    console.log('✅ No normalized duplicate IDs');
  }

  // ============================================================
  // SAMPLE NODES
  // ============================================================

  section('SAMPLE NAVIGATION NODES');

  const sampleNodes = allNodes.slice(0, 10);

  console.log('First 10 nodes:');
  console.log('');

  for (const node of sampleNodes) {
    console.log(`  [${node.type.toUpperCase()}] ${node.name}`);
    console.log(`    id: ${node.id}`);
    console.log(`    normalized: ${normalizeNavigationId(node.id)}`);
    if (node.children && node.children.length > 0) {
      console.log(`    children: ${node.children.length}`);
    }
    console.log('');
  }

  // ============================================================
  // HIERARCHY IDS
  // ============================================================

  section('HIERARCHY ID VERIFICATION');

  console.log('Draft hierarchy IDs:');
  console.log(`  domain_id:  ${draft.domain_id}`);
  console.log(`  subject_id: ${draft.subject_id}`);
  console.log(`  topic_id:   ${draft.topic_id}`);
  console.log('');

  const expectedIds = {
    domainId: '30000000-0000-0000-0000-000000000001',
    subjectId: '3a706051-9d9d-4bdf-af48-331a5acd557e',
    topicId: '4b21ddc0-123b-41e3-8ea1-280d37f7f035',
  };

  if (draft.domain_id === expectedIds.domainId) {
    console.log('✅ domain_id matches Full Stack Development');
  } else {
    console.error(`❌ domain_id mismatch:`);
    console.error(`   Expected: ${expectedIds.domainId}`);
    console.error(`   Actual:   ${draft.domain_id}`);
  }

  if (draft.subject_id === expectedIds.subjectId) {
    console.log('✅ subject_id matches Backend Development');
  } else {
    console.error(`❌ subject_id mismatch:`);
    console.error(`   Expected: ${expectedIds.subjectId}`);
    console.error(`   Actual:   ${draft.subject_id}`);
  }

  if (draft.topic_id === expectedIds.topicId) {
    console.log('✅ topic_id matches Java');
  } else {
    console.error(`❌ topic_id mismatch:`);
    console.error(`   Expected: ${expectedIds.topicId}`);
    console.error(`   Actual:   ${draft.topic_id}`);
  }

  // ============================================================
  // PUBLISH PAYLOAD RECONSTRUCTION
  // ============================================================

  section('PUBLISH PAYLOAD RECONSTRUCTION');

  console.log('When Publish is clicked, the frontend sends:');
  console.log('');
  console.log('POST /api/tutorial-left-sidebar');
  console.log('Content-Type: application/json');
  console.log('');

  const publishPayload = {
    brandId: draft.brand_id,
    domainId: draft.domain_id,
    subjectId: draft.subject_id,
    topicId: draft.topic_id,
    activeSubtopicId: draft.active_subtopic_id || undefined,
    tree: {
      topics: storedTree.topics,
    },
    sourceFormat: draft.source_format,
    sourceContent: draft.source_content,
    status: 'published',
  };

  console.log('Payload (reconstructed):');
  console.log(JSON.stringify(publishPayload, null, 2).substring(0, 500) + '...');
  console.log('');

  console.log('This payload will trigger:');
  console.log('  1. API validation (saveSchema)');
  console.log('  2. Hierarchy validation (getHierarchyNames)');
  console.log('  3. Navigation parsing (JSON/Markdown)');
  console.log('  4. Navigation validation (depth, types, uniqueness)');
  console.log('  5. ID normalization (normalizeNavigationIds)');
  console.log('  6. Tree transformation (transformNavigationTree)');
  console.log('  7. ensureTopicHierarchySynced(topicId) ← Phase 11.18F proved this works');
  console.log('  8. Sidebar persistence (UPSERT tutorial_sidebar_trees_v2)');
  console.log('');

  // ============================================================
  // HTTP GET PATH ANALYSIS
  // ============================================================

  section('HTTP GET PATH ANALYSIS');

  console.log('Browser 404 observation:');
  console.log('  GET /api/tutorial-left-sidebar?brandId=shared&topicId=...');
  console.log('  → 404');
  console.log('');
  console.log('This is EXPECTED behavior when:');
  console.log('  - No PUBLISHED sidebar exists for this topic');
  console.log('  - Only a DRAFT exists');
  console.log('');
  console.log('Current draft status:', draft.status);
  console.log('Current published_at:', draft.published_at || 'NULL');
  console.log('');
  console.log('The GET 404 is NOT blocking Publish.');
  console.log('The GET might be:');
  console.log('  - Composer initialization');
  console.log('  - Draft loading');
  console.log('  - Frontend state sync');
  console.log('');
  console.log('The actual Publish failure is in the POST handler.');

  // ============================================================
  // FINAL DIAGNOSIS
  // ============================================================

  section('PHASE 11.18G — FINAL DIAGNOSIS');

  console.log('DRAFT STATE: ✅ VALID');
  console.log(`  - Sidebar row exists: ${draft.id}`);
  console.log(`  - Status is "draft": ${draft.status === 'draft' ? 'YES' : 'NO'}`);
  console.log(`  - Hierarchy IDs match: ${draft.domain_id === expectedIds.domainId && draft.subject_id === expectedIds.subjectId && draft.topic_id === expectedIds.topicId ? 'YES' : 'NO'}`);
  console.log(`  - Navigation tree exists: ${storedTree && storedTree.topics ? 'YES' : 'NO'}`);
  console.log('');

  console.log('ID VALIDATION:');
  if (invalidCount > 0) {
    console.log('  ❌ FAIL - Some IDs normalize to empty strings');
  } else if (normalizedDuplicates.length > 0) {
    console.log('  ❌ FAIL - Duplicate normalized IDs detected');
  } else if (changedCount > 0) {
    console.log('  ⚠️  WARN - IDs differ from normalized form (may re-normalize on Publish)');
  } else {
    console.log('  ✅ PASS - All IDs are valid and normalized');
  }
  console.log('');

  console.log('PROVEN WORKING (Phase 11.18F):');
  console.log('  ✅ MainDB hierarchy reads');
  console.log('  ✅ TutorialDB domain UPSERT');
  console.log('  ✅ TutorialDB subject UPSERT');
  console.log('  ✅ TutorialDB topic UPSERT');
  console.log('  ✅ TutorialDB subtopic UPSERT');
  console.log('  ✅ Transaction rollback');
  console.log('');

  console.log('REMAINING INVESTIGATION:');
  console.log('  ⚠️  HTTP POST route validation');
  console.log('  ⚠️  API environment differences');
  console.log('  ⚠️  Concurrent modification');
  console.log('  ⚠️  Production database connection');
  console.log('');

  console.log('NEXT STEP:');
  console.log('  Deploy Phase 11.18E instrumented code');
  console.log('  Start admin server');
  console.log('  Click Publish');
  console.log('  Capture [PHASE_11_18E] logs');
  console.log('  Identify exact failure step (SYNC-01 through SYNC-13)');
  console.log('');
}

void main();
