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
  laymanExplanation: {
    badge: string;
    title: string;
    intro: string;
    mainConcept: {
      title: string;
      description: string;
      example: string;
      image: string;
    };
    reasonGrid: Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
    }>;
    typesTable: Array<{
      id: string;
      label: string;
      description: string;
      example: string;
      icon: string;
      iconBg: string;
    }>;
    footerTip: string;
  };
  realLifeExamples: {
    title: string;
    intro: string;
    hero: {
      badge: string;
      title: string;
      description: string;
      highlight: string;
      image: string;
    };
    scenarios: Array<{
      id: string;
      title: string;
      description: string;
      footer: string;
      image: string;
    }>;
    walkthrough: {
      title: string;
      subtitle: string;
      steps: Array<{
        id: string;
        title: string;
        description: string;
        icon: string;
      }>;
      footer: string;
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
    laymanExplanation: {
      badge: 'Layman Explanation',
      title: 'Component Architecture in React',
      intro: "Let's understand component architecture in the most simple way possible, without any technical jargon. Imagine you are building a castle with LEGO bricks.",
      mainConcept: {
        title: 'A component is like a',
        description: 'LEGO brick.',
        example: 'Example: A brick named "Button" can be used on the login page today and the signup page tomorrow.',
        image: '/lego_component_architecture.png'
      },
      reasonGrid: [
        { id: 'rg1', title: 'Reusable Pieces', description: 'Use the same "brick" multiple times.', icon: 'Package' },
        { id: 'rg2', title: 'Easy to Swap', description: 'Change or fix one part without breaking others.', icon: 'RefreshCw' },
        { id: 'rg3', title: 'Better Teamwork', description: 'Everyone can build different bricks at once.', icon: 'Users' },
        { id: 'rg4', title: 'Smart Structure', description: 'Keeps your code organized and clean.', icon: 'Zap' }
      ],
      typesTable: [
        { id: 't1', label: 'Atoms', description: 'Smallest pieces (Button, Input)', example: '"Button"', icon: 'Type', iconBg: 'bg-orange-500' },
        { id: 't2', label: 'Molecules', description: 'Groups of atoms (Search Bar)', example: 'SearchForm', icon: 'Binary', iconBg: 'bg-blue-500' },
        { id: 't3', label: 'Organisms', description: 'Complex parts (Navbar, Sidebar)', example: 'Navbar', icon: 'CheckCircle2', iconBg: 'bg-emerald-500' },
        { id: 't4', label: 'Templates', description: 'Page layouts (Grid, Header)', example: 'Dashboard', icon: 'LayoutList', iconBg: 'bg-purple-500' },
        { id: 't5', label: 'Pages', description: 'The whole screen (Home Page)', example: '{ name: "Home" }', icon: 'Code2', iconBg: 'bg-rose-500' }
      ],
      footerTip: 'Think of components as a library of parts you can combine to build anything.'
    },
    realLifeExamples: {
      title: 'Real Life Example',
      intro: "Let's understand Component Architecture with real life situations around us.",
      hero: {
        badge: 'Think of a Component as...',
        title: 'A Modular Kitchen Assembly',
        description: "When you buy a modular kitchen, you don't build every shelf from scratch. You choose pre-made cabinets (components) and arrange them to fit your space. Each cabinet comes with its own doors and handles already attached.",
        highlight: 'You just choose the cabinets. The kitchen structure is done for you!',
        image: '/modular_kitchen.png'
      },
      scenarios: [
        { id: 'rs1', title: 'Modular Furniture', description: 'IKEA parts that fit together perfectly to build a chair.', footer: 'You Connect -> It Works', image: '/modular_furniture.png' },
        { id: 'rs2', title: 'PC Components', description: 'RAM and GPU are components that plug into a motherboard.', footer: 'You Plug -> It Executes', image: '/pc_components.png' },
        { id: 'rs3', title: 'Traffic Lights', description: 'One standard design used at every intersection in the city.', footer: 'One Design -> Many Places', image: '/traffic_light.png' },
        { id: 'rs4', title: 'Vending Machines', description: 'Keypads and screens are reused parts of the machine.', footer: 'One Part -> Multiple Uses', image: '/vending_machine.png' }
      ],
      walkthrough: {
        title: "Let's Walk Through This",
        subtitle: 'Building a Social Media Feed',
        steps: [
          { id: 'st1', title: 'Identify Parts', description: 'Break the feed design into buttons and cards.', icon: 'PencilLine' },
          { id: 'st2', title: 'Build Bricks', description: 'Create individual components for each piece.', icon: 'Package' },
          { id: 'st3', title: 'Assemble Page', description: 'Combine pieces to form the full layout.', icon: 'Layers' },
          { id: 'st4', title: 'Live Interface', description: 'The user sees a complete, interactive feed.', icon: 'Monitor' }
        ],
        footer: 'Components help us build complex apps by combining simple, reusable parts!'
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
