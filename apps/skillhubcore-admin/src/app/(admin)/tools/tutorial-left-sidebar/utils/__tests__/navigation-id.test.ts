/**
 * Navigation ID Utilities Tests - Phase 0
 * Tests for lowercase alphanumeric ID normalization
 */

import { describe, test, expect } from 'vitest';
import type { AuthoringNavigationNode } from '../../../../../api/tutorial-left-sidebar/sidebar-schema';
import {
  normalizeNavigationId,
  getCanonicalNavigationId,
  validateUniqueCanonicalNavigationIds,
  normalizeNavigationIds,
} from '../navigation-id';

describe('normalizeNavigationId', () => {
  test('normalizes to lowercase alphanumeric only', () => {
    expect(normalizeNavigationId('What Is JavaScript?')).toBe('whatisjavascript');
    expect(normalizeNavigationId('JavaScript_Fundamentals')).toBe('javascriptfundamentals');
    expect(normalizeNavigationId('LET vs VAR vs CONST')).toBe('letvsvarvsconst');
  });

  test('removes all non-alphanumeric characters', () => {
    expect(normalizeNavigationId('what-is-javascript')).toBe('whatisjavascript');
    expect(normalizeNavigationId('what_is_javascript')).toBe('whatisjavascript');
    expect(normalizeNavigationId('WHAT--IS--JAVASCRIPT')).toBe('whatisjavascript');
  });

  test('preserves numbers', () => {
    expect(normalizeNavigationId('ES6 Features')).toBe('es6features');
    expect(normalizeNavigationId('HTTP/2 Protocol')).toBe('http2protocol');
  });

  test('handles edge cases', () => {
    expect(normalizeNavigationId('   JavaScript   ')).toBe('javascript');
    expect(normalizeNavigationId('C++')).toBe('c');
    expect(normalizeNavigationId('C#')).toBe('c');
  });
});

describe('getCanonicalNavigationId', () => {
  test('uses explicit ID when provided', () => {
    const node: AuthoringNavigationNode = {
      id: 'intro',
      name: 'Introduction to JavaScript',
      type: 'page',
    };
    expect(getCanonicalNavigationId(node)).toBe('intro');
  });

  test('normalizes explicit ID', () => {
    const node: AuthoringNavigationNode = {
      id: 'What_Is_JavaScript',
      name: 'What Is JavaScript?',
      type: 'page',
    };
    expect(getCanonicalNavigationId(node)).toBe('whatisjavascript');
  });

  test('falls back to name when ID missing (safety net)', () => {
    const node: AuthoringNavigationNode = {
      name: 'What Is JavaScript?',
      type: 'page',
    };
    expect(getCanonicalNavigationId(node)).toBe('whatisjavascript');
  });

  test('falls back to name when ID is empty string', () => {
    const node: AuthoringNavigationNode = {
      id: '',
      name: 'JavaScript Fundamentals',
      type: 'group',
    };
    expect(getCanonicalNavigationId(node)).toBe('javascriptfundamentals');
  });

  test('falls back to name when ID is whitespace', () => {
    const node: AuthoringNavigationNode = {
      id: '   ',
      name: 'Function Declaration',
      type: 'page',
    };
    expect(getCanonicalNavigationId(node)).toBe('functiondeclaration');
  });
});

describe('validateUniqueCanonicalNavigationIds', () => {
  test('accepts unique IDs', () => {
    const nodes: AuthoringNavigationNode[] = [
      { id: 'javascript', name: 'JavaScript', type: 'group' },
      { id: 'python', name: 'Python', type: 'group' },
      { id: 'typescript', name: 'TypeScript', type: 'group' },
    ];
    
    expect(() => validateUniqueCanonicalNavigationIds(nodes)).not.toThrow();
  });

  test('detects duplicate IDs after normalization', () => {
    const nodes: AuthoringNavigationNode[] = [
      { id: 'whatisjavascript', name: 'What Is JavaScript?', type: 'page' },
      { id: 'what_is_javascript', name: 'What is JavaScript', type: 'page' },
    ];
    
    expect(() => validateUniqueCanonicalNavigationIds(nodes)).toThrow(
      /Duplicate navigation ID after normalization: "whatisjavascript"/
    );
  });

  test('detects duplicates in nested children', () => {
    const nodes: AuthoringNavigationNode[] = [
      {
        id: 'javascript',
        name: 'JavaScript',
        type: 'group',
        children: [
          {
            id: 'fundamentals',
            name: 'Fundamentals',
            type: 'group',
            children: [
              { id: 'intro', name: 'Introduction', type: 'page' },
            ],
          },
          {
            id: 'advanced',
            name: 'Advanced',
            type: 'group',
            children: [
              { id: 'intro', name: 'Intro to Advanced', type: 'page' },
            ],
          },
        ],
      },
    ];
    
    expect(() => validateUniqueCanonicalNavigationIds(nodes)).toThrow(
      /Duplicate navigation ID after normalization: "intro"/
    );
  });

  test('detects semantic collision (C# vs C++)', () => {
    const nodes: AuthoringNavigationNode[] = [
      { id: 'C#', name: 'C#', type: 'group' },
      { id: 'C++', name: 'C++', type: 'group' },
    ];
    
    // Both normalize to 'c' - should throw
    expect(() => validateUniqueCanonicalNavigationIds(nodes)).toThrow(
      /Duplicate navigation ID after normalization: "c"/
    );
  });
});

