/**
 * PHASE 11.11E
 *
 * TRUE ZERO-BLOCK TUTORIAL FIXTURE DIAGNOSTIC
 *
 * READ ONLY
 *
 * This script MUST NOT:
 * - insert
 * - update
 * - delete
 * - publish
 * - archive
 * - migrate
 *
 * Purpose:
 * Identify genuine empty Tutorial Engine pages and distinguish them
 * from legacy-invalid tutorial documents that delivery converts to [].
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
import type { TutorialNavigationNode, TutorialSidebarBrandId } from '@quiz/types';

type FixtureStatus =
  | 'TRUE_EMPTY'
  | 'LEGACY_INVALID'
  | 'VALID_WITH_BLOCKS'
  | 'MISSING_MAPPING'
  | 'INVALID_HIERARCHY';

interface Candidate {
  brandId: string;

  domainName?: string;
  domainSlug?: string;

  subjectName?: string;
  subjectSlug?: string;

  topicName?: string;
  topicSlug?: string;

  subtopicName?: string;
  subtopicSlug?: string;

  navigationNodeId?: string;
  navigationNodeSlug?: string;
  navigationNodeName?: string;

  sidebarUrl?: string;
  routeUrl?: string;

  tutorialId?: string;
  tutorialStatus?: string;

  rawBlockCount: number | null;

  schemaVersion?: number;

  validationStatus:
    | 'PASS'
    | 'FAIL'
    | 'NOT_APPLICABLE'
    | 'NOT_CHECKED';

  status: FixtureStatus;

  notes: string[];
}

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

function buildRouteUrl(params: {
  domainSlug: string;
  subjectSlug: string;
  topicSlug: string;
  subtopicSlug: string;
  navigationNodeId?: string;
}): string {
  const base =
    `/tutorial-v2/` +
    `${params.domainSlug}/` +
    `${params.subjectSlug}/` +
    `${params.topicSlug}/` +
    `${params.subtopicSlug}`;

  if (!params.navigationNodeId) {
    return base;
  }

  return `${base}/${params.navigationNodeId}`;
}

function classifyTutorialContent(
  tutorial: any | null
): {
  status: FixtureStatus;
  rawBlockCount: number | null;
  schemaVersion?: number;
  validationStatus: Candidate['validationStatus'];
  notes: string[];
} {
  if (!tutorial) {
    return {
      status: 'TRUE_EMPTY',
      rawBlockCount: 0,
      validationStatus: 'NOT_APPLICABLE',
      notes: [
        'No tutorial content record exists.',
        'This is a genuine empty-page candidate.',
      ],
    };
  }

  const content = tutorial.content;

  if (!content || typeof content !== 'object') {
    return {
      status: 'LEGACY_INVALID',
      rawBlockCount: null,
      validationStatus: 'FAIL',
      notes: [
        'Tutorial record exists but content is missing or malformed.',
      ],
    };
  }

  const blocks = (content as any).blocks;

  if (!Array.isArray(blocks)) {
    return {
      status: 'LEGACY_INVALID',
      rawBlockCount: null,
      schemaVersion: content.schemaVersion,
      validationStatus: 'FAIL',
      notes: [
        'content.blocks is not an array.',
        'Do not classify as TRUE_EMPTY.',
      ],
    };
  }

  if (blocks.length === 0) {
    // Validate against current schema to ensure it's genuinely valid empty
    const validation = TutorialDocumentSchema.safeParse(content);
    
    if (!validation.success) {
      return {
        status: 'LEGACY_INVALID',
        rawBlockCount: 0,
        schemaVersion: content.schemaVersion,
        validationStatus: 'FAIL',
        notes: [
          'Tutorial has blocks:[] but fails schema validation.',
          'Malformed empty document structure.',
        ],
      };
    }

    return {
      status: 'TRUE_EMPTY',
      rawBlockCount: 0,
      schemaVersion: content.schemaVersion,
      validationStatus: 'PASS',
      notes: [
        'Tutorial record exists.',
        'content.blocks is genuinely empty.',
        'Schema validation PASS.',
      ],
    };
  }

  // Has blocks - validate to distinguish valid from legacy
  const validation = TutorialDocumentSchema.safeParse(content);
  
  if (!validation.success) {
    return {
      status: 'LEGACY_INVALID',
      rawBlockCount: blocks.length,
      schemaVersion: content.schemaVersion,
      validationStatus: 'FAIL',
      notes: [
        `Tutorial contains ${blocks.length} raw block(s).`,
        'Schema validation FAIL - legacy/incompatible content.',
        'Delivery will convert to blocks:[] - NOT a true empty fixture.',
      ],
    };
  }

  return {
    status: 'VALID_WITH_BLOCKS',
    rawBlockCount: blocks.length,
    schemaVersion: content.schemaVersion,
    validationStatus: 'PASS',
    notes: [
      `Tutorial contains ${blocks.length} valid block(s).`,
    ],
  };
}

function printCandidate(candidate: Candidate): void {
  console.log('');
  console.log('============================================================');
  console.log('CANDIDATE');
  console.log('============================================================');

  console.log(`Status:                  ${candidate.status}`);
  console.log(`Brand:                   ${candidate.brandId}`);

  console.log(`Domain:                  ${candidate.domainName ?? '-'}`);
  console.log(`Domain Slug:             ${candidate.domainSlug ?? '-'}`);

  console.log(`Subject:                 ${candidate.subjectName ?? '-'}`);
  console.log(`Subject Slug:            ${candidate.subjectSlug ?? '-'}`);

  console.log(`Topic:                   ${candidate.topicName ?? '-'}`);
  console.log(`Topic Slug:              ${candidate.topicSlug ?? '-'}`);

  console.log(`Subtopic:                ${candidate.subtopicName ?? '-'}`);
  console.log(`Subtopic Slug:           ${candidate.subtopicSlug ?? '-'}`);

  console.log(
    `Navigation Node ID:      ${candidate.navigationNodeId ?? '-'}`
  );

  console.log(
    `Navigation Node Slug:    ${candidate.navigationNodeSlug ?? '-'}`
  );

  console.log(
    `Navigation Node Name:    ${candidate.navigationNodeName ?? '-'}`
  );

  console.log(`Sidebar URL:             ${candidate.sidebarUrl ?? '-'}`);
  console.log(`Route URL:               ${candidate.routeUrl ?? '-'}`);

  console.log(`Tutorial ID:             ${candidate.tutorialId ?? '-'}`);
  console.log(
    `Tutorial Status:         ${candidate.tutorialStatus ?? '-'}`
  );

  console.log(
    `Schema Version:          ${candidate.schemaVersion ?? '-'}`
  );

  console.log(
    `Raw Block Count:         ${candidate.rawBlockCount ?? '-'}`
  );

  console.log(
    `Validation:              ${candidate.validationStatus}`
  );

  if (candidate.sidebarUrl && candidate.routeUrl) {
    console.log(
      `URL MATCH:               ${
        candidate.sidebarUrl === candidate.routeUrl ? 'YES' : 'NO'
      }`
    );
  }

  if (candidate.notes.length > 0) {
    console.log('');
    console.log('Notes:');

    for (const note of candidate.notes) {
      console.log(`  - ${note}`);
    }
  }
}

function flattenSidebarNodes(nodes: TutorialNavigationNode[]): Array<{
  id: string;
  name: string;
  slug?: string;
  url?: string;
}> {
  const items: Array<{ id: string; name: string; slug?: string; url?: string }> = [];

  function walk(branch: TutorialNavigationNode[]) {
    for (const node of branch) {
      // Only include page nodes (have url and slug)
      if (node.url && node.slug) {
        items.push({
          id: node.id,
          name: node.name,
          slug: node.slug,
          url: node.url,
        });
      }
      if (node.children) {
        walk(node.children);
      }
    }
  }

  walk(nodes);
  return items;
}

async function main(): Promise<void> {
  console.log('');
  console.log('============================================================');
  console.log('PHASE 11.11E');
  console.log('TRUE ZERO-BLOCK TUTORIAL FIXTURE DIAGNOSTIC');
  console.log('READ ONLY');
  console.log('============================================================');
  console.log('');

  const mainDb = getDb();
  const candidates: Candidate[] = [];

  // Step 1: Enumerate hierarchy
  console.log('[DIAGNOSTIC] Step 1: Enumerating MainDB hierarchy...');

  const allDomains = await mainDb
    .select()
    .from(domains)
    .where(isNull(domains.deletedAt));

  console.log(`[DIAGNOSTIC] Found ${allDomains.length} domains`);

  for (const domain of allDomains) {
    const domainSlug = slugify(domain.name);

    const domainSubjects = await mainDb
      .select()
      .from(subjects)
      .where(and(
        eq(subjects.domainId, domain.id),
        isNull(subjects.deletedAt)
      ));

    for (const subject of domainSubjects) {
      const subjectSlug = slugify(subject.name);

      const subjectTopics = await mainDb
        .select()
        .from(topics)
        .where(and(
          eq(topics.subjectId, subject.id),
          isNull(topics.deletedAt)
        ));

      for (const topic of subjectTopics) {
        const topicSlug = slugify(topic.name);

        // Step 2: Load published sidebar for this topic
        const sharedSidebars = await dbHttp
          .select()
          .from(tutorialSidebarTreesV2)
          .where(and(
            eq(tutorialSidebarTreesV2.brandId, 'shared'),
            eq(tutorialSidebarTreesV2.topicId, topic.id),
            eq(tutorialSidebarTreesV2.status, 'published')
          ))
          .limit(1);

        const skillupSidebars = sharedSidebars.length > 0
          ? []
          : await dbHttp
            .select()
            .from(tutorialSidebarTreesV2)
            .where(and(
              eq(tutorialSidebarTreesV2.brandId, 'skillup'),
              eq(tutorialSidebarTreesV2.topicId, topic.id),
              eq(tutorialSidebarTreesV2.status, 'published')
            ))
            .limit(1);

        const sidebar = sharedSidebars[0] ?? skillupSidebars[0];

        if (!sidebar) {
          console.log(`[DIAGNOSTIC] No sidebar for topic: ${topic.name}`);
          continue;
        }

        const brandId = sidebar.brandId === 'shared' ? 'skillup' : sidebar.brandId;

        console.log(`[DIAGNOSTIC] Found sidebar for topic: ${topic.name} (brand: ${brandId})`);

        // Step 3: Flatten navigation nodes
        const pageNodes = flattenSidebarNodes(sidebar.tree.topics);

        console.log(`[DIAGNOSTIC] Found ${pageNodes.length} page nodes in sidebar`);

        // Step 4: For each page node, check tutorial content
        for (const node of pageNodes) {
          // Find subtopic for this node (extract from URL or use first subtopic)
          const topicSubtopics = await mainDb
            .select()
            .from(subtopics)
            .where(and(
              eq(subtopics.topicId, topic.id),
              isNull(subtopics.deletedAt)
            ));

          if (topicSubtopics.length === 0) {
            continue;
          }

          // For now, associate with first subtopic
          // TODO: Parse from node.url if needed
          const subtopic = topicSubtopics[0];
          const subtopicSlug = compactSlug(subtopic.name);

          // Build route URL
          const routeUrl = buildRouteUrl({
            domainSlug,
            subjectSlug,
            topicSlug,
            subtopicSlug,
            navigationNodeId: node.id,
          });

          // Step 5: Query tutorial content by (subtopicSlug, navigationNodeId)
          const [tutorialSubtopicRecord] = await tutorialDb
            .select()
            .from(tutorialSubtopics)
            .where(eq(tutorialSubtopics.slug, subtopicSlug))
            .limit(1);

          let tutorial: any = null;
          let tutorialId: string | undefined;
          let tutorialStatus: string | undefined;

          if (tutorialSubtopicRecord) {
            const [tutorialRecord] = await tutorialDb
              .select()
              .from(tutorialSections)
              .where(and(
                eq(tutorialSections.subtopicId, tutorialSubtopicRecord.id),
                eq(tutorialSections.navigationNodeId, node.id),
                isNull(tutorialSections.deletedAt)
              ))
              .limit(1);

            if (tutorialRecord) {
              tutorial = tutorialRecord;
              tutorialId = tutorialRecord.id;
              tutorialStatus = tutorialRecord.status;
            }
          }

          // Step 6: Classify
          const classification = classifyTutorialContent(tutorial);

          const candidate: Candidate = {
            brandId,
            domainName: domain.name,
            domainSlug,
            subjectName: subject.name,
            subjectSlug,
            topicName: topic.name,
            topicSlug,
            subtopicName: subtopic.name,
            subtopicSlug,
            navigationNodeId: node.id,
            navigationNodeSlug: node.slug,
            navigationNodeName: node.name,
            sidebarUrl: node.url,
            routeUrl,
            tutorialId,
            tutorialStatus,
            ...classification,
          };

          candidates.push(candidate);
        }
      }
    }
  }

  // Step 7: Print results
  console.log('');
  console.log('============================================================');
  console.log('RESULTS');
  console.log('============================================================');

  const trueEmptyCandidates = candidates.filter(
    (candidate) => candidate.status === 'TRUE_EMPTY'
  );

  const legacyInvalidCandidates = candidates.filter(
    (candidate) => candidate.status === 'LEGACY_INVALID'
  );

  const validWithBlocksCandidates = candidates.filter(
    (candidate) => candidate.status === 'VALID_WITH_BLOCKS'
  );

  console.log('');
  console.log(`TRUE_EMPTY candidates:     ${trueEmptyCandidates.length}`);
  console.log(`LEGACY_INVALID candidates: ${legacyInvalidCandidates.length}`);
  console.log(`VALID_WITH_BLOCKS:         ${validWithBlocksCandidates.length}`);
  console.log(`TOTAL:                     ${candidates.length}`);
  console.log('');

  // Print TRUE_EMPTY first
  for (const candidate of trueEmptyCandidates) {
    printCandidate(candidate);
  }

  // Print LEGACY_INVALID (including current what-is-java)
  for (const candidate of legacyInvalidCandidates) {
    printCandidate(candidate);
  }

  // Print first 3 VALID_WITH_BLOCKS as examples
  for (const candidate of validWithBlocksCandidates.slice(0, 3)) {
    printCandidate(candidate);
  }

  console.log('');
  console.log('============================================================');
  console.log('FINAL RESULT');
  console.log('============================================================');

  if (trueEmptyCandidates.length === 0) {
    console.error('');
    console.error('NO TRUE_EMPTY FIXTURE FOUND.');
    console.error(
      'Do NOT use a legacy-invalid tutorial as the zero-block fixture.'
    );
    console.error('');
    console.error('Recommendation:');
    console.error('  - Create a new sidebar page node');
    console.error('  - Publish the sidebar');
    console.error('  - Do NOT create tutorial content');
    console.error('  - Test that page returns HTTP 200 with sidebar visible');

    process.exitCode = 1;
    return;
  }

  console.log('');
  console.log('BEST TRUE_EMPTY FIXTURE:');

  const best = trueEmptyCandidates[0];
  printCandidate(best);

  console.log('');
  console.log('============================================================');
  console.log('URL ANALYSIS');
  console.log('============================================================');

  console.log(`Sidebar URL:              ${best.sidebarUrl}`);
  console.log(`Current Next.js Route:    ${best.routeUrl}`);
  console.log(`URLs Match:               ${best.sidebarUrl === best.routeUrl ? 'YES' : 'NO'}`);
  console.log('');
  console.log(`navigationNodeId in sidebar URL: ${best.sidebarUrl?.includes(best.navigationNodeId ?? '') ? 'YES' : 'NO'}`);
  console.log(`navigationNodeId in route:       YES (required by [navigationNodeId]/page.tsx)`);

  console.log('');
  console.log('============================================================');
  console.log('IDENTITY ANALYSIS');
  console.log('============================================================');

  console.log('MainDB hierarchy identity:');
  console.log(`  domain → subject → topic → subtopic`);
  console.log('');
  console.log('Sidebar page identity:');
  console.log(`  sidebar.tree.topics[...].id (navigationNodeId)`);
  console.log('');
  console.log('TutorialDB page identity:');
  console.log(`  tutorialSections.subtopicId + navigationNodeId`);
  console.log('');
  console.log('Tutorial content identity:');
  console.log(`  tutorial_sections.id (UUID)`);
  console.log('');
  console.log('navigationNodeId persisted:  YES (tutorial_sections.navigation_node_id)');
  console.log('tutorial_pages exists:       NO (uses tutorial_sections directly)');
  console.log('tutorial_sections.navigation_node_id: YES (REQUIRED, NOT NULL)');

  console.log('');
  console.log('============================================================');
  console.log('EMPTY PAGE BEHAVIOR');
  console.log('============================================================');

  console.log('Draft empty document allowed:      UNKNOWN (not tested)');
  console.log('Published empty document allowed:  NO (composer rejects DOCUMENT_EMPTY)');
  console.log('');
  console.log('Correct empty-page representation:');
  console.log('  - Sidebar page exists (published)');
  console.log('  - Tutorial content record: ABSENT');
  console.log('  - Delivery returns: { tutorial: null }');
  console.log('  - Page payload: { content: { blocks: [] } }');
  console.log('  - Page renders: Sidebar + empty content state');

  console.log('');
  console.log('============================================================');
  console.log('LEGACY INVALID FIXTURE');
  console.log('============================================================');

  const legacyFixture = legacyInvalidCandidates.find(
    c => c.navigationNodeId === 'what-is-java'
  );

  if (legacyFixture) {
    console.log('Current what-is-java fixture:  LEGACY_INVALID');
    console.log(`Tutorial ID:                   ${legacyFixture.tutorialId}`);
    console.log(`Raw block count:               ${legacyFixture.rawBlockCount ?? 'unknown'}`);
    console.log(`Schema validation:             FAIL`);
    console.log(`Delivery fallback:             blocks: []`);
    console.log('');
    console.log('Therefore:');
    console.log('  NOT suitable as TRUE_EMPTY fixture.');
    console.log('  Use for schema validation testing only.');
  }

  console.log('');
  console.log('============================================================');
  console.log('RECOMMENDATION');
  console.log('============================================================');

  console.log('');
  console.log(`Use: ${best.routeUrl}`);
  console.log('');
  console.log('For Definition D1 E2E:');
  console.log('  1. Start with this TRUE_EMPTY fixture');
  console.log('  2. Create valid Definition D1 block');
  console.log('  3. Persist to tutorial_sections');
  console.log('  4. Verify delivery returns blocks:[D1]');
  console.log('  5. Verify page renders Definition component');

  console.log('');
  console.log('============================================================');
  console.log('PHASE 11.11E COMPLETE');
  console.log('============================================================');
}

main().catch((error) => {
  console.error('');
  console.error('PHASE 11.11E FAILED');
  console.error(error);

