import type { TutorialIntroductionPayload } from '@quiz/types';

/**
 * I1 Introduction Block - Example Authoring Payload
 * 
 * This demonstrates the I1 block structure with a complete Introduction example.
 * Used as default payload when creating new Introduction blocks.
 */
export const introductionI1Example: TutorialIntroductionPayload = {
  page: {
    badge: 'JavaScript',
    title: 'Functions in JavaScript',
    subtitle: 'Master the building blocks of reusable code',
    motto: {
      lines: ['Know', 'Your Path.', 'Learn with', 'Purpose.'],
    },
    learningGoal: 'Learn how to write, organize, and use JavaScript functions from basic declarations to advanced patterns.',
    topic: {
      title: 'What are Functions?',
      description: 'Functions are reusable blocks of code that perform specific tasks. They accept inputs, process them, and return outputs.',
      quote: '"Functions are the bread and butter of JavaScript." — Kyle Simpson',
    },
    whereFit: {
      title: 'Where Do Functions Fit?',
      description: 'Functions sit at the core of JavaScript, connecting data structures and application logic.',
      flowCards: [
        { title: 'Variables', subtitle: 'Store values', icon: 'box' },
        { title: 'Functions', subtitle: 'Transform data', icon: 'code', highlight: true },
        { title: 'Objects', subtitle: 'Organize behavior', icon: 'layers' },
      ],
    },
    solution: {
      title: 'A Simple Function',
      description: 'A basic function that adds two numbers:',
      code: {
        language: 'javascript',
        code: 'function add(a, b) {\n  return a + b;\n}\n\nconst result = add(5, 3);',
      },
    },
    whereUsed: {
      title: 'Where Are Functions Used?',
      description: 'Functions appear everywhere in JavaScript applications.',
      useCases: [
        { title: 'Event Handlers', description: 'Respond to user interactions', icon: 'target' },
        { title: 'API Calls', description: 'Fetch and process data', icon: 'globe' },
        { title: 'Data Processing', description: 'Transform arrays and compute values', icon: 'wrench' },
      ],
    },
    roadmap: {
      title: 'Your Learning Roadmap',
      description: 'Progress from fundamentals to advanced patterns.',
      steps: [
        { title: 'Function Basics', subtitle: 'Declarations and expressions' },
        { title: 'Parameters & Returns', subtitle: 'Passing data in and out' },
        { title: 'Scope & Closures', subtitle: 'Variable access and memory' },
        { title: 'Higher-Order Functions', subtitle: 'Functions as values' },
        { title: 'Advanced Patterns', subtitle: 'Composition and currying' },
      ],
    },
    whyMatters: {
      title: 'Why This Matters',
      benefits: [
        { title: 'Write Reusable Code', subtitle: 'Avoid repetition', icon: 'rocket' },
        { title: 'Improve Maintainability', subtitle: 'Easier to test and debug', icon: 'check-circle' },
        { title: 'Unlock Advanced Patterns', subtitle: 'Foundation for frameworks', icon: 'lightbulb' },
      ],
    },
    keyTakeaway: 'Functions are the essential building blocks of JavaScript. Mastering them unlocks clean, modular, and scalable code.',
  },
};
