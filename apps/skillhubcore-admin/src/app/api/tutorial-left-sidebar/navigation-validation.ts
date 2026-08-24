/**
 * Navigation Structure Validation
 * 
 * Validates navigation tree depth and node type constraints.
 * Runs BEFORE ID normalization.
 */

import type { AuthoringNavigationNode } from './sidebar-schema';

/**
 * Validate navigation depth (max 3 levels)
 * 
 * Ensures navigation tree doesn't exceed maximum depth.
 * Deep content should be moved into tutorial page content blocks.
 * 
 * @throws Error if depth exceeds 3 levels
 */
export function validateNavigationDepth(
  nodes: AuthoringNavigationNode[], 
  currentDepth = 1, 
  path = 'Root'
): void {
  if (currentDepth > 3) {
    throw new Error(
      `Navigation depth exceeds maximum of 3 levels at: ${path}. ` +
      `Move deeper content into tutorial page content.`
    );
  }
  
  nodes.forEach((node) => {
    if (node.children && node.children.length > 0) {
      validateNavigationDepth(
        node.children, 
        currentDepth + 1, 
        `${path} → ${node.name}`
      );
    }
  });
}

/**
 * Validate node types and structural rules
 * 
 * Rules:
 * - Page nodes must NOT have children
 * - Group nodes must have children
 * - Type must be 'group' or 'page'
 * 
 * @throws Error if structural rules violated
 */
export function validateNodeTypes(
  nodes: AuthoringNavigationNode[], 
  path = 'Root'
): void {
  nodes.forEach((node) => {
    if (!node.type || (node.type !== 'group' && node.type !== 'page')) {
      throw new Error(
        `Invalid or missing node type at: ${path} → ${node.name}. ` +
        `Must be 'group' or 'page'.`
      );
    }
    
    if (node.type === 'page' && node.children && node.children.length > 0) {
      throw new Error(
        `Page node cannot have children at: ${path} → ${node.name}. ` +
        `Pages are leaf nodes.`
      );
    }
    
    if (node.type === 'group' && (!node.children || node.children.length === 0)) {
      throw new Error(
        `Group node must have children at: ${path} → ${node.name}. ` +
        `Use type='page' for leaf nodes.`
      );
    }
    
    if (node.children && node.children.length > 0) {
      validateNodeTypes(node.children, `${path} → ${node.name}`);
    }
  });
}
