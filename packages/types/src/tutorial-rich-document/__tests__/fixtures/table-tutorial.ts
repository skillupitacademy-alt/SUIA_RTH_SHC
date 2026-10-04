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
          { id: 'type', label: 'Type', alignment: 'left' },
          { id: 'description', label: 'Description', alignment: 'left' },
          { id: 'example', label: 'Example', alignment: 'center' },
        ],
        rows: [
          {
            id: 'row_1',
            cells: [
              { columnId: 'type', value: 'String' },
              { columnId: 'description', value: 'Text data' },
              { columnId: 'example', value: '"Hello"' },
            ],
          },
          {
            id: 'row_2',
            cells: [
              { columnId: 'type', value: 'Number' },
              { columnId: 'description', value: 'Numeric data' },
              { columnId: 'example', value: '42' },
            ],
          },
          {
            id: 'row_3',
            cells: [
              { columnId: 'type', value: 'Boolean' },
              { columnId: 'description', value: 'True or false' },
              { columnId: 'example', value: 'true' },
            ],
          },
          {
            id: 'row_4',
            cells: [
              { columnId: 'type', value: 'Undefined' },
              { columnId: 'description', value: 'Variable declared but not assigned' },
              { columnId: 'example', value: 'undefined' },
            ],
          },
          {
            id: 'row_5',
            cells: [
              { columnId: 'type', value: 'Null' },
              { columnId: 'description', value: 'Intentional absence of value' },
              { columnId: 'example', value: 'null' },
            ],
          },
        ],
        hasHeader: true,
      },
    },
    {
      id: 'definition1',
      type: 'callout',
      content: {
        variant: 'info',
        title: 'Primitive Type',
        text: 'A data type that is not an object and has no methods. Numbers, strings, and booleans are primitive types.',
      },
    },
  ],
};
