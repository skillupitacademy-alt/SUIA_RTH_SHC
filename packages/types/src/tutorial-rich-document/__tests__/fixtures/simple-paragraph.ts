/**
 * Simple paragraph fixture for testing
 */

import { TutorialDocument } from '../../document';

export const simpleParagraphDocument: TutorialDocument = {
  schemaVersion: 1,
  blocks: [
    {
      id: 'p1',
      type: 'paragraph',
      content: {
        text: 'This is a simple paragraph.',
      },
    },
  ],
};
