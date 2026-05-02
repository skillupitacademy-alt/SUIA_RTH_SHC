import { BrandConfig } from './brandConfig';

export interface LearningPathItem {
  id: string;
  label: string;
  status: 'active' | 'completed' | 'pending' | 'locked';
  icon: string;
}

export interface RelatedSubtopic {
  id: string;
  title: string;
  status: 'next' | 'default';
}

export interface SubtopicNotesViewData {
  nav: {
    courseLabel: string;
    lessonLabel: string;
    dashboardCtaLabel: string;
    streak: number;
    xpPoints: number;
    learnerInitials: string;
  };
  leftSidebar: {
    title: string;
    items: LearningPathItem[];
    progress: {
      percentage: number;
      message: string;
    };
  };
  mainContent: {
    breadcrumbs: string[];
    title: string;
    meta: {
      readTime: string;
      level: string;
      xp: number;
    };
    simpleWords: string;
    sections: {
      id: string;
      title: string;
      content: string;
      keyPoint?: string;
      codeExample?: {
        code: string;
        output: string;
      };
    }[];
    laymanExplanation?: {
      badge: string;
      title: string;
      intro: string;
      mainConcept: {
        title: string;
        description: string;
        example: string;
        image: string;
      };
      reasonGrid: {
        id: string;
        title: string;
        description: string;
        icon: string;
      }[];
      typesTable: {
        id: string;
        label: string;
        description: string;
        example: string;
        icon: string;
        iconBg: string;
      }[];
      footerTip: string;
    };
    realLifeExamples?: {
      title: string;
      intro: string;
      hero: {
        badge: string;
        title: string;
        description: string;
        highlight: string;
        image: string;
      };
      scenarios: {
        id: string;
        title: string;
        description: string;
        footer: string;
        image: string;
      }[];
      walkthrough: {
        title: string;
        subtitle: string;
        steps: {
          id: string;
          title: string;
          description: string;
          icon: string;
        }[];
        footer: string;
      };
    };
    technicalDeepDive?: {
      title: string;
      badge: string;
      intro: string;
      sections: {
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
      }[];
    };
  };
  rightSidebar: {
    aiTutor: {
      title: string;
      messages: { text: string; time: string; sender: 'user' | 'bot' }[];
      inputPlaceholder: string;
    };
    courseProgress: {
      percentage: number;
      courseName: string;
      label: string;
    };
    xpStats: {
      earned: number;
      total: number;
    };
    relatedSubtopics: RelatedSubtopic[];
    laymanSidebar?: {
      quickSummary: string[];
      keyTerms: { term: string; definition: string }[];
      readingTime: string;
      thinkAboutIt: string;
    };
    deepDiveSidebar?: {
      onThisPage: { id: string; label: string }[];
      quickLinks: { id: string; label: string; icon: string }[];
    };
  };
}

export async function loadSubtopicNotesData(brand: BrandConfig): Promise<SubtopicNotesViewData> {
  return {
    nav: {
      courseLabel: 'React Development',
      lessonLabel: 'React Basics',
      dashboardCtaLabel: 'Dashboard',
      streak: 7,
      xpPoints: 2450,
      learnerInitials: 'AJ',
    },
    leftSidebar: {
      title: 'Learning Path',
      items: [
        { id: 'overview', label: 'Overview', status: 'pending', icon: 'Circle' },
        { id: 'notes', label: 'Notes', status: 'active', icon: 'FileText' },
        { id: 'layman', label: 'Layman Explanation', icon: 'Zap', status: 'completed' },
        { id: 'real-life', label: 'Real Life Examples', icon: 'Globe', status: 'completed' },
        { id: 'technical-deep-dive', label: 'Technical Deep Dive', icon: 'Cpu', status: 'completed' },
        { id: 'code-example', label: 'Code Example', icon: 'Code', status: 'completed' },
        { id: 'assignments', label: 'Assignments', status: 'completed', icon: 'FileCheck' },
        { id: 'project', label: 'Projects', icon: 'Briefcase', status: 'completed' },
        { id: 'quiz', label: 'Quiz', status: 'active', icon: 'HelpCircle' },
        { id: 'ai-tutor', label: brand.tutorLabel, status: 'pending', icon: 'Circle' },
        { id: 'progress', label: 'Progress Tracker', status: 'pending', icon: 'TrendingUp' },
      ],
      progress: {
        percentage: 35,
        message: "Keep going! You're making great progress."
      }
    },
    mainContent: {
      breadcrumbs: ['Home', 'React', 'React Basics', 'Components', 'Component Architecture'],
      title: 'Component Architecture in React',
      meta: {
        readTime: '10 min read',
        level: 'Intermediate',
        xp: 50
      },
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
      }
    },
    rightSidebar: {
      aiTutor: {
        title: `${brand.tutorLabel || 'Tutor'} (Ask Anything)`,
        messages: [
          { text: 'What is component architecture?', time: '2:30 PM', sender: 'user' },
          { text: 'Component architecture is a way to handle scalable applications by organizing code into independent components. Would you like to see an example?', time: '2:30 PM', sender: 'bot' }
        ],
        inputPlaceholder: 'Ask a follow-up...'
      },
      courseProgress: {
        percentage: 65,
        courseName: 'React Basics',
        label: '65% Completed'
      },
      xpStats: {
        earned: 50,
        total: 2450
      },
      relatedSubtopics: [
        { id: 'rs1', title: 'Props and State', status: 'next' },
        { id: 'rs2', title: 'Component Lifecycle', status: 'default' },
        { id: 'rs3', title: 'Hooks API', status: 'default' },
      ],
      laymanSidebar: {
        quickSummary: [
          'A component is like a Lego brick.',
          'It is a self-contained piece of UI.',
          'You can reuse it anywhere.',
          'It makes code cleaner and easier to fix.'
        ],
        keyTerms: [
          { term: 'Component', definition: 'A reusable building block' },
          { term: 'Props', definition: 'Data passed into a component' },
          { term: 'State', definition: 'Internal data of a component' },
          { term: 'Atom', definition: 'The smallest possible piece' },
          { term: 'Molecule', definition: 'A group of atoms working together' }
        ],
        readingTime: '5 - 7 minutes',
        thinkAboutIt: "If you could build your entire website using only 5 types of bricks, which ones would they be? That's the power of atomic design!"
      }
    }
  };
}
