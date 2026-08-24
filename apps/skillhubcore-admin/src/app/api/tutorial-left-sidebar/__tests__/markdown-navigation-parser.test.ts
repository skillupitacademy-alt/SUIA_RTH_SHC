/**
 * Markdown Navigation Parser Tests
 * Tests for Phase 0.2 FINAL - Key/Value Markdown authoring format
 * 
 * Contract: JSON and Markdown carry same semantic keys (id, name, type, description)
 * Indentation represents children only, NOT type
 */

import { describe, test, expect } from 'vitest';
import { parseMarkdownNavigation } from '../markdown-navigation-parser';
import { normalizeNavigationIds } from '../../../(admin)/tools/tutorial-left-sidebar/utils/navigation-id';

describe('parseMarkdownNavigation - Key/Value Syntax', () => {
  // TEST GROUP A — Basic parsing
  
  test('parses single top-level group with explicit type', () => {
    const markdown = `- id: pythonfundamentals
  name: Python Fundamentals
  type: group`;
    
    const result = parseMarkdownNavigation(markdown);
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Python Fundamentals');
    expect(result[0].id).toBe('pythonfundamentals');
    expect(result[0].type).toBe('group');
  });

  test('parses node starting with name instead of id', () => {
    const markdown = `- name: Python Fundamentals
  id: pythonfundamentals
  type: group`;
    
    const result = parseMarkdownNavigation(markdown);
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Python Fundamentals');
    expect(result[0].id).toBe('pythonfundamentals');
    expect(result[0].type).toBe('group');
  });

  test('parses group with child group - explicit types', () => {
    const markdown = `- id: topic
  name: Topic
  type: group

  - id: subtopic
    name: Subtopic
    type: group`;
    
    const result = parseMarkdownNavigation(markdown);
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Topic');
    expect(result[0].type).toBe('group');
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children![0].name).toBe('Subtopic');
    expect(result[0].children![0].type).toBe('group');
  });

  test('parses group with multiple child pages', () => {
    const markdown = `- id: functions
  name: Functions
  type: group

  - id: definition
    name: Definition
    type: page

  - id: arguments
    name: Arguments
    type: page

  - id: return
    name: Return
    type: page`;
    
    const result = parseMarkdownNavigation(markdown);
    
    expect(result[0].children).toHaveLength(3);
    expect(result[0].children![0].name).toBe('Definition');
    expect(result[0].children![0].type).toBe('page');
    expect(result[0].children![1].name).toBe('Arguments');
    expect(result[0].children![1].type).toBe('page');
    expect(result[0].children![2].name).toBe('Return');
    expect(result[0].children![2].type).toBe('page');
  });

  test('parses multiple sibling groups', () => {
    const markdown = `- id: groupa
  name: Group A
  type: group

- id: groupb
  name: Group B
  type: group`;
    
    const result = parseMarkdownNavigation(markdown);
    
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Group A');
    expect(result[1].name).toBe('Group B');
  });

  // TEST GROUP B — Description support
  
  test('parses description field', () => {
    const markdown = `- id: javascript
  name: JavaScript
  type: group
  description: Programming language for web development.`;
    
    const result = parseMarkdownNavigation(markdown);
    
    expect(result[0].description).toBe('Programming language for web development.');
  });

  test('parses nested descriptions', () => {
    const markdown = `- id: python
  name: Python
  type: group
  description: General-purpose programming language.

  - id: functions
    name: Functions
    type: group
    description: Reusable blocks of Python code.

    - id: definition
      name: Function Definition
      type: page
      description: Explains how Python functions are defined.`;
    
    const result = parseMarkdownNavigation(markdown);
    
    expect(result[0].description).toBe('General-purpose programming language.');
    expect(result[0].children![0].description).toBe('Reusable blocks of Python code.');
    expect(result[0].children![0].children![0].description).toBe('Explains how Python functions are defined.');
  });

  test('description is optional', () => {
    const markdown = `- id: functions
  name: Functions
  type: group`;
    
    const result = parseMarkdownNavigation(markdown);
    
    expect(result[0].description).toBeUndefined();
  });

  // TEST GROUP C — Hierarchy
  
  test('handles nested indentation levels', () => {
    const markdown = `- id: l1
  name: Level 1
  type: group

  - id: l2
    name: Level 2
    type: group

    - id: l3
      name: Level 3
      type: page`;
    
    const result = parseMarkdownNavigation(markdown);
    
    expect(result[0].children).toBeDefined();
    expect(result[0].children![0].children).toBeDefined();
    expect(result[0].children![0].children![0].name).toBe('Level 3');
  });

  test('handles sibling nodes after deep nesting', () => {
    const markdown = `- id: top
  name: Top
  type: group

  - id: l2a
    name: Level 2 A
    type: group

    - id: l3
      name: Level 3
      type: page

  - id: l2b
    name: Level 2 B
    type: group`;
    
    const result = parseMarkdownNavigation(markdown);
    
    expect(result[0].children).toHaveLength(2);
    expect(result[0].children![0].children).toHaveLength(1);
    expect(result[0].children![1].name).toBe('Level 2 B');
  });

  test('handles jump from deep level to root', () => {
    const markdown = `- id: topa
  name: Top A
  type: group

  - id: l2
    name: Level 2
    type: group

    - id: l3
      name: Level 3
      type: page

- id: topb
  name: Top B
  type: group`;
    
    const result = parseMarkdownNavigation(markdown);
    
    expect(result).toHaveLength(2);
    expect(result[1].name).toBe('Top B');
  });

  // TEST GROUP D — IDs
  
  test('preserves explicit ID', () => {
    const markdown = `- id: functiondeclaration
  name: Function Declaration
  type: page`;
    
    const result = parseMarkdownNavigation(markdown);
    
    expect(result[0].id).toBe('functiondeclaration');
    expect(result[0].name).toBe('Function Declaration');
  });

  test('allows missing ID for server normalization', () => {
    const markdown = `- name: Function Declaration
  type: page`;
    
    const result = parseMarkdownNavigation(markdown);
    
    expect(result[0].id).toBeUndefined();
    expect(result[0].name).toBe('Function Declaration');
  });

  test('explicit ID is NOT normalized by parser', () => {
    const markdown = `- id: Topic_With_Underscores
  name: Topic
  type: group`;
    
    const result = parseMarkdownNavigation(markdown);
    
    // Parser preserves as-is
    expect(result[0].id).toBe('Topic_With_Underscores');
    
    // Server normalization handles it
    const normalized = normalizeNavigationIds(result);
    expect(normalized[0].id).toBe('topicwithunderscores');
  });

  // TEST GROUP E — Type determination
  
  test('type is explicit, not inferred from indentation', () => {
    const markdown = `- id: advanced
  name: Advanced
  type: group

  - id: internals
    name: Internals
    type: group

    - id: memory
      name: Memory
      type: page`;
    
    const result = parseMarkdownNavigation(markdown);
    
    // Type comes from explicit declaration, not level
    expect(result[0].type).toBe('group');
    expect(result[0].children![0].type).toBe('group');
    expect(result[0].children![0].children![0].type).toBe('page');
  });

  test('deeply nested group is still group if type says so', () => {
    const markdown = `- id: l1
  name: Level 1
  type: group

  - id: l2
    name: Level 2
    type: group

    - id: l3
      name: Level 3
      type: group

      - id: l4
        name: Level 4
        type: group`;
    
    const result = parseMarkdownNavigation(markdown);
    
    const l4Node = result[0].children![0].children![0].children![0];
    expect(l4Node.type).toBe('group'); // Explicit type, not inferred
  });

  // TEST GROUP F — Validation
  
  test('throws on invalid type', () => {
    const markdown = `- id: test
  name: Test
  type: invalid`;
    
    expect(() => parseMarkdownNavigation(markdown)).toThrow(/Invalid type.*invalid.*must be.*group.*page/);
  });

  test('throws on missing name', () => {
    const markdown = `- id: test
  type: group`;
    
    expect(() => parseMarkdownNavigation(markdown)).toThrow(/missing required "name"/);
  });

  test('throws on missing type', () => {
    const markdown = `- id: test
  name: Test`;
    
    expect(() => parseMarkdownNavigation(markdown)).toThrow(/missing required "type"/);
  });

  test('throws on invalid syntax', () => {
    const markdown = 'Invalid line without dash or key';
    
    expect(() => parseMarkdownNavigation(markdown)).toThrow(/Invalid Markdown navigation syntax/);
  });

  test('skips blank lines', () => {
    const markdown = `- id: topica
  name: Topic A
  type: group


- id: topicb
  name: Topic B
  type: group`;
    
    const result = parseMarkdownNavigation(markdown);
    
    expect(result).toHaveLength(2);
  });

  // TEST GROUP G — Realistic example
  
  test('parses complete navigation tree with descriptions', () => {
    const markdown = `- id: pythonfundamentals
  name: Python Fundamentals
  type: group
  description: Core Python programming concepts.

  - id: functions
    name: Functions
    type: group
    description: Reusable blocks of code.

    - id: functiondefinition
      name: Function Definition
      type: page
      description: Explains how functions are declared.

    - id: functionarguments
      name: Function Arguments
      type: page
      description: Explains function parameters.

    - id: returnstatement
      name: Return Statement
      type: page
      description: Explains return values.

  - id: classes
    name: Classes
    type: group
    description: Object-oriented programming.

    - id: classdefinition
      name: Class Definition
      type: page
      description: Explains class declarations.

    - id: constructor
      name: Constructor
      type: page
      description: Explains object initialization.`;
    
    const result = parseMarkdownNavigation(markdown);
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Python Fundamentals');
    expect(result[0].description).toBe('Core Python programming concepts.');
    expect(result[0].children).toHaveLength(2);
    expect(result[0].children![0].name).toBe('Functions');
    expect(result[0].children![0].description).toBe('Reusable blocks of code.');
    expect(result[0].children![0].children).toHaveLength(3);
    expect(result[0].children![1].name).toBe('Classes');
    expect(result[0].children![1].description).toBe('Object-oriented programming.');
    expect(result[0].children![1].children).toHaveLength(2);
  });
});

