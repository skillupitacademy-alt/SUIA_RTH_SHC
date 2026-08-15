/**
 * Code tutorial fixture with code blocks and examples
 */

import { TutorialDocument } from '../../document';

export const codeTutorialDocument: TutorialDocument = {
  schemaVersion: 1,
  blocks: [
    {
      id: 'h1',
      type: 'heading',
      content: {
        text: 'Variables in JavaScript',
        level: 1,
      },
    },
    {
      id: 'p1',
      type: 'paragraph',
      content: {
        text: 'Variables are containers for storing data values.',
      },
    },
    {
      id: 'code1',
      type: 'code',
      content: {
        language: 'javascript',
        code: 'let name = "John";\nconst age = 30;\nvar city = "New York";',
        filename: 'variables.js',
        caption: 'Three ways to declare variables',
        highlightLines: [1, 2],
      },
    },
    {
      id: 'callout1',
      type: 'callout',
      content: {
        variant: 'tip',
        title: 'Best Practice',
        text: 'Use const by default. Only use let when you need to reassign the variable.',
      },
    },
    {
      id: 'example1',
      type: 'example',
      content: {
        title: 'Counter Example',
        explanation: 'Here is a simple counter that demonstrates variable reassignment:',
        code: 'let count = 0;\ncount = count + 1;\nconsole.log(count);',
        output: '1',
        notes: 'The let keyword allows us to change the value of count.',
      },
    },
  ],
  metadata: {
    estimatedReadTime: 3,
    tags: ['javascript', 'variables', 'basics'],
  },
};
