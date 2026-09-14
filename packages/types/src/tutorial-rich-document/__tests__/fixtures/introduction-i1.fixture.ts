/**
 * Test Fixture: Introduction Block I1
 * Matches the actual I1 schema with content.page.* structure
 */

import type { IIntroductionBlock } from '../../blocks/introduction';

/**
 * Standard I1 fixture demonstrating all required sections
 */
export const introductionI1Fixture: IIntroductionBlock = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  type: 'introduction',
  version: 'I1',
  content: {
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
  },
  presentation: {
    width: 'full',
  },
};

/**
 * Minimal I1 fixture using minimum collection sizes
 */
export const introductionI1MinimalFixture: IIntroductionBlock = {
  id: '550e8400-e29b-41d4-a716-446655440002',
  type: 'introduction',
  version: 'I1',
  content: {
    page: {
      badge: 'Quick',
      title: 'Minimal Example',
      subtitle: 'Simplest valid structure',
      motto: {
        lines: ['Start', 'Here.', 'Go', 'Far.'],
      },
      learningGoal: 'Get started quickly.',
      topic: {
        title: 'The Basics',
        description: 'Core concepts explained.',
        quote: '"Start simple." — Anonymous',
      },
      whereFit: {
        title: 'Context',
        description: 'Where this fits.',
        flowCards: [{ title: 'Step 1', subtitle: 'First step', icon: 'arrow-right' }],
      },
      solution: {
        title: 'Example',
        description: 'A simple example:',
        code: { language: 'javascript', code: 'console.log("Hello");' },
      },
      whereUsed: {
        title: 'Usage',
        description: 'Common uses.',
        useCases: [{ title: 'Basic Apps', description: 'Simple projects', icon: 'box' }],
      },
      roadmap: {
        title: 'Path',
        description: 'Your journey.',
        steps: [{ title: 'Start', subtitle: 'Begin here' }],
      },
      whyMatters: {
        title: 'Impact',
        benefits: [{ title: 'Core Skill', subtitle: 'Essential knowledge', icon: 'star' }],
      },
      keyTakeaway: 'This is the essential takeaway.',
    },
  },
  presentation: {
    width: 'normal',
  },
};

/**
 * Maximal I1 fixture using maximum collection sizes
 */
