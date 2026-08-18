import { and, eq, isNull } from 'drizzle-orm';

import {
  dbHttp,
  tutorialPageContentV2,
  tutorialSidebarTreesV2,
} from '@quiz/db-tutorial';
import {
  domains as shcDomains,
  getDb,
  subjects as shcSubjects,
  subtopics as shcSubtopics,
  topics as shcTopics,
} from '@quiz/db';
import type {
  BrandTutorialTheme,
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
    domain: { id: string; name: string; slug: string };
    subject: { id: string; name: string; slug: string };
    topic: { id: string; name: string; slug: string };
    subtopic: { id: string; name: string; slug: string };
  };
}

interface FlatNavigationItem {
  name: string;
  slug: string;
  url?: string;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getRuntimeBrandConfig(brandId: Exclude<TutorialSidebarBrandId, 'shared'>): Pick<TutorialNavigationTree, 'brand' | 'theme'> {
  if (brandId === 'skillup') {
    return {
      brand: {
        name: 'SkillUp IT Academy',
        shortName: 'SUIA',
        tagline: 'Build Skills That Move Careers',
      },
      theme: {
        primary: '#f54a8d',
        primaryDark: '#d63d7a',
        secondary: '#133382',
        activeBackground: '#fff0f6',
        completed: '#08a64a',
      },
    };
  }

  return {
    brand: {
      name: 'RealTutorialHub',
      shortName: 'RTH',
      tagline: 'Learn Smarter, Not Harder',
    },
    theme: {
      primary: '#d03f00',
      primaryDark: '#b63600',
      secondary: '#124fd6',
      activeBackground: '#eef3fa',
      completed: '#08a64a',
    },
  };
}

function withRuntimeBrand(tree: TutorialNavigationTree, brandId: Exclude<TutorialSidebarBrandId, 'shared'>): TutorialNavigationTree {
  const runtimeBrand = getRuntimeBrandConfig(brandId);

  return {
    ...tree,
    brand: {
      ...runtimeBrand.brand,
      logoUrl: tree.brand.logoUrl,
    },
    theme: runtimeBrand.theme satisfies BrandTutorialTheme,
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
  const db = getDb();
  const domainRows = await db
    .select()
    .from(shcDomains)
    .where(isNull(shcDomains.deletedAt));
  const domain = domainRows.find((row) => slugify(row.name) === params.domainSlug);

  if (!domain) {
    return null;
  }

  const subjectRows = await db
    .select()
    .from(shcSubjects)
    .where(and(
      eq(shcSubjects.domainId, domain.id),
      isNull(shcSubjects.deletedAt)
    ));
  const subject = subjectRows.find((row) => slugify(row.name) === params.subjectSlug);

  if (!subject) {
    return null;
  }

  const topicRows = await db
    .select()
    .from(shcTopics)
    .where(and(
      eq(shcTopics.subjectId, subject.id),
      isNull(shcTopics.deletedAt)
    ));
  const topic = topicRows.find((row) => slugify(row.name) === params.topicSlug);

  if (!topic) {
    return null;
  }

  const subtopicRows = await db
    .select()
    .from(shcSubtopics)
    .where(and(
      eq(shcSubtopics.topicId, topic.id),
      isNull(shcSubtopics.deletedAt)
    ));
  const subtopic = subtopicRows.find((row) => slugify(row.name) === params.subtopicSlug);

  if (!subtopic) {
    return null;
  }

  return {
    domain: { id: domain.id, name: domain.name, slug: slugify(domain.name) },
    subject: { id: subject.id, name: subject.name, slug: slugify(subject.name) },
    topic: { id: topic.id, name: topic.name, slug: slugify(topic.name) },
    subtopic: { id: subtopic.id, name: subtopic.name, slug: slugify(subtopic.name) },
  };
}

export async function getPublishedTutorialSidebar(params: TutorialSidebarDeliveryParams): Promise<TutorialSidebarDeliveryPayload | null> {
  const hierarchy = await resolveHierarchy(params);
  if (!hierarchy) {
    return null;
  }

  const sharedRows = await dbHttp
    .select()
    .from(tutorialSidebarTreesV2)
    .where(and(
      eq(tutorialSidebarTreesV2.brandId, 'shared'),
      eq(tutorialSidebarTreesV2.topicId, hierarchy.topic.id),
      eq(tutorialSidebarTreesV2.status, 'published')
    ))
    .limit(1);

  const brandRows = sharedRows.length > 0
    ? []
    : await dbHttp
      .select()
      .from(tutorialSidebarTreesV2)
      .where(and(
        eq(tutorialSidebarTreesV2.brandId, params.brandId),
        eq(tutorialSidebarTreesV2.topicId, hierarchy.topic.id),
        eq(tutorialSidebarTreesV2.status, 'published')
      ))
      .limit(1);

  const sidebar = sharedRows[0] ?? brandRows[0];
  if (!sidebar) {
    return null;
  }

  const brandedTree = withRuntimeBrand(sidebar.tree, params.brandId);

  const activeUrl =
    findUrlBySlug(brandedTree.topics, params.subtopicSlug)
    || findUrlBySlug(brandedTree.topics, hierarchy.subtopic.slug);

  return {
    tree: brandedTree,
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
  const sharedRows = await dbHttp
    .select()
    .from(tutorialPageContentV2)
    .where(and(
      eq(tutorialPageContentV2.brandId, 'shared'),
      eq(tutorialPageContentV2.subtopicId, hierarchy.subtopic.id),
      eq(tutorialPageContentV2.status, 'published')
    ));

  const brandRows = sharedRows.length > 0
    ? []
    : await dbHttp
      .select()
      .from(tutorialPageContentV2)
      .where(and(
        eq(tutorialPageContentV2.brandId, params.brandId),
        eq(tutorialPageContentV2.subtopicId, hierarchy.subtopic.id),
        eq(tutorialPageContentV2.status, 'published')
      ));

  const contentRows = sharedRows.length > 0 ? sharedRows : brandRows;
  const content: TutorialPagePayload['content'] = {};

  for (const row of contentRows) {
    if (row.contentType === 'definition') {
      content.definition = row.payload as TutorialPagePayload['content']['definition'];
    }
    if (row.contentType === 'code') {
      content.code = row.payload as TutorialPagePayload['content']['code'];
    }
    if (row.contentType === 'summary') {
      content.summary = row.payload as TutorialPagePayload['content']['summary'];
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
