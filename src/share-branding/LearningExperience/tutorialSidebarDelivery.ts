import { and, eq } from 'drizzle-orm';

import {
  db,
  tutorialDomains,
  tutorialSubjects,
  tutorialTopics,
  tutorialSubtopics,
  tutorialSidebarTreesV2,
} from '@quiz/db-tutorial';
import type { TutorialNavigationNode, TutorialNavigationTree, TutorialSidebarBrandId } from '@quiz/types';

export interface TutorialSidebarDeliveryParams {
  brandId: Exclude<TutorialSidebarBrandId, 'shared'>;
  domainSlug: string;
  subjectSlug: string;
  topicSlug: string;
  subtopicSlug: string;
}

export interface TutorialSidebarDeliveryPayload {
  tree: TutorialNavigationTree;
  activeUrl: string;
  hierarchy: {
    domain: typeof tutorialDomains.$inferSelect;
    subject: typeof tutorialSubjects.$inferSelect;
    topic: typeof tutorialTopics.$inferSelect;
    subtopic: typeof tutorialSubtopics.$inferSelect;
  };
}

function findUrlBySlug(nodes: TutorialNavigationNode[], slug: string): string {
  for (const node of nodes) {
    if (node.slug === slug && node.url) {
      return node.url;
    }

    const childMatch = findUrlBySlug(node.children ?? [], slug);
    if (childMatch) {
      return childMatch;
    }
  }

  return '';
}

async function resolveHierarchy(params: TutorialSidebarDeliveryParams) {
  const [domain] = await db
    .select()
    .from(tutorialDomains)
    .where(eq(tutorialDomains.slug, params.domainSlug))
    .limit(1);

  if (!domain) {
    return null;
  }

  const [subject] = await db
    .select()
    .from(tutorialSubjects)
    .where(and(
      eq(tutorialSubjects.domainId, domain.id),
      eq(tutorialSubjects.slug, params.subjectSlug)
    ))
    .limit(1);

  if (!subject) {
    return null;
  }

  const [topic] = await db
    .select()
    .from(tutorialTopics)
    .where(and(
      eq(tutorialTopics.subjectId, subject.id),
      eq(tutorialTopics.slug, params.topicSlug)
    ))
    .limit(1);

  if (!topic) {
    return null;
  }

  const [subtopic] = await db
    .select()
    .from(tutorialSubtopics)
    .where(and(
      eq(tutorialSubtopics.topicId, topic.id),
      eq(tutorialSubtopics.slug, params.subtopicSlug)
    ))
    .limit(1);

  if (!subtopic) {
    return null;
  }

  return { domain, subject, topic, subtopic };
}

export async function getPublishedTutorialSidebar(params: TutorialSidebarDeliveryParams): Promise<TutorialSidebarDeliveryPayload | null> {
  const hierarchy = await resolveHierarchy(params);
  if (!hierarchy) {
    return null;
  }

  const brandRows = await db
    .select()
    .from(tutorialSidebarTreesV2)
    .where(and(
      eq(tutorialSidebarTreesV2.brandId, params.brandId),
      eq(tutorialSidebarTreesV2.topicId, hierarchy.topic.id),
      eq(tutorialSidebarTreesV2.status, 'published')
    ))
    .limit(1);

  const sharedRows = brandRows.length > 0
    ? []
    : await db
      .select()
      .from(tutorialSidebarTreesV2)
      .where(and(
        eq(tutorialSidebarTreesV2.brandId, 'shared'),
        eq(tutorialSidebarTreesV2.topicId, hierarchy.topic.id),
        eq(tutorialSidebarTreesV2.status, 'published')
      ))
      .limit(1);

  const sidebar = brandRows[0] ?? sharedRows[0];
  if (!sidebar) {
    return null;
  }

  const activeUrl =
    findUrlBySlug(sidebar.tree.topics, params.subtopicSlug)
    || findUrlBySlug(sidebar.tree.topics, hierarchy.subtopic.slug);

  return {
    tree: sidebar.tree,
    activeUrl,
    hierarchy,
  };
}
