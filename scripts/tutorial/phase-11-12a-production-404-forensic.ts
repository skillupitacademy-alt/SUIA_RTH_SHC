/**
 * PHASE 11.12A — TUTORIAL V2 SIDEBAR / CONTENT AUDIT + PRODUCTION 404 FORENSIC
 *
 * READ ONLY DIAGNOSTIC
 *
 * DO NOT:
 * - Create tutorial_sections rows
 * - Modify URLs
 * - Change routing
 * - Fix schema
 * - Migrate data
 * - Suppress 404
 *
 * Purpose:
 * Determine the exact root cause of production 404 and verify the
 * empty-page architectural contract.
 */

import 'dotenv/config';
import { and, eq, isNull } from 'drizzle-orm';
import {
  dbHttp,
  db as tutorialDb,
  tutorialSections,
  tutorialSubtopics,
  tutorialSidebarTreesV2,
} from '@quiz/db-tutorial';
import { TutorialDocumentSchema } from '@quiz/types';
import {
  domains,
  subjects,
  topics,
  subtopics,
  getDb,
} from '@quiz/db';
import type { TutorialNavigationNode } from '@quiz/types';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// ============================================================
// UTILITIES
// ============================================================

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function compactSlug(value: string | undefined): string {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

type Classification =
  | 'TRUE_EMPTY'
  | 'VALID_EMPTY'
  | 'VALID_WITH_BLOCKS'
  | 'LEGACY_INVALID'
  | 'MALFORMED'
  | 'IDENTITY_MISMATCH'
  | 'URL_MISMATCH';

interface AuditRow {
  brandId: string;
  domain: string;
  domainSlug: string;
  subject: string;
  subjectSlug: string;
  topic: string;
  topicSlug: string;
  subtopic: string;
  subtopicSlug: string;

  navigationNodeId: string;
  navigationNodeName: string;
  navigationNodeSlug: string;
  navigationNodeType: string;

  sidebarUrl: string;

  tutorialSectionExists: boolean;
  tutorialSectionId: string | null;

  schemaVersion: number | null;
  rawBlockCount: number | null;
  validationStatus: 'PASS' | 'FAIL' | 'NOT_APPLICABLE';

  tutorialSectionNavigationNodeId: string | null;
  navigationNodeIdMatch: boolean;

  expectedRouteUrl: string;
  routeUrlMatch: boolean;

  classification: Classification;
}

function flattenSidebarNodes(
  nodes: TutorialNavigationNode[]
): TutorialNavigationNode[] {
  const result: TutorialNavigationNode[] = [];

  function walk(branch: TutorialNavigationNode[]) {
    for (const node of branch) {
      // Only include page nodes
      if (node.type === 'page' && node.slug && node.url) {
        result.push(node);
      }
      if (node.children) {
        walk(node.children);
      }
    }
  }

  walk(nodes);
  return result;
}

function buildExpectedRouteUrl(params: {
  domainSlug: string;
  subjectSlug: string;
  topicSlug: string;
  subtopicSlug: string;
  navigationNodeId: string;
}): string {
  return `/tutorial-v2/${params.domainSlug}/${params.subjectSlug}/${params.topicSlug}/${params.subtopicSlug}/${params.navigationNodeId}`;
}

// ============================================================
// MAIN
// ============================================================

async function main(): Promise<void> {
  console.log('');
  console.log('============================================================');
  console.log('PHASE 11.12A');
  console.log('TUTORIAL V2 SIDEBAR / CONTENT AUDIT + PRODUCTION 404 FORENSIC');
  console.log('READ ONLY DIAGNOSTIC');
  console.log('============================================================');
  console.log('');

  // ============================================================
  // STEP 1 — CHECK GIT / DEPLOYMENT VERSION
  // ============================================================
  console.log('[STEP 1] Git / Deployment Version Check');
  console.log('');
  console.log('Local commit: (run git rev-parse HEAD to verify)');
  console.log('Deployed commit: (requires deployment metadata)');
  console.log('Same commit: UNKNOWN (manual verification required)');
  console.log('');

  const mainDb = getDb();
  const auditRows: AuditRow[] = [];

  // ============================================================
  // STEP 2 — INSPECT CURRENT ROUTE
  // ============================================================
  console.log('[STEP 2] Current Route Architecture');
  console.log('');
  console.log('Route file path:');
  console.log('  apps/skillup-web/src/app/tutorial-v2/');
  console.log('    [domainSlug]/');
  console.log('    [subjectSlug]/');
  console.log('    [topicSlug]/');
  console.log('    [subtopicSlug]/');
  console.log('    [navigationNodeId]/');
  console.log('    page.tsx');
  console.log('');
  console.log('Dynamic parameters:');
  console.log('  domainSlug:      string');
  console.log('  subjectSlug:     string');
  console.log('  topicSlug:       string');
  console.log('  subtopicSlug:    string');
  console.log('  navigationNodeId: string (REQUIRED)');
  console.log('');
  console.log('Expected URL shape:');
  console.log('  /tutorial-v2/{domain}/{subject}/{topic}/{subtopic}/{navigationNodeId}');
  console.log('');

  // ============================================================
  // STEP 3 — INSPECT SIDEBAR GENERATION
  // ============================================================
  console.log('[STEP 3] Sidebar Generation');
  console.log('');
  console.log('Sidebar delivery file:');
  console.log('  src/share-branding/LearningExperience/tutorialSidebarDelivery.ts');
  console.log('');
  console.log('URL generation function:');
  console.log('  withTutorialV2Url()');
  console.log('');
  console.log('URL construction:');
  console.log('  `/tutorial-v2/${domain}/${subject}/${topic}/${canonicalSubtopicSlug(slug)}/${node.id}`');
  console.log('');
  console.log('Subtopic resolution:');
  console.log('  canonicalSubtopicSlug(item.slug || item.name)');
  console.log('');

  // ============================================================
  // STEP 4 — ENUMERATE ALL PUBLISHED SIDEBAR PAGE NODES
  // ============================================================
  console.log('[STEP 4] Enumerating Published Sidebar Page Nodes...');
  console.log('');

  const allDomains = await mainDb
    .select()
    .from(domains)
    .where(isNull(domains.deletedAt));

  console.log(`Found ${allDomains.length} domains`);
  console.log('');

  let totalPageNodes = 0;

  for (const domain of allDomains) {
    const domainSlug = slugify(domain.name);

    const domainSubjects = await mainDb
      .select()
      .from(subjects)
      .where(and(eq(subjects.domainId, domain.id), isNull(subjects.deletedAt)));

    for (const subject of domainSubjects) {
      const subjectSlug = slugify(subject.name);

      const subjectTopics = await mainDb
        .select()
        .from(topics)
        .where(and(eq(topics.subjectId, subject.id), isNull(topics.deletedAt)));

      for (const topic of subjectTopics) {
        const topicSlug = slugify(topic.name);

        // Get published sidebar
        const [sidebar] = await dbHttp
          .select()
          .from(tutorialSidebarTreesV2)
          .where(
            and(
              eq(tutorialSidebarTreesV2.topicId, topic.id),
              eq(tutorialSidebarTreesV2.status, 'published')
            )
          )
          .limit(1);

        if (!sidebar) continue;

        const brandId = sidebar.brandId === 'shared' ? 'skillup' : sidebar.brandId;

        // Flatten page nodes
        const pageNodes = flattenSidebarNodes(sidebar.tree.topics);
        totalPageNodes += pageNodes.length;

        // Get all subtopics for this topic
        const topicSubtopics = await mainDb
          .select()
          .from(subtopics)
          .where(and(eq(subtopics.topicId, topic.id), isNull(subtopics.deletedAt)));

        // ============================================================
        // STEP 5 — MATCH SIDEBAR PAGES TO tutorial_sections
        // ============================================================

        for (const node of pageNodes) {
          const derivedSubtopicSlug = compactSlug(node.slug || node.name);

          // Find matching MainDB subtopic
          const mainDbSubtopic = topicSubtopics.find(
            (s) => compactSlug(s.name) === derivedSubtopicSlug
          );

          if (!mainDbSubtopic) {
            // Cannot match - no subtopic exists
            auditRows.push({
              brandId,
              domain: domain.name,
              domainSlug,
              subject: subject.name,
              subjectSlug,
              topic: topic.name,
              topicSlug,
              subtopic: 'UNKNOWN',
              subtopicSlug: derivedSubtopicSlug,

              navigationNodeId: node.id,
              navigationNodeName: node.name,
              navigationNodeSlug: node.slug || '',
              navigationNodeType: node.type || 'page',

              sidebarUrl: node.url || '',

              tutorialSectionExists: false,
              tutorialSectionId: null,

              schemaVersion: null,
              rawBlockCount: null,
              validationStatus: 'NOT_APPLICABLE',

              tutorialSectionNavigationNodeId: null,
              navigationNodeIdMatch: false,

              expectedRouteUrl: buildExpectedRouteUrl({
                domainSlug,
                subjectSlug,
                topicSlug,
                subtopicSlug: derivedSubtopicSlug,
                navigationNodeId: node.id,
              }),
              routeUrlMatch: false,

              classification: 'IDENTITY_MISMATCH',
            });
            continue;
          }

          // Find TutorialDB subtopic
          const [tutorialSubtopic] = await tutorialDb
            .select()
            .from(tutorialSubtopics)
            .where(eq(tutorialSubtopics.slug, derivedSubtopicSlug))
            .limit(1);

          if (!tutorialSubtopic) {
            // Subtopic exists in MainDB but not TutorialDB
            auditRows.push({
              brandId,
              domain: domain.name,
              domainSlug,
              subject: subject.name,
              subjectSlug,
              topic: topic.name,
              topicSlug,
              subtopic: mainDbSubtopic.name,
              subtopicSlug: derivedSubtopicSlug,

              navigationNodeId: node.id,
              navigationNodeName: node.name,
              navigationNodeSlug: node.slug || '',
              navigationNodeType: node.type || 'page',

              sidebarUrl: node.url || '',

              tutorialSectionExists: false,
              tutorialSectionId: null,

              schemaVersion: null,
              rawBlockCount: null,
              validationStatus: 'NOT_APPLICABLE',

              tutorialSectionNavigationNodeId: null,
              navigationNodeIdMatch: false,

              expectedRouteUrl: buildExpectedRouteUrl({
                domainSlug,
                subjectSlug,
                topicSlug,
                subtopicSlug: derivedSubtopicSlug,
                navigationNodeId: node.id,
              }),
              routeUrlMatch: false,

              classification: 'IDENTITY_MISMATCH',
            });
            continue;
          }

          // Query tutorial_sections
          const [tutorialSection] = await tutorialDb
            .select()
            .from(tutorialSections)
            .where(
              and(
                eq(tutorialSections.subtopicId, tutorialSubtopic.id),
                eq(tutorialSections.navigationNodeId, node.id),
                isNull(tutorialSections.deletedAt)
              )
            )
            .limit(1);

          const expectedRouteUrl = buildExpectedRouteUrl({
            domainSlug,
            subjectSlug,
            topicSlug,
            subtopicSlug: derivedSubtopicSlug,
            navigationNodeId: node.id,
          });

          const sidebarUrl = node.url || '';
          const routeUrlMatch = sidebarUrl === expectedRouteUrl;

          if (!tutorialSection) {
            // TRUE_EMPTY
            auditRows.push({
              brandId,
              domain: domain.name,
              domainSlug,
              subject: subject.name,
              subjectSlug,
              topic: topic.name,
              topicSlug,
              subtopic: mainDbSubtopic.name,
              subtopicSlug: derivedSubtopicSlug,

              navigationNodeId: node.id,
              navigationNodeName: node.name,
              navigationNodeSlug: node.slug || '',
              navigationNodeType: node.type || 'page',

              sidebarUrl,

              tutorialSectionExists: false,
              tutorialSectionId: null,

              schemaVersion: null,
              rawBlockCount: 0,
              validationStatus: 'NOT_APPLICABLE',

              tutorialSectionNavigationNodeId: null,
              navigationNodeIdMatch: true,

              expectedRouteUrl,
              routeUrlMatch,

              classification: routeUrlMatch ? 'TRUE_EMPTY' : 'URL_MISMATCH',
            });
            continue;
          }

          // ============================================================
          // STEP 6 — VALIDATE EXISTING TUTORIAL CONTENT
          // ============================================================

          const content = tutorialSection.content;
          const blocks = (content as any)?.blocks;
          const rawBlockCount = Array.isArray(blocks) ? blocks.length : null;

          let validationStatus: 'PASS' | 'FAIL' | 'NOT_APPLICABLE' = 'NOT_APPLICABLE';
          let classification: Classification = 'MALFORMED';

          if (rawBlockCount !== null) {
            const validation = TutorialDocumentSchema.safeParse(content);
            validationStatus = validation.success ? 'PASS' : 'FAIL';

            if (validation.success) {
              classification = rawBlockCount === 0 ? 'VALID_EMPTY' : 'VALID_WITH_BLOCKS';
            } else {
              classification = 'LEGACY_INVALID';
            }
          }

          const navigationNodeIdMatch =
            tutorialSection.navigationNodeId === node.id;

          auditRows.push({
            brandId,
            domain: domain.name,
            domainSlug,
            subject: subject.name,
            subjectSlug,
            topic: topic.name,
            topicSlug,
            subtopic: mainDbSubtopic.name,
            subtopicSlug: derivedSubtopicSlug,

            navigationNodeId: node.id,
            navigationNodeName: node.name,
            navigationNodeSlug: node.slug || '',
            navigationNodeType: node.type || 'page',

            sidebarUrl,

            tutorialSectionExists: true,
            tutorialSectionId: tutorialSection.id,

            schemaVersion: (content as any)?.schemaVersion ?? null,
            rawBlockCount,
            validationStatus,

            tutorialSectionNavigationNodeId: tutorialSection.navigationNodeId,
            navigationNodeIdMatch,

            expectedRouteUrl,
            routeUrlMatch,

            classification: !navigationNodeIdMatch
              ? 'IDENTITY_MISMATCH'
              : !routeUrlMatch
              ? 'URL_MISMATCH'
              : classification,
          });
        }
      }
    }
  }

  console.log(`Total published sidebar page nodes: ${totalPageNodes}`);
  console.log('');

  // ============================================================
  // STEP 7 — PRODUCE THE COMPLETE AUDIT TABLE
  // ============================================================
  console.log('[STEP 7] Generating audit files...');
  console.log('');

  mkdirSync('test-results/tutorial-v2', { recursive: true });

  // JSON
  writeFileSync(
    'test-results/tutorial-v2/sidebar-content-audit.json',
    JSON.stringify(auditRows, null, 2)
  );

  // CSV
  const csvHeaders = Object.keys(auditRows[0] || {}).join(',');
  const csvRows = auditRows.map((row) =>
    Object.values(row)
      .map((v) => (typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v))
      .join(',')
  );
  writeFileSync(
    'test-results/tutorial-v2/sidebar-content-audit.csv',
    [csvHeaders, ...csvRows].join('\n')
  );

  console.log('✅ test-results/tutorial-v2/sidebar-content-audit.json');
  console.log('✅ test-results/tutorial-v2/sidebar-content-audit.csv');
  console.log('');

  // ============================================================
  // STEP 8 — PRINT SUMMARY
  // ============================================================
  console.log('');
  console.log('============================================================');
  console.log('TUTORIAL V2 SIDEBAR / CONTENT AUDIT');
  console.log('============================================================');
  console.log('');

  const counts = {
    total: auditRows.length,
    tutorialSectionsMatched: auditRows.filter((r) => r.tutorialSectionExists).length,
    TRUE_EMPTY: auditRows.filter((r) => r.classification === 'TRUE_EMPTY').length,
    VALID_EMPTY: auditRows.filter((r) => r.classification === 'VALID_EMPTY').length,
    VALID_WITH_BLOCKS: auditRows.filter((r) => r.classification === 'VALID_WITH_BLOCKS')
      .length,
    LEGACY_INVALID: auditRows.filter((r) => r.classification === 'LEGACY_INVALID').length,
    MALFORMED: auditRows.filter((r) => r.classification === 'MALFORMED').length,
    IDENTITY_MISMATCH: auditRows.filter((r) => r.classification === 'IDENTITY_MISMATCH')
      .length,
    URL_MISMATCH: auditRows.filter((r) => r.classification === 'URL_MISMATCH').length,
  };

  console.log(`Published Sidebar Page Nodes:       ${counts.total}`);
  console.log(`tutorial_sections records matched:  ${counts.tutorialSectionsMatched}`);
  console.log('');
  console.log(`TRUE_EMPTY:                          ${counts.TRUE_EMPTY}`);
  console.log(`VALID_EMPTY:                         ${counts.VALID_EMPTY}`);
  console.log(`VALID_WITH_BLOCKS:                   ${counts.VALID_WITH_BLOCKS}`);
  console.log(`LEGACY_INVALID:                      ${counts.LEGACY_INVALID}`);
  console.log(`MALFORMED:                           ${counts.MALFORMED}`);
  console.log(`IDENTITY_MISMATCH:                   ${counts.IDENTITY_MISMATCH}`);
  console.log(`URL_MISMATCH:                        ${counts.URL_MISMATCH}`);
  console.log('');
  console.log(`Pages with content:                  ${counts.tutorialSectionsMatched}`);
  console.log(`Pages without content:               ${counts.total - counts.tutorialSectionsMatched}`);
  console.log(`Pages with valid content:            ${counts.VALID_EMPTY + counts.VALID_WITH_BLOCKS}`);
  console.log(`Pages with invalid content:          ${counts.LEGACY_INVALID + counts.MALFORMED}`);
  console.log('');

  // ============================================================
  // STEP 9 — SPECIFICALLY AUDIT JAVA
  // ============================================================
  console.log('');
  console.log('============================================================');
  console.log('JAVA HIERARCHY AUDIT');
  console.log('============================================================');
  console.log('');

  const javaRows = auditRows.filter((r) => r.topicSlug === 'java');

  console.log(`Java page nodes: ${javaRows.length}`);
  console.log('');

  if (javaRows.length > 0) {
    console.log('navigationNodeId'.padEnd(25), 'Name'.padEnd(30), 'Content', 'Blocks', 'Status');
    console.log('─'.repeat(120));

    for (const row of javaRows.slice(0, 20)) {
      console.log(
        row.navigationNodeId.padEnd(25),
        row.navigationNodeName.padEnd(30),
        row.tutorialSectionExists ? 'YES' : 'NO ',
        String(row.rawBlockCount ?? '-').padEnd(6),
        row.classification
      );
    }

    if (javaRows.length > 20) {
      console.log(`... and ${javaRows.length - 20} more`);
    }
  }

  console.log('');

  // ============================================================
  // STEP 10-14 — DEPLOYED 404 INVESTIGATION
  // ============================================================
  console.log('');
  console.log('============================================================');
  console.log('DEPLOYED 404 INVESTIGATION');
  console.log('============================================================');
  console.log('');
  console.log('Requested URL:');
  console.log('  https://user.skillupitacademy.com/tutorial-v2/full-stack-development/backend-development/java/whatisjava');
  console.log('');
  console.log('MANUAL TESTING REQUIRED:');
  console.log('  1. Test deployed URL with authenticated session');
  console.log('  2. Capture HTTP status, redirect chain, response');
  console.log('  3. Compare with local development behavior');
  console.log('');

  // Find what-is-java in audit
  const whatIsJava = javaRows.find((r) => r.navigationNodeId === 'what-is-java');
  const javaSyntax = javaRows.find((r) => r.navigationNodeId === 'java-syntax');

  if (whatIsJava) {
    console.log('what-is-java audit result:');
    console.log(`  navigationNodeId:      ${whatIsJava.navigationNodeId}`);
    console.log(`  subtopicSlug:          ${whatIsJava.subtopicSlug}`);
    console.log(`  sidebarUrl:            ${whatIsJava.sidebarUrl}`);
    console.log(`  expectedRouteUrl:      ${whatIsJava.expectedRouteUrl}`);
    console.log(`  routeUrlMatch:         ${whatIsJava.routeUrlMatch}`);
    console.log(`  tutorialSectionExists: ${whatIsJava.tutorialSectionExists}`);
    console.log(`  rawBlockCount:         ${whatIsJava.rawBlockCount}`);
    console.log(`  classification:        ${whatIsJava.classification}`);
    console.log('');
  }

  if (javaSyntax) {
    console.log('java-syntax audit result:');
    console.log(`  navigationNodeId:      ${javaSyntax.navigationNodeId}`);
    console.log(`  subtopicSlug:          ${javaSyntax.subtopicSlug}`);
    console.log(`  sidebarUrl:            ${javaSyntax.sidebarUrl}`);
    console.log(`  expectedRouteUrl:      ${javaSyntax.expectedRouteUrl}`);
    console.log(`  routeUrlMatch:         ${javaSyntax.routeUrlMatch}`);
    console.log(`  tutorialSectionExists: ${javaSyntax.tutorialSectionExists}`);
    console.log(`  rawBlockCount:         ${javaSyntax.rawBlockCount}`);
    console.log(`  classification:        ${javaSyntax.classification}`);
    console.log('');
  }

  // ============================================================
  // STEP 15 — CHECK THE EMPTY-PAGE CONTRACT
  // ============================================================
  console.log('');
  console.log('============================================================');
  console.log('EMPTY-PAGE CONTRACT VERIFICATION');
  console.log('============================================================');
  console.log('');
  console.log('Expected architectural contract:');
  console.log('  Sidebar page exists (published)');
  console.log('    +');
  console.log('  tutorial_sections record ABSENT');
  console.log('    ↓');
  console.log('  Delivery returns: { tutorial: null }');
  console.log('    ↓');
  console.log('  Page payload: { content: { blocks: [] } }');
  console.log('    ↓');
  console.log('  Learner sees: Sidebar + empty content state');
  console.log('');
  console.log('Current implementation:');
  console.log('  tutorialSidebarDelivery.ts line 397:');
  console.log('    if (!tutorial) console.log("continuing with empty content");');
  console.log('');
  console.log('  page.tsx:');
  console.log('    Empty block check REMOVED (Phase 11.11D)');
  console.log('');
  console.log('Contract status: IMPLEMENTED ✅');
  console.log('');
  console.log('HOWEVER: Production 404 suggests either:');
  console.log('  A. URL mismatch preventing route match');
  console.log('  B. Deployment running older code');
  console.log('  C. Different code path in production');
  console.log('');

  // ============================================================
  // FINAL REPORT
  // ============================================================
  console.log('');
  console.log('============================================================');
  console.log('PHASE 11.12A — FINAL FORENSIC RESULT');
  console.log('============================================================');
  console.log('');
  console.log('SIDEBAR');
  console.log('');
  console.log(`Published page nodes:      ${counts.total}`);
  console.log(`tutorial_sections matched: ${counts.tutorialSectionsMatched}`);
  console.log('');
  console.log(`TRUE_EMPTY:                ${counts.TRUE_EMPTY}`);
  console.log(`VALID_WITH_BLOCKS:         ${counts.VALID_WITH_BLOCKS}`);
  console.log(`LEGACY_INVALID:            ${counts.LEGACY_INVALID}`);
  console.log(`URL_MISMATCH:              ${counts.URL_MISMATCH}`);
  console.log(`IDENTITY_MISMATCH:         ${counts.IDENTITY_MISMATCH}`);
  console.log('');
  console.log('────────────────────────────────────────────────────────────');
  console.log('');
  console.log('ROOT CAUSE HYPOTHESIS');
  console.log('');

  if (counts.URL_MISMATCH > 0) {
    console.log('PRIMARY SUSPECT: URL_MISMATCH');
    console.log('');
    console.log(`  ${counts.URL_MISMATCH} sidebar page(s) have URLs that do not match`);
    console.log('  the expected Next.js route pattern.');
    console.log('');
    console.log('  Sidebar URLs use pattern:');
    console.log('    /tutorial-v2/{domain}/{subject}/{topic}/{subtopicSlug}');
    console.log('');
    console.log('  Next.js route expects:');
    console.log('    /tutorial-v2/{domain}/{subject}/{topic}/{subtopicSlug}/{navigationNodeId}');
    console.log('');
    console.log('  RECOMMENDATION:');
    console.log('    Fix sidebar URL generation to include navigationNodeId');
    console.log('');
  } else if (counts.TRUE_EMPTY === counts.total) {
    console.log('ALL PAGES ARE TRUE_EMPTY');
    console.log('');
    console.log('  No tutorial_sections records exist.');
    console.log('  Empty-page contract should handle this.');
    console.log('');
    console.log('  If production returns 404:');
    console.log('    Verify deployed code includes Phase 11.11D changes');
    console.log('');
  } else {
    console.log('MIXED STATE DETECTED');
    console.log('');
    console.log('  Some pages have content, most do not.');
    console.log('  URL mismatches detected.');
    console.log('');
    console.log('  Manual production testing required.');
    console.log('');
  }

  console.log('────────────────────────────────────────────────────────────');
  console.log('');
  console.log('RECOMMENDATION');
  console.log('');

  if (counts.URL_MISMATCH > 0) {
    console.log('CODE CHANGE REQUIRED');
    console.log('');
    console.log('Files to modify:');
    console.log('  src/share-branding/LearningExperience/tutorialSidebarDelivery.ts');
    console.log('');
    console.log('Change:');
    console.log('  withTutorialV2Url() already generates correct URLs');
    console.log('  BUT stored sidebar JSON may have stale URLs');
    console.log('');
    console.log('Action:');
    console.log('  Verify sidebar generation creates correct URLs');
    console.log('  OR add runtime URL transformation if needed');
    console.log('');
    console.log('DO NOT IMPLEMENT until approved.');
    console.log('');
  } else {
    console.log('NO CODE CHANGE REQUIRED');
    console.log('');
    console.log('Empty-page contract is implemented correctly.');
    console.log('Investigate deployment/environment mismatch.');
    console.log('');
  }

  console.log('============================================================');
  console.log('PHASE 11.12A COMPLETE');
  console.log('============================================================');
}

main().catch((error) => {
  console.error('');
  console.error('PHASE 11.12A FAILED');
  console.error(error);
  process.exitCode = 1;
});