export const introductionI1MaximalFixture: IIntroductionBlock = {
  id: '550e8400-e29b-41d4-a716-446655440003',
  type: 'introduction',
  version: 'I1',
  content: {
    page: {
      badge: 'Full-Stack',
      title: 'Complete Web Development Bootcamp',
      subtitle: 'From zero to production-ready applications',
      motto: {
        lines: ['Every', 'Journey', 'Starts', 'Here.'],
      },
      learningGoal: 'Build professional web applications using modern tools, frameworks, and best practices.',
      topic: {
        title: 'What is Full-Stack Development?',
        description: 'Full-stack development encompasses frontend and backend technologies, databases, APIs, and deployment.',
        quote: '"The best developers are T-shaped: deep in one area, broad across many." — Unknown',
      },
      whereFit: {
        title: 'The Full-Stack Landscape',
        description: 'Full-stack connects multiple technologies into cohesive applications.',
        flowCards: [
          { title: 'HTML/CSS', subtitle: 'Structure', icon: 'book-open' },
          { title: 'JavaScript', subtitle: 'Logic', icon: 'code' },
          { title: 'React', subtitle: 'UI', icon: 'layers' },
          { title: 'Node.js', subtitle: 'Server', icon: 'globe', highlight: true },
          { title: 'Express', subtitle: 'API', icon: 'route' },
          { title: 'Database', subtitle: 'Data', icon: 'box' },
          { title: 'Auth', subtitle: 'Security', icon: 'check-circle' },
          { title: 'Testing', subtitle: 'Quality', icon: 'target' },
          { title: 'CI/CD', subtitle: 'Deploy', icon: 'rocket' },
          { title: 'Monitor', subtitle: 'Observability', icon: 'zap' },
        ],
      },
      solution: {
        title: 'A Full-Stack Example',
        description: 'Minimal Express server with React frontend:',
        code: {
          language: 'javascript',
          code: 'app.get("/api/users", async (req, res) => {\n  const users = await db.users.findMany();\n  res.json(users);\n});',
        },
      },
      whereUsed: {
        title: 'Where Are Full-Stack Skills Used?',
        description: 'Full-stack capabilities are valuable across many contexts.',
        useCases: [
          { title: 'SaaS', description: 'Multi-tenant apps', icon: 'globe' },
          { title: 'E-commerce', description: 'Shopping flows', icon: 'wrench' },
          { title: 'Internal Tools', description: 'Admin dashboards', icon: 'layers' },
          { title: 'MVPs', description: 'Rapid prototyping', icon: 'rocket' },
          { title: 'Startups', description: 'Small teams', icon: 'lightbulb' },
          { title: 'Agencies', description: 'Client projects', icon: 'star' },
          { title: 'Enterprise', description: 'Large-scale apps', icon: 'box' },
          { title: 'Freelance', description: 'End-to-end delivery', icon: 'target' },
          { title: 'Open Source', description: 'Community projects', icon: 'code' },
          { title: 'Education', description: 'Learning platforms', icon: 'graduation-cap' },
        ],
      },
      roadmap: {
        title: 'Your 20-Week Roadmap',
        description: 'Structured journey through modern web development.',
        steps: [
          { title: 'Week 1: HTML', subtitle: 'Semantic markup' },
          { title: 'Week 2: CSS', subtitle: 'Styling techniques' },
          { title: 'Week 3: JS Intro', subtitle: 'Variables and functions' },
          { title: 'Week 4: DOM', subtitle: 'Interactive UIs' },
          { title: 'Week 5: Async JS', subtitle: 'Promises and fetch' },
          { title: 'Week 6: React Basics', subtitle: 'Components' },
          { title: 'Week 7: React State', subtitle: 'Hooks' },
          { title: 'Week 8: Router', subtitle: 'Navigation' },
          { title: 'Week 9: Node.js', subtitle: 'Backend setup' },
          { title: 'Week 10: Express', subtitle: 'REST APIs' },
          { title: 'Week 11: Database', subtitle: 'Data modeling' },
          { title: 'Week 12: CRUD', subtitle: 'Operations' },
          { title: 'Week 13: Auth', subtitle: 'Sessions' },
          { title: 'Week 14: Authorization', subtitle: 'Access control' },
          { title: 'Week 15: Testing', subtitle: 'Unit tests' },
          { title: 'Week 16: CI/CD', subtitle: 'Pipelines' },
          { title: 'Week 17: Performance', subtitle: 'Optimization' },
          { title: 'Week 18: Security', subtitle: 'Best practices' },
          { title: 'Week 19: Project', subtitle: 'Capstone build' },
          { title: 'Week 20: Portfolio', subtitle: 'Showcase' },
        ],
      },
      whyMatters: {
        title: 'Why Full-Stack Matters',
        benefits: [
          { title: 'Career Flexibility', subtitle: 'Work across layers', icon: 'target' },
          { title: 'Faster Development', subtitle: 'No waiting', icon: 'zap' },
          { title: 'Better Architecture', subtitle: 'End-to-end understanding', icon: 'layers' },
          { title: 'Higher Pay', subtitle: 'Broader skills', icon: 'star' },
          { title: 'Startup Viability', subtitle: 'Ship MVPs solo', icon: 'rocket' },
          { title: 'Open Source', subtitle: 'Contribute fully', icon: 'globe' },
          { title: 'Problem Solving', subtitle: 'Trace issues', icon: 'wrench' },
          { title: 'Leadership', subtitle: 'System decisions', icon: 'lightbulb' },
          { title: 'Learning', subtitle: 'Stay current', icon: 'book-open' },
          { title: 'Independence', subtitle: 'Solo projects', icon: 'check-circle' },
        ],
      },
      keyTakeaway: 'Full-stack development is the most versatile skillset in modern software engineering, empowering complete application builds.',
    },
  },
  presentation: {
    width: 'full',
  },
};
