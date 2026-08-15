/**
 * Test Fixture: JavaScript Introduction Tutorial
 * Based on example from tutorialengine.md
 */

import type { TutorialDocument } from '../../document';

/**
 * JavaScript Introduction Tutorial Document
 * 
 * Represents this content:
 * 
 * # JavaScript
 * 
 * JavaScript is a programming language that makes websites interactive.
 * 
 * ## What does it actually do?
 * 
 * When you click a button and a menu drops down, JavaScript responds.
 * 
 * ## Where does it run?
 * 
 * - Client-Side
 * - Server-Side
 * 
 * ## Key Characteristics
 * 
 * - High-level
 * - Dynamically Typed
 * - Event-Driven
 * 
 * > JavaScript is NOT Java
 */
export const javascriptIntroFixture: TutorialDocument = {
  schemaVersion: 1,
  blocks: [
    {
      id: 'block_heading_main',
      type: 'heading',
      content: {
        text: 'JavaScript',
        level: 1,
      },
      presentation: {
        width: 'full',
        alignment: 'left',
      },
    },
    {
      id: 'block_para_intro',
      type: 'paragraph',
      content: {
        text: 'JavaScript is a programming language that makes websites interactive.',
      },
      presentation: {
        width: 'full',
      },
    },
    {
      id: 'block_heading_what',
      type: 'heading',
      content: {
        text: 'What does it actually do?',
        level: 2,
      },
      presentation: {
        width: 'full',
      },
    },
    {
      id: 'block_para_what',
      type: 'paragraph',
      content: {
        text: 'When you click a button and a menu drops down, JavaScript responds to the event.',
      },
    },
    {
      id: 'block_heading_where',
      type: 'heading',
      content: {
        text: 'Where does it run?',
        level: 2,
      },
    },
    {
      id: 'block_list_where',
      type: 'list',
      content: {
        style: 'unordered',
        items: [
          { text: 'Client-Side' },
          { text: 'Server-Side' },
        ],
      },
    },
    {
      id: 'block_heading_characteristics',
      type: 'heading',
      content: {
        text: 'Key Characteristics',
        level: 2,
      },
    },
    {
      id: 'block_list_characteristics',
      type: 'list',
      content: {
        style: 'unordered',
        items: [
          { text: 'High-level' },
          { text: 'Dynamically Typed' },
          { text: 'Event-Driven' },
        ],
      },
    },
    {
      id: 'block_callout_java',
      type: 'callout',
      content: {
        variant: 'important',
        text: 'JavaScript is NOT Java',
      },
      presentation: {
        width: 'normal',
      },
    },
  ],
  metadata: {
    estimatedReadTime: 3,
    learningObjectives: [
      'Understand what JavaScript is',
      'Know where JavaScript runs',
      'Learn key characteristics of JavaScript',
    ],
    audience: 'beginner',
    tags: ['javascript', 'introduction', 'basics'],
  },
};
