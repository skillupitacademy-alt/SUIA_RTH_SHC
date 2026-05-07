/**
 * Universal Subtopic Content Registry
 * 
 * This file defines the universal pattern for all subtopic content.
 * Component-architecture is the BASE pattern that all other subtopics follow.
 * 
 * Pattern Structure:
 * - simpleWords: Brief explanation
 * - sections: Array of content sections with title, content, keyPoint, codeExample
 * - laymanExplanation: Simple analogy with mainConcept, reasonGrid, typesTable
 * - realLifeExamples: Real-world scenarios with hero, scenarios, walkthrough
 * - technicalDeepDive: In-depth technical content with sections
 */

export interface SubtopicContentPattern {
  simpleWords: string;
  // Notes Section Templates (8 templates from JSON spec)
  definitionBlock: {
    badge: string;
    headline: string;
    definitionText: string;
    importanceCallout: string;
    quickSummary: string[];
  };
  sections: Array<{
    id: string;
    title: string;
    content: string;
    keyPoint?: string;
    codeExample?: {
      code: string;
      output: string;
    };
  }>;
  componentGrid: {
    gridTitle: string;
    componentCards: Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
      subcomponents: string[];
    }>;
  };
  examplePanel: {
    exampleTitle: string;
    scenarios: Array<{
      id: string;
      title: string;
      scenarioDescription: string;
      practicalSolution: string;
      industryContext: string;
    }>;
  };
  practiceCard: {
    bestPracticeTitle: string;
    recommendations: Array<{
      id: string;
      title: string;
      description: string;
    }>;
    optimizationTips: string[];
    industryStandards: string[];
  };
  warningFaq: {
    commonErrors: Array<{
      id: string;
      error: string;
      solution: string;
    }>;
    faqItems: Array<{
      id: string;
      question: string;
      answer: string;
    }>;
    misconceptionAlerts: string[];
  };
  summaryCard: {
    summaryTitle: string;
    keyTakeaways: string[];
    revisionChecklist: Array<{
      id: string;
      item: string;
      checked: boolean;
    }>;
    memoryReinforcement: string;
    examTips: string[];
  };
  // Layman Explanation Section Templates (8 templates from JSON spec)
  laymanExplanation: {
    simpleOverview: {
      badge: string;
      headline: string;
      simpleDefinition: string;
      subExplanation: string;
      importanceBlock: string;
      progressIndicator?: string;
    };
    everydayAnalogy: {
      title: string;
      storyAnalogy: string;
      comparisonPanel: {
        realWorld: string;
        technical: string;
      };
      visualMetaphor: string;
      keyTakeaway: string;
      image?: string;
    };
    whyItExists: {
      sectionTitle: string;
      benefitCards: Array<{
        id: string;
        title: string;
        description: string;
        icon: string;
        type: 'career' | 'practical' | 'future';
      }>;
    };
    simpleUseCases: {
      gridTitle: string;
      useCaseCards: Array<{
        id: string;
        title: string;
        description: string;
        category: 'everyday' | 'career';
        icon: string;
      }>;
    };
    beginnerBreakdown: {
      title: string;
      steps: Array<{
        id: string;
        stepTitle: string;
        stepExplanation: string;
        microLearningChunk: string;
      }>;
    };
    mentalModel: {
      title: string;
      conceptMap: {
        nodes: Array<{
          id: string;
          label: string;
          description: string;
        }>;
        connections: Array<{
          from: string;
          to: string;
          label: string;
        }>;
      };
      visualLabels: string[];
    };
    commonConfusions: {
      title: string;
      confusionItems: Array<{
        id: string;
        confusion: string;
        clarification: string;
      }>;
      faqItems: Array<{
        id: string;
        question: string;
        answer: string;
      }>;
      misconceptionAlerts: string[];
    };
    simpleRecap: {
      summaryTitle: string;
      keyTakeaways: string[];
      simpleRecapPoints: string[];
      confidenceBoost: string;
      memoryReinforcement: string;
    };
  };
  realLifeExamples: {
    // 1. Concept to Real World Mapping
    conceptMapping?: {
      badge: string;
      headline: string;
      conceptDefinition: string;
      realWorldTranslation: string;
      importanceBlock: string;
      careerRelevance?: string;
    };
    // 2. Industry Use Case
    industryUseCase?: {
      title: string;
      industryName: string;
      scenarioDescription: string;
      businessContext: string;
      implementation: string;
      impact: string;
      keyTakeaway: string;
      image?: string;
    };
    // 3. Daily Life Example
    dailyLifeExample?: {
      title: string;
      storyTitle: string;
      storyNarrative: string;
      everydayConnection: string;
      technicalMapping: string;
      relatableInsight: string;
      image?: string;
    };
    // 4. Career Relevance
    careerRelevance?: {
      title: string;
      careerPaths: Array<{
        id: string;
        role: string;
        description: string;
        skillLevel: 'entry' | 'mid' | 'senior';
        salaryRange?: string;
        icon: string;
      }>;
      industryDemand: string;
      futureGrowth: string;
    };
    // 5. Problem Solution Context
    problemSolutionContext?: {
      title: string;
      problemStatement: string;
      context: string;
      solution: string;
      implementation: string;
      outcome: string;
      lessonsLearned: string;
    };
    // 6. Business Application
    businessApplication?: {
      title: string;
      companyType: string;
      businessChallenge: string;
      technicalApplication: string;
      businessProcess: string;
      roi: string;
      scalability: string;
      keyInsight: string;
    };
    // 7. Domain Specific Scenarios
    domainScenarios?: {
      title: string;
      scenarios: Array<{
        id: string;
        domain: string;
        title: string;
        description: string;
        application: string;
        icon: string;
      }>;
    };
    // 8. Practical Recap
    practicalRecap?: {
      summaryTitle: string;
      keyApplications: string[];
      industryRelevance: string[];
      careerImpact: string;
      nextSteps: string[];
      practicalAdvice: string;
    };
  };
  technicalDeepDive: {
    title: string;
    badge: string;
    intro: string;
    sections: Array<{
      id: string;
      title: string;
      content: string;
      diagram?: {
        type: 'anatomy' | 'flow' | 'chain';
        data: any;
      };
      code?: {
        language: string;
        code: string;
        output?: string;
      };
      keyPoints?: string[];
      steps?: { id: string; text: string }[];
      highlight?: string;
    }>;
  };
  codeExample: {
    title: string;
    description: string;
    examples: Array<{
      title: string;
      file: string;
    }>;
    code: string;
    output: string;
    tip: string;
  };
  assignment: {
    title: string;
    description: string;
    xp: number;
    duration: string;
    task: {
      title: string;
      description: string;
      requirements: string[];
    };
    objectives: string[];
    starterCode: string;
    submissionGuidelines: string[];
  };
  project: {
    title: string;
    description: string;
    xp: number;
    deadline: string;
    hero: {
      badge: string;
      title: string;
      description: string;
      image: string;
    };
    realWorldUse: string;
    skills: string[];
    buildItems: string[];
    deliverables: string[];
  };
  quiz: {
    title: string;
    description: string;
    totalQuestions: number;
    duration: string;
    xp: number;
    questions: Array<{
      id: string;
      questionNumber: number;
      type: string;
      points: number;
      question: string;
      code?: string;
      options: Array<{
        id: string;
        text: string;
      }>;
      correctAnswer: string;
      explanation: string;
    }>;
  };
  progress: {
    title: string;
    description: string;
    stats: {
      completionPercentage: number;
      xpEarned: number;
      totalXp: number;
      streak: number;
      timeSpent: string;
    };
    milestones: Array<{
      id: string;
      title: string;
      status: 'completed' | 'current' | 'locked';
      xp: number;
    }>;
  };
}

