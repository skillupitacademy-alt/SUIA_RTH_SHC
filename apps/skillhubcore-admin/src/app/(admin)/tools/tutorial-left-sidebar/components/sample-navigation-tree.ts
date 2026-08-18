import type { TutorialNavigationNode, TutorialNavigationTree } from './types';

// UNIVERSAL NAVIGATION JSON TEMPLATE
// This is the standard structure for sidebar navigation.
// DO NOT include brand, theme, progress, or status in your navigation JSON.
// Those are applied at runtime based on brand and user context.
export const universalNavigationTemplate: TutorialNavigationNode[] = [
  {
    id: 'javascript',
    name: 'JavaScript',
    type: 'group',
    icon: 'javascript',
    expanded: true,
    children: [
      {
        id: 'javascript-fundamentals',
        name: 'JavaScript Fundamentals',
        type: 'group',
        icon: 'book',
        expanded: true,
        children: [
          {
            id: 'what-is-javascript',
            name: 'What Is JavaScript?',
            type: 'page',
            icon: 'folder'
          },
          {
            id: 'javascript-syntax',
            name: 'JavaScript Syntax',
            type: 'page',
            icon: 'folder'
          },
          {
            id: 'javascript-statements',
            name: 'JavaScript Statements',
            type: 'page',
            icon: 'folder'
          }
        ]
      },
      {
        id: 'variables',
        name: 'Variables',
        type: 'group',
        icon: 'folder',
        children: [
          {
            id: 'what-is-variable',
            name: 'What Is a Variable?',
            type: 'page',
            icon: 'folder'
          },
          {
            id: 'let-var-const',
            name: 'let vs var vs const',
            type: 'page',
            icon: 'folder'
          }
        ]
      },
      {
        id: 'functions',
        name: 'Functions',
        type: 'group',
        icon: 'folder',
        expanded: true,
        children: [
          {
            id: 'what-is-function',
            name: 'What Is Function?',
            type: 'page',
            icon: 'folder'
          },
          {
            id: 'function-declaration',
            name: 'Function Declaration',
            type: 'page',
            icon: 'folder'
          }
        ]
      }
    ]
  }
];

// PRESENTATION SAMPLE (for preview only - includes brand/theme/progress)
// This demonstrates what the final rendered sidebar looks like with runtime data applied
export const sampleNavigationTree: TutorialNavigationTree = {
  brand: {
    name: 'RealTutorialHub',
    shortName: 'RTH',
    tagline: 'Learn Smarter, Not Harder',
  },
  theme: {
    primary: '#d03f00',
    primaryDark: '#b63600',
    secondary: '#124fd6',
    activeBackground: '#eef3fa',
    completed: '#08a64a',
  },
  subject: {
    name: 'Frontend Development',
    icon: 'code',
  },
  progress: {
    percentage: 35,
  },
  topics: universalNavigationTemplate.map((node) => ({
    ...node,
    slug: node.id,
    status: 'not-started' as const,
    children: node.children?.map((child) => ({
      ...child,
      slug: child.id,
      status: 'not-started' as const,
      children: child.children?.map((grandchild) => ({
        ...grandchild,
        slug: grandchild.id,
        status: 'not-started' as const,
      }))
    }))
  }))
};