describe('normalizeNavigationIds', () => {
  test('normalizes IDs while preserving names', () => {
    const nodes: AuthoringNavigationNode[] = [
      { id: 'What_Is_JS', name: 'What Is JavaScript?', type: 'page' },
    ];
    
    const normalized = normalizeNavigationIds(nodes);
    
    expect(normalized[0].id).toBe('whatisjs');
    expect(normalized[0].name).toBe('What Is JavaScript?');
  });

  test('generates ID from name when missing (safety fallback)', () => {
    const nodes: AuthoringNavigationNode[] = [
      { name: 'Function Declaration', type: 'page' },
    ];
    
    const normalized = normalizeNavigationIds(nodes);
    
    expect(normalized[0].id).toBe('functiondeclaration');
    expect(normalized[0].name).toBe('Function Declaration');
  });

  test('preserves description during normalization', () => {
    const nodes: AuthoringNavigationNode[] = [
      {
        id: 'Function Declaration',
        name: 'Function Declaration',
        type: 'page',
        description: 'Explains how functions are declared and named in JavaScript.',
      },
    ];

    const normalized = normalizeNavigationIds(nodes);

    expect(normalized[0].id).toBe('functiondeclaration');
    expect(normalized[0].name).toBe('Function Declaration');
    expect(normalized[0].description).toBe('Explains how functions are declared and named in JavaScript.');
  });

  test('normalizes nested children', () => {
    const nodes: AuthoringNavigationNode[] = [
      {
        id: 'JavaScript_Fundamentals',
        name: 'JavaScript Fundamentals',
        type: 'group',
        children: [
          { id: 'What Is JavaScript?', name: 'What Is JavaScript?', type: 'page' },
          { id: 'JavaScript Syntax', name: 'JavaScript Syntax', type: 'page' },
        ],
      },
    ];
    
    const normalized = normalizeNavigationIds(nodes);
    
    expect(normalized[0].id).toBe('javascriptfundamentals');
    expect(normalized[0].children?.[0].id).toBe('whatisjavascript');
    expect(normalized[0].children?.[1].id).toBe('javascriptsyntax');
  });

  test('preserves other node properties', () => {
    const nodes: AuthoringNavigationNode[] = [
      {
        id: 'javascript',
        name: 'JavaScript',
        type: 'group',
        description: 'A programming language for the web.',
        icon: 'javascript',
        expanded: true,
      },
    ];
    
    const normalized = normalizeNavigationIds(nodes);
    
    expect(normalized[0].icon).toBe('javascript');
    expect(normalized[0].expanded).toBe(true);
    expect(normalized[0].type).toBe('group');
    expect(normalized[0].description).toBe('A programming language for the web.');
  });

  test('handles complex real-world scenario', () => {
    const nodes: AuthoringNavigationNode[] = [
      {
        id: 'JavaScript Fundamentals',
        name: 'JavaScript Fundamentals',
        type: 'group',
        description: 'Core concepts needed to understand JavaScript.',
        children: [
          {
            id: 'What is JavaScript?',
            name: 'What Is JavaScript?',
            type: 'page',
            description: 'Introduces JavaScript and explains its purpose.',
          },
          {
            id: 'JavaScript-Syntax',
            name: 'JavaScript Syntax',
            type: 'page',
            description: 'Explains the basic rules used to write JavaScript code.',
          },
        ],
      },
    ];

    const normalized = normalizeNavigationIds(nodes);

    expect(normalized[0].id).toBe('javascriptfundamentals');
    expect(normalized[0].description).toBe('Core concepts needed to understand JavaScript.');
    expect(normalized[0].children?.[0].id).toBe('whatisjavascript');
    expect(normalized[0].children?.[0].description).toBe('Introduces JavaScript and explains its purpose.');
    expect(normalized[0].children?.[1].id).toBe('javascriptsyntax');
    expect(normalized[0].children?.[1].description).toBe('Explains the basic rules used to write JavaScript code.');
  });
});