/**
 * Content Registry
 * Component-architecture is the BASE - all other subtopics follow this pattern
 */
export const subtopicContentRegistry: Record<string, SubtopicContentPattern> = {
  // BASE PATTERN: Component Architecture
  'component-architecture': {
    simpleWords: 'Component architecture is a way to build user interfaces by assembling small, isolated, and reusable pieces of code called components, rather than building the entire page as one single chunk.',
    definitionBlock: {
      badge: 'Core Concept',
      headline: 'Component Architecture in React',
      definitionText: 'Component architecture is a design pattern where user interfaces are built by composing small, self-contained, and reusable pieces called components. Each component encapsulates its own structure, styling, and behavior, making it easier to build, test, and maintain complex applications.',
      importanceCallout: 'This pattern is fundamental to modern React development and is used by companies like Facebook, Netflix, and Airbnb to build scalable applications.',
      quickSummary: [
        'Break UI into small, reusable pieces',
        'Each component manages its own logic and state',
        'Compose complex interfaces from simple building blocks',
        'Easier to test, debug, and maintain code'
      ]
    },
    sections: [
      {
        id: 's1',
        title: '1. What is Component Architecture?',
        content: 'Component architecture is a technique where UI elements are broken down into self-contained modules. These components manage their own structure and logic, allowing you to compose complex interfaces from simple building blocks.',
        keyPoint: 'It helps enforce the Single Responsibility Principle, making your code more readable, testable, and maintainable.'
      },
      {
        id: 's2',
        title: '2. How Does Component Architecture Work?',
        content: 'In React, the most common pattern is separating Container (Smart) components from Presentational (Dumb) components. Container components handle state and data fetching, while presentational components focus entirely on how things look.\n\nExample:',
        codeExample: {
          code: 'const UserProfile = ({ user }) => (\n  <div className="card">\n    <img src={user.avatar} alt="Profile" />\n    <h2>{user.name}</h2>\n  </div>\n);\n\nconst UserContainer = () => {\n  const [user, setUser] = useState(null);\n  useEffect(() => {\n    fetchUser().then(data => setUser(data));\n  }, []);\n\n  return user ? <UserProfile user={user} /> : <Loading />;\n};',
          output: 'Output: <UserProfile /> rendered with data'
        }
      }
    ],
    componentGrid: {
      gridTitle: 'Breaking Down Component Architecture',
      componentCards: [
        {
          id: 'cg1',
          title: 'Presentational Components',
          description: 'Focus purely on how things look. They receive data via props and render UI.',
          icon: 'Eye',
          subcomponents: ['Buttons', 'Cards', 'Forms', 'Typography']
        },
        {
          id: 'cg2',
          title: 'Container Components',
          description: 'Handle logic, state management, and data fetching. They pass data to presentational components.',
          icon: 'Database',
          subcomponents: ['Data Fetchers', 'State Managers', 'Event Handlers', 'API Connectors']
        },
        {
          id: 'cg3',
          title: 'Higher-Order Components',
          description: 'Functions that take a component and return a new enhanced component with additional functionality.',
          icon: 'Layers',
          subcomponents: ['Auth Wrappers', 'Data Loaders', 'Error Boundaries', 'Theme Providers']
        }
      ]
    },
    examplePanel: {
      exampleTitle: 'Practical Examples in Real Applications',
      scenarios: [
        {
          id: 'ep1',
          title: 'E-Commerce Product Card',
          scenarioDescription: 'A reusable product card component that displays product image, name, price, and add-to-cart button.',
          practicalSolution: 'Create a <ProductCard /> component that accepts product data as props. Use it across homepage, search results, and category pages.',
          industryContext: 'Used by Amazon, eBay, Shopify'
        },
        {
          id: 'ep2',
          title: 'Social Media Post Component',
          scenarioDescription: 'A post component that shows user avatar, name, timestamp, content, and interaction buttons (like, comment, share).',
          practicalSolution: 'Build a <Post /> component with nested <Avatar />, <PostContent />, and <ActionBar /> components for maximum reusability.',
          industryContext: 'Used by Facebook, Twitter, LinkedIn'
        }
      ]
    },
    practiceCard: {
      bestPracticeTitle: 'Best Practices for Component Architecture',
      recommendations: [
        {
          id: 'bp1',
          title: 'Single Responsibility Principle',
          description: 'Each component should do one thing well. If a component grows too large, split it into smaller components.'
        },
        {
          id: 'bp2',
          title: 'Props Over State',
          description: 'Prefer passing data via props rather than duplicating state. Lift state up to the nearest common ancestor.'
        },
        {
          id: 'bp3',
          title: 'Composition Over Inheritance',
          description: 'Use component composition instead of class inheritance. React favors composition for code reuse.'
        }
      ],
      optimizationTips: [
        'Use React.memo() to prevent unnecessary re-renders',
        'Implement code splitting with React.lazy() for large components',
        'Keep component files under 250 lines of code',
        'Use TypeScript for better type safety and autocomplete'
      ],
      industryStandards: [
        'Follow Atomic Design methodology (Atoms, Molecules, Organisms)',
        'Maintain a component library/storybook for documentation',
        'Write unit tests for each component',
        'Use consistent naming conventions (PascalCase for components)'
      ]
    },
    warningFaq: {
      commonErrors: [
        {
          id: 'ce1',
          error: 'Prop Drilling (passing props through many levels)',
          solution: 'Use Context API or state management libraries like Redux or Zustand to avoid passing props through multiple levels.'
        },
        {
          id: 'ce2',
          error: 'Mutating Props Directly',
          solution: 'Props are read-only. Never modify props directly. Instead, use state or callbacks to handle changes.'
        },
        {
          id: 'ce3',
          error: 'Too Many Props (more than 5-7 props)',
          solution: 'If a component has too many props, consider splitting it into smaller components or grouping related props into objects.'
        }
      ],
      faqItems: [
        {
          id: 'faq1',
          question: 'When should I split a component into smaller components?',
          answer: 'Split when: (1) Component exceeds 250 lines, (2) Component has multiple responsibilities, (3) Parts of the component are reused elsewhere, (4) Component becomes hard to test or understand.'
        },
        {
          id: 'faq2',
          question: 'Should I use functional or class components?',
          answer: 'Use functional components with hooks. They are simpler, more concise, and recommended by React team. Class components are legacy but still supported.'
        },
        {
          id: 'faq3',
          question: 'How do I share logic between components?',
          answer: 'Use custom hooks to extract and share stateful logic. Custom hooks are functions that start with "use" and can call other hooks.'
        }
      ],
      misconceptionAlerts: [
        'Components are NOT just about splitting code - they are about creating reusable, testable units',
        'More components does NOT always mean better code - balance reusability with complexity',
        'Component architecture is NOT only for large apps - even small apps benefit from good structure'
      ]
    },
    summaryCard: {
      summaryTitle: 'Key Takeaways & Revision Checklist',
      keyTakeaways: [
        'Component architecture breaks UI into small, reusable, self-contained pieces',
        'Presentational components handle UI, container components handle logic',
        'Props flow down (parent to child), events flow up (child to parent)',
        'Composition is preferred over inheritance in React',
        'Follow Single Responsibility Principle for each component',
        'Use hooks to share logic between components'
      ],
      revisionChecklist: [
        { id: 'rc1', item: 'Understand the difference between presentational and container components', checked: false },
        { id: 'rc2', item: 'Know when to split a component into smaller components', checked: false },
        { id: 'rc3', item: 'Can explain props vs state', checked: false },
        { id: 'rc4', item: 'Understand component composition patterns', checked: false },
        { id: 'rc5', item: 'Know common mistakes and how to avoid them', checked: false },
        { id: 'rc6', item: 'Can implement a reusable component from scratch', checked: false }
      ],
      memoryReinforcement: 'Remember: Components are like LEGO bricks - small, reusable, and composable. Master this pattern and you master React.',
      examTips: [
        'Be ready to explain the difference between smart and dumb components',
        'Practice writing a component that accepts props and renders UI',
        'Understand when to use state vs props',
        'Know the component lifecycle and when re-renders occur'
      ]
    },
    laymanExplanation: {
      simpleOverview: {
        badge: 'Beginner Friendly',
        headline: 'Component Architecture - Explained Simply',
        simpleDefinition: 'Component architecture is like building with LEGO bricks. Instead of creating one giant piece, you build small, reusable parts that snap together to make something amazing.',
        subExplanation: 'Think of it as organizing your code into small boxes. Each box does one job really well, and you can use the same box in different places.',
        importanceBlock: 'This approach makes your code easier to understand, fix, and reuse - just like how LEGO bricks can be used to build anything from a car to a castle!',
        progressIndicator: 'Beginner Level - No coding experience needed'
      },
      everydayAnalogy: {
        title: 'The LEGO Brick Story',
        storyAnalogy: 'Imagine you want to build a LEGO castle. You don\'t create one massive block - you use small bricks. A red brick for the walls, a blue brick for the roof, and a yellow brick for the door. Each brick is independent, but together they create something beautiful.',
        comparisonPanel: {
          realWorld: 'LEGO bricks that snap together to build anything',
          technical: 'React components that combine to build user interfaces'
        },
        visualMetaphor: 'Just like you can use the same LEGO brick in multiple places, you can use the same component (like a Button) on different pages of your website.',
        keyTakeaway: 'Components are reusable building blocks - build once, use everywhere!',
        image: '/lego_component_architecture.png'
      },
      whyItExists: {
        sectionTitle: 'Why Do We Need Component Architecture?',
        benefitCards: [
          {
            id: 'b1',
            title: 'Save Time',
            description: 'Build a button once, use it 100 times. No need to write the same code again and again.',
            icon: 'Clock',
            type: 'practical'
          },
          {
            id: 'b2',
            title: 'Easy to Fix',
            description: 'If something breaks, you only fix one component instead of searching through thousands of lines of code.',
            icon: 'Wrench',
            type: 'practical'
          },
          {
            id: 'b3',
            title: 'Team Collaboration',
            description: 'Different team members can work on different components at the same time without conflicts.',
            icon: 'Users',
            type: 'career'
          },
          {
            id: 'b4',
            title: 'Career Growth',
            description: 'Companies like Facebook, Netflix, and Airbnb use this pattern. Learning it opens doors to top tech jobs.',
            icon: 'TrendingUp',
            type: 'career'
          },
          {
            id: 'b5',
            title: 'Scalable Apps',
            description: 'Start small and grow big. Components make it easy to add new features without breaking existing ones.',
            icon: 'Rocket',
            type: 'future'
          },
          {
            id: 'b6',
            title: 'Clean Code',
            description: 'Your code stays organized and readable, making it easier for you and others to understand.',
            icon: 'Sparkles',
            type: 'future'
          }
        ]
      },
      simpleUseCases: {
        gridTitle: 'Where Do You See Components in Real Life?',
        useCaseCards: [
          {
            id: 'uc1',
            title: 'Social Media Feed',
            description: 'Each post is a component. Same design, different content.',
            category: 'everyday',
            icon: 'MessageSquare'
          },
          {
            id: 'uc2',
            title: 'Shopping Cart',
            description: 'Product cards that show image, price, and "Add to Cart" button.',
            category: 'everyday',
            icon: 'ShoppingCart'
          },
          {
            id: 'uc3',
            title: 'Navigation Menu',
            description: 'The same menu appears on every page of a website.',
            category: 'everyday',
            icon: 'Menu'
          },
          {
            id: 'uc4',
            title: 'Login Form',
            description: 'Username, password, and submit button - reused across apps.',
            category: 'everyday',
            icon: 'LogIn'
          },
          {
            id: 'uc5',
            title: 'Dashboard Widgets',
            description: 'Charts, stats, and cards that display different data.',
            category: 'career',
            icon: 'LayoutDashboard'
          },
          {
            id: 'uc6',
            title: 'Notification Alerts',
            description: 'Success, error, or warning messages with consistent styling.',
            category: 'career',
            icon: 'Bell'
          },
          {
            id: 'uc7',
            title: 'Video Player',
            description: 'Play, pause, volume controls - same component, different videos.',
            category: 'everyday',
            icon: 'Play'
          },
          {
            id: 'uc8',
            title: 'Comment Section',
            description: 'User avatar, name, timestamp, and comment text repeated for each comment.',
            category: 'career',
            icon: 'MessageCircle'
          }
        ]
      },
      beginnerBreakdown: {
        title: 'Breaking It Down Step-by-Step',
        steps: [
          {
            id: 'step1',
            stepTitle: 'Step 1: Identify Repeating Parts',
            stepExplanation: 'Look at your design and find parts that appear multiple times. For example, buttons, cards, or forms.',
            microLearningChunk: 'If you see the same design pattern twice, it\'s a candidate for a component!'
          },
          {
            id: 'step2',
            stepTitle: 'Step 2: Create a Component',
            stepExplanation: 'Build that repeating part as a separate, independent piece of code. Give it a clear name like "Button" or "ProductCard".',
            microLearningChunk: 'Think of it as creating a template that you can fill with different content later.'
          },
          {
            id: 'step3',
            stepTitle: 'Step 3: Make It Flexible',
            stepExplanation: 'Use "props" (properties) to customize the component. Like changing the button text or card image.',
            microLearningChunk: 'Props are like function parameters - they let you pass different data to the same component.'
          },
          {
            id: 'step4',
            stepTitle: 'Step 4: Reuse Everywhere',
            stepExplanation: 'Now use your component anywhere you need it. Change the props to show different content.',
            microLearningChunk: 'One component, infinite possibilities! Just like one LEGO brick can be used in many builds.'
          },
          {
            id: 'step5',
            stepTitle: 'Step 5: Update Once, Change Everywhere',
            stepExplanation: 'If you need to change the design, update the component once and it updates everywhere it\'s used.',
            microLearningChunk: 'This is the superpower of components - centralized updates!'
          }
        ]
      },
      mentalModel: {
        title: 'How to Think About Components',
        conceptMap: {
          nodes: [
            { id: 'app', label: 'Your App', description: 'The complete application' },
            { id: 'page', label: 'Page', description: 'A single screen or route' },
            { id: 'section', label: 'Section', description: 'Major parts like Header, Content, Footer' },
            { id: 'component', label: 'Component', description: 'Reusable UI pieces like Button, Card' },
            { id: 'element', label: 'HTML Element', description: 'Basic building blocks like div, button, input' }
          ],
          connections: [
            { from: 'app', to: 'page', label: 'contains' },
            { from: 'page', to: 'section', label: 'divided into' },
            { from: 'section', to: 'component', label: 'built with' },
            { from: 'component', to: 'element', label: 'made of' }
          ]
        },
        visualLabels: [
          'Top Level: Your entire application',
          'Middle Level: Pages and sections',
          'Bottom Level: Small reusable components',
          'Foundation: Basic HTML elements'
        ]
      },
      commonConfusions: {
        title: 'Common Beginner Confusions',
        confusionItems: [
          {
            id: 'conf1',
            confusion: 'Do I need to make EVERYTHING a component?',
            clarification: 'No! Only make components for things you\'ll reuse or things that are complex. A simple heading doesn\'t need to be a component.'
          },
          {
            id: 'conf2',
            confusion: 'How small should a component be?',
            clarification: 'If a component does ONE thing well, it\'s the right size. A button component just handles button behavior. A form component handles the entire form.'
          },
          {
            id: 'conf3',
            confusion: 'Can components talk to each other?',
            clarification: 'Yes! Parent components can pass data to child components using props. Child components can send data back using callback functions.'
          }
        ],
        faqItems: [
          {
            id: 'faq1',
            question: 'What\'s the difference between a component and a function?',
            answer: 'A component is a special function that returns UI (what you see on screen). Regular functions return data or perform actions.'
          },
          {
            id: 'faq2',
            question: 'Do I need to know advanced JavaScript to use components?',
            answer: 'No! You just need to understand basic functions and how to pass parameters. Components are actually a great way to learn JavaScript!'
          },
          {
            id: 'faq3',
            question: 'Can I use components from other developers?',
            answer: 'Absolutely! There are thousands of pre-built component libraries like Material-UI, Ant Design, and Chakra UI that you can use for free.'
          }
        ],
        misconceptionAlerts: [
          'Components are NOT just for big projects - even small apps benefit from good structure',
          'You DON\'T need to be an expert to start using components - beginners can learn this!',
          'Components are NOT slower than regular code - they actually help optimize performance'
        ]
      },
      simpleRecap: {
        summaryTitle: 'Let\'s Recap What You Learned',
        keyTakeaways: [
          'Components are like LEGO bricks - small, reusable building blocks',
          'Build once, use everywhere - saves time and reduces errors',
          'Each component does one job really well',
          'Props let you customize components with different data',
          'Update one component, and it changes everywhere it\'s used',
          'Used by top companies like Facebook, Netflix, and Airbnb'
        ],
        simpleRecapPoints: [
          'You now understand what components are and why they exist',
          'You can identify where components are used in real apps',
          'You know the basic steps to create and reuse components',
          'You understand how components fit into the bigger picture'
        ],
        confidenceBoost: '🎉 Congratulations! You\'ve just learned a concept that professional developers use every single day. You\'re on your way to building amazing things!',
        memoryReinforcement: 'Remember: Components = LEGO bricks. Small pieces that snap together to build anything you can imagine!'
      }
    },
    realLifeExamples: {
      // 1. Concept to Real World Mapping
      conceptMapping: {
        badge: 'Real World Connection',
        headline: 'Component Architecture in Everyday Life',
        conceptDefinition: 'Component Architecture is a design pattern where you break down complex systems into smaller, reusable, independent pieces that work together to create the whole.',
        realWorldTranslation: 'Think of LEGO bricks. Each brick is a component - small, reusable, and can be combined with other bricks to build anything from a house to a spaceship. You don\'t reinvent the brick each time; you reuse the same bricks in different combinations.',
        importanceBlock: 'This concept isn\'t just for coding - it\'s how modern cars, smartphones, and even buildings are designed. Breaking things into components makes them easier to build, fix, and improve.',
        careerRelevance: 'Used by 95% of modern web applications including Facebook, Netflix, and Airbnb'
      },
      // 2. Industry Use Case
      industryUseCase: {
        title: 'Industry Example: E-Commerce Platform',
        industryName: 'E-Commerce',
        scenarioDescription: 'Amazon needs to display product cards on search results, recommendations, wish lists, and cart pages. Each card shows product image, title, price, and rating.',
        businessContext: 'Without components, developers would copy-paste the same HTML/CSS code hundreds of times. When design changes (like adding a "Prime" badge), they\'d need to update thousands of files manually.',
        implementation: 'Amazon creates ONE ProductCard component with props for image, title, price, and rating. This single component is reused across the entire platform.',
        impact: 'When they need to add a "Prime" badge, they update ONE component file, and it automatically appears on all 50+ pages that use ProductCard. This saves weeks of development time.',
        keyTakeaway: 'Components turn "update 1000 files" into "update 1 file" - that\'s the power of reusability in enterprise applications.'
      },
      // 3. Daily Life Example
      dailyLifeExample: {
        title: 'Daily Life Story',
        storyTitle: 'The Coffee Machine Analogy',
        storyNarrative: 'Imagine you run a coffee shop. Instead of training each barista to make every drink from scratch, you install a coffee machine with preset buttons: Espresso, Latte, Cappuccino. Each button is like a component - it knows exactly what to do when pressed.',
        everydayConnection: 'The machine (your app) has buttons (components) that anyone can use. You don\'t need to know how the machine grinds beans or heats water - you just press "Latte" and get a latte.',
        technicalMapping: 'In code, a Button component knows how to look and behave. You don\'t rewrite button logic every time - you just use <Button label="Submit" /> and it works.',
        relatableInsight: 'Just like coffee machine buttons make baristas\' lives easier, components make developers\' lives easier by handling complexity behind a simple interface.'
      },
      // 4. Career Relevance
      careerRelevance: {
        title: 'Career Opportunities with Component Architecture',
        careerPaths: [
          {
            id: 'career1',
            role: 'Frontend Developer',
            description: 'Build user interfaces using component-based frameworks like React, Vue, or Angular.',
            skillLevel: 'entry',
            salaryRange: '$60K-$90K',
            icon: 'Code2'
          },
          {
            id: 'career2',
            role: 'UI/UX Engineer',
            description: 'Design and implement reusable component libraries for design systems.',
            skillLevel: 'mid',
            salaryRange: '$90K-$130K',
            icon: 'Palette'
          },
          {
            id: 'career3',
            role: 'Full Stack Developer',
            description: 'Build both frontend components and backend APIs that power them.',
            skillLevel: 'mid',
            salaryRange: '$100K-$150K',
            icon: 'Layers'
          },
          {
            id: 'career4',
            role: 'Solutions Architect',
            description: 'Design large-scale component architectures for enterprise applications.',
            skillLevel: 'senior',
            salaryRange: '$150K-$200K+',
            icon: 'Building2'
          }
        ],
        industryDemand: 'Component-based development is the industry standard. 9 out of 10 job postings for frontend roles require React, Vue, or Angular - all component-based frameworks.',
        futureGrowth: 'The demand for component architecture skills is growing 25% year-over-year as more companies modernize their applications. This skill is future-proof and transferable across industries.'
      },
      // 5. Problem Solution Context
      problemSolutionContext: {
        title: 'Real-World Problem Solving',
        problemStatement: 'A startup is building a social media app. They need to show user profiles in 15 different places: feed, comments, search results, followers list, etc. Each profile shows avatar, name, and bio.',
        context: 'The team has 3 developers and a tight deadline. Copying code 15 times means 15 places to update when design changes. They\'re already struggling with inconsistent styling across pages.',
        solution: 'Create a single UserProfile component that accepts userId as a prop. This component handles fetching user data, displaying avatar, name, and bio with consistent styling.',
        implementation: 'Developers build UserProfile once, then reuse it everywhere: <UserProfile userId="123" />. When design changes, they update one file instead of 15.',
        outcome: 'Development time reduced by 60%. Bug fixes now take minutes instead of hours. The app has consistent design across all pages. The team can focus on new features instead of maintenance.',
        lessonsLearned: 'Components aren\'t just about code reuse - they\'re about maintainability, consistency, and team productivity. One well-designed component can save hundreds of hours.'
      },
      // 6. Business Application
      businessApplication: {
        title: 'Business Case: Enterprise Dashboard',
        companyType: 'SaaS Company',
        businessChallenge: 'A SaaS company provides analytics dashboards to 500+ clients. Each client wants custom branding (colors, logos) but the same functionality (charts, tables, filters).',
        technicalApplication: 'Build components with theming support: <Chart data={salesData} theme={clientTheme} />. The Chart component adapts its colors and styling based on the theme prop.',
        businessProcess: 'Sales team can onboard new clients in hours instead of weeks. Developers build features once, and they work for all clients automatically. Clients get white-labeled dashboards without custom development.',
        roi: 'Reduced client onboarding time from 2 weeks to 2 hours. Saved $500K annually in custom development costs. Increased client satisfaction scores by 40%.',
        scalability: 'The component architecture scales from 500 to 5000 clients without additional development effort. New features automatically roll out to all clients.',
        keyInsight: 'Components enable mass customization - giving each client a unique experience while maintaining a single codebase. This is the secret behind successful SaaS platforms.'
      },
      // 7. Domain Specific Scenarios
      domainScenarios: {
        title: 'Component Architecture Across Industries',
        scenarios: [
          {
            id: 'scenario1',
            domain: 'E-Commerce',
            title: 'Product Cards',
            description: 'Reusable product display components used across search, recommendations, and cart pages.',
            application: 'Amazon, eBay, Shopify stores',
            icon: 'ShoppingCart'
          },
          {
            id: 'scenario2',
            domain: 'Healthcare',
            title: 'Patient Records',
            description: 'Standardized components for displaying medical history, prescriptions, and test results.',
            application: 'Hospital management systems, telemedicine apps',
            icon: 'Heart'
          },
          {
            id: 'scenario3',
            domain: 'Finance',
            title: 'Transaction Cards',
            description: 'Consistent transaction display components across banking apps and statements.',
            application: 'Banking apps, payment gateways, fintech platforms',
            icon: 'DollarSign'
          },
          {
            id: 'scenario4',
            domain: 'Education',
            title: 'Course Modules',
            description: 'Reusable lesson, quiz, and assignment components for learning platforms.',
            application: 'Coursera, Udemy, Khan Academy',
            icon: 'GraduationCap'
          },
          {
            id: 'scenario5',
            domain: 'Entertainment',
            title: 'Video Players',
            description: 'Standardized video player components with play, pause, and progress controls.',
            application: 'Netflix, YouTube, streaming platforms',
            icon: 'Play'
          },
          {
            id: 'scenario6',
            domain: 'Social Media',
            title: 'Post Cards',
            description: 'Reusable post components showing author, content, likes, and comments.',
            application: 'Facebook, Twitter, Instagram, LinkedIn',
            icon: 'MessageSquare'
          }
        ]
      },
      // 8. Practical Recap
      practicalRecap: {
        summaryTitle: 'Real-World Applications Summary',
        keyApplications: [
          'Build reusable UI components that work across your entire application',
          'Create design systems that ensure brand consistency',
          'Reduce development time by 50-70% through component reuse',
          'Enable team collaboration with clear component boundaries',
          'Scale applications from MVP to enterprise without rewriting code',
          'Implement white-labeling and multi-tenant architectures'
        ],
        industryRelevance: [
          'E-Commerce Platforms',
          'SaaS Applications',
          'Social Media Networks',
          'Banking & Finance',
          'Healthcare Systems',
          'Education Platforms',
          'Entertainment Streaming',
          'Enterprise Dashboards'
        ],
        careerImpact: 'Mastering component architecture opens doors to frontend, full-stack, and solutions architect roles. It\'s a foundational skill that applies to React, Vue, Angular, and even mobile development with React Native. Companies actively seek developers who can build scalable, maintainable component-based applications.',
        nextSteps: [
          'Practice building small components like buttons, cards, and forms',
          'Study popular component libraries like Material-UI and Ant Design',
          'Build a personal project using component-based architecture',
          'Learn about design systems and component documentation',
          'Contribute to open-source component libraries on GitHub'
        ],
        practicalAdvice: 'Start small. Don\'t try to componentize everything at once. Begin with the most repeated UI elements in your project - buttons, cards, inputs. As you get comfortable, you\'ll naturally see more opportunities to create reusable components. Remember: good components solve real problems, not imaginary ones.'
      }
    },
    technicalDeepDive: {
      title: 'Technical Deep Dive',
      badge: 'In-Depth',
      intro: "Let's understand the internal workings of Component Architecture in React.",
      sections: [
        {
          id: 'td1',
          title: '1. Component Anatomy',
          content: 'At its core, a React component is a JavaScript function or class that accepts props and returns a React element. Internally, React maintains a complex structure to track its lifecycle and state.',
          diagram: {
            type: 'anatomy',
            data: {
              slots: [
                { label: '[[Props]]', desc: 'Read-only external data', color: 'blue' },
                { label: '[[State]]', desc: 'Internal mutable data', color: 'emerald' },
                { label: '[[Hooks]]', desc: 'State & Lifecycle effects', color: 'purple' },
                { label: '[[VirtualDOM]]', desc: 'UI representation', color: 'rose' }
              ]
            }
          },
          keyPoints: [
            'Components are conceptually pure functions.',
            'Props must be treated as immutable.',
            'State changes trigger a re-render cycle.',
            'React handles the DOM updates via diffing.'
          ]
        },
        {
          id: 'td2',
          title: '2. Reconciliation & Queues',
          content: 'React uses a "Virtual DOM" to optimize updates. When state changes, React generates a new Virtual DOM tree and compares it with the previous one (Diffing).',
          diagram: {
            type: 'flow',
            data: ['Render Phase', 'Diffing', 'Commit Phase', 'DOM Update']
          },
          code: {
            language: 'javascript',
            code: 'const [count, setCount] = useState(0);\n\n// 1. User clicks -> setCount(1)\n// 2. React triggers Render Phase\n// 3. New Virtual DOM generated\n// 4. Diffing: count changed 0 -> 1\n// 5. Commit Phase: Update only the text node',
            output: '// Output: 1, 4, 3, 2'
          }
        },
        {
          id: 'td3',
          title: '3. Component Resolution',
          content: 'Component resolution procedure:',
          steps: [
            { id: 's1', text: 'If a component receives new props -> it becomes dirty.' },
            { id: 's2', text: 'If state updates -> it schedules a re-render.' },
            { id: 's3', text: 'If parent re-renders -> children are re-evaluated.' }
          ],
          code: {
            language: 'javascript',
            code: 'const Parent = () => {\n  const [val, setVal] = useState(0);\n  return <Child value={val} />;\n};\n\n// 1. setVal(1)\n// 2. Parent re-renders\n// 3. Child receives new props\n// 4. Child re-renders',
            output: '// Result: Full subtree updated'
          }
        },
        {
          id: 'td4',
          title: '4. Chaining Mechanics',
          content: 'Each render returns a new Virtual DOM node.',
          diagram: {
            type: 'chain',
            data: ['Component', 'Element', 'Instance', 'DOM Node']
          },
          highlight: 'This allows for maximum reusability and a predictable data flow.'
        }
      ]
    },
    codeExample: {
      title: 'Code Example',
      description: 'See how Component Architecture works in real code. Try it, run it, and observe the output.',
      examples: [
        { title: 'Example 1: Basic Component', file: 'user-profile.tsx' },
        { title: 'Example 2: State & Lifecycle', file: 'counter.tsx' },
        { title: 'Example 3: Composition', file: 'app-layout.tsx' }
      ],
      code: `// 1. Defining a Functional Component
const UserProfile = ({ name, role }) => {
  return (
    <div className="profile-card">
      <h2>{name}</h2>
      <p>{role}</p>
    </div>
  );
};

// 2. Using the Component with Props
const App = () => {
  return (
    <div className="container">
      <h1>Team Members</h1>
      <UserProfile 
        name="React Developer" 
        role="Senior Developer" 
      />
    </div>
  );
};

console.log("Component rendered successfully.");`,
      output: 'Component rendered successfully.',
      tip: 'Change name = "Your Name" on line 16 to see the component update in real-time.'
    },
    assignment: {
      title: 'Assignment',
      description: 'Apply Component Architecture to a real-world task.',
      xp: 150,
      duration: '20 Mins',
      task: {
        title: 'Profile Dashboard Composition',
        description: 'Your task is to refactor a monolithic dashboard into three clean, reusable components. The final result should:',
        requirements: [
          'Contain a separate <Navbar /> component for branding.',
          'Contain a <Sidebar /> component for navigation links.',
          'Contain a <ProfileCard /> component to display user details.',
          'Compose all three into a single cohesive layout.'
        ]
      },
      objectives: [
        'Use Functional Components for all parts.',
        'Props must be used to pass data to the ProfileCard.',
        'Each component must be self-contained.',
        'Maintain a clear parent-child relationship.',
        'Code must be clean and well-commented.'
      ],
      starterCode: `// 1. Define your components
function Navbar() { return <div>Navbar</div>; }
function Sidebar() { return <div>Sidebar</div>; }
function ProfileCard({ user }) { 
  return <div>{user.name}</div>; 
}

// 2. Compose them
function App() {
  const user = { name: "John Doe" };
  return (
    <div>
      <Navbar />
      <Sidebar />
      <ProfileCard user={user} />
    </div>
  );
}

render(<App />);`,
      submissionGuidelines: [
        'Submit only the component architecture code.',
        'Do not modify the render call at the bottom.',
        'Test your code structure before submitting.'
      ]
    },
    project: {
      title: 'Capstone Project',
      description: 'Master Component Architecture through this hands-on project.',
      xp: 500,
      deadline: '2 Days Left',
      hero: {
        badge: 'intermediate project',
        title: 'User Management System Dashboard',
        description: 'Build a professional User Management Dashboard where every part of the interface is a modular, reusable component. This project will test your ability to compose complex layouts from simple building blocks.',
        image: '/project_mockup.svg'
      },
      realWorldUse: 'Admin dashboards, CRM systems, user panels',
      skills: ['React', 'Components', 'Props', 'State', 'Composition', 'Hooks'],
      buildItems: [
        'Create a Component for the User Table Header.',
        'Build a row component that handles individual user data.',
        'Implement a Modal component for adding new users.',
        'Use composition to build the full Dashboard page.'
      ],
      deliverables: [
        'Fully functional React dashboard.',
        'Source code on GitHub repository.',
        'A short video demo of the UI interactions.',
        'Project documentation and README.'
      ]
    },
    quiz: {
      title: 'Interactive Quiz',
      description: 'Test your mastery of Component Architecture.',
      totalQuestions: 10,
      duration: '15 min',
      xp: 100,
      questions: [
        {
          id: 'q1',
          questionNumber: 1,
          type: 'Single Choice',
          points: 2,
          question: 'What is the main benefit of component architecture?',
          options: [
            { id: 'A', text: 'Faster rendering' },
            { id: 'B', text: 'Reusability and maintainability' },
            { id: 'C', text: 'Smaller file sizes' },
            { id: 'D', text: 'Better SEO' }
          ],
          correctAnswer: 'B',
          explanation: 'Component architecture promotes reusability and maintainability by breaking down UI into self-contained, modular pieces.'
        },
        {
          id: 'q2',
          questionNumber: 2,
          type: 'Single Choice',
          points: 2,
          question: 'Which pattern separates logic from presentation?',
          options: [
            { id: 'A', text: 'Container/Presentational pattern' },
            { id: 'B', text: 'Singleton pattern' },
            { id: 'C', text: 'Factory pattern' },
            { id: 'D', text: 'Observer pattern' }
          ],
          correctAnswer: 'A',
          explanation: 'The Container/Presentational pattern separates components that handle logic (containers) from those that handle UI (presentational).'
        },
        {
          id: 'q3',
          questionNumber: 3,
          type: 'Single Choice',
          points: 2,
          question: 'What are props in React components?',
          options: [
            { id: 'A', text: 'Internal state variables' },
            { id: 'B', text: 'Read-only data passed from parent' },
            { id: 'C', text: 'Mutable configuration objects' },
            { id: 'D', text: 'CSS properties' }
          ],
          correctAnswer: 'B',
          explanation: 'Props are read-only data passed from parent components to child components, enabling data flow down the component tree.'
        },
        {
          id: 'q4',
          questionNumber: 4,
          type: 'Single Choice',
          points: 2,
          question: 'What will be the output of the following code?',
          code: `const Button = ({ label }) => <button>{label}</button>;
const App = () => <Button label="Click Me" />;`,
          options: [
            { id: 'A', text: 'A button with text "Click Me"' },
            { id: 'B', text: 'An error' },
            { id: 'C', text: 'An empty button' },
            { id: 'D', text: 'Undefined' }
          ],
          correctAnswer: 'A',
          explanation: 'The Button component receives the label prop and renders it inside a button element, displaying "Click Me".'
        }
      ]
    },
    progress: {
      title: 'Your Progress',
      description: 'Track your learning journey and achievements.',
      stats: {
        completionPercentage: 65,
        xpEarned: 450,
        totalXp: 1000,
        streak: 7,
        timeSpent: '3h 45m'
      },
      milestones: [
        { id: 'm1', title: 'Completed Overview', status: 'completed', xp: 50 },
        { id: 'm2', title: 'Finished Notes', status: 'completed', xp: 100 },
        { id: 'm3', title: 'Understood Layman Explanation', status: 'completed', xp: 75 },
        { id: 'm4', title: 'Explored Real-Life Examples', status: 'completed', xp: 75 },
        { id: 'm5', title: 'Studied Technical Deep Dive', status: 'current', xp: 150 },
        { id: 'm6', title: 'Completed Code Example', status: 'locked', xp: 100 },
        { id: 'm7', title: 'Submitted Assignment', status: 'locked', xp: 150 },
        { id: 'm8', title: 'Finished Project', status: 'locked', xp: 500 },
        { id: 'm9', title: 'Passed Quiz', status: 'locked', xp: 100 }
      ]
    }
  },

  // Other subtopics will be added here following the same universal pattern
  // Each subtopic must have: simpleWords, sections, laymanExplanation, realLifeExamples, technicalDeepDive
  // TODO: Add javascript-promises and other subtopics following component-architecture pattern
};

/**
 * Get content for a subtopic
 * Returns undefined if subtopic not found - no fallback
 */
export function getSubtopicContent(subtopicId: string): SubtopicContentPattern | undefined {
  return subtopicContentRegistry[subtopicId];
}
