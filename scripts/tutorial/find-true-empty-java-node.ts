/**
 * Find TRUE_EMPTY navigation node for Java topic
 * that matches whatisjava subtopic
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
import { topics, getDb } from '@quiz/db';
import type { TutorialNavigationNode } from '@quiz/types';

function compactSlug(value: string | undefined): string {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function flattenNodes(nodes: TutorialNavigationNode[]): TutorialNavigationNode[] {
  const result: TutorialNavigationNode[] = [];
  function walk(branch: TutorialNavigationNode[]) {
    for (const node of branch) {
      if (node.slug && node.url) {
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

async function main() {
  const mainDb = getDb();

  // Get Java topic
  const javaTopic = await mainDb
    .select()
    .from(topics)
    .where(and(isNull(topics.deletedAt)))
    .then((rows) => rows.find((t) => slugify(t.name) === 'java'));

  if (!javaTopic) {
    console.error('Java topic not found');
    process.exitCode = 1;
    return;
  }

  // Get sidebar
  const [sidebar] = await dbHttp
    .select()
    .from(tutorialSidebarTreesV2)
    .where(
      and(
        eq(tutorialSidebarTreesV2.topicId, javaTopic.id),
        eq(tutorialSidebarTreesV2.status, 'published')
      )
    )
    .limit(1);

  if (!sidebar) {
    console.error('No sidebar found');
    process.exitCode = 1;
    return;
  }

  // Get whatisjava subtopic
  const [tutorialSubtopic] = await tutorialDb
    .select()
    .from(tutorialSubtopics)
    .where(eq(tutorialSubtopics.slug, 'whatisjava'))
    .limit(1);

  if (!tutorialSubtopic) {
    console.error('TutorialDB subtopic whatisjava not found');
    process.exitCode = 1;
    return;
  }

  console.log(`TutorialDB subtopic: ${tutorialSubtopic.name} (${tutorialSubtopic.id})`);
  console.log('');

  // Flatten all page nodes
  const pageNodes = flattenNodes(sidebar.tree.topics);

  console.log(`Total page nodes in sidebar: ${pageNodes.length}`);
  console.log('');

  // Filter nodes that derive to whatisjava
  const matchingNodes = pageNodes.filter(
    (node) => compactSlug(node.slug) === 'whatisjava'
  );

  console.log(`Nodes matching 'whatisjava' subtopic: ${matchingNodes.length}`);
  console.log('');

  // Check each matching node for tutorial_sections
  for (const node of matchingNodes) {
    const [section] = await tutorialDb
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

    const status = !section
      ? 'TRUE_EMPTY'
      : TutorialDocumentSchema.safeParse(section.content).success
      ? section.content.blocks?.length === 0
        ? 'EMPTY_DOC'
        : `VALID (${section.content.blocks.length} blocks)`
      : 'LEGACY_INVALID';

    console.log(`${node.id.padEnd(25)} | ${node.name.padEnd(30)} | ${status}`);
  }
}

main().catch(console.error);
