import type { TutorialSummaryPayload } from '@quiz/types';

/**
 * S1 Summary Block - Example Authoring Payload
 * 
 * This is a legacy-format example used for initial authoring state.
 * It demonstrates the complete S1 block structure with revision table.
 */
export const summaryS1Example: TutorialSummaryPayload = {
  page: {
    badge: 'REVISION & SUMMARY',
    badgeIcon: 'fa-book-open',
    title: 'Revision: Variables and id()',
    introduction: "Let's quickly revise what we learned about variables, objects, and identity in Python.",
  },
  summary: [
    { text: 'A variable is a name that <code>references</code> an object in memory.' },
    { text: 'Variables store references, <code>not</code> the actual values.' },
    { text: '<code>id()</code> returns the identity of the object, not its value.' },
    { text: 'Two variables can have the same value but different identities.' },
    { text: 'When a variable is assigned a new value, it may start referring to a new object.' },
  ],
  revisionTable: {
    columns: [
      { id: 'concept', title: 'Concept', icon: 'fa-regular fa-lightbulb' },
      { id: 'keyPoint', title: 'Key Point', icon: 'fa-solid fa-bullseye' },
      { id: 'example', title: 'Example', icon: 'fa-solid fa-code' },
      { id: 'remember', title: 'Remember', icon: 'fa-solid fa-star' },
    ],
    rows: [
      {
        concept: { name: 'Variable', icon: 'fa-solid fa-xmark' },
        keyPoint: {
          title: 'References an object.',
          description: 'A variable is just a name that refers to an object stored in memory.',
          code: 'x = 10',
        },
        example: { code: 'x = 10' },
        remember: {
          title: 'Variable != object',
          description: 'The variable holds a reference, not the actual value.',
        },
      },
      {
        concept: { name: 'Object', icon: 'fa-solid fa-cube' },
        keyPoint: {
          title: 'Contains value/type information.',
          description: 'An object stores the actual data along with its type and other internal information.',
          code: 'type(x) -> int',
        },
        example: { code: '10' },
        remember: {
          title: 'Objects exist in memory',
          description: 'Objects are created in memory and can be shared by multiple variables.',
        },
      },
      {
        concept: { name: 'Assignment', icon: 'fa-solid fa-equals' },
        keyPoint: {
          title: 'Binds a variable to an object.',
          description: 'Assignment makes a variable reference an object produced by an expression.',
          code: 'x = 20',
        },
        example: { code: 'x = 20' },
        remember: {
          title: 'Reference can change',
          description: 'After assignment, <code>x</code> now refers to the object containing <code>20</code>.',
        },
      },
    ],
  },
  quickTips: [
    { text: 'Use meaningful variable names to make your code readable.' },
    { text: 'Use <code>id()</code> to understand how Python manages objects in memory.' },
    { text: "Don't rely on <code>id()</code> for program logic; its value can change between runs." },
    { text: 'Practice with small examples and predict the output before running the code.' },
  ],
  finalTip: {
    title: 'Quick Revision Tip',
    text: 'Review this table regularly. Strong fundamentals make advanced topics much easier.',
  },
};
