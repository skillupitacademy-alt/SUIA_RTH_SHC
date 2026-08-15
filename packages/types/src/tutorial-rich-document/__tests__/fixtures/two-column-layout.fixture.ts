/**
 * Test Fixture: Two-Column Layout Example
 * Demonstrates nested container blocks
 */

import type { TutorialDocument } from '../../document';

export const twoColumnLayoutFixture: TutorialDocument = {
  schemaVersion: 1,
  blocks: [
    {
      id: 'block_heading_comparison',
      type: 'heading',
      content: {
        text: 'Client-Side vs Server-Side JavaScript',
        level: 1,
      },
    },
    {
      id: 'block_two_column_comparison',
      type: 'two-column',
      content: {
        left: {
          blocks: [
            {
              id: 'block_heading_client',
              type: 'heading',
              content: {
                text: 'Client-Side',
                level: 3,
              },
            },
            {
              id: 'block_para_client',
              type: 'paragraph',
              content: {
                text: 'Runs in the browser. Handles user interactions and DOM manipulation.',
              },
            },
            {
              id: 'block_code_client',
              type: 'code',
              content: {
                language: 'javascript',
                code: 'document.querySelector("#btn").addEventListener("click", () => {\n  console.log("Clicked!");\n});',
                caption: 'DOM event handling',
              },
            },
          ],
        },
        right: {
          blocks: [
            {
              id: 'block_heading_server',
              type: 'heading',
              content: {
                text: 'Server-Side',
                level: 3,
              },
            },
            {
              id: 'block_para_server',
              type: 'paragraph',
              content: {
                text: 'Runs on the server. Handles API requests, database operations, and business logic.',
              },
            },
            {
              id: 'block_code_server',
              type: 'code',
              content: {
                language: 'javascript',
                code: 'app.get("/api/users", async (req, res) => {\n  const users = await db.users.findAll();\n  res.json(users);\n});',
                caption: 'API endpoint example',
              },
            },
          ],
        },
      },
      presentation: {
        ratio: '50-50',
        gap: 'normal',
      },
    },
    {
      id: 'block_callout_both',
      type: 'callout',
      content: {
        variant: 'tip',
        title: 'Full-Stack JavaScript',
        text: 'With Node.js, you can use JavaScript for both client and server, enabling full-stack development with a single language.',
      },
    },
  ],
  metadata: {
    estimatedReadTime: 5,
    tags: ['javascript', 'client-server', 'full-stack'],
  },
};
