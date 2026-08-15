/**
 * Nested layout fixture demonstrating container blocks
 */

import { TutorialDocument } from '../../document';

export const nestedLayoutDocument: TutorialDocument = {
  schemaVersion: 1,
  blocks: [
    {
      id: 'h1',
      type: 'heading',
      content: {
        text: 'React vs Vue Comparison',
        level: 1,
      },
    },
    {
      id: 'two-col-1',
      type: 'two-column',
      content: {
        left: {
          blocks: [
            {
              id: 'h2-react',
              type: 'heading',
              content: {
                text: 'React',
                level: 2,
              },
            },
            {
              id: 'p-react',
              type: 'paragraph',
              content: {
                text: 'React is a JavaScript library for building user interfaces.',
              },
            },
            {
              id: 'card-grid-1',
              type: 'card-grid',
              content: {
                cards: [
                  {
                    title: 'Pros',
                    blocks: [
                      {
                        id: 'list-react-pros',
                        type: 'list',
                        content: {
                          style: 'unordered',
                          items: ['Large ecosystem', 'Strong community', 'Flexible'],
                        },
                      },
                    ],
                  },
                  {
                    title: 'Cons',
                    blocks: [
                      {
                        id: 'list-react-cons',
                        type: 'list',
                        content: {
                          style: 'unordered',
                          items: ['Steep learning curve', 'JSX syntax'],
                        },
                      },
                    ],
                  },
                ],
                columns: 2,
              },
            },
          ],
        },
        right: {
          blocks: [
            {
              id: 'h2-vue',
              type: 'heading',
              content: {
                text: 'Vue',
                level: 2,
              },
            },
            {
              id: 'p-vue',
              type: 'paragraph',
              content: {
                text: 'Vue is a progressive JavaScript framework for building user interfaces.',
              },
            },
            {
              id: 'callout-vue',
              type: 'callout',
              content: {
                variant: 'info',
                title: 'Progressive Framework',
                text: 'Vue can be adopted incrementally, from a library to a full framework.',
              },
            },
          ],
        },
      },
    },
    {
      id: 'comparison-1',
      type: 'comparison',
      content: {
        title: 'Feature Comparison',
        entities: ['React', 'Vue'],
        features: ['Learning Curve', 'Performance', 'Ecosystem'],
        rows: [
          ['Moderate-Steep', 'Easy-Moderate'],
          ['Excellent', 'Excellent'],
          ['Very Large', 'Growing'],
        ],
      },
    },
  ],
  metadata: {
    estimatedReadTime: 8,
    tags: ['react', 'vue', 'comparison', 'frameworks'],
  },
};
