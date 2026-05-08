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
  // Layman Explanation Section Templates (8 templates from JSON spec) - OPTIONAL for phase-by-phase addition
  laymanExplanation?: {
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
  realLifeExamples?: {
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
  technicalDeepDive?: {
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
  codeExample?: {
    problemContext: {
      title: string;
      scenario: string;
      requirements: string[];
      constraints: string;
    };
    basicCodeExample: {
      title: string;
      description: string;
      code: string;
      language: string;
      explanation: string;
    };
    lineByLineExplanation: {
      title: string;
      lines: Array<{
        id: string;
        lineNumber: number;
        code: string;
        explanation: string;
      }>;
    };
    outputDemonstration: {
      title: string;
      input: string;
      output: string;
      explanation: string;
      visualRepresentation: string;
    };
    bestPracticeVersion: {
      title: string;
      improvements: string[];
      code: string;
      explanation: string;
      benefits: string[];
    };
    commonMistakes: {
      title: string;
      mistakes: Array<{
        id: string;
        mistake: string;
        badCode: string;
        why: string;
        goodCode: string;
        lesson: string;
      }>;
    };
    realWorldImplementation: {
      title: string;
      scenario: string;
      code: string;
      features: string[];
      explanation: string;
      scalability: string;
    };
    codeSummary: {
      title: string;
      keyTakeaways: string[];
      practiceExercise: string;
      nextSteps: string[];
    };
  };
  assignment?: {
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
  project?: {
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
  quiz?: {
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
  visualExplanation?: {
    conceptVisualIntro?: {
      badge: string;
      headline: string;
      visualDefinition: string;
      heroDiagramPreview?: string;
      importanceBlock: string;
      progressIndicator?: string;
    };
    diagrammaticBreakdown?: {
      title: string;
      diagramTitle: string;
      componentLabels: Array<{
        id: string;
        label: string;
        description: string;
      }>;
      stepMarkers: string[];
      technicalTooltips: Array<{
        id: string;
        term: string;
        explanation: string;
      }>;
    };
    stepByStepVisualFlow?: {
      title: string;
      sequenceTitle: string;
      steps: Array<{
        id: string;
        stepNumber: number;
        title: string;
        description: string;
        visualCue: string;
      }>;
      phaseExplanations: string[];
    };
    comparativeVisualization?: {
      title: string;
      comparisonTitle: string;
      sideBySideVisuals: {
        option1: {
          title: string;
          description: string;
          pros: string[];
          cons: string[];
        };
        option2: {
          title: string;
          description: string;
          pros: string[];
          cons: string[];
        };
      };
      differenceHighlights: string[];
    };
    mentalModelVisualization?: {
      title: string;
      frameworkMap: {
        nodes: Array<{
          id: string;
          label: string;
          description: string;
          type: 'core' | 'supporting' | 'related';
        }>;
        connections: Array<{
          from: string;
          to: string;
          label: string;
          type: 'primary' | 'secondary';
        }>;
      };
      memoryLabels: string[];
    };
    realWorldVisualMapping?: {
      title: string;
      practicalScenarios: Array<{
        id: string;
        title: string;
        description: string;
        industryContext: string;
        visualRepresentation: string;
        icon: string;
      }>;
      careerRelevance: string;
    };
    commonConfusionVisualization?: {
      title: string;
      confusionItems: Array<{
        id: string;
        confusion: string;
        visualClarification: string;
        correctVisualization: string;
      }>;
      faqItems: Array<{
        id: string;
        question: string;
        answer: string;
      }>;
      misconceptionDiagrams: string[];
    };
    visualSummary?: {
      summaryTitle: string;
      keyVisualTakeaways: string[];
      revisionInfographic: string;
      memoryReinforcement: string;
      examVisualChecklist: string[];
    };
  };
  practiceTest?: {
    assessmentIntro?: {
      badge: string;
      headline: string;
      testDescription: string;
      difficultyOverview: string;
      learningGoals: string[];
      readinessIndicator: string;
    };
    conceptRecallQuestions?: {
      title: string;
      questions: Array<{
        id: string;
        questionNumber: number;
        type: 'single-choice' | 'multiple-choice';
        points: number;
        question: string;
        code?: string;
        options: Array<{
          id: string;
          text: string;
        }>;
        correctAnswer: string | string[];
        explanation: string;
        difficulty: 'easy' | 'medium' | 'hard';
      }>;
    };
    scenarioBasedQuestions?: {
      title: string;
      scenarios: Array<{
        id: string;
        scenarioTitle: string;
        realWorldProblem: string;
        businessContext: string;
        decisionQuestion: string;
        options: Array<{
          id: string;
          text: string;
        }>;
        correctAnswer: string;
        explanation: string;
        difficulty: 'medium' | 'hard';
      }>;
    };
    difficultyProgression?: {
      title: string;
      levels: Array<{
        id: string;
        level: 'beginner' | 'intermediate' | 'advanced';
        description: string;
        questionCount: number;
        passingScore: number;
      }>;
      adaptiveLogic: boolean;
    };
    instantFeedback?: {
      enabled: boolean;
      feedbackType: 'immediate' | 'end-of-test';
    };
    commonMistakeDetection?: {
      title: string;
      mistakeCategories: Array<{
        id: string;
        category: string;
        description: string;
        frequency: number;
      }>;
      weaknessHeatmap: {
        topics: Array<{
          id: string;
          topic: string;
          score: number;
          status: 'strong' | 'moderate' | 'weak';
        }>;
      };
    };
    performanceAnalytics?: {
      title: string;
      scoreDisplay: {
        currentScore: number;
        maxScore: number;
        percentage: number;
      };
      performanceGraphs: {
        accuracyTrend: number[];
        speedTrend: number[];
      };
      benchmarkComparison: {
        userScore: number;
        averageScore: number;
        topScore: number;
      };
      masteryPercentage: number;
      examReadinessScore: number;
    };
    revisionRecommendations?: {
      title: string;
      personalizedLearningPath: Array<{
        id: string;
        topic: string;
        priority: 'high' | 'medium' | 'low';
        estimatedTime: string;
        resources: string[];
      }>;
      weaknessRecoverySteps: string[];
      recommendedResources: Array<{
        id: string;
        title: string;
        type: 'video' | 'article' | 'practice';
        link: string;
      }>;
      futureGoals: string[];
    };
  };
  progress?: {
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
    },
    visualExplanation: {
      conceptVisualIntro: {
        badge: 'Visual Learning',
        headline: 'Component Architecture Visualized',
        visualDefinition: 'Component architecture is the systematic organization of UI elements into reusable, self-contained building blocks. Think of it as creating a library of LEGO pieces that can be combined in different ways to build complex interfaces.',
        heroDiagramPreview: '🏗️ Imagine a pyramid: At the base are Atoms (buttons, inputs), in the middle are Molecules (search bars), and at the top are Organisms (navigation bars). Each level builds upon the previous one.',
        importanceBlock: 'Visual understanding of component architecture helps you see the relationships between components, understand data flow, and design scalable systems that are easy to maintain and extend.',
        progressIndicator: 'This visual guide will help you master component architecture through diagrams, flowcharts, and visual metaphors.'
      },
      diagrammaticBreakdown: {
        title: 'Component Hierarchy Breakdown',
        diagramTitle: 'Atomic Design System Structure',
        componentLabels: [
          {
            id: '1',
            label: 'Atoms',
            description: 'The smallest building blocks: buttons, inputs, labels, icons. These cannot be broken down further without losing their meaning.'
          },
          {
            id: '2',
            label: 'Molecules',
            description: 'Simple groups of atoms working together: a search bar (input + button), a form field (label + input + error message).'
          },
          {
            id: '3',
            label: 'Organisms',
            description: 'Complex UI components made of molecules and atoms: navigation bar, product card grid, user profile section.'
          },
          {
            id: '4',
            label: 'Templates',
            description: 'Page-level layouts that arrange organisms into a structure, showing content placement without real data.'
          },
          {
            id: '5',
            label: 'Pages',
            description: 'Specific instances of templates filled with real content and data, representing actual user-facing screens.'
          }
        ],
        stepMarkers: [
          'Start with atoms: Create basic UI elements',
          'Combine into molecules: Group related atoms',
          'Build organisms: Assemble complex sections',
          'Design templates: Define page layouts',
          'Populate pages: Add real content'
        ],
        technicalTooltips: [
          {
            id: 'tt1',
            term: 'Composition',
            explanation: 'The process of combining smaller components to create larger, more complex components.'
          },
          {
            id: 'tt2',
            term: 'Props',
            explanation: 'Data passed from parent to child components to customize behavior and appearance.'
          },
          {
            id: 'tt3',
            term: 'Reusability',
            explanation: 'The ability to use the same component in multiple places with different data or configurations.'
          },
          {
            id: 'tt4',
            term: 'Encapsulation',
            explanation: 'Keeping component logic and styling self-contained to prevent conflicts with other components.'
          }
        ]
      },
      stepByStepVisualFlow: {
        title: 'Building a Component Step-by-Step',
        sequenceTitle: 'From Concept to Implementation',
        steps: [
          {
            id: 'step1',
            stepNumber: 1,
            title: 'Identify the Component',
            description: 'Look at your design and identify repeating UI patterns. These are candidates for components.',
            visualCue: '🔍 Circle all similar elements in your mockup - these should become components.'
          },
          {
            id: 'step2',
            stepNumber: 2,
            title: 'Define Props Interface',
            description: 'Determine what data the component needs from its parent. This becomes your props interface.',
            visualCue: '📝 List all variable parts: text, colors, sizes, callbacks, etc.'
          },
          {
            id: 'step3',
            stepNumber: 3,
            title: 'Build the Component',
            description: 'Create the component structure using JSX, applying props to make it flexible and reusable.',
            visualCue: '🔨 Write the JSX markup with props placeholders instead of hardcoded values.'
          },
          {
            id: 'step4',
            stepNumber: 4,
            title: 'Add Styling',
            description: 'Apply CSS or styled-components to make the component visually match your design.',
            visualCue: '🎨 Style the component to match the design system colors, spacing, and typography.'
          },
          {
            id: 'step5',
            stepNumber: 5,
            title: 'Test & Refine',
            description: 'Use the component in different contexts to ensure it works correctly with various props.',
            visualCue: '✅ Try different prop combinations to verify flexibility and edge cases.'
          }
        ],
        phaseExplanations: [
          'Phase 1 (Steps 1-2): Planning - Understanding what you need before coding',
          'Phase 2 (Steps 3-4): Implementation - Building the actual component',
          'Phase 3 (Step 5): Validation - Ensuring quality and reusability'
        ]
      },
      comparativeVisualization: {
        title: 'Component Architecture Approaches',
        comparisonTitle: 'Monolithic vs Component-Based Architecture',
        sideBySideVisuals: {
          option1: {
            title: 'Monolithic Approach',
            description: 'All UI code in one large file or component. Everything is tightly coupled and interdependent.',
            pros: [
              'Simple to start for very small projects',
              'No need to think about component boundaries',
              'Faster initial development for tiny apps'
            ],
            cons: [
              'Extremely difficult to maintain as project grows',
              'Code duplication everywhere',
              'Hard to test individual pieces',
              'Team collaboration becomes impossible',
              'Changes in one place break unrelated features'
            ]
          },
          option2: {
            title: 'Component-Based Approach',
            description: 'UI is broken down into small, reusable, independent components. Each component has a single responsibility.',
            pros: [
              'Easy to maintain and scale',
              'Components can be reused across the app',
              'Easy to test individual components',
              'Multiple developers can work simultaneously',
              'Changes are isolated and predictable',
              'Better code organization'
            ],
            cons: [
              'Requires upfront planning and design',
              'Slight learning curve for beginners',
              'More files to manage initially'
            ]
          }
        },
        differenceHighlights: [
          'Monolithic: One 5000-line file. Component-based: 50 files of 100 lines each.',
          'Monolithic: Change button color = search entire file. Component-based: Change button color = edit Button.tsx.',
          'Monolithic: Reuse code = copy-paste. Component-based: Reuse code = import component.',
          'Monolithic: Testing = test entire app. Component-based: Testing = test individual components.'
        ]
      },
      mentalModelVisualization: {
        title: 'Mental Model: Component Architecture',
        frameworkMap: {
          nodes: [
            {
              id: 'root',
              label: 'App Component',
              description: 'The top-level component that renders the entire application',
              type: 'core'
            },
            {
              id: 'layout',
              label: 'Layout Components',
              description: 'Define the overall structure: Header, Sidebar, Footer, Main Content Area',
              type: 'core'
            },
            {
              id: 'feature',
              label: 'Feature Components',
              description: 'Implement specific features: UserProfile, ProductList, ShoppingCart',
              type: 'supporting'
            },
            {
              id: 'ui',
              label: 'UI Components',
              description: 'Reusable UI elements: Button, Input, Card, Modal, Dropdown',
              type: 'supporting'
            },
            {
              id: 'data',
              label: 'Data Flow',
              description: 'Props flow down from parent to child, events bubble up from child to parent',
              type: 'related'
            },
            {
              id: 'state',
              label: 'State Management',
              description: 'Each component can have local state, shared state lives in parent components',
              type: 'related'
            }
          ],
          connections: [
            {
              from: 'root',
              to: 'layout',
              label: 'renders',
              type: 'primary'
            },
            {
              from: 'layout',
              to: 'feature',
              label: 'contains',
              type: 'primary'
            },
            {
              from: 'feature',
              to: 'ui',
              label: 'uses',
              type: 'primary'
            },
            {
              from: 'root',
              to: 'data',
              label: 'manages',
              type: 'secondary'
            },
            {
              from: 'data',
              to: 'state',
              label: 'controls',
              type: 'secondary'
            }
          ]
        },
        memoryLabels: [
          'Think: Russian Nesting Dolls',
          'Remember: Props Down, Events Up',
          'Visualize: LEGO Blocks',
          'Analogy: Kitchen Appliances (each has one job)',
          'Pattern: Composition over Inheritance'
        ]
      },
      realWorldVisualMapping: {
        title: 'Real-World Component Examples',
        practicalScenarios: [
          {
            id: 'rw1',
            title: 'E-Commerce Product Card',
            description: 'A reusable card component that displays product information across the site.',
            industryContext: 'Used by Amazon, eBay, Shopify - appears on search results, category pages, recommendations.',
            visualRepresentation: 'ProductCard receives props: image, title, price, rating, onAddToCart. Same component, different data.',
            icon: 'ShoppingCart'
          },
          {
            id: 'rw2',
            title: 'Social Media Post',
            description: 'A post component that renders user content with consistent styling.',
            industryContext: 'Used by Facebook, Twitter, LinkedIn - appears in feeds, profiles, search results.',
            visualRepresentation: 'Post component receives: author, content, timestamp, likes, comments. Reused thousands of times per page.',
            icon: 'MessageSquare'
          },
          {
            id: 'rw3',
            title: 'Dashboard Widget',
            description: 'Modular widgets that can be arranged in different layouts.',
            industryContext: 'Used by analytics platforms, admin panels, monitoring tools.',
            visualRepresentation: 'Widget component receives: title, data, chartType, size. Users can customize their dashboard layout.',
            icon: 'BarChart'
          }
        ],
        careerRelevance: 'Understanding component architecture is essential for frontend developers. Companies like Google, Facebook, and Netflix rely heavily on component-based systems. This skill is required for React, Vue, Angular, and modern web development roles.'
      },
      commonConfusionVisualization: {
        title: 'Common Confusions Clarified',
        confusionItems: [
          {
            id: 'conf1',
            confusion: 'Should every HTML element be a separate component?',
            visualClarification: 'No! Only create components for reusable patterns or logical groupings. A single <div> doesn\'t need to be a component.',
            correctVisualization: '✅ Component: Button (reused 50 times). ❌ Component: Single <div> wrapper (used once).'
          },
          {
            id: 'conf2',
            confusion: 'How do I know when to split a component into smaller components?',
            visualClarification: 'Split when: 1) Component exceeds 200 lines, 2) You see repeated patterns, 3) Component has multiple responsibilities.',
            correctVisualization: '✅ UserProfile split into: Avatar, UserInfo, UserStats. ❌ UserProfile as one 500-line component.'
          },
          {
            id: 'conf3',
            confusion: 'Should components always be in separate files?',
            visualClarification: 'Generally yes for reusability and organization. Small helper components can stay in the same file if only used there.',
            correctVisualization: '✅ Button.tsx (reusable). ✅ UserProfile.tsx with internal HelperComponent (not reused). ❌ All components in App.tsx.'
          }
        ],
        faqItems: [
          {
            id: 'faq1',
            question: 'How many props is too many?',
            answer: 'If a component has more than 7-8 props, consider: 1) Grouping related props into an object, 2) Splitting into smaller components, 3) Using composition instead.'
          },
          {
            id: 'faq2',
            question: 'Should I optimize every component for reusability?',
            answer: 'No. Start simple. Only optimize for reusability when you actually need to reuse it. Premature abstraction creates complexity.'
          }
        ],
        misconceptionDiagrams: [
          'Misconception: More components = better code. Reality: Right-sized components = better code.',
          'Misconception: Components must be pure functions. Reality: Components can have side effects when needed.',
          'Misconception: All state should be in parent. Reality: Local state is fine for component-specific data.'
        ]
      },
      visualSummary: {
        summaryTitle: 'Visual Summary: Component Architecture',
        keyVisualTakeaways: [
          '🏗️ Components are building blocks: Start small (atoms), combine into larger pieces (molecules, organisms)',
          '🔄 Reusability is key: Write once, use everywhere with different props',
          '📦 Encapsulation matters: Each component is self-contained with its own logic and styling',
          '⬇️ Data flows down: Props pass from parent to child components',
          '⬆️ Events flow up: Child components notify parents through callbacks',
          '🎯 Single responsibility: Each component should do one thing well'
        ],
        revisionInfographic: 'Picture a tree: The trunk is your App component, branches are layout components, leaves are UI components. Data flows from trunk to leaves (props), events flow from leaves to trunk (callbacks).',
        memoryReinforcement: 'Remember the LEGO analogy: You don\'t build a LEGO castle from one giant piece. You use small, reusable bricks (components) that snap together (composition) to create complex structures (applications).',
        examVisualChecklist: [
          'Can you draw the component hierarchy of a simple app?',
          'Can you identify atoms, molecules, and organisms in a design?',
          'Can you explain props flow with arrows in a diagram?',
          'Can you visualize how events bubble up from child to parent?',
          'Can you sketch the difference between monolithic and component-based architecture?'
        ]
      }
    },
    practiceTest: {
      assessmentIntro: {
        badge: 'Practice Test',
        headline: 'Component Architecture Assessment',
        testDescription: 'Test your understanding of component architecture concepts, design patterns, and best practices. This assessment includes concept recall questions and real-world scenarios.',
        difficultyOverview: 'Mixed difficulty: 40% Easy, 40% Medium, 20% Hard. Questions progress from basic concepts to advanced architectural decisions.',
        learningGoals: [
          'Identify appropriate component boundaries',
          'Understand props and data flow',
          'Apply atomic design principles',
          'Make architectural decisions for real-world scenarios'
        ],
        readinessIndicator: 'You should complete the Notes, Layman Explanation, and Visual Explanation sections before taking this test.'
      },
      conceptRecallQuestions: {
        title: 'Concept Recall Questions',
        questions: [
          {
            id: 'cr1',
            questionNumber: 1,
            type: 'single-choice',
            points: 2,
            question: 'What is the smallest unit in Atomic Design methodology?',
            options: [
              { id: 'A', text: 'Molecule' },
              { id: 'B', text: 'Atom' },
              { id: 'C', text: 'Component' },
              { id: 'D', text: 'Element' }
            ],
            correctAnswer: 'B',
            explanation: 'Atoms are the smallest building blocks in Atomic Design. They are basic HTML elements like buttons, inputs, and labels that cannot be broken down further without losing their meaning.',
            difficulty: 'easy'
          },
          {
            id: 'cr2',
            questionNumber: 2,
            type: 'single-choice',
            points: 2,
            question: 'In React component architecture, how does data typically flow?',
            options: [
              { id: 'A', text: 'Bidirectionally between parent and child' },
              { id: 'B', text: 'From child to parent via props' },
              { id: 'C', text: 'From parent to child via props' },
              { id: 'D', text: 'Randomly based on component needs' }
            ],
            correctAnswer: 'C',
            explanation: 'Data flows unidirectionally from parent to child components via props. This is a core principle of React\'s architecture, making data flow predictable and easier to debug.',
            difficulty: 'easy'
          },
          {
            id: 'cr3',
            questionNumber: 3,
            type: 'single-choice',
            points: 3,
            question: 'What is the primary benefit of component composition?',
            options: [
              { id: 'A', text: 'Faster rendering performance' },
              { id: 'B', text: 'Smaller bundle size' },
              { id: 'C', text: 'Reusability and maintainability' },
              { id: 'D', text: 'Better SEO optimization' }
            ],
            correctAnswer: 'C',
            explanation: 'Component composition allows you to build complex UIs from smaller, reusable pieces. This improves code reusability, maintainability, and makes it easier for teams to collaborate.',
            difficulty: 'medium'
          },
          {
            id: 'cr4',
            questionNumber: 4,
            type: 'single-choice',
            points: 3,
            question: 'Which of the following is an example of a "molecule" in Atomic Design?',
            options: [
              { id: 'A', text: 'A button' },
              { id: 'B', text: 'A search bar (input + button)' },
              { id: 'C', text: 'A complete navigation bar' },
              { id: 'D', text: 'An entire page layout' }
            ],
            correctAnswer: 'B',
            explanation: 'A molecule is a simple group of atoms working together. A search bar combines an input (atom) and a button (atom) to create a functional unit.',
            difficulty: 'medium'
          },
          {
            id: 'cr5',
            questionNumber: 5,
            type: 'single-choice',
            points: 4,
            question: 'When should you split a large component into smaller components?',
            options: [
              { id: 'A', text: 'Only when it exceeds 1000 lines of code' },
              { id: 'B', text: 'When it has multiple responsibilities or repeated patterns' },
              { id: 'C', text: 'Never, large components are more efficient' },
              { id: 'D', text: 'Only when requested by code review' }
            ],
            correctAnswer: 'B',
            explanation: 'Components should be split when they have multiple responsibilities (violating Single Responsibility Principle) or when you notice repeated patterns that could be extracted into reusable components.',
            difficulty: 'hard'
          }
        ]
      },
      scenarioBasedQuestions: {
        title: 'Scenario-Based Questions',
        scenarios: [
          {
            id: 'sb1',
            scenarioTitle: 'E-Commerce Product Listing',
            realWorldProblem: 'You are building an e-commerce site with product listings. Each product shows an image, title, price, rating, and "Add to Cart" button.',
            businessContext: 'The product card appears on: search results page, category pages, related products section, and wishlist page.',
            decisionQuestion: 'What is the best architectural approach?',
            options: [
              { id: 'A', text: 'Create separate components for each page (SearchProductCard, CategoryProductCard, etc.)' },
              { id: 'B', text: 'Create one reusable ProductCard component that accepts props' },
              { id: 'C', text: 'Write the product card HTML directly in each page without components' },
              { id: 'D', text: 'Create a different component for each product category' }
            ],
            correctAnswer: 'B',
            explanation: 'A single reusable ProductCard component with props is the best approach. It eliminates code duplication, ensures consistent styling across the site, and makes updates easy (change once, update everywhere).',
            difficulty: 'medium'
          },
          {
            id: 'sb2',
            scenarioTitle: 'Dashboard Widget System',
            realWorldProblem: 'You are building an analytics dashboard where users can add, remove, and rearrange widgets (charts, tables, metrics).',
            businessContext: 'Different users need different widgets. Some want sales charts, others want user metrics, some want both.',
            decisionQuestion: 'How should you architect the widget system?',
            options: [
              { id: 'A', text: 'Create one large Dashboard component with all widgets hardcoded' },
              { id: 'B', text: 'Create a base Widget component and specific widget types (ChartWidget, TableWidget) that extend it' },
              { id: 'C', text: 'Create completely independent widget components with no shared structure' },
              { id: 'D', text: 'Use a single component with a giant switch statement for different widget types' }
            ],
            correctAnswer: 'B',
            explanation: 'A base Widget component with specialized extensions follows the composition pattern. The base handles common functionality (drag, resize, close), while specific widgets handle their unique rendering logic.',
            difficulty: 'hard'
          },
          {
            id: 'sb3',
            scenarioTitle: 'Form Component Design',
            realWorldProblem: 'Your app has 20+ forms (login, signup, profile edit, checkout, etc.). Each form has different fields but similar validation and submission logic.',
            businessContext: 'Forms need consistent styling, error handling, and accessibility features across the entire application.',
            decisionQuestion: 'What is the most maintainable architecture?',
            options: [
              { id: 'A', text: 'Copy-paste form code for each form and customize as needed' },
              { id: 'B', text: 'Create reusable form field components (Input, Select, Checkbox) and a Form wrapper component' },
              { id: 'C', text: 'Use a single mega-form component with conditional rendering for all forms' },
              { id: 'D', text: 'Write each form from scratch without any shared components' }
            ],
            correctAnswer: 'B',
            explanation: 'Creating reusable form field components and a Form wrapper provides consistency, reduces code duplication, and makes it easy to update validation or styling across all forms. This follows the DRY (Don\'t Repeat Yourself) principle.',
            difficulty: 'medium'
          }
        ]
      },
      difficultyProgression: {
        title: 'Difficulty Levels',
        levels: [
          {
            id: 'beginner',
            level: 'beginner',
            description: 'Basic concepts and definitions',
            questionCount: 3,
            passingScore: 70
          },
          {
            id: 'intermediate',
            level: 'intermediate',
            description: 'Application of concepts to common scenarios',
            questionCount: 3,
            passingScore: 75
          },
          {
            id: 'advanced',
            level: 'advanced',
            description: 'Complex architectural decisions and trade-offs',
            questionCount: 2,
            passingScore: 80
          }
        ],
        adaptiveLogic: false
      },
      instantFeedback: {
        enabled: true,
        feedbackType: 'immediate'
      },
      commonMistakeDetection: {
        title: 'Common Mistakes',
        mistakeCategories: [
          {
            id: 'cm1',
            category: 'Over-engineering',
            description: 'Creating too many small components or abstractions before they are needed',
            frequency: 35
          },
          {
            id: 'cm2',
            category: 'Under-engineering',
            description: 'Creating monolithic components that should be split into smaller pieces',
            frequency: 30
          },
          {
            id: 'cm3',
            category: 'Props confusion',
            description: 'Misunderstanding how props flow or trying to modify props directly',
            frequency: 25
          },
          {
            id: 'cm4',
            category: 'State management',
            description: 'Placing state at the wrong level in the component hierarchy',
            frequency: 10
          }
        ],
        weaknessHeatmap: {
          topics: [
            {
              id: 'atomic-design',
              topic: 'Atomic Design Principles',
              score: 85,
              status: 'strong'
            },
            {
              id: 'props-flow',
              topic: 'Props and Data Flow',
              score: 70,
              status: 'moderate'
            },
            {
              id: 'composition',
              topic: 'Component Composition',
              score: 60,
              status: 'weak'
            }
          ]
        }
      },
      performanceAnalytics: {
        title: 'Your Performance',
        scoreDisplay: {
          currentScore: 18,
          maxScore: 24,
          percentage: 75
        },
        performanceGraphs: {
          accuracyTrend: [60, 70, 75, 80, 75],
          speedTrend: [120, 100, 90, 85, 80]
        },
        benchmarkComparison: {
          userScore: 75,
          averageScore: 68,
          topScore: 95
        },
        masteryPercentage: 75,
        examReadinessScore: 80
      },
      revisionRecommendations: {
        title: 'Personalized Learning Path',
        personalizedLearningPath: [
          {
            id: 'rec1',
            topic: 'Component Composition Patterns',
            priority: 'high',
            estimatedTime: '30 minutes',
            resources: ['Code Example Section', 'Technical Deep Dive', 'Practice Project']
          },
          {
            id: 'rec2',
            topic: 'Props and Data Flow',
            priority: 'medium',
            estimatedTime: '20 minutes',
            resources: ['Visual Explanation', 'Real-Life Examples']
          },
          {
            id: 'rec3',
            topic: 'Atomic Design Review',
            priority: 'low',
            estimatedTime: '15 minutes',
            resources: ['Notes Section', 'Layman Explanation']
          }
        ],
        weaknessRecoverySteps: [
          'Review the Component Composition section in Technical Deep Dive',
          'Complete the hands-on project to practice building reusable components',
          'Study real-world examples of component architecture in popular apps',
          'Practice identifying component boundaries in existing designs'
        ],
        recommendedResources: [
          {
            id: 'res1',
            title: 'Component Composition Deep Dive',
            type: 'article',
            link: '/technical-deep-dive'
          },
          {
            id: 'res2',
            title: 'Build a Component Library Project',
            type: 'practice',
            link: '/project'
          },
          {
            id: 'res3',
            title: 'Real-World Component Examples',
            type: 'video',
            link: '/real-life'
          }
        ],
        futureGoals: [
          'Master advanced composition patterns',
          'Learn state management in component hierarchies',
          'Understand performance optimization for components',
          'Explore component testing strategies'
        ]
      }
    }
  },

  // Other subtopics will be added here following the same universal pattern
  // Each subtopic must have: simpleWords, sections, laymanExplanation, realLifeExamples, technicalDeepDive
  // TODO: Add javascript-promises and other subtopics following component-architecture pattern

  'whatisjavascript': {
    simpleWords: 'What is JavaScript in Front End Development',
    definitionBlock: {
        badge: "Core Concept",
        headline: "What is JavaScript?",
        definitionText: "JavaScript is a high-level programming language used to create interactive and dynamic behavior on websites. It allows developers to control webpage content, respond to user actions, and build full web applications.",
        importanceCallout: "JavaScript is essential because modern websites rely on it for functionality such as forms, games, chat systems, and dynamic content. Without JavaScript, websites would be mostly static and less engaging.",
        quickSummary: [
            "JavaScript is like the brain that makes websites interactive. While HTML builds the structure and CSS designs the look, JavaScript adds actions like button clicks, animations, and live updates.",
            "JavaScript transforms static webpages into interactive digital experiences."
        ]
    },
    sections: [
        {
            id: "s1",
            title: "Understanding What is JavaScript?",
            content: "JavaScript is one of the core technologies of web development. It works alongside HTML and CSS to make websites functional, interactive, and responsive.\n\nJavaScript runs directly in web browsers, allowing developers to manipulate webpage elements in real time. It can detect user interactions such as clicks, typing, or scrolling and respond instantly. JavaScript is also used outside browsers through environments like Node.js for backend development. This makes it a versatile language for full stack development. Because of its flexibility, JavaScript powers everything from small website features to complex web applications.\n\nAt its core, JavaScript uses variables to store data, functions to perform actions, and events to react to users. Developers write scripts that instruct the browser on what to do. For example, JavaScript can validate forms before submission, display pop-up messages, or update content without refreshing the page. It also supports APIs, frameworks, and libraries that expand its power. Understanding these building blocks helps developers create powerful web experiences.",
            keyPoint: "Think of a website like a car. HTML is the frame, CSS is the paint and design, and JavaScript is the engine that makes it move and respond when you drive."
        }
    ],
    componentGrid: {
        gridTitle: "Key Components of What is JavaScript?",
        componentCards: [
            {
                id: "comp1",
                title: "Variables and Data",
                description: "Variables store information such as names, numbers, or user input. They allow JavaScript programs to remember and process data.",
                icon: "Box",
                subcomponents: [
                    "They are needed to manage and manipulate information dynamically."
                ]
            },
            {
                id: "comp2",
                title: "Functions",
                description: "Functions are reusable blocks of code designed to perform specific tasks. They help organize code and avoid repetition.",
                icon: "Layers",
                subcomponents: [
                    "They make programs efficient, modular, and easier to maintain."
                ]
            },
            {
                id: "comp3",
                title: "Events and Interactivity",
                description: "Events detect user actions like clicks, key presses, or mouse movement. JavaScript uses these events to trigger responses.",
                icon: "Zap",
                subcomponents: [
                    "They enable websites to interact with users in real time."
                ]
            }
        ]
    },
    examplePanel: {
        exampleTitle: "Syntax and Structure",
        scenarios: [
            {
                id: "sc1",
                title: "Basic Syntax",
                scenarioDescription: "JavaScript syntax is designed to be readable and flexible. Statements often end with semicolons, variables are declared with keywords like let, and functions or browser methods perform actions. In this example, a message is stored, displayed in the console, and shown to the user.",
                practicalSolution: "let message = \"Hello, World!\";\nconsole.log(message);\nalert(message);",
                industryContext: "Basic syntax pattern used in modern applications"
            },
            {
                id: "sc2",
                title: "Button Click Interaction",
                scenarioDescription: "A website button needs to show a welcome message when clicked. This improves user engagement and feedback.",
                practicalSolution: "document.getElementById(\"btn\").onclick = function() {\n  alert(\"Welcome to JavaScript!\");\n};",
                industryContext: "This code attaches a click event to a button. When the user clicks it, a popup message appears instantly."
            },
            {
                id: "sc3",
                title: "Form Input Validation",
                scenarioDescription: "A signup form should check if the user entered a name before submission. This prevents incomplete submissions.",
                practicalSolution: "let username = document.getElementById(\"name\").value;\nif(username === \"\") {\n  alert(\"Please enter your name\");\n}",
                industryContext: "This code checks whether the input field is empty. If no name is entered, it alerts the user to complete the form."
            }
        ]
    },
    practiceCard: {
        bestPracticeTitle: "Best Practices",
        recommendations: [
            {
                id: "bp1",
                title: "Use Meaningful Variable Names",
                description: "Clear variable names make code easier to understand and maintain. They reduce confusion for you and other developers. Do: Use let userAge = 25; Don't: Avoid let x = 25;"
            },
            {
                id: "bp2",
                title: "Keep Code Organized with Functions",
                description: "Functions prevent repeated code and improve readability. Organized code is easier to debug and update. Do: Create function greetUser() for greeting logic. Don't: Repeat alert code multiple times."
            },
            {
                id: "bp3",
                title: "Test for Errors Regularly",
                description: "Using console logs and browser developer tools helps catch mistakes early. Regular testing improves code quality. Do: Use console.log() to inspect values. Don't: Ignore errors until the program breaks."
            }
        ],
        optimizationTips: [
            "Follow industry standards",
            "Write clean, maintainable code"
        ],
        industryStandards: [
            "Use consistent naming conventions",
            "Follow best practices"
        ]
    },
    warningFaq: {
        commonErrors: [
            {
                id: "err1",
                error: "Forgetting quotation marks around text",
                solution: "JavaScript treats unquoted text as variables, causing errors. Always wrap strings in single or double quotes."
            },
            {
                id: "err2",
                error: "Using = instead of === in conditions",
                solution: "A single = assigns values instead of comparing them. Use === for accurate comparisons."
            },
            {
                id: "err3",
                error: "Trying to access HTML elements before they load",
                solution: "JavaScript may run before webpage elements are available. Place scripts at the end of the body or use DOMContentLoaded."
            }
        ],
        faqItems: [
            {
                id: "faq1",
                question: "Is JavaScript the same as Java?",
                answer: "No, JavaScript and Java are different languages. JavaScript is mainly for web interactivity, while Java is used for broader software applications."
            },
            {
                id: "faq2",
                question: "Can JavaScript be used outside websites?",
                answer: "Yes, JavaScript can run on servers using Node.js, build mobile apps, and even create desktop applications."
            },
            {
                id: "faq3",
                question: "Why should beginners learn JavaScript?",
                answer: "JavaScript is beginner-friendly, widely used, and essential for web development. Learning it opens many career opportunities in tech."
            }
        ],
        misconceptionAlerts: [
            "Review common mistakes carefully",
            "Practice to avoid errors"
        ]
    },
    summaryCard: {
        summaryTitle: "Quick Revision Summary",
        keyTakeaways: [
            "JavaScript is a programming language for interactive websites.",
            "It works with HTML and CSS to create complete web experiences.",
            "Variables, functions, and events are core building blocks.",
            "JavaScript can run in browsers and on servers.",
            "It is essential for modern front end and full stack development."
        ],
        revisionChecklist: [
            {
                id: "rc1",
                item: "HTML builds structure.",
                checked: false
            },
            {
                id: "rc2",
                item: "CSS styles design.",
                checked: false
            },
            {
                id: "rc3",
                item: "JavaScript adds functionality.",
                checked: false
            }
        ],
        memoryReinforcement: "JavaScript is the engine that brings websites to life.",
        examTips: [
            "Practice writing small scripts like alerts and button interactions.",
            "Focus on understanding variables, functions, and event handling."
        ]
    }
  ,
    laymanExplanation: {
        simpleOverview: {
            badge: "Beginner Friendly",
            headline: "What is JavaScript? Explained Simply",
            simpleDefinition: "JavaScript is a tool that makes websites interactive and responsive when you use them. It helps websites react when you click buttons, type in forms, or play videos.",
            subExplanation: "Without JavaScript, websites would mostly just sit there showing information like digital posters. JavaScript adds action, movement, and smart features so websites feel alive and useful.",
            importanceBlock: "Beginners should care because JavaScript is one of the main building blocks of modern websites. Learning it opens the door to creating websites, apps, and digital tools.",
            progressIndicator: "Perfect for beginners - no prior knowledge needed"
        },
        everydayAnalogy: {
            title: "Think of It Like This",
            storyAnalogy: "Imagine building a toy car. HTML creates the body, CSS paints and decorates it, and JavaScript is the engine that makes it drive, honk, and move. Without the engine, the car may look nice, but it cannot actually do anything.",
            comparisonPanel: {
                realWorld: "Think about a TV remote. Pressing buttons changes channels, volume, or settings instantly.",
                technical: "JavaScript acts like the remote control for websites, allowing users to trigger actions and make things happen."
            },
            visualMetaphor: "JavaScript is like the electricity that powers all the smart features in a home.",
            keyTakeaway: "JavaScript gives websites the power to respond, move, and interact."
        },
        whyItExists: {
            sectionTitle: "Why Does This Exist?",
            benefitCards: [
                {
                    id: "benefit1",
                    title: "Career Opportunities",
                    description: "JavaScript is one of the most important skills for web developers. Learning it can lead to jobs in front-end, back-end, or full stack development.",
                    icon: "Briefcase",
                    type: "career"
                },
                {
                    id: "benefit2",
                    title: "Better Digital Experiences",
                    description: "JavaScript makes websites smoother and easier to use. It helps users interact with content quickly and efficiently.",
                    icon: "Zap",
                    type: "practical"
                },
                {
                    id: "benefit3",
                    title: "Strong Learning Foundation",
                    description: "Understanding JavaScript makes advanced technologies like React, Vue, or Node.js easier to learn later. It is a valuable long-term skill.",
                    icon: "TrendingUp",
                    type: "future"
                }
            ]
        },
        simpleUseCases: {
            gridTitle: "Where You'll See This",
            useCaseCards: [
                {
                    id: "use1",
                    title: "Interactive Websites",
                    description: "JavaScript powers buttons, menus, sliders, and popups on websites. Netflix uses JavaScript to manage interactive browsing and recommendations.",
                    category: "everyday" as const,
                    icon: "Monitor"
                },
                {
                    id: "use2",
                    title: "Mobile-Friendly Web Apps",
                    description: "JavaScript helps websites work smoothly on smartphones and tablets. Facebook's web version uses JavaScript for notifications and live updates.",
                    category: "everyday" as const,
                    icon: "Smartphone"
                },
                {
                    id: "use3",
                    title: "Real-Time Applications",
                    description: "JavaScript supports chat apps, online maps, and live dashboards. Google Maps uses JavaScript for route updates and dynamic navigation.",
                    category: "career" as const,
                    icon: "Globe"
                },
                {
                    id: "use4",
                    title: "Online Shopping",
                    description: "JavaScript updates shopping carts, filters products, and improves checkout processes. Amazon uses JavaScript to instantly update cart totals and recommendations.",
                    category: "career" as const,
                    icon: "ShoppingCart"
                }
            ]
        },
        beginnerBreakdown: {
            title: "Step-by-Step Breakdown",
            steps: [
                {
                    id: "step1",
                    stepTitle: "Step 1: Add Basic Actions",
                    stepExplanation: "JavaScript starts by giving websites the ability to perform actions. It can display messages, change content, or respond to clicks.",
                    microLearningChunk: "JavaScript makes web pages active."
                },
                {
                    id: "step2",
                    stepTitle: "Step 2: Listen to Users",
                    stepExplanation: "It watches for actions like typing, clicking, or scrolling. Then it decides how the website should respond.",
                    microLearningChunk: "JavaScript listens and reacts."
                },
                {
                    id: "step3",
                    stepTitle: "Step 3: Update Instantly",
                    stepExplanation: "JavaScript changes webpage content without forcing a reload. This makes websites feel faster and smoother.",
                    microLearningChunk: "JavaScript creates real-time updates."
                },
                {
                    id: "step4",
                    stepTitle: "Step 4: Build Full Applications",
                    stepExplanation: "As skills grow, JavaScript can power entire applications, from social platforms to business dashboards.",
                    microLearningChunk: "JavaScript scales from simple pages to advanced apps."
                }
            ]
        },
        mentalModel: {
            title: "Mental Model",
            conceptMap: {
                nodes: [],
                connections: []
            },
            visualLabels: [
                "Structure: The webpage's content and layout.",
                "Design: The colors, styling, and appearance.",
                "Interaction: The smart actions and responses."
            ]
        },
        commonConfusions: {
            title: "Common Beginner Confusions",
            confusionItems: [
                {
                    id: "conf1",
                    confusion: "Is JavaScript the same as Java?",
                    clarification: "No, they are different programming languages. They have different purposes even though their names sound similar."
                },
                {
                    id: "conf2",
                    confusion: "Do all websites use JavaScript?",
                    clarification: "Many modern websites use JavaScript because it adds important interactive features. Simple websites may use less, but advanced ones depend on it heavily."
                },
                {
                    id: "conf3",
                    confusion: "Is JavaScript only for experts?",
                    clarification: "No, beginners can start with simple JavaScript tasks like alerts and buttons. Skills grow step by step over time."
                }
            ],
            faqItems: [
                {
                    id: "faq1",
                    question: "Can JavaScript build games?",
                    answer: "Yes, JavaScript can create browser games and interactive experiences. Many online games use it."
                },
                {
                    id: "faq2",
                    question: "Can JavaScript work outside websites?",
                    answer: "Yes, JavaScript can also run on servers and applications using tools like Node.js."
                },
                {
                    id: "faq3",
                    question: "Why is JavaScript important?",
                    answer: "Because it powers the interactive parts of modern websites and applications used daily."
                }
            ],
            misconceptionAlerts: [
                "JavaScript is not the same as Java.",
                "JavaScript is not only for animations.",
                "JavaScript is not too hard for beginners."
            ]
        },
        simpleRecap: {
            summaryTitle: "Let's Recap What You Learned",
            keyTakeaways: [
                "JavaScript makes websites interactive.",
                "It helps websites respond to users.",
                "It works with HTML and CSS.",
                "It powers many real-world digital platforms.",
                "It is an essential skill for web developers.",
                "Beginners can learn JavaScript step by step."
            ],
            simpleRecapPoints: [
                "You now understand what JavaScript does.",
                "You know why websites need JavaScript.",
                "You can relate it to everyday examples.",
                "You see its importance for your learning journey."
            ],
            confidenceBoost: "You are building an amazing foundation in web development. JavaScript may seem big now, but with practice, you can absolutely master it! 💡",
            memoryReinforcement: "JavaScript is the engine that turns websites into smart, interactive experiences."
        }
    }
  ,
    realLifeExamples: {
        conceptMapping: {
            badge: "Real World Connection",
            headline: "How What is JavaScript? Works in Real Life",
            conceptDefinition: "JavaScript is a programming language that powers interactive and dynamic functionality on websites, web apps, and digital platforms. It enables real-time user engagement, browser automation, and full stack application development.",
            realWorldTranslation: "In real life, JavaScript is what makes websites respond when you click buttons, fill forms, stream videos, or shop online. It turns static web pages into smart digital experiences people use every day.",
            importanceBlock: "Industries rely on JavaScript because it improves customer experience, boosts engagement, and supports scalable web applications. It is one of the most widely used technologies across global businesses.",
            careerRelevance: "Learning JavaScript opens career paths in frontend, backend, mobile development, and software engineering."
        },
        industryUseCase: {
            title: "Industry Use Case",
            industryName: "E-Commerce",
            scenarioDescription: "Companies like Amazon use JavaScript to create seamless shopping experiences with live product updates, instant cart changes, and personalized recommendations. Customers interact with products dynamically without refreshing pages.",
            businessContext: "Online retailers need fast, interactive platforms to keep customers engaged and reduce abandonment. Slow or static websites can lead to lost sales.",
            implementation: "JavaScript powers dynamic product pages, real-time inventory updates, checkout validation, and recommendation engines. Frameworks like React improve performance while APIs connect frontend interfaces to backend systems. This ensures smooth customer journeys from browsing to payment.",
            impact: "Improved user experience increases conversion rates and customer retention. Amazon's dynamic interface helps support billions in annual online sales.",
            keyTakeaway: "JavaScript is essential for building responsive digital commerce experiences that directly drive revenue."
        },
        dailyLifeExample: {
            title: "Daily Life Example",
            storyTitle: "Ordering Food Online",
            storyNarrative: "Imagine ordering food through Uber Eats or Zomato. When you select meals, update quantities, or track delivery in real time, JavaScript powers those actions instantly. It updates your total bill, validates your payment, and refreshes driver location without reloading the page. This creates a smooth and convenient user experience. Without JavaScript, these platforms would feel slow and disconnected.",
            everydayConnection: "People interact with JavaScript daily through social media, banking apps, streaming platforms, and online shopping websites. It is deeply integrated into most digital experiences.",
            technicalMapping: "JavaScript handles user actions, updates content dynamically, and communicates with servers behind the scenes. It ensures real-time functionality across modern applications.",
            relatableInsight: "Every time a website feels interactive and responsive, JavaScript is usually working behind the scenes."
        },
        careerRelevance: {
            title: "Career Paths Using What is JavaScript?",
            careerPaths: [
                {
                    id: "career1",
                    role: "Frontend Developer",
                    description: "Frontend developers build interactive user interfaces for websites and applications using JavaScript, HTML, and CSS. They focus on user experience, responsiveness, and design functionality.",
                    skillLevel: "entry",
                    salaryRange: "$60,000 - $95,000",
                    icon: "Code"
                },
                {
                    id: "career2",
                    role: "Full Stack Engineer",
                    description: "Full stack engineers use JavaScript for both frontend and backend development with tools like Node.js. They build complete applications from user interfaces to server systems.",
                    skillLevel: "mid",
                    salaryRange: "$90,000 - $140,000",
                    icon: "Layers"
                },
                {
                    id: "career3",
                    role: "Solutions Architect",
                    description: "Solutions architects design scalable business systems that often use JavaScript frameworks for enterprise web applications. They align technology solutions with business needs.",
                    skillLevel: "mid",
                    salaryRange: "$120,000 - $180,000",
                    icon: "Briefcase"
                },
                {
                    id: "career4",
                    role: "Tech Lead",
                    description: "Tech leads manage development teams building large-scale JavaScript applications. They oversee technical decisions, code quality, and product scalability.",
                    skillLevel: "senior",
                    salaryRange: "$150,000 - $220,000",
                    icon: "Award"
                }
            ],
            industryDemand: "JavaScript consistently ranks among the top 3 most in-demand programming languages globally, with over 65% of developers using it regularly according to Stack Overflow surveys. Web development jobs continue to grow rapidly across industries.",
            futureGrowth: "As businesses expand digital services, JavaScript demand is expected to remain strong due to its role in web, mobile, and cloud applications. Framework evolution ensures continued career opportunities."
        },
        problemSolutionContext: {
            title: "Real Problem, Real Solution",
            problemStatement: "Netflix needed a highly interactive streaming interface capable of handling millions of users while delivering personalized recommendations and smooth browsing experiences.",
            context: "Traditional static web pages could not support the speed, personalization, and scalability required for global streaming audiences.",
            solution: "Netflix adopted JavaScript frameworks to build responsive interfaces that dynamically load content, personalize recommendations, and improve streaming controls. JavaScript allows asynchronous content updates and efficient browser-side rendering. This reduced server strain while improving user engagement.",
            implementation: "Frontend technologies like React and backend JavaScript tools helped Netflix scale globally. JavaScript APIs continuously deliver personalized content recommendations.",
            outcome: "Netflix improved customer retention, user engagement, and platform scalability. JavaScript became a core component of its digital product experience.",
            lessonsLearned: "JavaScript is critical for solving scalability and interactivity challenges in large consumer platforms."
        },
        businessApplication: {
            title: "Business Application",
            companyType: "SaaS Company",
            businessChallenge: "Companies like Google Workspace need fast, browser-based applications that support real-time collaboration without software installation.",
            technicalApplication: "JavaScript powers tools like Google Docs for instant editing, collaboration, and cloud synchronization. It handles dynamic content updates, shared sessions, and responsive interfaces. Combined with APIs, JavaScript ensures smooth productivity experiences.",
            businessProcess: "JavaScript integrates directly into daily workflows by supporting communication, document editing, and business automation in web browsers.",
            roi: "Reduced software deployment costs and increased customer adoption improve long-term profitability. SaaS companies gain scalable recurring revenue through efficient JavaScript-powered platforms.",
            scalability: "JavaScript frameworks allow businesses to scale products globally while maintaining consistent performance across devices.",
            keyInsight: "JavaScript enables businesses to build scalable, profitable, and highly interactive digital solutions."
        },
        domainScenarios: {
            title: "Where You'll Use This",
            scenarios: [
                {
                    id: "scenario1",
                    domain: "E-Commerce",
                    title: "Interactive Online Shopping",
                    description: "JavaScript powers shopping carts, payment forms, and personalized product recommendations. It improves conversion through dynamic customer experiences.",
                    application: "Amazon uses JavaScript for real-time product filtering and checkout systems.",
                    icon: "ShoppingCart"
                },
                {
                    id: "scenario2",
                    domain: "Healthcare",
                    title: "Patient Portals and Scheduling",
                    description: "Healthcare platforms use JavaScript for appointment booking, medical dashboards, and patient communication tools. This improves service accessibility.",
                    application: "Hospital systems use JavaScript-driven portals for online patient management.",
                    icon: "Heart"
                },
                {
                    id: "scenario3",
                    domain: "Finance",
                    title: "Banking Dashboards",
                    description: "Financial institutions use JavaScript for live account updates, fraud alerts, and investment tracking. It supports secure and interactive user experiences.",
                    application: "PayPal and Stripe use JavaScript for payment processing interfaces.",
                    icon: "DollarSign"
                },
                {
                    id: "scenario4",
                    domain: "Education",
                    title: "Interactive Learning Platforms",
                    description: "Educational websites use JavaScript for quizzes, simulations, and progress tracking. It improves student engagement and learning efficiency.",
                    application: "Platforms like Khan Academy rely on JavaScript for browser-based learning tools.",
                    icon: "BookOpen"
                },
                {
                    id: "scenario5",
                    domain: "Entertainment",
                    title: "Streaming and Gaming",
                    description: "JavaScript supports video controls, game mechanics, and user interactions on entertainment platforms. It creates immersive digital experiences.",
                    application: "Netflix and browser games use JavaScript extensively.",
                    icon: "Film"
                },
                {
                    id: "scenario6",
                    domain: "Social Media",
                    title: "Real-Time User Interaction",
                    description: "Social platforms use JavaScript for feeds, notifications, messaging, and content updates. It keeps users engaged continuously.",
                    application: "Facebook and Instagram rely on JavaScript for dynamic social experiences.",
                    icon: "Share2"
                }
            ]
        },
        practicalRecap: {
            summaryTitle: "Real-World Impact Summary",
            keyApplications: [
                "Interactive websites and web apps",
                "Real-time business platforms",
                "Scalable SaaS products",
                "Consumer-facing digital experiences"
            ],
            industryRelevance: [
                "Used heavily in e-commerce and SaaS",
                "Essential for web-based enterprise software",
                "Critical for digital transformation strategies"
            ],
            careerImpact: "Mastering JavaScript significantly increases employability in software development and web engineering. It provides flexibility across multiple technical career paths.",
            nextSteps: [
                "Learn JavaScript syntax and fundamentals",
                "Build projects like forms or interactive websites",
                "Explore frameworks like React and Node.js"
            ],
            practicalAdvice: "Focus on hands-on projects that simulate real business applications. Practical JavaScript experience is highly valued by employers."
        }
    }
  },

  'variable': {
    simpleWords: 'Variables and Data Types in Front End Development',
    definitionBlock: {
        badge: "Core Concept",
        headline: "What is Variables and Data Type?",
        definitionText: "Variables in JavaScript are named containers used to store data values, while data types define the kind of data a variable can hold, such as numbers, text, or true/false values.",
        importanceCallout: "Variables and data types are the foundation of programming because they allow developers to store, manage, and manipulate information. Without them, applications cannot process user input, calculations, or dynamic content effectively.",
        quickSummary: [
            "Think of a variable like a labeled box where you store information. Data types tell JavaScript what kind of information is inside that box, such as a name, age, or price.",
            "Variables store data, and data types define what kind of data is stored."
        ]
    },
    sections: [
        {
            id: "s1",
            title: "Understanding Variables and Data Type",
            content: "In JavaScript, variables help store information that can be reused throughout a program. Data types ensure that JavaScript understands how to handle each stored value properly.\n\nJavaScript provides variables through keywords like var, let, and const. Each variable can hold different types of data, such as strings for text, numbers for calculations, booleans for true/false conditions, arrays for lists, and objects for structured information. Using the correct data type helps avoid errors and improves code clarity. Variables make programs flexible because values can change based on user actions or application logic.\n\nA variable name identifies stored data. The assignment operator stores a value inside the variable. Data types classify values into categories like primitive types such as string, number, boolean, null, undefined and reference types such as object or array. Proper use of let and const provides better control over changing or fixed values. Understanding these concepts is essential for writing efficient JavaScript programs.",
            keyPoint: "Imagine variables as storage boxes with labels like Name or Price. Data types are the type of item inside each box, such as words, numbers, or yes/no answers."
        }
    ],
    componentGrid: {
        gridTitle: "Key Components of Variables and Data Type",
        componentCards: [
            {
                id: "comp1",
                title: "Variable Declaration",
                description: "This defines a variable using var, let, or const before storing data. It creates a named reference for future use.",
                icon: "Box",
                subcomponents: [
                    "It allows developers to create storage spaces for program data."
                ]
            },
            {
                id: "comp2",
                title: "Data Types",
                description: "These determine the kind of value stored, such as text, numbers, or logical values. JavaScript uses data types to process values correctly.",
                icon: "Layers",
                subcomponents: [
                    "It ensures data is handled appropriately based on its type."
                ]
            },
            {
                id: "comp3",
                title: "Assignment and Reassignment",
                description: "Assignment stores a value in a variable, while reassignment updates it later if allowed. Let variables can change, while const variables remain fixed.",
                icon: "Zap",
                subcomponents: [
                    "It provides flexibility for dynamic programming logic."
                ]
            }
        ]
    },
    examplePanel: {
        exampleTitle: "Syntax and Structure",
        scenarios: [
            {
                id: "sc1",
                title: "Basic Syntax",
                scenarioDescription: "The let keyword creates variables whose values can change later. The const keyword creates variables with fixed values. Strings use quotes, numbers do not, and booleans use true or false without quotes.",
                practicalSolution: "let userName = \"Alice\";\nconst age = 25;\nlet isStudent = true;",
                industryContext: "Basic syntax pattern used in modern applications"
            },
            {
                id: "sc2",
                title: "Online Shopping Cart",
                scenarioDescription: "An e-commerce website stores product price and customer name. These values help personalize the shopping experience.",
                practicalSolution: "let customerName = \"Rahul\";\nlet productPrice = 999;\nlet inStock = true;",
                industryContext: "The customer name is stored as text, product price as a number, and stock status as a boolean. This helps the system manage orders efficiently."
            },
            {
                id: "sc3",
                title: "Student Registration Form",
                scenarioDescription: "A school website collects student details during registration. Variables store this information for processing.",
                practicalSolution: "let studentName = \"Priya\";\nlet gradeLevel = 10;\nconst isRegistered = true;",
                industryContext: "Each variable stores different information types. JavaScript uses these values to manage records and display personalized data."
            }
        ]
    },
    practiceCard: {
        bestPracticeTitle: "Best Practices",
        recommendations: [
            {
                id: "bp1",
                title: "Use Meaningful Variable Names",
                description: "Clear variable names make code easier to understand and maintain. Avoid vague names that confuse other developers. Do: Use let userAge = 25; Don't: Avoid let x = 25;"
            },
            {
                id: "bp2",
                title: "Prefer let and const Over var",
                description: "Let and const provide better scope control and reduce unexpected errors. Modern JavaScript development strongly recommends them. Do: Use const taxRate = 18; Don't: Avoid var taxRate = 18;"
            },
            {
                id: "bp3",
                title: "Match Correct Data Types",
                description: "Using the right data type improves accuracy and prevents logical issues. Store numbers as numbers, not strings. Do: Use let price = 500; Don't: Avoid let price = \"500\";"
            }
        ],
        optimizationTips: [
            "Follow industry standards",
            "Write clean, maintainable code"
        ],
        industryStandards: [
            "Use consistent naming conventions",
            "Follow best practices"
        ]
    },
    warningFaq: {
        commonErrors: [
            {
                id: "err1",
                error: "Using const for values that need updating",
                solution: "Const variables cannot be reassigned after initialization. Use let when values may change."
            },
            {
                id: "err2",
                error: "Confusing strings with numbers",
                solution: "Numbers inside quotes are treated as text, not numerical values. Remove quotes when storing numeric data."
            },
            {
                id: "err3",
                error: "Declaring variables without clear names",
                solution: "Poor naming reduces code readability. Use descriptive names like totalAmount instead of single-letter names."
            }
        ],
        faqItems: [
            {
                id: "faq1",
                question: "What is the difference between let and const?",
                answer: "Let allows reassignment of values, while const creates fixed references. Use const by default unless you need changes."
            },
            {
                id: "faq2",
                question: "Can JavaScript variables change data types?",
                answer: "Yes, JavaScript is dynamically typed, so a variable can hold different data types at different times. However, this should be used carefully."
            },
            {
                id: "faq3",
                question: "Why are data types important?",
                answer: "Data types help JavaScript understand how to process values correctly. They reduce bugs and improve code reliability."
            }
        ],
        misconceptionAlerts: [
            "Review common mistakes carefully",
            "Practice to avoid errors"
        ]
    },
    summaryCard: {
        summaryTitle: "Quick Revision Summary",
        keyTakeaways: [
            "Variables store reusable data values.",
            "Data types define the kind of data stored.",
            "Use let for changeable values and const for fixed values.",
            "Common data types include string, number, and boolean.",
            "Good naming and correct type usage improve code quality."
        ],
        revisionChecklist: [
            {
                id: "rc1",
                item: "Variables are labeled storage containers.",
                checked: false
            },
            {
                id: "rc2",
                item: "Data types guide JavaScript behavior.",
                checked: false
            },
            {
                id: "rc3",
                item: "Proper syntax ensures efficient programming.",
                checked: false
            }
        ],
        memoryReinforcement: "A variable is a box, and the data type tells you what is inside it.",
        examTips: [
            "Practice identifying data types in code examples.",
            "Remember the differences between var, let, and const."
        ]
    }
  ,
    laymanExplanation: {
        simpleOverview: {
            badge: "Beginner Friendly",
            headline: "Variables and Data Type Explained Simply",
            simpleDefinition: "A variable is like a box where you store information, such as your name or age. A data type tells what kind of thing is inside that box, like words, numbers, or true/false answers.",
            subExplanation: "When you build websites or apps, you need places to keep important information. Variables help store that information, and data types help the computer understand how to use it correctly.",
            importanceBlock: "Learning this helps you understand how programs remember and use information. It is one of the first building blocks of coding.",
            progressIndicator: "Perfect for beginners - no prior knowledge needed"
        },
        everydayAnalogy: {
            title: "Think of It Like This",
            storyAnalogy: "Imagine you have different labeled containers in your kitchen. One jar says Sugar, another says Rice, and another says Salt. The label is like the variable name, and what is inside is the data type. This helps you quickly know what each container holds and how to use it.",
            comparisonPanel: {
                realWorld: "A school bag has different pockets for books, pencils, and lunch boxes. Each pocket stores a specific type of item.",
                technical: "Variables are like those pockets, and data types are the type of items stored inside them, such as text, numbers, or yes/no values."
            },
            visualMetaphor: "Variables are labeled boxes, and data types are the kind of treasure inside each box.",
            keyTakeaway: "Variables organize information, and data types explain what that information is."
        },
        whyItExists: {
            sectionTitle: "Why Does This Exist?",
            benefitCards: [
                {
                    id: "benefit1",
                    title: "Build Real Projects",
                    description: "Every website or app stores user names, prices, and settings. Knowing variables helps you create real working programs.",
                    icon: "Briefcase",
                    type: "career"
                },
                {
                    id: "benefit2",
                    title: "Make Apps Smarter",
                    description: "Variables help apps remember information like login details or shopping cart items. This makes digital tools useful in everyday life.",
                    icon: "Zap",
                    type: "practical"
                },
                {
                    id: "benefit3",
                    title: "Learn Advanced Coding Faster",
                    description: "Understanding variables makes future topics like functions and apps much easier. It gives you a strong coding foundation.",
                    icon: "TrendingUp",
                    type: "future"
                }
            ]
        },
        simpleUseCases: {
            gridTitle: "Where You'll See This",
            useCaseCards: [
                {
                    id: "use1",
                    title: "Streaming Platforms",
                    description: "Netflix stores your profile name, watch history, and preferences using variables. This helps personalize your viewing experience.",
                    category: "everyday",
                    icon: "Monitor"
                },
                {
                    id: "use2",
                    title: "Mobile Apps",
                    description: "Your phone's weather app stores temperature numbers and city names. Variables make this information easy to update.",
                    category: "everyday",
                    icon: "Smartphone"
                },
                {
                    id: "use3",
                    title: "Web Development Jobs",
                    description: "Developers use variables daily to build forms, games, and websites. This skill is essential in front-end careers.",
                    category: "career",
                    icon: "Globe"
                },
                {
                    id: "use4",
                    title: "Online Shopping",
                    description: "Amazon stores product prices, customer details, and cart totals with variables. This keeps shopping systems organized.",
                    category: "career",
                    icon: "ShoppingCart"
                }
            ]
        },
        beginnerBreakdown: {
            title: "Step-by-Step Breakdown",
            steps: [
                {
                    id: "step1",
                    stepTitle: "Step 1: Create a Box",
                    stepExplanation: "First, you make a variable, which is like creating an empty box with a name. This box is ready to store information.",
                    microLearningChunk: "A variable is a storage box."
                },
                {
                    id: "step2",
                    stepTitle: "Step 2: Put Something Inside",
                    stepExplanation: "Next, you store data like text, numbers, or true/false values inside the box. This gives the variable purpose.",
                    microLearningChunk: "Variables hold useful information."
                },
                {
                    id: "step3",
                    stepTitle: "Step 3: Understand the Type",
                    stepExplanation: "The computer checks what kind of data is stored. This helps it know how to handle the value.",
                    microLearningChunk: "Data type explains the stored value."
                },
                {
                    id: "step4",
                    stepTitle: "Step 4: Use It in Your Program",
                    stepExplanation: "Finally, your code can use that stored information whenever needed. This makes apps dynamic and interactive.",
                    microLearningChunk: "Stored data powers real applications."
                }
            ]
        },
        mentalModel: {
            title: "Mental Model",
            conceptMap: {
                nodes: [],
                connections: []
            },
            visualLabels: [
                "Variable Name: The label on the shelf",
                "Stored Value: The item placed on the shelf",
                "Data Type: The category of item stored"
            ]
        },
        commonConfusions: {
            title: "Common Beginner Confusions",
            confusionItems: [
                {
                    id: "conf1",
                    confusion: "Thinking variables only store numbers",
                    clarification: "Variables can store many types of information, including words and true/false values. They are flexible storage containers."
                },
                {
                    id: "conf2",
                    confusion: "Believing quotes do not matter",
                    clarification: "Words need quotes because JavaScript treats them as text. Without quotes, it may think they are variable names."
                },
                {
                    id: "conf3",
                    confusion: "Mixing up variable names and values",
                    clarification: "The variable name is the label, while the value is the actual data stored. They work together but are not the same."
                }
            ],
            faqItems: [
                {
                    id: "faq1",
                    question: "Do I need to memorize all data types now?",
                    answer: "No, start with basic ones like text, numbers, and true/false. You will learn more naturally with practice."
                },
                {
                    id: "faq2",
                    question: "Can I change a variable later?",
                    answer: "Yes, many variables can be updated later. This makes programs flexible."
                },
                {
                    id: "faq3",
                    question: "Why are variables important?",
                    answer: "They help programs remember and manage information. Without variables, coding would be very limited."
                }
            ],
            misconceptionAlerts: [
                "Variables are not permanent storage like files.",
                "Numbers inside quotes are treated as text.",
                "Variable names should clearly describe the stored value."
            ]
        },
        simpleRecap: {
            summaryTitle: "Let's Recap What You Learned",
            keyTakeaways: [
                "Variables are storage boxes for information.",
                "Data types describe what kind of information is stored.",
                "Variables can hold names, ages, prices, and more.",
                "Data types help computers use information correctly.",
                "This concept is essential for all programming.",
                "Learning variables makes future coding easier."
            ],
            simpleRecapPoints: [
                "You now know what variables are.",
                "You understand why data types matter.",
                "You can connect coding ideas to real life.",
                "You are building a strong programming foundation."
            ],
            confidenceBoost: "Great job! You are learning one of the most important parts of JavaScript. Keep going—you are building real coding skills. 🚀",
            memoryReinforcement: "Think of variables as labeled boxes and data types as what is stored inside them."
        }
    }
  ,
    realLifeExamples: {
        conceptMapping: {
            badge: "Real World Connection",
            headline: "How Variables and Data Type Works in Real Life",
            conceptDefinition: "Variables store important pieces of information in software systems, while data types define what kind of information is being stored and how it should be processed. Together, they form the backbone of digital applications.",
            realWorldTranslation: "In real life, variables are like digital storage labels for customer names, payment amounts, or product details. Data types ensure each piece of information is handled correctly, whether it is text, numbers, or true/false values.",
            importanceBlock: "Every major industry depends on structured data handling to power websites, apps, and automation systems. Without variables and data types, modern software could not function efficiently.",
            careerRelevance: "Mastering this concept is essential for web developers, software engineers, and technology professionals building real-world systems."
        },
        industryUseCase: {
            title: "Industry Use Case",
            industryName: "E-Commerce",
            scenarioDescription: "Amazon manages millions of product listings, customer profiles, and payment transactions every day. Each product price, customer name, and stock level must be stored accurately.",
            businessContext: "The platform needs to process huge amounts of user and product data quickly. Errors in data handling could lead to pricing mistakes or failed transactions.",
            implementation: "Variables store customer names, product prices, order IDs, and shipping details. Data types ensure prices remain numbers for calculations, names stay as strings, and stock availability is stored as boolean values. JavaScript on Amazon's front-end uses this system to dynamically display product pages and update carts in real time.",
            impact: "This structured approach improves customer experience, reduces operational errors, and supports billions in annual sales. Accurate data management directly supports business growth.",
            keyTakeaway: "Variables and data types enable scalable, reliable online business systems."
        },
        dailyLifeExample: {
            title: "Daily Life Example",
            storyTitle: "Ordering Food Through a Delivery App",
            storyNarrative: "When you order food on Uber Eats or Swiggy, the app stores your name, delivery address, selected items, and payment amount. Your name is stored as text, item count as numbers, and delivery status as true or false values. These pieces of information update constantly as your order progresses. Without organized storage, the app would not know where to send your meal.",
            everydayConnection: "People interact with variables and data types every time they use apps for shopping, booking rides, or online payments. These systems silently manage user information behind the scenes.",
            technicalMapping: "Variables hold the user's order information, while data types ensure each value behaves correctly. This allows apps to calculate totals, track deliveries, and personalize experiences.",
            relatableInsight: "Every digital service you use depends on organized data storage."
        },
        careerRelevance: {
            title: "Career Paths Using Variables and Data Type",
            careerPaths: [
                {
                    id: "career1",
                    role: "Frontend Developer",
                    description: "Builds websites and interfaces that manage user input, forms, and dynamic content using JavaScript variables. Uses data types daily for interactive applications.",
                    skillLevel: "entry",
                    salaryRange: "$55,000 - $85,000",
                    icon: "Code"
                },
                {
                    id: "career2",
                    role: "Full Stack Engineer",
                    description: "Handles both front-end and back-end systems, managing user data across entire applications. Relies heavily on variables for databases, APIs, and interfaces.",
                    skillLevel: "mid",
                    salaryRange: "$90,000 - $140,000",
                    icon: "Layers"
                },
                {
                    id: "career3",
                    role: "Solutions Architect",
                    description: "Designs enterprise systems where data structure and type management are critical. Ensures scalable architecture for business platforms.",
                    skillLevel: "mid",
                    salaryRange: "$120,000 - $170,000",
                    icon: "Briefcase"
                },
                {
                    id: "career4",
                    role: "Tech Lead",
                    description: "Leads software teams and oversees code quality, architecture, and performance. Strong foundational understanding of variables and data systems is essential.",
                    skillLevel: "senior",
                    salaryRange: "$150,000 - $220,000",
                    icon: "Award"
                }
            ],
            industryDemand: "According to global developer job trends, JavaScript remains one of the most in-demand programming languages, with millions of active job postings worldwide. Front-end and full-stack roles continue to grow strongly.",
            futureGrowth: "As web applications expand, demand for JavaScript developers is expected to remain strong through the next decade. Foundational programming concepts like variables will remain essential."
        },
        problemSolutionContext: {
            title: "Real Problem, Real Solution",
            problemStatement: "A banking app must securely process balances, transactions, and customer identities while preventing calculation errors. Incorrect data handling could cause serious financial issues.",
            context: "Financial systems require precise and structured data management because even small mistakes can impact thousands of users.",
            solution: "Variables store account balances, user IDs, and transaction histories. Numbers are stored as numeric types for accurate calculations, while customer names remain strings. Boolean values manage account status, such as active or suspended. This ensures financial systems remain reliable and secure.",
            implementation: "JavaScript front-end systems validate user input before processing. Proper data typing reduces errors and supports secure banking workflows.",
            outcome: "This improves reliability, customer trust, and transaction accuracy. Strong variable and type management directly reduces operational risk.",
            lessonsLearned: "Accurate data organization is critical for trust-heavy industries like finance."
        },
        businessApplication: {
            title: "Business Application",
            companyType: "SaaS Company",
            businessChallenge: "Companies like Salesforce manage large-scale customer relationship data for thousands of organizations. Each client requires personalized, structured data systems.",
            technicalApplication: "Variables store customer records, subscription plans, and usage metrics. Strings manage names, numbers track subscriptions, and booleans handle feature activation. This allows SaaS platforms to automate business operations efficiently.",
            businessProcess: "Variables and data types are used across dashboards, analytics, and reporting systems. They support automation, customer segmentation, and billing.",
            roi: "Efficient data systems reduce manual work, improve scalability, and increase customer retention. SaaS businesses rely on these efficiencies for recurring revenue growth.",
            scalability: "As customer bases grow, structured variable management supports expansion without system breakdown. Proper architecture ensures long-term business success.",
            keyInsight: "Scalable software begins with reliable data management fundamentals."
        },
        domainScenarios: {
            title: "Where You'll Use This",
            scenarios: [
                {
                    id: "scenario1",
                    domain: "E-Commerce",
                    title: "Dynamic Product Management",
                    description: "Amazon and Flipkart use variables to manage product names, prices, discounts, and stock. Data types ensure accurate shopping experiences.",
                    application: "Cart totals and personalized recommendations rely on structured variables.",
                    icon: "ShoppingCart"
                },
                {
                    id: "scenario2",
                    domain: "Healthcare",
                    title: "Patient Data Systems",
                    description: "Hospitals use software to store patient names, age, prescriptions, and appointment dates. Correct data typing ensures patient safety.",
                    application: "Healthcare portals manage medical records securely and efficiently.",
                    icon: "Heart"
                },
                {
                    id: "scenario3",
                    domain: "Finance",
                    title: "Secure Banking Applications",
                    description: "Banks use variables for balances, transfers, and customer profiles. Accurate number handling prevents costly mistakes.",
                    application: "Mobile banking apps process transactions in real time.",
                    icon: "DollarSign"
                },
                {
                    id: "scenario4",
                    domain: "Education",
                    title: "Learning Platforms",
                    description: "Platforms like Coursera or Udemy track student names, progress percentages, and certifications. Variables power personalized dashboards.",
                    application: "Course systems use structured data to guide learners.",
                    icon: "BookOpen"
                },
                {
                    id: "scenario5",
                    domain: "Entertainment",
                    title: "Streaming Personalization",
                    description: "Netflix stores watch history, ratings, and profile settings. Variables help create tailored recommendations.",
                    application: "Streaming services improve user retention through smart personalization.",
                    icon: "Film"
                },
                {
                    id: "scenario6",
                    domain: "Social Media",
                    title: "User Engagement Systems",
                    description: "Instagram and Facebook track likes, usernames, and posts. Variables help platforms update content instantly.",
                    application: "Social apps rely on structured data for engagement algorithms.",
                    icon: "Share2"
                }
            ]
        },
        practicalRecap: {
            summaryTitle: "Real-World Impact Summary",
            keyApplications: [
                "Managing user profiles and customer data",
                "Supporting real-time app functionality",
                "Powering business automation systems",
                "Ensuring reliable software scalability"
            ],
            industryRelevance: [
                "Essential in nearly every software industry",
                "Foundational for all web and app development",
                "Critical for data-driven business operations"
            ],
            careerImpact: "Understanding variables and data types gives you the technical foundation needed for modern development roles. This skill directly supports employability in software engineering careers.",
            nextSteps: [
                "Practice building JavaScript projects",
                "Learn functions and control flow",
                "Explore APIs and full-stack systems"
            ],
            practicalAdvice: "Focus on mastering variables early because they are used everywhere in programming. Real-world success in coding starts with strong fundamentals."
        }
    }
  ,
    technicalDeepDive: {
        title: "Technical Deep Dive: Variables and Data Type",
        badge: "Advanced",
        intro: "Variables and data types in JavaScript are deeply connected to execution contexts, lexical environments, memory allocation, and runtime optimization. Understanding these internal mechanics helps developers write more efficient, maintainable, and secure applications.",
        sections: [
            {
                id: "section1",
                title: "Architecture Overview",
                content: "JavaScript uses execution contexts to manage variable creation and lifecycle during code execution. Each context contains lexical environments that store variable bindings and scope references. Primitive data types such as strings, numbers, and booleans are stored directly in stack memory, while objects, arrays, and functions are stored as references in heap memory. Scope chains determine variable accessibility across nested contexts. JavaScript engines such as V8 optimize variable access using hidden classes, inline caching, and just-in-time compilation.",
                keyPoints: [
                    "Execution contexts define scope, memory allocation, and variable lifecycle.",
                    "Primitive values are stored by value, while objects are stored by reference.",
                    "Modern engines optimize variable access for speed and efficiency."
                ]
            },
            {
                id: "section2",
                title: "Internal Mechanics",
                content: "During parsing, JavaScript performs a creation phase where memory is allocated for variables and function declarations. Variables declared with var are hoisted and initialized with undefined, while let and const are hoisted but remain inaccessible in the temporal dead zone until execution reaches their declaration. Runtime execution assigns values dynamically, allowing variables to change types. The engine tracks references through environment records and manages unused memory with garbage collection. This dynamic model provides flexibility but can introduce runtime unpredictability.",
                steps: [
                    {
                        id: "step1",
                        text: "Step 1: Parse source code and allocate memory for declarations."
                    },
                    {
                        id: "step2",
                        text: "Step 2: Execute code line by line while assigning runtime values."
                    },
                    {
                        id: "step3",
                        text: "Step 3: Optimize execution and reclaim unused memory."
                    }
                ],
                code: {
                    language: "javascript",
                    code: "console.log(user);\nvar user = \"Alice\";\n\nlet age = 25;\nconst active = true;",
                    output: "The var variable logs undefined due to hoisting, while let and const are inaccessible before declaration."
                }
            },
            {
                id: "section3",
                title: "Performance Optimization",
                content: "Efficient variable usage improves runtime performance and memory predictability. Using const for immutable values allows engines to make safer optimization assumptions. Avoiding unnecessary type mutation prevents deoptimization in JIT-compiled code paths. Maintaining consistent object shapes improves hidden class generation in V8. Performance profiling tools such as Chrome DevTools help monitor memory allocation, variable retention, and execution bottlenecks.",
                keyPoints: [
                    "Prefer const for stable values to improve optimization opportunities.",
                    "Avoid frequent variable type changes to reduce JIT deoptimization.",
                    "Use profiling tools to identify memory leaks and performance bottlenecks."
                ],
                code: {
                    language: "javascript",
                    code: "const taxRate = 0.18;\nlet total = 1000;\ntotal += total * taxRate;",
                    output: "Stable variable types improve predictability and execution efficiency."
                }
            },
            {
                id: "section4",
                title: "Advanced Concepts",
                content: "Advanced JavaScript variable management includes closures, destructuring, symbols, and explicit type control strategies. Closures preserve access to lexical variables beyond their original execution context, enabling encapsulation and private state. Destructuring syntax improves readability when extracting structured data. Symbols create unique property identifiers that avoid collisions. Advanced projects often integrate TypeScript for static type safety and improved maintainability.",
                keyPoints: [
                    "Closures support stateful functions and encapsulation.",
                    "Destructuring simplifies structured data extraction.",
                    "Symbols provide collision-resistant object properties."
                ],
                code: {
                    language: "javascript",
                    code: "function counter() {\n  let count = 0;\n  return function() {\n    count++;\n    return count;\n  };\n}"
                }
            },
            {
                id: "section5",
                title: "Edge Cases and Gotchas",
                content: "JavaScript dynamic typing can create confusing edge cases due to implicit type coercion. Loose equality comparisons may trigger automatic conversions that produce unexpected outcomes. Null and undefined represent different absence states but are often confused. NaN is a unique numeric value that does not equal itself. Developers must also guard against accidental global variable creation and scope leakage.",
                keyPoints: [
                    "Use strict equality operators to avoid implicit coercion issues.",
                    "Treat null and undefined as distinct values with separate meanings.",
                    "Enable strict mode to prevent accidental global scope pollution."
                ],
                highlight: "Type coercion and poor scope management are major sources of bugs in JavaScript applications."
            },
            {
                id: "section6",
                title: "Design Patterns",
                content: "Strong variable design often relies on proven architectural patterns such as module patterns, factory functions, and immutable state management. Module patterns use closures to protect private variables. Factory functions simplify reusable object generation with controlled state. Immutable data patterns are widely used in frameworks like React to improve predictability and debugging. Clear naming conventions and separation of concerns improve long-term maintainability.",
                keyPoints: [
                    "Module patterns encapsulate internal state securely.",
                    "Factory functions improve object reuse and flexibility.",
                    "Immutable state patterns enhance UI consistency and debugging."
                ],
                code: {
                    language: "javascript",
                    code: "function createUser(name) {\n  return {\n    getName() {\n      return name;\n    }\n  };\n}"
                }
            },
            {
                id: "section7",
                title: "Security Considerations",
                content: "Improper variable handling can expose sensitive information or create exploitable vulnerabilities. Global variables increase attack surfaces by exposing state to unintended contexts. Type confusion may introduce validation flaws when processing user input. Secure code uses scoped declarations, sanitizes external data, and enforces strict type checking. Defensive variable management reduces both security and reliability risks.",
                keyPoints: [
                    "Minimize global state to reduce exposure risks.",
                    "Validate and sanitize all external input before assignment.",
                    "Use strict mode and predictable typing for safer applications."
                ],
                highlight: "Never trust user input without validation, regardless of expected type.",
                code: {
                    language: "javascript",
                    code: "\"use strict\";\nconst username = sanitizeInput(userInput);\nif (typeof username === \"string\") {\n  processUser(username);\n}"
                }
            },
            {
                id: "section8",
                title: "Technical Summary",
                content: "Variables and data types are foundational to JavaScript architecture, influencing memory management, scope control, optimization, and security. Advanced mastery requires understanding execution models, dynamic typing behavior, and scalable design patterns. Strong technical knowledge in this area leads to more performant, secure, and maintainable software systems.",
                keyPoints: [
                    "Execution contexts govern variable lifecycle and scope.",
                    "Memory behavior differs significantly between primitive and reference types.",
                    "Performance optimization depends on predictable type usage.",
                    "Advanced patterns improve scalability and maintainability.",
                    "Security depends on strict validation and scope discipline.",
                    "Profiling and optimization are essential for production-grade applications."
                ]
            }
        ]
    }
  ,
    codeExample: {
        problemContext: {
            title: "The Problem We're Solving",
            scenario: "A user registration system needs to store a person's name, age, and account status. This information must be organized correctly so the application can display user details and process logic accurately.",
            requirements: [
                "Store user name as text",
                "Store user age as a number",
                "Store account status as a true or false value"
            ],
            constraints: "Each variable must use the correct data type to avoid errors and improve code readability."
        },
        basicCodeExample: {
            title: "Basic Implementation",
            description: "This code creates variables for a user profile and stores different types of information. It demonstrates how JavaScript handles strings, numbers, and booleans.",
            code: "let userName = \"Alice\";\nlet userAge = 25;\nlet isActive = true;\n\nconsole.log(userName);\nconsole.log(userAge);\nconsole.log(isActive);",
            language: "javascript",
            explanation: "The code declares three variables using let. Each variable stores a specific type of data, including text, numeric, and boolean values. The console.log statements display these values in the console. This is a foundational example of variable declaration and data type usage."
        },
        lineByLineExplanation: {
            title: "Line-by-Line Breakdown",
            lines: [
                {
                    id: "line1",
                    lineNumber: 1,
                    code: "let userName = \"Alice\";",
                    explanation: "This creates a variable called userName and stores a string value. Strings are used for text data."
                },
                {
                    id: "line2",
                    lineNumber: 2,
                    code: "let userAge = 25;",
                    explanation: "This creates a variable for age using a numeric value. Numbers are used for calculations and counting."
                },
                {
                    id: "line3",
                    lineNumber: 3,
                    code: "let isActive = true;",
                    explanation: "This creates a boolean variable. Booleans represent true or false conditions."
                },
                {
                    id: "line4",
                    lineNumber: 5,
                    code: "console.log(userName);",
                    explanation: "This outputs the user's name to the console. It helps verify stored values."
                },
                {
                    id: "line5",
                    lineNumber: 6,
                    code: "console.log(userAge);",
                    explanation: "This outputs the user's age to the console. Console logging is useful for debugging."
                }
            ]
        },
        outputDemonstration: {
            title: "Output and Results",
            input: "userName = Alice, userAge = 25, isActive = true",
            output: "Alice\n25\ntrue",
            explanation: "The console displays each stored variable value in sequence. This confirms that JavaScript correctly stores and processes different data types.",
            visualRepresentation: "The user profile data appears line by line in the browser console. Each variable's value is displayed clearly."
        },
        bestPracticeVersion: {
            title: "Best Practice Implementation",
            improvements: [
                "Use const for values that should not change",
                "Use descriptive variable names",
                "Group related data logically"
            ],
            code: "const userName = \"Alice\";\nconst userAge = 25;\nconst isActive = true;\n\nconsole.log(`Name: ${userName}`);\nconsole.log(`Age: ${userAge}`);\nconsole.log(`Active: ${isActive}`);",
            explanation: "This version improves reliability by using const for fixed values. Template literals improve readability when displaying output. Descriptive naming and consistent formatting make the code easier to maintain and scale.",
            benefits: [
                "Improved code safety",
                "Better readability",
                "Easier debugging and maintenance"
            ]
        },
        commonMistakes: {
            title: "Common Mistakes to Avoid",
            mistakes: [
                {
                    id: "mistake1",
                    mistake: "Using unclear variable names",
                    badCode: "let x = \"Alice\";",
                    why: "Single-letter names make code hard to understand. Clear naming improves readability.",
                    goodCode: "let userName = \"Alice\";",
                    lesson: "Always use meaningful variable names."
                },
                {
                    id: "mistake2",
                    mistake: "Storing numbers as strings",
                    badCode: "let age = \"25\";",
                    why: "Strings cannot always be used correctly in calculations. This may cause logical errors.",
                    goodCode: "let age = 25;",
                    lesson: "Use proper numeric types for numbers."
                },
                {
                    id: "mistake3",
                    mistake: "Using var instead of let or const",
                    badCode: "var userName = \"Alice\";",
                    why: "var has broader scope and can create unexpected bugs. Modern JavaScript favors let and const.",
                    goodCode: "let userName = \"Alice\";",
                    lesson: "Prefer modern variable declarations."
                }
            ]
        },
        realWorldImplementation: {
            title: "Real-World Implementation",
            scenario: "A production web application stores customer information during account creation. This includes names, ages, email addresses, and subscription status.",
            code: "const customerName = \"Rahul Sharma\";\nconst customerAge = 30;\nconst customerEmail = \"[rahul@example.com](mailto:rahul@example.com)\";\nconst isSubscribed = true;\n\nconst customerProfile = {\n  customerName,\n  customerAge,\n  customerEmail,\n  isSubscribed\n};\n\nconsole.log(customerProfile);",
            features: [
                "Structured user profile storage",
                "Multiple data types integration",
                "Scalable object organization"
            ],
            explanation: "This implementation groups related variables into an object for better scalability. It mirrors real-world applications where user profiles are stored and processed dynamically. Objects improve maintainability and integration with APIs or databases.",
            scalability: "As more customer details are added, object structures remain organized and manageable. This approach supports enterprise-level application growth."
        },
        codeSummary: {
            title: "Code Summary",
            keyTakeaways: [
                "Variables store reusable information.",
                "Data types define how values behave.",
                "Use let and const appropriately.",
                "Clear structure improves scalability."
            ],
            practiceExercise: "Create a student profile using variables for name, grade, and enrollment status. Then display the information using console.log statements.",
            nextSteps: [
                "Practice variable declarations",
                "Learn objects and arrays",
                "Explore functions for dynamic data processing"
            ]
        }
    }
  ,
    technicalDeepDive: {
        title: "Technical Deep Dive: Variables and Data Type",
        badge: "Advanced",
        intro: "Variables and data types in JavaScript are deeply connected to execution contexts, lexical environments, memory allocation, and runtime optimization. Understanding these internal mechanics helps developers write more efficient, maintainable, and secure applications.",
        sections: [
            {
                id: "section1",
                title: "Architecture Overview",
                content: "JavaScript uses execution contexts to manage variable creation and lifecycle during code execution. Each context contains lexical environments that store variable bindings and scope references. Primitive data types such as strings, numbers, and booleans are stored directly in stack memory, while objects, arrays, and functions are stored as references in heap memory. Scope chains determine variable accessibility across nested contexts. JavaScript engines such as V8 optimize variable access using hidden classes, inline caching, and just-in-time compilation.",
                keyPoints: [
                    "Execution contexts define scope, memory allocation, and variable lifecycle.",
                    "Primitive values are stored by value, while objects are stored by reference.",
                    "Modern engines optimize variable access for speed and efficiency."
                ]
            },
            {
                id: "section2",
                title: "Internal Mechanics",
                content: "During parsing, JavaScript performs a creation phase where memory is allocated for variables and function declarations. Variables declared with var are hoisted and initialized with undefined, while let and const are hoisted but remain inaccessible in the temporal dead zone until execution reaches their declaration. Runtime execution assigns values dynamically, allowing variables to change types. The engine tracks references through environment records and manages unused memory with garbage collection. This dynamic model provides flexibility but can introduce runtime unpredictability.",
                steps: [
                    {
                        id: "step1",
                        text: "Step 1: Parse source code and allocate memory for declarations."
                    },
                    {
                        id: "step2",
                        text: "Step 2: Execute code line by line while assigning runtime values."
                    },
                    {
                        id: "step3",
                        text: "Step 3: Optimize execution and reclaim unused memory."
                    }
                ],
                code: {
                    language: "javascript",
                    code: "console.log(user);\nvar user = \"Alice\";\n\nlet age = 25;\nconst active = true;",
                    output: "The var variable logs undefined due to hoisting, while let and const are inaccessible before declaration."
                }
            },
            {
                id: "section3",
                title: "Performance Optimization",
                content: "Efficient variable usage improves runtime performance and memory predictability. Using const for immutable values allows engines to make safer optimization assumptions. Avoiding unnecessary type mutation prevents deoptimization in JIT-compiled code paths. Maintaining consistent object shapes improves hidden class generation in V8. Performance profiling tools such as Chrome DevTools help monitor memory allocation, variable retention, and execution bottlenecks.",
                keyPoints: [
                    "Prefer const for stable values to improve optimization opportunities.",
                    "Avoid frequent variable type changes to reduce JIT deoptimization.",
                    "Use profiling tools to identify memory leaks and performance bottlenecks."
                ],
                code: {
                    language: "javascript",
                    code: "const taxRate = 0.18;\nlet total = 1000;\ntotal += total * taxRate;",
                    output: "Stable variable types improve predictability and execution efficiency."
                }
            },
            {
                id: "section4",
                title: "Advanced Concepts",
                content: "Advanced JavaScript variable management includes closures, destructuring, symbols, and explicit type control strategies. Closures preserve access to lexical variables beyond their original execution context, enabling encapsulation and private state. Destructuring syntax improves readability when extracting structured data. Symbols create unique property identifiers that avoid collisions. Advanced projects often integrate TypeScript for static type safety and improved maintainability.",
                keyPoints: [
                    "Closures support stateful functions and encapsulation.",
                    "Destructuring simplifies structured data extraction.",
                    "Symbols provide collision-resistant object properties."
                ],
                code: {
                    language: "javascript",
                    code: "function counter() {\n  let count = 0;\n  return function() {\n    count++;\n    return count;\n  };\n}"
                }
            },
            {
                id: "section5",
                title: "Edge Cases and Gotchas",
                content: "JavaScript dynamic typing can create confusing edge cases due to implicit type coercion. Loose equality comparisons may trigger automatic conversions that produce unexpected outcomes. Null and undefined represent different absence states but are often confused. NaN is a unique numeric value that does not equal itself. Developers must also guard against accidental global variable creation and scope leakage.",
                keyPoints: [
                    "Use strict equality operators to avoid implicit coercion issues.",
                    "Treat null and undefined as distinct values with separate meanings.",
                    "Enable strict mode to prevent accidental global scope pollution."
                ],
                highlight: "Type coercion and poor scope management are major sources of bugs in JavaScript applications."
            },
            {
                id: "section6",
                title: "Design Patterns",
                content: "Strong variable design often relies on proven architectural patterns such as module patterns, factory functions, and immutable state management. Module patterns use closures to protect private variables. Factory functions simplify reusable object generation with controlled state. Immutable data patterns are widely used in frameworks like React to improve predictability and debugging. Clear naming conventions and separation of concerns improve long-term maintainability.",
                keyPoints: [
                    "Module patterns encapsulate internal state securely.",
                    "Factory functions improve object reuse and flexibility.",
                    "Immutable state patterns enhance UI consistency and debugging."
                ],
                code: {
                    language: "javascript",
                    code: "function createUser(name) {\n  return {\n    getName() {\n      return name;\n    }\n  };\n}"
                }
            },
            {
                id: "section7",
                title: "Security Considerations",
                content: "Improper variable handling can expose sensitive information or create exploitable vulnerabilities. Global variables increase attack surfaces by exposing state to unintended contexts. Type confusion may introduce validation flaws when processing user input. Secure code uses scoped declarations, sanitizes external data, and enforces strict type checking. Defensive variable management reduces both security and reliability risks.",
                keyPoints: [
                    "Minimize global state to reduce exposure risks.",
                    "Validate and sanitize all external input before assignment.",
                    "Use strict mode and predictable typing for safer applications."
                ],
                highlight: "Never trust user input without validation, regardless of expected type.",
                code: {
                    language: "javascript",
                    code: "\"use strict\";\nconst username = sanitizeInput(userInput);\nif (typeof username === \"string\") {\n  processUser(username);\n}"
                }
            },
            {
                id: "section8",
                title: "Technical Summary",
                content: "Variables and data types are foundational to JavaScript architecture, influencing memory management, scope control, optimization, and security. Advanced mastery requires understanding execution models, dynamic typing behavior, and scalable design patterns. Strong technical knowledge in this area leads to more performant, secure, and maintainable software systems.",
                keyPoints: [
                    "Execution contexts govern variable lifecycle and scope.",
                    "Memory behavior differs significantly between primitive and reference types.",
                    "Performance optimization depends on predictable type usage.",
                    "Advanced patterns improve scalability and maintainability.",
                    "Security depends on strict validation and scope discipline.",
                    "Profiling and optimization are essential for production-grade applications."
                ]
            }
        ]
    }
  ,
    assignment: {
        title: "Assignment",
        description: "",
        xp: 150,
        duration: "20 Mins",
        task: {
            title: "",
            description: "",
            requirements: []
        },
        objectives: [],
        starterCode: {
            title: "Starter Code",
            description: "This starter code provides a structure for the assignment with placeholders. Students must complete the missing variable declarations and outputs.",
            code: "// TODO: Create variables for user name, age, and active status\n\n// Example:\n// const userName = \"Your Name\";\n\n// TODO: Display each variable using console.log()\n\n// TODO: Bonus - Create an object called userProfile",
            language: "javascript",
            instructions: [
                "Replace placeholder values with your own sample data",
                "Use correct data types for each variable",
                "Test your code in the browser console or Node.js"
            ]
        },
        submissionGuidelines: []
    }
  ,
    assignment: {
        title: "Assignment",
        description: "",
        xp: 150,
        duration: "20 Mins",
        task: {
            title: "",
            description: "",
            requirements: []
        },
        objectives: [],
        starterCode: "// TODO: Create variables for user name, age, and active status\n\n// Example:\n// const userName = \"Your Name\";\n\n// TODO: Display each variable using console.log()\n\n// TODO: Bonus - Create an object called userProfile",
        submissionGuidelines: []
    }
  ,
    assignment: {
        title: "Variables and Data Type - Hands-On Assignment",
        description: "Students will build a simple user profile program that stores and displays personal information using JavaScript variables. This project helps learners practice variable declaration, data type selection, and structured output.",
        xp: 100,
        duration: "30-45 minutes",
        task: {
            title: "Assignment Requirements",
            description: "Create a JavaScript program that stores a user's profile details and displays them clearly in the console. Your solution should demonstrate proper variable naming and correct data type usage.",
            requirements: [
                "Create variables for user details: Store the user's name, age, and active status. Use appropriate data types for each value.",
                "Use modern JavaScript syntax: Use let or const instead of var. Choose const for fixed values.",
                "Display all stored information: Use console.log statements to show each variable clearly. Format output for readability.",
                "Create a profile object: Group all variables into one object for better organization. This introduces structured programming concepts."
            ]
        },
        objectives: [
            "Understand how to declare variables using let and const",
            "Practice using strings, numbers, and booleans",
            "Learn how to store and display structured data",
            "Improve confidence in writing basic JavaScript code"
        ],
        starterCode: "// TODO: Create variables for user name, age, and active status\n\n// Example:\n// const userName = \"Your Name\";\n\n// TODO: Display each variable using console.log()\n\n// TODO: Bonus - Create an object called userProfile",
        submissionGuidelines: [
            "Ensure all required variables are included",
            "Use correct syntax and formatting",
            "Test your code before submission"
        ]
    }
  ,
    project: {
        title: "Build a User Profile Management Dashboard using Variables and Data Type",
        description: "Students will build an interactive JavaScript-based user profile dashboard that stores, manages, and displays user information such as names, ages, email addresses, and subscription statuses. This project focuses on applying variables, data types, objects, arrays, and dynamic updates in a practical front-end environment. Learners will simulate how real-world applications manage customer or employee data. By the end, students will have a portfolio-worthy beginner-to-intermediate project.",
        xp: 500,
        deadline: "3-5 hours",
        hero: {
            badge: "Project Complete",
            title: "Build a User Profile Management Dashboard using Variables and Data Type",
            description: "Students will build an interactive JavaScript-based user profile dashboard that stores, manages, and displays user information such as names, ages, email addresses, and subscription statuses. This project focuses on applying variables, data types, objects, arrays, and dynamic updates in a practical front-end environment. Learners will simulate how real-world applications manage customer or employee data. By the end, students will have a portfolio-worthy beginner-to-intermediate project.",
            image: "/project_mockup.svg"
        },
        realWorldUse: "This project mirrors real business systems used in SaaS dashboards, HR platforms, and customer portals. It helps prepare learners for actual front-end and full-stack development roles.",
        skills: [
            "HTML5",
            "CSS3",
            "JavaScript ES6"
        ],
        buildItems: [
            "Phase 1: Project Setup and Variable Design",
            "Phase 2: Core Data Handling",
            "Phase 3: Dynamic UI Rendering",
            "Phase 4: Optimization and Deployment"
        ],
        deliverables: [
            "Master variable declaration and data type management",
            "Work with objects and arrays for structured data",
            "Build interactive front-end functionality",
            "Develop scalable coding habits for larger applications"
        ]
    }
  ,
    quiz: {
        title: "Variables and Data Type - Knowledge Check",
        description: "This quiz tests your understanding of JavaScript variables, declarations, and data types through practical coding, debugging, and real-world scenarios. It is designed to reinforce both foundational concepts and applied problem-solving skills.",
        totalQuestions: 18, // Fixed: actual count instead of claimed 20
        duration: "20 minutes",
        xp: 150,
        questions: [
            {
                id: "mc1",
                questionNumber: 1,
                type: "Multiple Choice",
                points: 2,
                question: "Which keyword is best for declaring a variable that should not be reassigned?",
                options: [
                    {
                        id: "a",
                        text: "const"
                    },
                    {
                        id: "b",
                        text: "let"
                    },
                    {
                        id: "c",
                        text: "var"
                    },
                    {
                        id: "d",
                        text: "define"
                    }
                ],
                correctAnswer: "a",
                explanation: "const creates a variable whose reference cannot be reassigned. It is preferred for stable values."
            },
            {
                id: "mc2",
                questionNumber: 2,
                type: "Multiple Choice",
                points: 2,
                question: "Which data type is used for true or false values?",
                options: [
                    {
                        id: "a",
                        text: "String"
                    },
                    {
                        id: "b",
                        text: "Boolean"
                    },
                    {
                        id: "c",
                        text: "Number"
                    },
                    {
                        id: "d",
                        text: "Object"
                    }
                ],
                correctAnswer: "b",
                explanation: "Boolean values represent logical true or false states. They are essential for conditions and decision-making."
            },
            {
                id: "mc3",
                questionNumber: 3,
                type: "Multiple Choice",
                points: 2,
                question: "What is the output type of typeof null in JavaScript?",
                options: [
                    {
                        id: "a",
                        text: "null"
                    },
                    {
                        id: "b",
                        text: "undefined"
                    },
                    {
                        id: "c",
                        text: "object"
                    },
                    {
                        id: "d",
                        text: "boolean"
                    }
                ],
                correctAnswer: "c",
                explanation: "Due to a historical JavaScript bug, typeof null returns object. This is a well-known language quirk."
            },
            {
                id: "tf1",
                questionNumber: 4,
                type: "True/False",
                points: 1,
                question: "Strings in JavaScript must be enclosed in quotes.",
                options: [
                    {
                        id: "true",
                        text: "True"
                    },
                    {
                        id: "false",
                        text: "False"
                    }
                ],
                correctAnswer: "true",
                explanation: "Strings require single, double, or backtick quotes. Without quotes, JavaScript interprets them differently."
            },
            {
                id: "tf2",
                questionNumber: 5,
                type: "True/False",
                points: 1,
                question: "Variables declared with let can be redeclared in the same scope.",
                options: [
                    {
                        id: "true",
                        text: "True"
                    },
                    {
                        id: "false",
                        text: "False"
                    }
                ],
                correctAnswer: "false",
                explanation: "let allows reassignment but not redeclaration within the same scope. Attempting redeclaration causes an error."
            },
            {
                id: "tf3",
                questionNumber: 6,
                type: "True/False",
                points: 1,
                question: "JavaScript is a dynamically typed language.",
                options: [
                    {
                        id: "true",
                        text: "True"
                    },
                    {
                        id: "false",
                        text: "False"
                    }
                ],
                correctAnswer: "true",
                explanation: "Variables can change data types during runtime. This flexibility is a core feature of JavaScript."
            },
            {
                id: "co1",
                questionNumber: 7,
                type: "Code Output",
                points: 3,
                question: "What will this code output?",
                code: "let age = 25;\nconsole.log(typeof age);",
                options: [
                    {
                        id: "a",
                        text: "number"
                    },
                    {
                        id: "b",
                        text: "string"
                    },
                    {
                        id: "c",
                        text: "boolean"
                    },
                    {
                        id: "d",
                        text: "undefined"
                    }
                ],
                correctAnswer: "a",
                explanation: "The variable age stores a numeric value. typeof returns number."
            },
            {
                id: "co2",
                questionNumber: 8,
                type: "Code Output",
                points: 3,
                question: "What will this code output?",
                code: "let value = \"5\" + 2;\nconsole.log(value);",
                options: [
                    {
                        id: "a",
                        text: "7"
                    },
                    {
                        id: "b",
                        text: "52"
                    },
                    {
                        id: "c",
                        text: "undefined"
                    },
                    {
                        id: "d",
                        text: "error"
                    }
                ],
                correctAnswer: "b",
                explanation: "JavaScript performs string concatenation because one operand is a string. The result becomes 52."
            },
            {
                id: "co3",
                questionNumber: 9,
                type: "Code Output",
                points: 3,
                question: "What will this code output?",
                code: "const active = true;\nconsole.log(typeof active);",
                options: [
                    {
                        id: "a",
                        text: "string"
                    },
                    {
                        id: "b",
                        text: "number"
                    },
                    {
                        id: "c",
                        text: "boolean"
                    },
                    {
                        id: "d",
                        text: "object"
                    }
                ],
                correctAnswer: "c",
                explanation: "The variable stores a boolean value. typeof correctly identifies it as boolean."
            },
            {
                id: "fb1",
                questionNumber: 10,
                type: "Fill in the Blank",
                points: 2,
                question: "The keyword _____ is used for variables that should not be reassigned.",
                options: [],
                correctAnswer: "const",
                explanation: "const creates immutable variable references. It is preferred for stable values."
            },
            {
                id: "fb2",
                questionNumber: 11,
                type: "Fill in the Blank",
                points: 2,
                question: "The data type used for text values is _____.",
                options: [],
                correctAnswer: "string",
                explanation: "Strings represent textual data. They must be enclosed in quotes."
            },
            {
                id: "fb3",
                questionNumber: 12,
                type: "Fill in the Blank",
                points: 2,
                question: "JavaScript uses _____ typing, meaning variable types can change during runtime.",
                options: [],
                correctAnswer: "dynamic",
                explanation: "Dynamic typing allows flexibility in variable assignments. However, it requires careful management."
            },
            {
                id: "db1",
                questionNumber: 13,
                type: "Debug the Code",
                points: 3,
                question: "What's wrong with this code?",
                code: "const age = 25;\nage = 30;",
                options: [
                    {
                        id: "a",
                        text: "const variables cannot be reassigned"
                    },
                    {
                        id: "b",
                        text: "age should be a string"
                    },
                    {
                        id: "c",
                        text: "Missing semicolon"
                    },
                    {
                        id: "d",
                        text: "age is undefined"
                    }
                ],
                correctAnswer: "a",
                explanation: "const prevents reassignment after initialization. Use let if the value may change."
            },
            {
                id: "db2",
                questionNumber: 14,
                type: "Debug the Code",
                points: 3,
                question: "What's wrong with this code?",
                code: "let userName = Alice;",
                options: [
                    {
                        id: "a",
                        text: "let is invalid"
                    },
                    {
                        id: "b",
                        text: "String values need quotes"
                    },
                    {
                        id: "c",
                        text: "Variable names cannot use camelCase"
                    },
                    {
                        id: "d",
                        text: "Semicolon is forbidden"
                    }
                ],
                correctAnswer: "b",
                explanation: "Alice is interpreted as an identifier instead of text. Strings must use quotes."
            },
            {
                id: "db3",
                questionNumber: 15,
                type: "Debug the Code",
                points: 3,
                question: "What's wrong with this code?",
                code: "let price = \"100\";\nconsole.log(price + 50);",
                options: [
                    {
                        id: "a",
                        text: "console.log is invalid"
                    },
                    {
                        id: "b",
                        text: "The code crashes"
                    },
                    {
                        id: "c",
                        text: "Price is stored as a string instead of number"
                    },
                    {
                        id: "d",
                        text: "Variables cannot store prices"
                    }
                ],
                correctAnswer: "c",
                explanation: "Because price is a string, JavaScript concatenates instead of adding numerically. Store prices as numbers for calculations."
            },
            {
                id: "sb1",
                questionNumber: 16,
                type: "Scenario-Based",
                points: 3,
                question: "A registration form stores a user's full name permanently after signup. The value should not change during execution.\n\nWhich declaration is best?",
                options: [
                    {
                        id: "a",
                        text: "const fullName"
                    },
                    {
                        id: "b",
                        text: "let fullName"
                    },
                    {
                        id: "c",
                        text: "var fullName"
                    },
                    {
                        id: "d",
                        text: "string fullName"
                    }
                ],
                correctAnswer: "a",
                explanation: "const is best when reassignment is unnecessary. It improves code safety and predictability."
            },
            {
                id: "sb2",
                questionNumber: 17,
                type: "Scenario-Based",
                points: 3,
                question: "An online shopping app calculates product totals using prices entered by users.\n\nWhich data type should product prices use?",
                options: [
                    {
                        id: "a",
                        text: "String"
                    },
                    {
                        id: "b",
                        text: "Number"
                    },
                    {
                        id: "c",
                        text: "Boolean"
                    },
                    {
                        id: "d",
                        text: "Undefined"
                    }
                ],
                correctAnswer: "b",
                explanation: "Prices require mathematical calculations, so numeric types are essential. Strings would create calculation errors."
            },
            {
                id: "sb3",
                questionNumber: 18,
                type: "Scenario-Based",
                points: 3,
                question: "A developer needs to track whether a user is logged in or not.\n\nWhich data type is most appropriate?",
                options: [
                    {
                        id: "a",
                        text: "String"
                    },
                    {
                        id: "b",
                        text: "Array"
                    },
                    {
                        id: "c",
                        text: "Boolean"
                    },
                    {
                        id: "d",
                        text: "Object"
                    }
                ],
                correctAnswer: "c",
                explanation: "Login status only requires true or false values. Boolean is the ideal choice for state tracking."
            }
        ]
    }
  ,
    visual: {
        visualExplanation: {
            visualOverview: {
                title: "Visual Guide to Variables and Data Type",
                description: "Visuals make abstract JavaScript concepts easier to understand by showing how variables store data and how different data types behave. Diagrams and flowcharts help learners see relationships, processes, and structures clearly.",
                learningStyle: "Visual learners will love this section!"
            },
            conceptDiagram: {
                title: "Concept Diagram",
                description: "This diagram shows how variables act as storage containers, data types define stored values, and JavaScript processes them. It visually connects declaration, storage, and usage.",
                components: [
                    {
                        id: "comp1",
                        name: "Variable Declaration",
                        description: "Represents creating a named storage container using let, const, or var.",
                        position: "top"
                    },
                    {
                        id: "comp2",
                        name: "Data Type Assignment",
                        description: "Represents assigning a value such as string, number, or boolean.",
                        position: "middle"
                    },
                    {
                        id: "comp3",
                        name: "Program Usage",
                        description: "Represents using stored data in calculations, logic, or output.",
                        position: "bottom"
                    }
                ],
                connections: [
                    {
                        from: "comp1",
                        to: "comp2",
                        label: "Stores"
                    },
                    {
                        from: "comp2",
                        to: "comp3",
                        label: "Processes"
                    }
                ],
                explanation: "Start from variable declaration at the top, then follow how data types define the stored value, and finally observe how the application uses that data. This creates a full concept lifecycle."
            },
            flowchartExplanation: {
                title: "Process Flowchart",
                description: "This flowchart shows the step-by-step process of creating and using variables in JavaScript. It explains how data moves from declaration to program output.",
                steps: [
                    {
                        id: "step1",
                        type: "start",
                        label: "Start Program",
                        description: "Begin writing JavaScript code."
                    },
                    {
                        id: "step2",
                        type: "process",
                        label: "Declare Variable",
                        description: "Create a variable using let, const, or var."
                    },
                    {
                        id: "step3",
                        type: "decision",
                        label: "Choose Correct Data Type?",
                        description: "Determine if the value should be text, number, or boolean.",
                        branches: [
                            "Yes",
                            "No"
                        ]
                    },
                    {
                        id: "step4",
                        type: "process",
                        label: "Assign and Use Value",
                        description: "Store data and apply it in logic or output."
                    },
                    {
                        id: "step5",
                        type: "end",
                        label: "Display Result",
                        description: "Show final output to user or system."
                    }
                ],
                explanation: "The process begins with declaration, checks for correct type usage, then moves to assignment and practical use. Proper data type decisions prevent future logic errors."
            },
            comparisonChart: {
                title: "Comparison Chart",
                description: "This chart compares var, let, and const to help learners choose the right declaration method. Understanding these differences improves code quality.",
                items: [
                    {
                        id: "item1",
                        name: "var",
                        pros: [
                            "Function scoped",
                            "Older browser support",
                            "Simple syntax"
                        ],
                        cons: [
                            "Can cause scope confusion",
                            "Allows redeclaration"
                        ],
                        useCase: "Use mainly for legacy code maintenance."
                    },
                    {
                        id: "item2",
                        name: "let",
                        pros: [
                            "Block scoped",
                            "Allows reassignment",
                            "Modern standard"
                        ],
                        cons: [
                            "Cannot redeclare in same scope",
                            "Slightly stricter behavior"
                        ],
                        useCase: "Use when values may change."
                    },
                    {
                        id: "item3",
                        name: "const",
                        pros: [
                            "Block scoped",
                            "Prevents reassignment",
                            "Improves code safety"
                        ],
                        cons: [
                            "Cannot be reassigned",
                            "Requires initialization"
                        ],
                        useCase: "Use for stable, fixed values."
                    }
                ]
            },
            timelineVisualization: {
                title: "Timeline Visualization",
                description: "This timeline shows the lifecycle of a variable from creation to execution. It helps learners understand runtime progression.",
                events: [
                    {
                        id: "event1",
                        time: "Phase 1",
                        event: "Declaration",
                        description: "The variable is created in memory. JavaScript reserves storage space."
                    },
                    {
                        id: "event2",
                        time: "Phase 2",
                        event: "Initialization",
                        description: "A value is assigned to the variable. Data type is determined."
                    },
                    {
                        id: "event3",
                        time: "Phase 3",
                        event: "Execution",
                        description: "The variable is used in logic, calculations, or display. Program functionality depends on this stage."
                    },
                    {
                        id: "event4",
                        time: "Phase 4",
                        event: "Memory Cleanup",
                        description: "Unused variables are removed by garbage collection. This optimizes memory."
                    }
                ]
            },
            architectureDiagram: {
                title: "Architecture Diagram",
                description: "This architecture shows how variables and data types interact across front-end application layers. It demonstrates storage, logic, and user presentation.",
                layers: [
                    {
                        id: "layer1",
                        name: "Input Layer",
                        description: "Collects user or system input values.",
                        components: [
                            "Forms",
                            "User Input Fields"
                        ]
                    },
                    {
                        id: "layer2",
                        name: "Logic Layer",
                        description: "Processes variables, validates data types, and performs calculations.",
                        components: [
                            "JavaScript Variables",
                            "Validation Functions"
                        ]
                    },
                    {
                        id: "layer3",
                        name: "Presentation Layer",
                        description: "Displays processed information to the user.",
                        components: [
                            "DOM Rendering",
                            "Console Output"
                        ]
                    }
                ],
                dataFlow: "Data enters through user input, gets processed by JavaScript logic, and is displayed through UI or console outputs. Each layer depends on accurate variable management."
            },
            mindMap: {
                title: "Mind Map",
                description: "This mind map organizes the major concepts related to JavaScript variables and data types. It provides a structured overview for easier revision.",
                centralConcept: "Variables and Data Type",
                branches: [
                    {
                        id: "branch1",
                        title: "Variable Types",
                        subtopics: [
                            "var",
                            "let",
                            "const"
                        ]
                    },
                    {
                        id: "branch2",
                        title: "Primitive Data Types",
                        subtopics: [
                            "String",
                            "Number",
                            "Boolean"
                        ]
                    },
                    {
                        id: "branch3",
                        title: "Advanced Types",
                        subtopics: [
                            "Object",
                            "Array",
                            "Null"
                        ]
                    },
                    {
                        id: "branch4",
                        title: "Best Practices",
                        subtopics: [
                            "Naming",
                            "Scope",
                            "Optimization"
                        ]
                    }
                ]
            },
            visualSummary: {
                title: "Visual Summary",
                keyVisualTakeaways: [
                    "Variables act as labeled storage boxes.",
                    "Data types define what kind of data is stored.",
                    "Correct declaration improves code safety.",
                    "Structured variable management supports scalable applications."
                ],
                visualLearningTips: [
                    "Use diagrams to connect declaration and execution flow.",
                    "Compare var, let, and const visually for easier recall.",
                    "Practice drawing your own variable lifecycle maps."
                ],
                nextSteps: "Apply these visuals while building real JavaScript projects. Continue exploring objects, arrays, and functions for deeper understanding."
            }
        }
    }
  ,
    visual: {
        visualExplanation: {
            visualOverview: {
                title: "Visual Guide to Variables and Data Type",
                description: "Visuals make abstract JavaScript concepts easier to understand by showing how variables store data and how different data types behave. Diagrams and flowcharts help learners see relationships, processes, and structures clearly.",
                learningStyle: "Visual learners will love this section!"
            },
            conceptDiagram: {
                title: "Concept Diagram",
                description: "This diagram shows how variables act as storage containers, data types define stored values, and JavaScript processes them. It visually connects declaration, storage, and usage.",
                components: [
                    {
                        id: "comp1",
                        name: "Variable Declaration",
                        description: "Represents creating a named storage container using let, const, or var.",
                        position: "top"
                    },
                    {
                        id: "comp2",
                        name: "Data Type Assignment",
                        description: "Represents assigning a value such as string, number, or boolean.",
                        position: "middle"
                    },
                    {
                        id: "comp3",
                        name: "Program Usage",
                        description: "Represents using stored data in calculations, logic, or output.",
                        position: "bottom"
                    }
                ],
                connections: [
                    {
                        from: "comp1",
                        to: "comp2",
                        label: "Stores"
                    },
                    {
                        from: "comp2",
                        to: "comp3",
                        label: "Processes"
                    }
                ],
                explanation: "Start from variable declaration at the top, then follow how data types define the stored value, and finally observe how the application uses that data. This creates a full concept lifecycle."
            },
            flowchartExplanation: {
                title: "Process Flowchart",
                description: "This flowchart shows the step-by-step process of creating and using variables in JavaScript. It explains how data moves from declaration to program output.",
                steps: [
                    {
                        id: "step1",
                        type: "start",
                        label: "Start Program",
                        description: "Begin writing JavaScript code."
                    },
                    {
                        id: "step2",
                        type: "process",
                        label: "Declare Variable",
                        description: "Create a variable using let, const, or var."
                    },
                    {
                        id: "step3",
                        type: "decision",
                        label: "Choose Correct Data Type?",
                        description: "Determine if the value should be text, number, or boolean.",
                        branches: [
                            "Yes",
                            "No"
                        ]
                    },
                    {
                        id: "step4",
                        type: "process",
                        label: "Assign and Use Value",
                        description: "Store data and apply it in logic or output."
                    },
                    {
                        id: "step5",
                        type: "end",
                        label: "Display Result",
                        description: "Show final output to user or system."
                    }
                ],
                explanation: "The process begins with declaration, checks for correct type usage, then moves to assignment and practical use. Proper data type decisions prevent future logic errors."
            },
            comparisonChart: {
                title: "Comparison Chart",
                description: "This chart compares var, let, and const to help learners choose the right declaration method. Understanding these differences improves code quality.",
                items: [
                    {
                        id: "item1",
                        name: "var",
                        pros: [
                            "Function scoped",
                            "Older browser support",
                            "Simple syntax"
                        ],
                        cons: [
                            "Can cause scope confusion",
                            "Allows redeclaration"
                        ],
                        useCase: "Use mainly for legacy code maintenance."
                    },
                    {
                        id: "item2",
                        name: "let",
                        pros: [
                            "Block scoped",
                            "Allows reassignment",
                            "Modern standard"
                        ],
                        cons: [
                            "Cannot redeclare in same scope",
                            "Slightly stricter behavior"
                        ],
                        useCase: "Use when values may change."
                    },
                    {
                        id: "item3",
                        name: "const",
                        pros: [
                            "Block scoped",
                            "Prevents reassignment",
                            "Improves code safety"
                        ],
                        cons: [
                            "Cannot be reassigned",
                            "Requires initialization"
                        ],
                        useCase: "Use for stable, fixed values."
                    }
                ]
            },
            timelineVisualization: {
                title: "Timeline Visualization",
                description: "This timeline shows the lifecycle of a variable from creation to execution. It helps learners understand runtime progression.",
                events: [
                    {
                        id: "event1",
                        time: "Phase 1",
                        event: "Declaration",
                        description: "The variable is created in memory. JavaScript reserves storage space."
                    },
                    {
                        id: "event2",
                        time: "Phase 2",
                        event: "Initialization",
                        description: "A value is assigned to the variable. Data type is determined."
                    },
                    {
                        id: "event3",
                        time: "Phase 3",
                        event: "Execution",
                        description: "The variable is used in logic, calculations, or display. Program functionality depends on this stage."
                    },
                    {
                        id: "event4",
                        time: "Phase 4",
                        event: "Memory Cleanup",
                        description: "Unused variables are removed by garbage collection. This optimizes memory."
                    }
                ]
            },
            architectureDiagram: {
                title: "Architecture Diagram",
                description: "This architecture shows how variables and data types interact across front-end application layers. It demonstrates storage, logic, and user presentation.",
                layers: [
                    {
                        id: "layer1",
                        name: "Input Layer",
                        description: "Collects user or system input values.",
                        components: [
                            "Forms",
                            "User Input Fields"
                        ]
                    },
                    {
                        id: "layer2",
                        name: "Logic Layer",
                        description: "Processes variables, validates data types, and performs calculations.",
                        components: [
                            "JavaScript Variables",
                            "Validation Functions"
                        ]
                    },
                    {
                        id: "layer3",
                        name: "Presentation Layer",
                        description: "Displays processed information to the user.",
                        components: [
                            "DOM Rendering",
                            "Console Output"
                        ]
                    }
                ],
                dataFlow: "Data enters through user input, gets processed by JavaScript logic, and is displayed through UI or console outputs. Each layer depends on accurate variable management."
            },
            mindMap: {
                title: "Mind Map",
                description: "This mind map organizes the major concepts related to JavaScript variables and data types. It provides a structured overview for easier revision.",
                centralConcept: "Variables and Data Type",
                branches: [
                    {
                        id: "branch1",
                        title: "Variable Types",
                        subtopics: [
                            "var",
                            "let",
                            "const"
                        ]
                    },
                    {
                        id: "branch2",
                        title: "Primitive Data Types",
                        subtopics: [
                            "String",
                            "Number",
                            "Boolean"
                        ]
                    },
                    {
                        id: "branch3",
                        title: "Advanced Types",
                        subtopics: [
                            "Object",
                            "Array",
                            "Null"
                        ]
                    },
                    {
                        id: "branch4",
                        title: "Best Practices",
                        subtopics: [
                            "Naming",
                            "Scope",
                            "Optimization"
                        ]
                    }
                ]
            },
            visualSummary: {
                title: "Visual Summary",
                keyVisualTakeaways: [
                    "Variables act as labeled storage boxes.",
                    "Data types define what kind of data is stored.",
                    "Correct declaration improves code safety.",
                    "Structured variable management supports scalable applications."
                ],
                visualLearningTips: [
                    "Use diagrams to connect declaration and execution flow.",
                    "Compare var, let, and const visually for easier recall.",
                    "Practice drawing your own variable lifecycle maps."
                ],
                nextSteps: "Apply these visuals while building real JavaScript projects. Continue exploring objects, arrays, and functions for deeper understanding."
            }
        }
    }
  ,
    visualExplanation: {
        conceptVisualIntro: {
            badge: "Visual Learning",
            headline: "Visual Guide to Variables and Data Type",
            visualDefinition: "Visuals make abstract JavaScript concepts easier to understand by showing how variables store data and how different data types behave. Diagrams and flowcharts help learners see relationships, processes, and structures clearly.",
            heroDiagramPreview: "Visual learners will love this section!",
            importanceBlock: "Visual understanding helps you see relationships and patterns more clearly.",
            progressIndicator: "Follow along with diagrams and visual aids"
        },
        diagrammaticBreakdown: {
            title: "Concept Diagram",
            diagramTitle: "Concept Diagram",
            componentLabels: [
                {
                    id: "comp1",
                    label: "Variable Declaration",
                    description: "Represents creating a named storage container using let, const, or var."
                },
                {
                    id: "comp2",
                    label: "Data Type Assignment",
                    description: "Represents assigning a value such as string, number, or boolean."
                },
                {
                    id: "comp3",
                    label: "Program Usage",
                    description: "Represents using stored data in calculations, logic, or output."
                }
            ],
            stepMarkers: [
                "comp1 → comp2: Stores",
                "comp2 → comp3: Processes"
            ],
            technicalTooltips: [
                {
                    id: "comp1",
                    term: "Variable Declaration",
                    explanation: "Represents creating a named storage container using let, const, or var."
                },
                {
                    id: "comp2",
                    term: "Data Type Assignment",
                    explanation: "Represents assigning a value such as string, number, or boolean."
                },
                {
                    id: "comp3",
                    term: "Program Usage",
                    explanation: "Represents using stored data in calculations, logic, or output."
                }
            ]
        },
        stepByStepVisualFlow: {
            title: "Process Flowchart",
            sequenceTitle: "This flowchart shows the step-by-step process of creating and using variables in JavaScript. It explains how data moves from declaration to program output.",
            steps: [
                {
                    id: "step1",
                    stepNumber: 1,
                    title: "Start Program",
                    description: "Begin writing JavaScript code.",
                    visualCue: "start: Start Program"
                },
                {
                    id: "step2",
                    stepNumber: 2,
                    title: "Declare Variable",
                    description: "Create a variable using let, const, or var.",
                    visualCue: "process: Declare Variable"
                },
                {
                    id: "step3",
                    stepNumber: 3,
                    title: "Choose Correct Data Type?",
                    description: "Determine if the value should be text, number, or boolean.",
                    visualCue: "decision: Choose Correct Data Type?"
                },
                {
                    id: "step4",
                    stepNumber: 4,
                    title: "Assign and Use Value",
                    description: "Store data and apply it in logic or output.",
                    visualCue: "process: Assign and Use Value"
                },
                {
                    id: "step5",
                    stepNumber: 5,
                    title: "Display Result",
                    description: "Show final output to user or system.",
                    visualCue: "end: Display Result"
                }
            ],
            phaseExplanations: [
                "The process begins with declaration, checks for correct type usage, then moves to assignment and practical use. Proper data type decisions prevent future logic errors."
            ]
        },
        comparativeVisualization: {
            title: "Comparison Chart",
            comparisonTitle: "This chart compares var, let, and const to help learners choose the right declaration method. Understanding these differences improves code quality.",
            sideBySideVisuals: {
                option1: {
                    title: "var",
                    description: "Use mainly for legacy code maintenance.",
                    pros: [
                        "Function scoped",
                        "Older browser support",
                        "Simple syntax"
                    ],
                    cons: [
                        "Can cause scope confusion",
                        "Allows redeclaration"
                    ]
                },
                option2: {
                    title: "let",
                    description: "Use when values may change.",
                    pros: [
                        "Block scoped",
                        "Allows reassignment",
                        "Modern standard"
                    ],
                    cons: [
                        "Cannot redeclare in same scope",
                        "Slightly stricter behavior"
                    ]
                }
            },
            differenceHighlights: [
                "var: Use mainly for legacy code maintenance.",
                "let: Use when values may change.",
                "const: Use for stable, fixed values."
            ]
        },
        mentalModelVisualization: {
            title: "Mind Map",
            frameworkMap: {
                nodes: [
                    {
                        id: "central",
                        label: "Variables and Data Type",
                        description: "This mind map organizes the major concepts related to JavaScript variables and data types. It provides a structured overview for easier revision.",
                        type: "core"
                    },
                    {
                        id: "branch1",
                        label: "Variable Types",
                        description: "var, let, const",
                        type: "supporting"
                    },
                    {
                        id: "branch2",
                        label: "Primitive Data Types",
                        description: "String, Number, Boolean",
                        type: "supporting"
                    },
                    {
                        id: "branch3",
                        label: "Advanced Types",
                        description: "Object, Array, Null",
                        type: "supporting"
                    },
                    {
                        id: "branch4",
                        label: "Best Practices",
                        description: "Naming, Scope, Optimization",
                        type: "supporting"
                    }
                ],
                connections: [
                    {
                        from: "central",
                        to: "branch1",
                        label: "relates to",
                        type: "primary"
                    },
                    {
                        from: "central",
                        to: "branch2",
                        label: "relates to",
                        type: "primary"
                    },
                    {
                        from: "central",
                        to: "branch3",
                        label: "relates to",
                        type: "primary"
                    },
                    {
                        from: "central",
                        to: "branch4",
                        label: "relates to",
                        type: "primary"
                    }
                ]
            },
            memoryLabels: [
                "Variable Types",
                "Primitive Data Types",
                "Advanced Types",
                "Best Practices"
            ]
        },
        realWorldVisualMapping: {
            title: "Architecture Diagram",
            practicalScenarios: [
                {
                    id: "layer1",
                    title: "Input Layer",
                    description: "Collects user or system input values.",
                    industryContext: "Forms, User Input Fields",
                    visualRepresentation: "Data enters through user input, gets processed by JavaScript logic, and is displayed through UI or console outputs. Each layer depends on accurate variable management.",
                    icon: "Layers"
                },
                {
                    id: "layer2",
                    title: "Logic Layer",
                    description: "Processes variables, validates data types, and performs calculations.",
                    industryContext: "JavaScript Variables, Validation Functions",
                    visualRepresentation: "Data enters through user input, gets processed by JavaScript logic, and is displayed through UI or console outputs. Each layer depends on accurate variable management.",
                    icon: "Layers"
                },
                {
                    id: "layer3",
                    title: "Presentation Layer",
                    description: "Displays processed information to the user.",
                    industryContext: "DOM Rendering, Console Output",
                    visualRepresentation: "Data enters through user input, gets processed by JavaScript logic, and is displayed through UI or console outputs. Each layer depends on accurate variable management.",
                    icon: "Layers"
                }
            ],
            careerRelevance: "Understanding architecture is crucial for system design roles"
        },
        commonConfusionVisualization: {
            title: "Timeline of Events",
            confusionItems: [
                {
                    id: "event1",
                    confusion: "Phase: Phase 1",
                    visualClarification: "Declaration",
                    correctVisualization: "The variable is created in memory. JavaScript reserves storage space."
                },
                {
                    id: "event2",
                    confusion: "Phase: Phase 2",
                    visualClarification: "Initialization",
                    correctVisualization: "A value is assigned to the variable. Data type is determined."
                },
                {
                    id: "event3",
                    confusion: "Phase: Phase 3",
                    visualClarification: "Execution",
                    correctVisualization: "The variable is used in logic, calculations, or display. Program functionality depends on this stage."
                },
                {
                    id: "event4",
                    confusion: "Phase: Phase 4",
                    visualClarification: "Memory Cleanup",
                    correctVisualization: "Unused variables are removed by garbage collection. This optimizes memory."
                }
            ],
            faqItems: [],
            misconceptionDiagrams: []
        },
        visualSummary: {
            summaryTitle: "Visual Summary",
            keyVisualTakeaways: [
                "Variables act as labeled storage boxes.",
                "Data types define what kind of data is stored.",
                "Correct declaration improves code safety.",
                "Structured variable management supports scalable applications."
            ],
            revisionInfographic: "Apply these visuals while building real JavaScript projects. Continue exploring objects, arrays, and functions for deeper understanding.",
            memoryReinforcement: "Use diagrams to connect declaration and execution flow. Compare var, let, and const visually for easier recall. Practice drawing your own variable lifecycle maps.",
            examVisualChecklist: [
                "Variables act as labeled storage boxes.",
                "Data types define what kind of data is stored.",
                "Correct declaration improves code safety.",
                "Structured variable management supports scalable applications."
            ]
        }
    }
  ,
    practiceTest: {
        assessmentIntro: {
            badge: "Practice Test",
            headline: "Variables and Data Type - Comprehensive Practice Test",
            testDescription: "This practice test covers theoretical concepts, practical implementation, debugging, code analysis, performance optimization, and best practices for JavaScript variables and data types. It is designed to simulate real exam-style assessments while strengthening both conceptual and applied knowledge.",
            difficultyOverview: "Difficulty: mixed",
            learningGoals: [
                "Test your understanding",
                "Identify knowledge gaps",
                "Practice for exams"
            ],
            readinessIndicator: "30 questions, 45 minutes"
        },
        conceptRecallQuestions: {
            title: "Concept Recall Questions",
            questions: [
                {
                    id: "theory1",
                    questionNumber: 1,
                    type: "single-choice",
                    points: 5,
                    question: "Which keyword should be used when a variable value will never change?",
                    options: [
                        {
                            id: "a",
                            text: "const"
                        },
                        {
                            id: "b",
                            text: "let"
                        },
                        {
                            id: "c",
                            text: "var"
                        },
                        {
                            id: "d",
                            text: "static"
                        }
                    ],
                    correctAnswer: "a",
                    explanation: "const creates a variable reference that cannot be reassigned after initialization. It improves code safety and predictability. Modern JavaScript strongly encourages const when values remain stable.",
                    difficulty: "easy"
                },
                {
                    id: "theory2",
                    questionNumber: 1,
                    type: "single-choice",
                    points: 5,
                    question: "What is JavaScript's type system?",
                    options: [
                        {
                            id: "a",
                            text: "Static typing"
                        },
                        {
                            id: "b",
                            text: "Dynamic typing"
                        },
                        {
                            id: "c",
                            text: "Manual typing"
                        },
                        {
                            id: "d",
                            text: "Compiled typing"
                        }
                    ],
                    correctAnswer: "b",
                    explanation: "JavaScript uses dynamic typing, meaning variable types can change during execution. This provides flexibility but can introduce type-related bugs if not managed carefully.",
                    difficulty: "medium"
                },
                {
                    id: "theory3",
                    questionNumber: 1,
                    type: "single-choice",
                    points: 5,
                    question: "What does typeof null return in JavaScript?",
                    options: [
                        {
                            id: "a",
                            text: "null"
                        },
                        {
                            id: "b",
                            text: "undefined"
                        },
                        {
                            id: "c",
                            text: "object"
                        },
                        {
                            id: "d",
                            text: "boolean"
                        }
                    ],
                    correctAnswer: "c",
                    explanation: "typeof null returns object due to a historical JavaScript bug. This behavior remains for backward compatibility. Developers must explicitly check for null values.",
                    difficulty: "hard"
                },
                {
                    id: "analysis1",
                    questionNumber: 4,
                    type: "single-choice",
                    points: 10,
                    question: "What is the output?",
                    code: "let price = 100;\nlet tax = 20;\nconsole.log(price + tax);",
                    options: [
                        {
                            id: "a",
                            text: "120"
                        },
                        {
                            id: "b",
                            text: "10020"
                        },
                        {
                            id: "c",
                            text: "NaN"
                        },
                        {
                            id: "d",
                            text: "undefined"
                        }
                    ],
                    correctAnswer: "a",
                    explanation: "Both variables are numbers, so JavaScript performs numeric addition. The result is 120. Correct typing ensures proper calculations.",
                    difficulty: "medium"
                },
                {
                    id: "analysis2",
                    questionNumber: 4,
                    type: "single-choice",
                    points: 10,
                    question: "What is the output?",
                    code: "let value = \"10\";\nconsole.log(value + 5);",
                    options: [
                        {
                            id: "a",
                            text: "15"
                        },
                        {
                            id: "b",
                            text: "105"
                        },
                        {
                            id: "c",
                            text: "NaN"
                        },
                        {
                            id: "d",
                            text: "Error"
                        }
                    ],
                    correctAnswer: "b",
                    explanation: "Because value is a string, JavaScript concatenates instead of adding numerically. This demonstrates type coercion behavior.",
                    difficulty: "hard"
                },
                {
                    id: "debug1",
                    questionNumber: 6,
                    type: "single-choice",
                    points: 15,
                    question: "Identify and fix the bug",
                    code: "const age = 25;\nage = 30;",
                    options: [
                        {
                            id: "a",
                            text: "Replace const with let"
                        },
                        {
                            id: "b",
                            text: "Use string age"
                        },
                        {
                            id: "c",
                            text: "Remove semicolon"
                        },
                        {
                            id: "d",
                            text: "Use boolean age"
                        }
                    ],
                    correctAnswer: "a",
                    explanation: "const variables cannot be reassigned. Since age changes, let is the correct choice. This prevents reassignment errors.",
                    difficulty: "hard"
                },
                {
                    id: "debug2",
                    questionNumber: 6,
                    type: "single-choice",
                    points: 15,
                    question: "Identify and fix the bug",
                    code: "let userName = Alice;",
                    options: [
                        {
                            id: "a",
                            text: "Replace let with const"
                        },
                        {
                            id: "b",
                            text: "Wrap Alice in quotes"
                        },
                        {
                            id: "c",
                            text: "Convert to boolean"
                        },
                        {
                            id: "d",
                            text: "Use var only"
                        }
                    ],
                    correctAnswer: "b",
                    explanation: "Alice without quotes is treated as an undefined identifier. Strings must be enclosed in quotes. This is a common beginner syntax mistake.",
                    difficulty: "medium"
                }
            ]
        },
        scenarioBasedQuestions: {
            title: "Scenario-Based Questions",
            scenarios: [
                {
                    id: "prac1",
                    scenarioTitle: "A shopping cart system stores product names, prices, and stock availability. These values need accurate calculations and display.",
                    realWorldProblem: "A shopping cart system stores product names, prices, and stock availability. These values need accurate calculations and display.",
                    businessContext: "Real-world application",
                    decisionQuestion: "Which data types should be used?",
                    options: [
                        {
                            id: "a",
                            text: "String for names, Number for prices, Boolean for stock"
                        },
                        {
                            id: "b",
                            text: "String for all values"
                        },
                        {
                            id: "c",
                            text: "Boolean for all values"
                        },
                        {
                            id: "d",
                            text: "Object for all values only"
                        }
                    ],
                    correctAnswer: "a",
                    explanation: "Textual names require strings, prices require numbers for calculations, and stock status uses booleans for true/false tracking. Proper typing improves reliability and prevents logical errors.",
                    difficulty: "medium"
                },
                {
                    id: "prac2",
                    scenarioTitle: "A banking application processes balances and account status for thousands of users.",
                    realWorldProblem: "A banking application processes balances and account status for thousands of users.",
                    businessContext: "Real-world application",
                    decisionQuestion: "What is the best declaration strategy?",
                    options: [
                        {
                            id: "a",
                            text: "Use var for all variables"
                        },
                        {
                            id: "b",
                            text: "Use const for fixed values and let for changing balances"
                        },
                        {
                            id: "c",
                            text: "Use strings for balances"
                        },
                        {
                            id: "d",
                            text: "Avoid variable declarations"
                        }
                    ],
                    correctAnswer: "b",
                    explanation: "Stable references should use const, while values that change require let. This improves maintainability, scope safety, and performance in production systems.",
                    difficulty: "hard"
                }
            ]
        },
        difficultyProgression: {
            title: "Difficulty Levels",
            levels: [
                {
                    id: "beginner",
                    level: "beginner",
                    description: "Basic concepts",
                    questionCount: 2,
                    passingScore: 70
                },
                {
                    id: "intermediate",
                    level: "intermediate",
                    description: "Applied knowledge",
                    questionCount: 2,
                    passingScore: 75
                },
                {
                    id: "advanced",
                    level: "advanced",
                    description: "Advanced concepts",
                    questionCount: 1,
                    passingScore: 80
                }
            ],
            adaptiveLogic: false
        },
        instantFeedback: {
            enabled: true,
            feedbackType: "immediate"
        },
        commonMistakeDetection: {
            title: "Common Mistakes",
            mistakeCategories: [
                {
                    id: "cm1",
                    category: "Conceptual misunderstanding",
                    description: "Misunderstanding core concepts",
                    frequency: 40
                },
                {
                    id: "cm2",
                    category: "Syntax errors",
                    description: "Common syntax mistakes",
                    frequency: 30
                },
                {
                    id: "cm3",
                    category: "Logic errors",
                    description: "Incorrect problem-solving approach",
                    frequency: 30
                }
            ],
            weaknessHeatmap: {
                topics: [
                    {
                        id: "topic1",
                        topic: "Core Concepts",
                        score: 75,
                        status: "moderate"
                    }
                ]
            }
        },
        performanceAnalytics: {
            title: "Your Performance",
            scoreDisplay: {
                currentScore: 0,
                maxScore: 65,
                percentage: 0
            },
            performanceGraphs: {
                accuracyTrend: [
                    0,
                    0,
                    0,
                    0,
                    0
                ],
                speedTrend: [
                    0,
                    0,
                    0,
                    0,
                    0
                ]
            },
            benchmarkComparison: {
                userScore: 0,
                averageScore: 70,
                topScore: 95
            },
            masteryPercentage: 0,
            examReadinessScore: 0
        },
        revisionRecommendations: {
            title: "Personalized Learning Path",
            personalizedLearningPath: [
                {
                    id: "rec1",
                    topic: "Review weak areas",
                    priority: "high",
                    estimatedTime: "30 minutes",
                    resources: [
                        "Notes Section",
                        "Code Examples"
                    ]
                }
            ],
            weaknessRecoverySteps: [
                "Review the concepts you struggled with",
                "Practice with additional examples",
                "Retake the test to measure improvement"
            ],
            recommendedResources: [
                {
                    id: "res1",
                    title: "Review Notes",
                    type: "article",
                    link: "/notes"
                }
            ],
            futureGoals: [
                "Master all concepts",
                "Achieve 90%+ score",
                "Move to advanced topics"
            ]
        }
    }
  }};

/**
 * Get content for a subtopic
 * Returns undefined if subtopic not found - no fallback
 */
export function getSubtopicContent(subtopicId: string): SubtopicContentPattern | undefined {
  return subtopicContentRegistry[subtopicId];
}

