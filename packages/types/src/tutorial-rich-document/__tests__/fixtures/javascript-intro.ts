/**
 * JavaScript Introduction Tutorial Fixture
 * 
 * This represents a real tutorial section converted to rich document format.
 */

import { TutorialDocument } from '../../document';

export const javascriptIntroDocument: TutorialDocument = {
  schemaVersion: 1,
  blocks: [
    {
      id: 'block_001',
      type: 'heading',
      content: { text: 'JavaScript', level: 1 },
      presentation: { width: 'full' },
    },
    {
      id: 'block_002',
      type: 'paragraph',
      content: {
        text: 'JavaScript is a programming language that makes websites interactive. While HTML gives a webpage structure and CSS gives it style, JavaScript makes it come alive.',
      },
    },
    {
      id: 'block_003',
      type: 'heading',
      content: { text: 'What does it actually do?', level: 2 },
    },
    {
      id: 'block_004',
      type: 'paragraph',
      content: {
        text: 'When you click a button and a menu drops down, JavaScript can respond to the event.',
      },
    },
    {
      id: 'block_005',
      type: 'heading',
      content: { text: 'Where does it run?', level: 2 },
    },
    {
      id: 'block_006',
      type: 'list',
      content: {
        style: 'unordered',
        items: ['Client-Side', 'Server-Side'],
      },
    },
    {
      id: 'block_007',
      type: 'heading',
      content: { text: 'Key Technical Characteristics', level: 2 },
    },
    {
      id: 'block_008',
      type: 'list',
      content: {
        style: 'unordered',
        items: [
          'High-level',
          'Dynamically Typed',
          'Multi-Paradigm',
          'Event-Driven & Asynchronous',
        ],
      },
    },
    {
      id: 'block_009',
      type: 'callout',
      content: {
        variant: 'important',
        text: 'JavaScript is NOT Java. JavaScript and Java are different programming languages.',
      },
    },
  ],
  metadata: {
    estimatedReadTime: 5,
    learningObjectives: [
      'Understand what JavaScript is',
      'Know where JavaScript runs',
      'Learn key characteristics of JavaScript',
    ],
    tags: ['javascript', 'programming', 'web-development'],
  },
};
