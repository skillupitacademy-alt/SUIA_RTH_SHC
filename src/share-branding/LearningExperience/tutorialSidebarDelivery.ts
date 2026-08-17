import { and, eq } from 'drizzle-orm';

import {
  db,
  tutorialDomains,
  tutorialPageContentV2,
  tutorialSubjects,
  tutorialTopics,
  tutorialSubtopics,
  tutorialSidebarTreesV2,
} from '@quiz/db-tutorial';
import type {
  TutorialNavigationNode,
  TutorialNavigationTree,
  TutorialPagePayload,
  TutorialSidebarBrandId,
} from '@quiz/types';

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

interface FlatNavigationItem {
  name: string;
  slug: string;
  url?: string;
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

function flattenNavigation(nodes: TutorialNavigationNode[]): FlatNavigationItem[] {
  const items: FlatNavigationItem[] = [];

  function walk(branch: TutorialNavigationNode[]) {
    for (const node of branch) {
      if (node.url) {
        items.push({ name: node.name, slug: node.slug, url: node.url });
      }
      walk(node.children ?? []);
    }
  }

  walk(nodes);
  return items;
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

export async function getPublishedTutorialPagePayload(params: TutorialSidebarDeliveryParams): Promise<TutorialPagePayload | null> {
  const sidebarPayload = await getPublishedTutorialSidebar(params);
  if (!sidebarPayload) {
    return null;
  }

  const { hierarchy, tree, activeUrl } = sidebarPayload;
  const brandRows = await db
    .select()
    .from(tutorialPageContentV2)
    .where(and(
      eq(tutorialPageContentV2.brandId, params.brandId),
      eq(tutorialPageContentV2.subtopicId, hierarchy.subtopic.id),
      eq(tutorialPageContentV2.status, 'published')
    ));

  const sharedRows = brandRows.length > 0
    ? []
    : await db
      .select()
      .from(tutorialPageContentV2)
      .where(and(
        eq(tutorialPageContentV2.brandId, 'shared'),
        eq(tutorialPageContentV2.subtopicId, hierarchy.subtopic.id),
        eq(tutorialPageContentV2.status, 'published')
      ));

  const contentRows = brandRows.length > 0 ? brandRows : sharedRows;
  const content: TutorialPagePayload['content'] = {};

  for (const row of contentRows) {
    if (row.contentType === 'definition') {
      content.definition = row.payload as TutorialPagePayload['content']['definition'];
    }
    if (row.contentType === 'code') {
      content.code = row.payload as TutorialPagePayload['content']['code'];
    }
  }

  const flatItems = flattenNavigation(tree.topics);
  const activeIndex = flatItems.findIndex((item) => item.slug === params.subtopicSlug || item.slug === hierarchy.subtopic.slug || item.url === activeUrl);

  return {
    brandId: params.brandId,
    theme: tree.theme,
    sidebar: tree,
    activeUrl,
    hierarchy: {
      domain: hierarchy.domain,
      subject: hierarchy.subject,
      topic: hierarchy.topic,
      subtopic: hierarchy.subtopic,
    },
    content,
    footer: {
      previous: activeIndex > 0 ? flatItems[activeIndex - 1] : null,
      next: activeIndex >= 0 && activeIndex < flatItems.length - 1 ? flatItems[activeIndex + 1] : null,
    },
  };
}
