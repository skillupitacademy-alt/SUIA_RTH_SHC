/**
 * Markdown Navigation Parser
 * 
 * Parses tutorial left-sidebar navigation Markdown into AuthoringNavigationNode[].
 * 
 * NOTE: This is NOT the tutorial-content MarkdownParser (which produces TutorialBlock[]).
 * This parser handles navigation structure only.
 * 
 * FINAL MARKDOWN CONTRACT (Phase 0.2):
 * ```
 * - id: javascript
 *   name: JavaScript
 *   type: group
 *   description: Programming language for web development.
 * 
 *   - id: functions
 *     name: Functions
 *     type: group
 *     description: Reusable blocks of logic.
 * 
 *     - id: definition
 *       name: Function Definition
 *       type: page
 *       description: Explains how functions are declared.
 * ```
 * 
 * Key/Value Syntax Rules:
 * - Each node starts with `- id: value`
 * - Required keys: `name`, `type`
 * - Optional keys: `id`, `description`
 * - Indentation represents `children` only (NOT type)
 * - Type is explicit: `group` or `page`
 * 
 * Architecture:
 * Markdown → AuthoringNavigationNode[] → Server Validation → Normalization → Canonical
 */

import type { AuthoringNavigationNode } from './sidebar-schema';

/**
 * Parse navigation Markdown into authoring nodes
 * 
 * Produces AuthoringNavigationNode[] with same semantic keys as JSON.
 * Does NOT normalize IDs - that's handled by the shared pipeline.
 * Does NOT validate structure - that's handled by navigation-validation.ts.
 * Does NOT infer type from indentation - type is explicit.
 * 
 * @param source - Markdown source using key/value syntax
 * @returns Array of authoring navigation nodes
 * @throws Error if Markdown syntax is invalid
 */
export function parseMarkdownNavigation(source: string): AuthoringNavigationNode[] {
  const lines = source.split(/\r?\n/);
  const roots: AuthoringNavigationNode[] = [];
  const stack: Array<{ level: number; node: AuthoringNavigationNode }> = [];
  
  let currentNode: Partial<AuthoringNavigationNode> | null = null;
  let currentIndentation = -1;
  let lineNumber = 0;

  for (const line of lines) {
    lineNumber++;
    
    // Skip blank lines
    if (!line.trim()) {
      continue;
    }

    // Detect node start: "- id:" or "- name:" (id is optional)
    const nodeStartMatch = line.match(/^(\s*)- (id|name):\s*(.+)$/);
    
    if (nodeStartMatch) {
      // Finalize previous node if exists
      if (currentNode) {
        finalizeNode(currentNode, currentIndentation, stack, roots);
      }
      
      // Start new node
      const indentation = nodeStartMatch[1];
      const key = nodeStartMatch[2];
      const value = nodeStartMatch[3].trim();
      
      currentIndentation = Math.floor(indentation.replace(/\t/g, '  ').length / 2);
      currentNode = {
        [key]: value,
      };
      
      continue;
    }

    // Parse continuation key/value pairs
    const keyValueMatch = line.match(/^\s+(id|name|type|description):\s*(.+)$/);
    
    if (keyValueMatch && currentNode) {
      const key = keyValueMatch[1];
      const value = keyValueMatch[2].trim();
      
      if (key === 'type') {
        if (value !== 'group' && value !== 'page') {
          throw new Error(
            `Invalid type at line ${lineNumber}: "${value}". ` +
            `Type must be "group" or "page".`
          );
        }
        currentNode.type = value as 'group' | 'page';
      } else if (key === 'id') {
        currentNode.id = value;
      } else if (key === 'name') {
        currentNode.name = value;
      } else if (key === 'description') {
        currentNode.description = value;
      }
      
      continue;
    }

    // Invalid line
    if (line.trim() && !line.match(/^\s*$/)) {
      throw new Error(
        `Invalid Markdown navigation syntax at line ${lineNumber}: "${line}". ` +
        `Expected format:\n` +
        `- id: value\n` +
        `  name: value\n` +
        `  type: group|page\n` +
        `  description: value (optional)`
      );
    }
  }

  // Finalize last node
  if (currentNode) {
    finalizeNode(currentNode, currentIndentation, stack, roots);
  }

  return roots;
}

/**
 * Finalize a parsed node and add it to the tree
 */
function finalizeNode(
  node: Partial<AuthoringNavigationNode>,
  level: number,
  stack: Array<{ level: number; node: AuthoringNavigationNode }>,
  roots: AuthoringNavigationNode[]
): void {
  // Validate required fields
  if (!node.name) {
    throw new Error(`Navigation node missing required "name" field.`);
  }
  if (!node.type) {
    throw new Error(`Navigation node "${node.name}" missing required "type" field.`);
  }

  const validNode = node as AuthoringNavigationNode;

  // Pop stack to find correct parent
  while (stack.length > 0 && stack[stack.length - 1].level >= level) {
    stack.pop();
  }

  const parent = stack[stack.length - 1]?.node;
  
  if (parent) {
    parent.children = parent.children ?? [];
    parent.children.push(validNode);
  } else {
    roots.push(validNode);
  }

  stack.push({ level, node: validNode });
}
