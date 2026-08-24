/**
 * Sidebar Navigation Validator Service
 * Phase 1: Page-Aware Tutorial Architecture
 * 
 * Validates that navigationNodeId exists in the correct topic-specific sidebar and is a valid page.
 * 
 * CRITICAL RULES:
 * 1. navigationNodeId MUST come from the canonical sidebar node.id
 * 2. navigationNodeId is NOT derived from name, slug, URL, or array position
 * 3. Validator MUST use topic bridge: subtopic → topic → topic.external_id → sidebar.topic_id
 * 4. Validator MUST NOT search arbitrary first sidebar for brand
 * 
 * ARCHITECTURE:
 * Phase 1 identity is (subtopicId, navigationNodeId, brandId).
 * The validator ensures the navigationNodeId belongs to the correct topic's sidebar.
 * 
 * TOPIC BRIDGE:
 * subtopic.topic_id → tutorial_topics.id → tutorial_topics.external_id === sidebar.topic_id
 */

import { db } from '../db';
import { tutorialSidebarTreesV2 } from '../schema/tutorial-sidebar-v2';
import { tutorialSubtopics } from '../schema/tutorial-subtopics';
import { tutorialTopics } from '../schema/tutorial-topics';
import { eq, and } from 'drizzle-orm';
import type { TutorialNormalizedNavigationTree, TutorialNavigationNode, TutorialSidebarBrandId } from '@quiz/types';

export interface NavigationValidationResult {
  isValid: boolean;
  reason?: string;
  node?: TutorialNavigationNode;
}

export class SidebarNavigationValidatorService {
  /**
   * Validates that navigationNodeId exists in the correct topic-specific sidebar and is a page type
   * 
   * Uses the canonical topic bridge:
   * subtopic.topic_id → topic.id → topic.external_id → sidebar.topic_id
   * 
   * @param subtopicId - UUID of the subtopic
   * @param navigationNodeId - Canonical node.id from sidebar (e.g., 'what-is-java')
   * @param brandId - Brand identifier
   * @returns Validation result with reason if invalid
   */
  static async validateNavigationNode(
    subtopicId: string,
    navigationNodeId: string,
    brandId: TutorialSidebarBrandId = 'shared'
  ): Promise<NavigationValidationResult> {
    try {
      // Step 1: Load subtopic with parent topic (need topic for sidebar lookup)
      const subtopic = await db.query.tutorialSubtopics.findFirst({
        where: eq(tutorialSubtopics.id, subtopicId),
        columns: {
          id: true,
          topicId: true,
        },
      });

      if (!subtopic) {
        return {
          isValid: false,
          reason: `Subtopic not found: ${subtopicId}`,
        };
      }

      // Step 2: Load parent topic (need external_id for sidebar bridge)
      const topic = await db.query.tutorialTopics.findFirst({
        where: eq(tutorialTopics.id, subtopic.topicId),
        columns: {
          id: true,
          externalId: true,
          name: true,
        },
      });

      if (!topic) {
        return {
          isValid: false,
          reason: `Parent topic not found for subtopic ${subtopicId}`,
        };
      }

      // Step 3: Find sidebar using topic.external_id → sidebar.topic_id bridge
      // This ensures we get the CORRECT sidebar for this topic, not just any sidebar for the brand
      const sidebarTree = await db.query.tutorialSidebarTreesV2.findFirst({
        where: and(
          eq(tutorialSidebarTreesV2.topicId, topic.externalId),
          eq(tutorialSidebarTreesV2.brandId, brandId)
        ),
        columns: {
          tree: true,
          topicId: true,
        },
      });

      if (!sidebarTree) {
        return {
          isValid: false,
          reason: `No sidebar found for topic "${topic.name}" (external_id: ${topic.externalId}) and brand ${brandId}`,
        };
      }

      // Step 4: Search for the navigation node in THIS topic's sidebar tree
      const node = this.findNodeInTree(sidebarTree.tree, navigationNodeId);

      if (!node) {
        return {
          isValid: false,
          reason: `Navigation node '${navigationNodeId}' not found in ${topic.name} sidebar tree`,
        };
      }

      // Step 5: Verify node type is 'page', not 'group'
      if (node.type !== 'page') {
        return {
          isValid: false,
          reason: `Navigation node '${navigationNodeId}' is type '${node.type}', expected 'page'`,
        };
      }

      return {
        isValid: true,
        node,
      };

    } catch (error) {
      return {
        isValid: false,
        reason: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Recursively finds a node by its canonical id in the tree
   */
  private static findNodeInTree(
    tree: TutorialNormalizedNavigationTree,
    nodeId: string
  ): TutorialNavigationNode | null {
    if (!tree.topics) {
      return null;
    }

    for (const topic of tree.topics) {
      const found = this.findNodeById(topic, nodeId);
      if (found) {
        return found;
      }
    }

    return null;
  }

  /**
   * Recursively searches for a node by id
   */
  private static findNodeById(
    node: TutorialNavigationNode,
    targetId: string
  ): TutorialNavigationNode | null {
    if (node.id === targetId) {
      return node;
    }

    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        const found = this.findNodeById(child, targetId);
        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  /**
   * Gets all page-type navigation nodes for a given brand
   * Useful for UI dropdowns
   */
  static async getAllValidNavigationNodes(
    brandId: TutorialSidebarBrandId = 'shared'
  ): Promise<TutorialNavigationNode[]> {
    try {
      const sidebarTree = await db.query.tutorialSidebarTreesV2.findFirst({
        where: eq(tutorialSidebarTreesV2.brandId, brandId),
        columns: {
          tree: true,
        },
      });

      if (!sidebarTree) {
        return [];
      }

      return this.collectAllPages(sidebarTree.tree);

    } catch (error) {
      console.error('Error getting valid navigation nodes:', error);
      return [];
    }
  }

  /**
   * Collects all page-type nodes from the entire tree
   */
  private static collectAllPages(
    tree: TutorialNormalizedNavigationTree
  ): TutorialNavigationNode[] {
    const pages: TutorialNavigationNode[] = [];

    if (!tree.topics) {
      return pages;
    }

    for (const topic of tree.topics) {
      this.collectPagesRecursive(topic, pages);
    }

    return pages;
  }

  /**
   * Recursively collects all page nodes
   */
  private static collectPagesRecursive(
    node: TutorialNavigationNode,
    pages: TutorialNavigationNode[]
  ): void {
    if (node.type === 'page') {
      pages.push(node);
    }

    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        this.collectPagesRecursive(child, pages);
      }
    }
  }
}