describe('JSON-Markdown Equivalence', () => {
  test('equivalent JSON and Markdown produce same canonical structure', () => {
    // Markdown
    const markdown = `- id: python
  name: Python
  type: group
  description: General-purpose programming language.

  - id: functions
    name: Functions
    type: group
    description: Reusable blocks of Python code.

    - id: functiondefinition
      name: Definition
      type: page
      description: Explains function definitions.`;
    
    const markdownParsed = parseMarkdownNavigation(markdown);
    const markdownNormalized = normalizeNavigationIds(markdownParsed);
    
    // Equivalent JSON (same keys)
    const json = [
      {
        id: 'python',
        name: 'Python',
        type: 'group' as const,
        description: 'General-purpose programming language.',
        children: [
          {
            id: 'functions',
            name: 'Functions',
            type: 'group' as const,
            description: 'Reusable blocks of Python code.',
            children: [
              {
                id: 'functiondefinition',
                name: 'Definition',
                type: 'page' as const,
                description: 'Explains function definitions.',
              },
            ],
          },
        ],
      },
    ];
    
    const jsonNormalized = normalizeNavigationIds(json);
    
    // Should produce same canonical structure
    expect(markdownNormalized[0].id).toBe(jsonNormalized[0].id);
    expect(markdownNormalized[0].name).toBe(jsonNormalized[0].name);
    expect(markdownNormalized[0].description).toBe(jsonNormalized[0].description);
    expect(markdownNormalized[0].children![0].id).toBe(jsonNormalized[0].children![0].id);
    expect(markdownNormalized[0].children![0].children![0].id).toBe(
      jsonNormalized[0].children![0].children![0].id
    );
  });

  test('missing IDs in both formats use same normalization', () => {
    // Markdown without explicit IDs
    const markdown = `- name: What Is JavaScript?
  type: group

  - name: Basics
    type: group

    - name: Variables
      type: page`;
    
    const markdownParsed = parseMarkdownNavigation(markdown);
    const markdownNormalized = normalizeNavigationIds(markdownParsed);
    
    // JSON without explicit IDs
    const json = [
      {
        name: 'What Is JavaScript?',
        type: 'group' as const,
        children: [
          {
            name: 'Basics',
            type: 'group' as const,
            children: [
              {
                name: 'Variables',
                type: 'page' as const,
              },
            ],
          },
        ],
      },
    ];
    
    const jsonNormalized = normalizeNavigationIds(json);
    
    // Both should generate same IDs
    expect(markdownNormalized[0].id).toBe('whatisjavascript');
    expect(jsonNormalized[0].id).toBe('whatisjavascript');
    expect(markdownNormalized[0].children![0].children![0].id).toBe('variables');
    expect(jsonNormalized[0].children![0].children![0].id).toBe('variables');
  });

  test('ID normalization same for both formats', () => {
    // Markdown with un-normalized ID
    const markdown = `- id: Function_Definition
  name: Function Definition
  type: page`;
    
    const markdownParsed = parseMarkdownNavigation(markdown);
    const markdownNormalized = normalizeNavigationIds(markdownParsed);
    
    // JSON with same un-normalized ID
    const json = [
      {
        id: 'Function_Definition',
        name: 'Function Definition',
        type: 'page' as const,
      },
    ];
    
    const jsonNormalized = normalizeNavigationIds(json);
    
    // Both should normalize to same result
    expect(markdownNormalized[0].id).toBe('functiondefinition');
    expect(jsonNormalized[0].id).toBe('functiondefinition');
  });

  test('description preservation through complete pipeline', () => {
    const markdown = `- id: functions
  name: Functions
  type: group
  description: Reusable blocks of executable logic.`;
    
    const parsed = parseMarkdownNavigation(markdown);
    const normalized = normalizeNavigationIds(parsed);
    
    // Description must survive normalization
    expect(parsed[0].description).toBe('Reusable blocks of executable logic.');
    expect(normalized[0].description).toBe('Reusable blocks of executable logic.');
  });
});
