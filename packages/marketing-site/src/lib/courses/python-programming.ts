import { Course } from '../CoursesCardData';
import { FaTerminal } from 'react-icons/fa';

export const pythonProgrammingCourse: Course =   {
    id: 4,
    category: "Development",
    format: "LIVE ONLINE",
    title: "Python Programming",
    description:
      "Master Python from fundamentals to advanced concepts with real-world projects.",
    features: [
      "Python Fundamentals",
      "Data Structures",
      "OOP & Functional Programming",
      "File Handling",
      "Libraries",
      "Projects"
    ],
    image: "/Eighth.webp",
    slug: "python-programming",
    icon: FaTerminal,
    heroSubtitle: "with AI",
    heroDescription: "Master Python, Django, React, FastAPI, Docker, AWS & cutting-edge AI/ML integration.",
    heroSubDescription: "Build production-grade applications and land high-paying jobs at top tech companies.",
    companies: ["Google", "Microsoft", "Amazon", "TCS", "Infosys", "Wipro"],
    ctaButtons: {
      primary: "Enroll Now - Limited Seats",
      secondary: "Explore Full Curriculum"
    },

    assessmentCertification: {
      assessmentCards: [
        {
          id: 0,
          title: 'Weekly Assignments',
          description: 'Hands-on coding tasks and exercises after each concept to reinforce learning',
          features: [
            'Weekly Evaluations',
            'Automated Testing',
            'Progress Tracking'
          ],
          backContent: {
            points: [
              'Python coding exercises after every module',
              'Progress tracking dashboard',
              'Automated test case evaluation',
              'Real-world problem solving with Python',
              'Concept application tasks'
            ],
            frequency: 'Every Week',
            weightage: '20% of final grade'
          }
        },
        {
          id: 1,
          title: 'Module Assessments',
          description: 'Comprehensive assessments for each module to validate understanding',
          features: [
            'MCQ + Coding Challenges',
            'Skill Gap Analysis',
            'Detailed Reports'
          ],
          backContent: {
            points: [
              'MCQ + Python coding challenges',
              'Problem-solving assessments',
              'Detailed performance reports',
              'Skill gap analysis',
              'Module Tests validation'
            ],
            frequency: 'After Each Module',
            weightage: '30% of final grade'
          }
        },
        {
          id: 2,
          title: 'Project Evaluations',
          description: 'Comprehensive review of real-world Python projects with detailed feedback',
          features: [
            'Architecture Review',
            'Best Practices Check',
            'Deployment Ready'
          ],
          backContent: {
            points: [
              'Python project architecture evaluation',
              'Django/FastAPI best practices assessment',
              'Deployment readiness check',
              'Code quality and functionality testing',
              'AI integration evaluation'
            ],
            frequency: 'Per Project',
            weightage: '40% of final grade'
          }
        },
        {
          id: 3,
          title: 'Certification Benefits',
          description: 'Industry-recognized certificate with global recognition',
          features: [
            'Industry Recognized',
            'Global Validity',
            'Hiring Partner Access'
          ],
          backContent: {
            points: [
              'Industry-recognized certificate',
              'Global recognition',
              'Hiring partner acceptance',
              'Decisions network access',
              'Verified skills validation'
            ],
            frequency: 'Program Completion',
            weightage: 'Official Certification'
          }
        }
      ],
      certificateData: {
        title: 'Industry-Recognized Certification',
        description: 'Our certificate validates your Python and AI skills and demonstrates your competency to employers worldwide.',
        benefits: [
          'Industry-recognized certificate',
          'Global recognition and validity',
          'Hiring partner acceptance',
          'Decisions network access',
          'Verified by industry experts',
          'Includes digital badge for LinkedIn'
        ],
        certificateDetails: {
          title: 'Certificate of Completion',
          subtitle: 'Full-Stack Python Development',
          subSubtitle: 'Covering Python, Django, FastAPI, REST APIs, Database Management, Frontend Development, AI Integration, Machine Learning, Cloud Deployment, and Real-World Full Stack AI Application Projects.',
          rating: 5
        }
      }
    },

    curriculum: {
      title: "Comprehensive Curriculum",
      description: "6–8 Months • 600–700 Hours",
      phases: [
        {
          id: 0,
          title: "Phase 1",
          subtitle: "Python Fundamentals & Core Concepts",
          icon: "Code",
          duration: "8-10 Weeks",
          gradient: "from-blue-500 to-indigo-600",
          bgColor: "bg-gradient-to-br from-blue-200 to-indigo-200",
          borderColor: "border-blue-700",
          topics: [
            {
              title: "Python Basics (4–5 Weeks)",
              color: "blue-500",
              items: [
                "Python Installation, virtual environments, IDEs (PyCharm, VS Code)",
                "Data types, variables, operators, control structures",
                "OOP principles: Classes, Objects, Inheritance, Polymorphism",
                "Exception handling and debugging",
                "Data structures: Lists, Tuples, Sets, Dictionaries",
                "File I/O operations",
                "Functional programming with Python",
                "Python 3.10+ features: Pattern matching, type hints"
              ]
            },
            {
              title: "Advanced Python & Design Patterns (4–5 Weeks)",
              color: "indigo-500",
              items: [
                "SOLID principles and clean code practices",
                "Design Patterns: Singleton, Factory, Builder, Observer, Strategy, MVC",
                "Database connectivity with SQLAlchemy",
                "Unit testing with pytest and unittest",
                "pip and poetry for dependency management",
                "Git version control and GitHub workflow",
                "Web scraping with BeautifulSoup and Requests"
              ]
            }
          ],
          projects: [
            {
              title: "Mini Project:",
              description: "Console-based application (Survey Management/Banking System)",
              color: "blue"
            },
            {
              title: "Advanced Project:",
              description: "Multi-threaded application with database integration",
              color: "indigo"
            }
          ]
        },
        {
          id: 1,
          title: "Phase 2",
          subtitle: "Backend Development with Django & FastAPI",
          icon: "Server",
          duration: "6-7 Weeks",
          gradient: "from-green-500 to-emerald-600",
          bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
          borderColor: "border-green-200",
          topics: [
            {
              title: "Django Framework Core (3–4 Weeks)",
              color: "green-500",
              items: [
                "Django ORM and MVT architecture",
                "Django REST Framework for API development",
                "Class-based views and function-based views",
                "REST API design principles",
                "Request/Response handling, validation",
                "Exception handling and error responses",
                "Authentication and authorization"
              ]
            },
            {
              title: "Database & Persistence (3–4 Weeks)",
              color: "emerald-500",
              items: [
                "Relational databases: PostgreSQL/MySQL",
                "SQL: Schemas, queries, joins, indexes, transactions",
                "Query optimization",
                "ORM queries and automated queries",
                "Database optimization and indexing",
                "NoSQL databases: MongoDB with PyMongo",
                "Caching strategies with Redis",
                "FastAPI for high-performance APIs"
              ]
            }
          ],
          projects: [
            {
              title: "Project 1:",
              description: "Build REST APIs for an e-commerce platform",
              color: "green"
            },
            {
              title: "Project 2:",
              description: "Multi-entity database application with complex relationships",
              color: "emerald"
            },
            {
              title: "Project 3:",
              description: "Secure microservices application with authentication",
              color: "teal"
            }
          ]
        },
        {
          id: 2,
          title: "Phase 3",
          subtitle: "Frontend Development",
          icon: "Globe",
          duration: "6-7 Weeks",
          gradient: "from-purple-500 to-violet-600",
          bgColor: "bg-gradient-to-br from-purple-50 to-violet-50",
          borderColor: "border-purple-200",
          topics: [
            {
              title: "Web Fundamentals (3 Weeks)",
              color: "purple-500",
              items: [
                "HTML5: semantic elements, accessibility, SEO basics",
                "CSS3: Flexbox, Grid, custom properties, animations, transitions",
                "Responsive design: Mobile-first, media queries, viewport",
                "Modern CSS: Tailwind CSS utility framework",
                "JavaScript: ES6+ features, arrow functions, destructuring, modules",
                "DOM manipulation, event handling, and debugging",
                "Fetch API, async/await, error handling",
                "Modern tooling: npm, package.json, ES modules"
              ]
            },
            {
              title: "React.js Fundamentals (3–4 Weeks)",
              color: "violet-500",
              items: [
                "React setup with Create React App",
                "JSX, components, props, state, virtual DOM",
                "React hooks: useState, useEffect, useContext, useReducer, useMemo, useCallback",
                "React Router v6 for navigation",
                "Form handling with Formik/React Hook Form, validation",
                "State management: Context API, Redux Toolkit",
                "API integration: Axios, React Query/TanStack Query",
                "Performance: memo, useMemo, useCallback, lazy loading"
              ]
            }
          ],
          projects: [
            {
              title: "Project 1:",
              description: "Multi-page responsive website (Restaurant / Portfolio)",
              color: "purple"
            },
            {
              title: "Project 2:",
              description: "Full-featured E-Commerce SPA with auth, cart, and payments",
              color: "violet"
            },
            {
              title: "Capstone:",
              description: "Social Media Dashboard / Task Manager with Real-time Updates",
              color: "fuchsia"
            }
          ]
        },
        {
          id: 3,
          title: "Phase 4",
          subtitle: "Advanced Frontend & Integration",
          icon: "Layers",
          duration: "4-5 Weeks",
          gradient: "from-orange-500 to-amber-600",
          bgColor: "bg-gradient-to-br from-orange-50 to-amber-50",
          borderColor: "border-orange-200",
          topics: [
            {
              title: "Advanced Frontend Concepts (4–5 Weeks)",
              color: "orange-500",
              items: [
                "TypeScript integration with React",
                "UI Libraries: Material UI / Ant Design / Chakra UI",
                "Frontend testing: Jest, React Testing Library",
                "Progressive Web Apps (PWA): Service workers, offline support",
                "Real-time features with WebSocket / Socket.io",
                "Authentication flow: JWT storage, refresh tokens",
                "Full stack integration: Connect React with Django APIs",
                "Deployment: Vercel, Netlify, GitHub Pages",
                "Performance optimization & debugging best practices"
              ]
            }
          ],
          projects: [
            {
              title: "Capstone Project:",
              description: "Complete full-stack app with advanced features",
              color: "orange"
            }
          ]
        },
        {
          id: 4,
          title: "Phase 5",
          subtitle: "AI Integration with Python",
          icon: "Brain",
          duration: "4-5 Weeks",
          gradient: "from-pink-500 to-rose-600",
          bgColor: "bg-gradient-to-br from-pink-50 to-rose-50",
          borderColor: "border-pink-200",
          topics: [
            {
              title: "AI/ML Fundamentals (2 Weeks)",
              color: "pink-500",
              items: [
                "Introduction to Machine Learning & AI terminology",
                "Types of learning: Supervised, Unsupervised, Reinforcement",
                "Key concepts: Features, Labels, training, inference",
                "Python ML ecosystem: Scikit-learn, TensorFlow, PyTorch",
                "Understanding neural networks and deployment",
                "Data preprocessing and feature engineering"
              ]
            },
            {
              title: "AI Integration via APIs (2–3 Weeks)",
              color: "rose-500",
              items: [
                "REST API calls with requests library",
                "OpenAI GPT-4, Claude, Gemini integration",
                "Hugging Face inference API and Transformers",
                "Cloud platforms: Vertex AI, AWS SageMaker",
                "Building chatbots, content generators",
                "Semantic search and natural language processing",
                "Prompt engineering best practices",
                "Rate limiting, caching, error handling"
              ]
            }
          ],
          projects: [
            {
              title: "Project 1:",
              description: "AI-powered Customer Support Chatbot with Django backend",
              color: "pink"
            },
            {
              title: "Project 2:",
              description: "Intelligent Resume Analyzer with RAG + Private Knowledge Base",
              color: "rose"
            }
          ]
        },
        {
          id: 5,
          title: "Phase 6",
          subtitle: "DevOps, Cloud & Deployment",
          icon: "Cloud",
          duration: "4-5 Weeks",
          gradient: "from-red-500 to-orange-600",
          bgColor: "bg-gradient-to-br from-red-50 to-orange-50",
          borderColor: "border-red-200",
          topics: [
            {
              title: "DevOps Essentials (2–3 Weeks)",
              color: "red-500",
              items: [
                "Linux command line basics",
                "Docker containerization",
                "Docker Compose for multi-container apps",
                "Kubernetes basics (optional)",
                "CI/CD pipelines with GitHub Actions/Jenkins",
                "Automated testing and deployment",
                "Monitoring and logging (ELK Stack basics)"
              ]
            },
            {
              title: "Cloud Deployment (2–3 Weeks)",
              color: "orange-500",
              items: [
                "Cloud computing fundamentals",
                "AWS services: EC2, RDS, S3, Lambda",
                "Deployment strategies in AWS Elastic Beanstalk",
                "Network infrastructure and security groups",
                "Environment variables and configuration management",
                "Database hosting: AWS RDS / MongoDB Atlas",
                "CDN and static file serving"
              ]
            }
          ],
          projects: [
            {
              title: "Project:",
              description: "Deploy full-stack application to cloud",
              color: "orange"
            }
          ]
        },
        {
          id: 6,
          title: "Phase 7",
          subtitle: "Capstone Projects & Interview Preparation",
          icon: "Rocket",
          duration: "4-6 Weeks",
          gradient: "from-cyan-500 to-blue-600",
          bgColor: "bg-gradient-to-br from-cyan-50 to-blue-50",
          borderColor: "border-cyan-200",
          topics: [
            {
              title: "Capstone Project Development (2–3 Weeks)",
              color: "cyan-500",
              items: [
                "AI-Powered E-Commerce Platform",
                "Smart Healthcare Management System",
                "Intelligent Job Portal",
                "Financial Analytics Dashboard",
                "Content Management System with AI",
                "Agile development methodology",
                "Sprint planning and execution",
                "Code reviews and best practices"
              ]
            },
            {
              title: "Interview Preparation (1–2 Weeks)",
              color: "blue-500",
              items: [
                "Data Structures & Algorithms in Python",
                "Problem-solving on LeetCode/HackerRank",
                "System design principles",
                "Python, Django, FastAPI, ML concepts",
                "Resume building and LinkedIn optimization",
                "Mock interviews and feedback",
                "Salary negotiation tips"
              ]
            }
          ],
          projects: [
            {
              title: "Capstone Outcome:",
              description: "Production-ready full-stack application with AI",
              color: "cyan"
            },
            {
              title: "Interview Outcome:",
              description: "Crack technical interviews at product companies",
              color: "blue"
            }
          ]
        }
      ],
      projects: [
        {
          id: 0,
          title: "E-Commerce Platform with Recommendation Engine",
          description: "Full-stack e-commerce application with AI-powered product recommendations, user authentication, payment integration, and admin dashboard",
          icon: "ShoppingCart",
          gradient: "from-blue-500 to-cyan-500",
          bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
          borderColor: "border-blue-200",
          tags: ["Python", "Django", "React", "AI/ML", "PostgreSQL"]
        },
        {
          id: 1,
          title: "AI-Powered Financial Analytics Dashboard",
          description: "Real-time financial data visualization with predictive analytics, stock prediction, and portfolio management",
          icon: "LineChart",
          gradient: "from-emerald-500 to-teal-500",
          bgColor: "bg-gradient-to-br from-emerald-50 to-teal-50",
          borderColor: "border-emerald-200",
          tags: ["Python", "FastAPI", "React", "TensorFlow", "WebSocket"]
        },
        {
          id: 2,
          title: "Smart Customer Support Chatbot",
          description: "AI chatbot integration with Django for automated support, ticket management, and sentiment analysis",
          icon: "MessageSquare",
          gradient: "from-purple-500 to-pink-500",
          bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
          borderColor: "border-purple-200",
          tags: ["Python", "Django", "OpenAI API", "NLP", "WebSocket"]
        },
        {
          id: 3,
          title: "Healthcare Management System",
          description: "Patient records, appointment scheduling, AI-assisted diagnosis, and telemedicine features",
          icon: "Stethoscope",
          gradient: "from-amber-500 to-orange-500",
          bgColor: "bg-gradient-to-br from-amber-50 to-orange-50",
          borderColor: "border-amber-200",
          tags: ["Python", "Django", "PostgreSQL", "AI/ML"]
        },
        {
          id: 4,
          title: "Intelligent Job Portal",
          description: "AI-powered job matching with resume parsing, skill assessment, and automated applications",
          icon: "Briefcase",
          gradient: "from-indigo-500 to-blue-500",
          bgColor: "bg-gradient-to-br from-indigo-50 to-blue-50",
          borderColor: "border-indigo-200",
          tags: ["Python", "Django", "Redis", "MongoDB", "NLP"]
        },
        {
          id: 5,
          title: "Fraud Detection System",
          description: "Real-time transaction monitoring with ML-based anomaly detection and alerts",
          icon: "Shield",
          gradient: "from-red-500 to-orange-500",
          bgColor: "bg-gradient-to-br from-red-50 to-orange-50",
          borderColor: "border-red-200",
          tags: ["Python", "FastAPI", "React", "Redis", "ML"]
        },
        {
          id: 6,
          title: "AI Content Management System",
          description: "Auto tagging, content generation, SEO optimization, and personalized recommendations",
          icon: "FileText",
          gradient: "from-rose-500 to-pink-500",
          bgColor: "bg-gradient-to-br from-rose-50 to-pink-50",
          borderColor: "border-rose-200",
          tags: ["Python", "Django", "Redis", "MySQL", "AI"]
        },
        {
          id: 7,
          title: "E-Learning Platform with AI Tutor",
          description: "Personalized learning paths, AI tutor, progress tracking, and discussion forums",
          icon: "GraduationCap",
          gradient: "from-cyan-500 to-blue-500",
          bgColor: "bg-gradient-to-br from-cyan-50 to-blue-50",
          borderColor: "border-cyan-200",
          tags: ["Python", "Django", "React", "MongoDB", "AI"]
        },
        {
          id: 8,
          title: "AI-Powered Project Management Tool",
          description: "Smart task assignment, timeline prediction, and resource optimization using AI",
          icon: "Kanban",
          gradient: "from-lime-500 to-emerald-500",
          bgColor: "bg-gradient-to-br from-lime-50 to-emerald-50",
          borderColor: "border-lime-200",
          tags: ["Python", "FastAPI", "React", "PostgreSQL", "AI"]
        },
        {
          id: 9,
          title: "Music Recommendation System",
          description: "Personalized playlists with mood detection and collaborative filtering",
          icon: "Music",
          gradient: "from-violet-500 to-purple-500",
          bgColor: "bg-gradient-to-br from-violet-50 to-purple-50",
          borderColor: "border-violet-200",
          tags: ["Python", "Django", "React", "Redis", "ML"]
        }
      ],
      techStack: [
        {
          category: "Backend Technologies",
          icon: "Server",
          borderColor: "border-blue-200",
          bgColor: "bg-gradient-to-r from-blue-50 to-indigo-50",
          technologies: [
            { label: "Python 3.10+", iconSrc: "/BT1.webp" },
            { label: "Django", iconSrc: "/BT2.webp" },
            { label: "FastAPI", iconSrc: "/BT3.webp" },
            { label: "SQL Alchemy", iconSrc: "/BT4.webp" },
            { label: "pytest & unittest", iconSrc: "/BT5.webp" },
            { label: "REST APIs", iconSrc: "/BT6.webp" }
          ]
        },
        {
          category: "Frontend Technologies",
          icon: "Globe",
          borderColor: "border-purple-200",
          bgColor: "bg-gradient-to-r from-purple-50 to-violet-50",
          technologies: [
            { label: "HTML5", iconSrc: "/FT1.webp" },
            { label: "CSS3", iconSrc: "/FT2.webp" },
            { label: "JavaScript ES6+", iconSrc: "/FT3.webp" },
            { label: "React.js", iconSrc: "/FT4.webp" },
            { label: "Redux/Context API", iconSrc: "/FT5.webp" },
            { label: "Material UI / Tailwind", iconSrc: "/FT6.webp" }
          ]
        },
        {
          category: "Database & DevOps",
          icon: "Database",
          borderColor: "border-green-200",
          bgColor: "bg-gradient-to-r from-green-50 to-emerald-50",
          technologies: [
            { label: "PostgreSQL", iconSrc: "/DD2.webp" },
            { label: "MySQL", iconSrc: "/DD1.webp" },
            { label: "MongoDB", iconSrc: "/DC3.webp" },
            { label: "Redis", iconSrc: "/CP6.webp" },
            { label: "Docker", iconSrc: "/DD4.webp" },
            { label: "Kubernetes", iconSrc: "/DD5.webp" },
            { label: "AWS Cloud", iconSrc: "/DD6.webp" },
            { label: "Git & GitHub", icon: "GitBranch" }
          ]
        },
        {
          category: "AI & ML Integration",
          icon: "Brain",
          borderColor: "border-orange-200",
          bgColor: "bg-gradient-to-r from-orange-50 to-amber-50",
          technologies: [
            { label: "OpenAI GPT-4", iconSrc: "/AI1.webp" },
            { label: "Hugging Face", iconSrc: "/AI2.webp" },
            { label: "LangChain", iconSrc: "/AI3.webp" },
            { label: "Vector Databases", iconSrc: "/AI4.webp" },
            { label: "RAG Architecture", iconSrc: "/AI5.webp" },
            { label: "TensorFlow/PyTorch", iconSrc: "/AI6.webp" }
          ]
        }
      ],
      careerOutcomes: [
        {
          title: "Python Full-Stack Developer",
          salary: "$80k–$135k",
          icon: "Cpu",
          gradient: "from-blue-500 to-cyan-500",
          bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
          borderColor: "border-blue-200",
          description: "Build complete web applications using Python + React + DevOps."
        },
        {
          title: "AI Integration Developer",
          salary: "$90k–$150k",
          icon: "Brain",
          gradient: "from-purple-500 to-pink-500",
          bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
          borderColor: "border-purple-200",
          description: "Integrate LLMs, APIs, vector search & RAG into Python applications."
        },
        {
          title: "Backend Engineer (Python)",
          salary: "$85k–$140k",
          icon: "Server",
          gradient: "from-green-500 to-emerald-500",
          bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
          borderColor: "border-green-200",
          description: "Design and build scalable backend systems with Django/FastAPI."
        }
      ],
      capstoneData: {
        title: "Capstone Development",
        icon: "FileText",
        bgColor: "bg-white",
        borderColor: "border-red-200",
        projects: ["AI Ecommerce", "Healthcare System", "Job Portal", "Financial Dashboard"],
        outcome: "Production-ready AI-powered Python application"
      },
      interviewPrep: {
        title: "Interview Preparation",
        icon: "Users",
        bgColor: "bg-white",
        borderColor: "border-red-200",
        technical: ["DSA in Python", "System Design", "Python + Django + FastAPI"],
        career: ["Resume + LinkedIn", "Mock Interviews", "Salary Negotiation"],
        outcome: "Crack product-based interviews"
      }
    }

  };