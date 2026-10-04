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
                    id: 'card-pros',
                    title: 'Pros',
                    blocks: [
                      {
                        id: 'list-react-pros',
                        type: 'list',
                        content: {
                          style: 'unordered',
                          items: [
                            { text: 'Large ecosystem' },
                            { text: 'Strong community' },
                            { text: 'Flexible' },
                          ],
                        },
                      },
                    ],
                  },
                  {
                    id: 'card-cons',
                    title: 'Cons',
                    blocks: [
                      {
                        id: 'list-react-cons',
                        type: 'list',
                        content: {
                          style: 'unordered',
                          items: [
                            { text: 'Steep learning curve' },
                            { text: 'JSX syntax' },
                          ],
                        },
                      },
                    ],
                  },
                ],
              },
              presentation: {
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
        features: [
          { name: 'Learning Curve', values: ['Moderate-Steep', 'Easy-Moderate'] },
          { name: 'Performance', values: ['Excellent', 'Excellent'] },
          { name: 'Ecosystem', values: ['Very Large', 'Growing'] },
        ],
      },
    },
  ],
  metadata: {
    estimatedReadTime: 8,
    tags: ['react', 'vue', 'comparison', 'frameworks'],
  },
};
