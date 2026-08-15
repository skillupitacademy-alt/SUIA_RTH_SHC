/**
 * Table fixture demonstrating data tables
 */

import { TutorialDocument } from '../../document';

export const tableTutorialDocument: TutorialDocument = {
  schemaVersion: 1,
  blocks: [
    {
      id: 'h1',
      type: 'heading',
      content: {
        text: 'JavaScript Data Types',
        level: 1,
      },
    },
    {
      id: 'p1',
      type: 'paragraph',
      content: {
        text: 'JavaScript has several primitive data types:',
      },
    },
    {
      id: 'table1',
      type: 'table',
      content: {
        columns: [
          { key: 'type', label: 'Type', alignment: 'left' },
          { key: 'description', label: 'Description', alignment: 'left' },
          { key: 'example', label: 'Example', alignment: 'center' },
        ],
        rows: [
          {
            type: 'String',
            description: 'Text data',
            example: '"Hello"',
          },
          {
            type: 'Number',
            description: 'Numeric data',
            example: '42',
          },
          {
            type: 'Boolean',
            description: 'True or false',
            example: 'true',
          },
          {
            type: 'Undefined',
            description: 'Variable declared but not assigned',
            example: 'undefined',
          },
          {
            type: 'Null',
            description: 'Intentional absence of value',
            example: 'null',
          },
        ],
        hasHeader: true,
      },
    },
    {
      id: 'definition1',
      type: 'definition',
      content: {
        term: 'Primitive Type',
        definition: 'A data type that is not an object and has no methods.',
        example: 'Numbers, strings, and booleans are primitive types.',
      },
    },
  ],
};
