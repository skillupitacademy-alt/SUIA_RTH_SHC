import { Course } from '../CoursesCardData';
import { FaCode } from 'react-icons/fa';

export const fullStackJavaCourse: Course =   {
    id: 3,
    category: "Development",
    format: "LIVE ONLINE",
    title: "Full Stack Java",
    description:
      "Master enterprise Java development with Spring Boot and modern frontend tools.",
    features: [
      "Spring Boot & Microservices",
      "Hibernate & JPA",
      "REST APIs",
      "Security"
    ],
    image: "/E.webp",
    slug: "full-stack-java",
    icon: FaCode,
    heroTitle: "Full Stack Java Developer",
    heroSubtitle: "with AI Integration",
    heroDescription: "Master Java, Spring Boot, React, Microservices, Docker, AWS & cutting-edge AI/ML integration.",
    heroSubDescription: "Build production-grade applications and land high-paying jobs at top tech companies.",
    // ADD ASSESSMENT DATA HERE
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
              'Hands-on coding tasks and exercises',
              'Coding exercises after every module',
              'Progress tracking dashboard',
              'Automated test case evaluation',
              'Real-world problem solving'
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
              'MCQ + coding challenges',
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
          description: 'Comprehensive review of real-world projects with detailed feedback',
          features: [
            'Architecture Review',
            'Best Practices Check',
            'Deployment Ready'
          ],
          backContent: {
            points: [
              'Architecture evaluation',
              'Best practices assessment',
              'Deployment readiness check',
              'Performance optimization tips',
              'Code quality and functionality testing'
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
        description: 'Our certificate validates your skills and demonstrates your competency to employers worldwide. It\'s not just a piece of paper—it\'s proof of your ability to build real-world applications.',
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
          subtitle: 'Full-Stack Development',
          subSubtitle: 'Covering Java, Spring Boot, REST APIs, Microservices, Database Management, Frontend Development, AI Integration, Cloud Deployment, and Real-World Full Stack AI Application Projects.',
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
          subtitle: "Java Fundamentals & Core Concepts",
          icon: "Code",
          duration: "8-10 Weeks",
          gradient: "from-blue-500 to-indigo-600",
          bgColor: "bg-gradient-to-br from-blue-200 to-indigo-200",
          borderColor: "border-blue-700",
          topics: [
            {
              title: "Java Basics (4–5 Weeks)",
              color: "blue-500",
              items: [
                "Java Installation, JDK setup, IntelliJ / Eclipse",
                "OOP: Classes, Objects, Inheritance, Polymorphism",
                "Collections Framework (List, Set, Map, Queue)",
                "Java 8+: Lambda, Streams"
              ]
            },
            {
              title: "Advanced Java (4–5 Weeks)",
              color: "indigo-500",
              items: [
                "SOLID + Clean Code",
                "Design Patterns: Singleton, Factory, Builder, Observer",
                "JDBC + DB Connectivity",
                "JUnit, Mockito Testing"
              ]
            }
          ],
          projects: [
            {
              title: "Mini Project:",
              description: "Console-based application (Library/Banking System)",
              color: "blue"
            },
            {
              title: "Advanced Project:",
              description: "Multithreaded Application + DB Integration",
              color: "indigo"
            }
          ]
        },
        {
          id: 1,
          title: "Phase 2",
          subtitle: "Backend Development with Spring",
          icon: "Server",
          duration: "6-7 Weeks",
          gradient: "from-green-500 to-emerald-600",
          bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
          borderColor: "border-green-200",
          topics: [
            {
              title: "Spring Framework Core (3–4 Weeks)",
              color: "green-500",
              items: [
                "Dependency Injection, IoC",
                "Spring Boot Auto Config",
                "MVC Architecture, REST API Design",
                "Validation + Exception Handling"
              ]
            },
            {
              title: "Database & Persistence (3–4 Weeks)",
              color: "emerald-500",
              items: [
                "MySQL / PostgreSQL, Hibernate + JPA",
                "Entity Relations (One-To-One, Many-To-Many)",
                "NoSQL (MongoDB), Caching with Redis"
              ]
            }
          ],
          projects: [
            {
              title: "Project 1:",
              description: "E-commerce REST API",
              color: "green"
            },
            {
              title: "Project 2:",
              description: "Multi-Entity Database Application",
              color: "emerald"
            },
            {
              title: "Project 3:",
              description: "Secure Microservices Architecture",
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
                "HTML5 + SEO + Accessibility",
                "CSS Flex, Grid, Animations",
                "JavaScript ES6+, Fetch API, async/await"
              ]
            },
            {
              title: "React.js Fundamentals (3–4 Weeks)",
              color: "violet-500",
              items: [
                "JSX, Props, State, Hooks",
                "React Router v6, Redux Toolkit",
                "Axios + React Query, Forms + Validation"
              ]
            }
          ],
          projects: [
            {
              title: "Project 1:",
              description: "Multi-page Responsive Website",
              color: "purple"
            },
            {
              title: "Project 2:",
              description: "Full-featured E-Commerce SPA",
              color: "violet"
            },
            {
              title: "Capstone:",
              description: "Social Media Dashboard / Real-Time App",
              color: "fuchsia"
            }
          ]
        },
        {
          id: 3,
          title: "Phase 4",
          subtitle: "DevOps, Cloud & Deployment",
          icon: "Cloud",
          duration: "4-5 Weeks",
          gradient: "from-orange-500 to-amber-600",
          bgColor: "bg-gradient-to-br from-orange-50 to-amber-50",
          borderColor: "border-orange-200",
          topics: [
            {
              title: "DevOps Essentials (2–3 Weeks)",
              color: "orange-500",
              items: [
                "Linux Commands, Docker & Docker Compose",
                "CI/CD — GitHub Actions",
                "Kubernetes Basics, Monitoring (ELK)"
              ]
            },
            {
              title: "Cloud Deployment (2–3 Weeks)",
              color: "amber-500",
              items: [
                "AWS: EC2, S3, RDS, Elastic Beanstalk",
                "MongoDB Atlas, Environment Variables"
              ]
            }
          ],
          projects: [
            {
              title: "Outcome:",
              description: "CI/CD + Container Deployment",
              color: "orange"
            },
            {
              title: "Project:",
              description: "Deploy Full-Stack App to Cloud",
              color: "amber"
            }
          ]
        },
        {
          id: 4,
          title: "Phase 5",
          subtitle: "AI Integration with Java",
          icon: "Brain",
          duration: "4-5 Weeks",
          gradient: "from-pink-500 to-rose-600",
          bgColor: "bg-gradient-to-br from-pink-50 to-rose-50",
          borderColor: "border-pink-200",
          topics: [
            {
              title: "AI / ML Fundamentals (2 Weeks)",
              color: "pink-500",
              items: [
                "AI / ML Basics, DL4J, WEKA, Tribuo",
                "Model Training / Inference, Python Bridge (optional)"
              ]
            },
            {
              title: "AI Integration via APIs (2–3 Weeks)",
              color: "rose-500",
              items: [
                "OpenAI, Claude, Gemini, HF API",
                "Vertex AI / Sagemaker, Chatbots / Summarizers"
              ]
            }
          ],
          projects: [
            {
              title: "Outcome:",
              description: "Understand ML, Model Lifecycle",
              color: "pink"
            },
            {
              title: "Project 1:",
              description: "AI Powered Support Bot",
              color: "rose"
            },
            {
              title: "Capstone:",
              description: "Resume Analyzer with RAG",
              color: "red"
            }
          ]
        },
        {
          id: 5,
          title: "Phase 6",
          subtitle: "Capstone & Interview Prep",
          icon: "Rocket",
          duration: "4-6 Weeks",
          gradient: "from-red-500 to-orange-600",
          bgColor: "bg-gradient-to-br from-red-50 to-orange-50",
          borderColor: "border-red-200",
          topics: [
            {
              title: "Capstone Project Development (2–3 Weeks)",
              color: "red-500",
              items: [
                "AI-Ecommerce Platform",
                "Healthcare Management System",
                "Intelligent Job Portal",
                "Financial Analytics Dashboard"
              ]
            },
            {
              title: "Interview Preparation (1–2 Weeks)",
              color: "orange-500",
              items: [
                "DSA + LeetCode",
                "System Design",
                "Java, Spring, Collections",
                "Resume & LinkedIn",
                "Mock Interviews",
                "Salary Negotiation"
              ]
            }
          ],
          projects: [
            {
              title: "Capstone Outcome:",
              description: "Full-Stack Production App",
              color: "red"
            },
            {
              title: "Interview Outcome:",
              description: "Crack Product-Based Interviews",
              color: "orange"
            }
          ]
        }
      ],
      projects: [
        {
          id: 0,
          title: "E-Commerce Platform with Recommendation Engine",
          description: "Full-stack + AI-powered product recommendations",
          icon: "ShoppingCart",
          gradient: "from-blue-500 to-cyan-500",
          bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
          borderColor: "border-blue-200",
          tags: ["Java", "Spring Boot", "React", "MySQL", "AI/ML"]
        },
        {
          id: 1,
          title: "AI-Powered Financial Analytics Dashboard",
          description: "Predictive analytics + real-time data",
          icon: "LineChart",
          gradient: "from-emerald-500 to-teal-500",
          bgColor: "bg-gradient-to-br from-emerald-50 to-teal-50",
          borderColor: "border-emerald-200",
          tags: ["Java", "Spring Boot", "React", "TensorFlow", "WebSocket"]
        },
        {
          id: 2,
          title: "Smart Customer Support Chatbot",
          description: "NLP + backend integrated bot",
          icon: "MessageSquare",
          gradient: "from-purple-500 to-pink-500",
          bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
          borderColor: "border-purple-200",
          tags: ["Java", "Spring Boot", "OpenAI API", "WebSocket", "NLP"]
        },
        {
          id: 3,
          title: "Healthcare Management System",
          description: "AI-assisted diagnosis + scheduling",
          icon: "Stethoscope",
          gradient: "from-amber-500 to-orange-500",
          bgColor: "bg-gradient-to-br from-amber-50 to-orange-50",
          borderColor: "border-amber-200",
          tags: ["Java", "Spring Boot", "PostgreSQL", "AI/ML"]
        },
        {
          id: 4,
          title: "Intelligent Job Portal",
          description: "AI-powered job matching + resume parsing",
          icon: "Briefcase",
          gradient: "from-indigo-500 to-blue-500",
          bgColor: "bg-gradient-to-br from-indigo-50 to-blue-50",
          borderColor: "border-indigo-200",
          tags: ["Java", "Spring Boot", "Redis", "MongoDB", "NLP"]
        },
        {
          id: 5,
          title: "AI Content Management System",
          description: "Auto-tagging + content generation",
          icon: "FileText",
          gradient: "from-rose-500 to-pink-500",
          bgColor: "bg-gradient-to-br from-rose-50 to-pink-50",
          borderColor: "border-rose-200",
          tags: ["Java", "Spring Boot", "Redis", "MySQL", "AI"]
        },
        {
          id: 6,
          title: "Fraud Detection System",
          description: "Real-time transaction monitoring",
          icon: "Shield",
          gradient: "from-red-500 to-orange-500",
          bgColor: "bg-gradient-to-br from-red-50 to-orange-50",
          borderColor: "border-red-200",
          tags: ["Java", "Spring Boot", "React", "Redis", "ML"]
        },
        {
          id: 7,
          title: "E-Learning Platform with AI Tutor",
          description: "Personalized learning paths",
          icon: "GraduationCap",
          gradient: "from-cyan-500 to-blue-500",
          bgColor: "bg-gradient-to-br from-cyan-50 to-blue-50",
          borderColor: "border-cyan-200",
          tags: ["Java", "Spring Boot", "React", "MongoDB", "AI"]
        },
        {
          id: 8,
          title: "AI-Powered Project Management Tool",
          description: "Smart task assignment + timeline prediction",
          icon: "Kanban",
          gradient: "from-lime-500 to-emerald-500",
          bgColor: "bg-gradient-to-br from-lime-50 to-emerald-50",
          borderColor: "border-lime-200",
          tags: ["Java", "Spring Boot", "React", "PostgreSQL", "AI"]
        },
        {
          id: 9,
          title: "Music Recommendation System",
          description: "Personalized playlists + mood detection",
          icon: "Music",
          gradient: "from-violet-500 to-purple-500",
          bgColor: "bg-gradient-to-br from-violet-50 to-purple-50",
          borderColor: "border-violet-200",
          tags: ["Java", "Spring Boot", "React", "Redis", "ML"]
        }
      ],
      techStack: [
        {
          category: "Backend Technologies",
          icon: "Server",
          borderColor: "border-blue-200",
          bgColor: "bg-gradient-to-r from-blue-50 to-indigo-50",
          technologies: [
            { label: "Java", iconSrc: "/BT1.webp" },
            { label: "Spring Boot", iconSrc: "/BT2.webp" },
            { label: "Spring Security", iconSrc: "/BT3.webp" },
            { label: "Hibernate & JPA", iconSrc: "/BT4.webp" },
            { label: "Maven/Gradle", iconSrc: "/BT5.webp" },
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
            { label: "JavaScript", iconSrc: "/FT3.webp" },
            { label: "React.js", iconSrc: "/FT4.webp" },
            { label: "Redux/Context", iconSrc: "/FT5.webp" },
            { label: "MUI/Tailwind", iconSrc: "/FT6.webp" }
          ]
        },
        {
          category: "Database & DevOps",
          icon: "Database",
          borderColor: "border-green-200",
          bgColor: "bg-gradient-to-r from-green-50 to-emerald-50",
          technologies: [
            { label: "MySQL", iconSrc: "/DD1.webp" },
            { label: "PostgreSQL", iconSrc: "/DD2.webp" },
            { label: "MongoDB", iconSrc: "/DD3.webp" },
            { label: "Docker", iconSrc: "/DD4.webp" },
            { label: "Kubernetes", iconSrc: "/DD5.webp" },
            { label: "AWS", iconSrc: "/DD6.webp" },
            { label: "Git & GitHub", icon: "GitBranch" }
          ]
        },
        {
          category: "AI & ML Integration",
          icon: "Brain",
          borderColor: "border-orange-200",
          bgColor: "bg-gradient-to-r from-orange-50 to-amber-50",
          technologies: [
            { label: "OpenAI", iconSrc: "/AI1.webp" },
            { label: "Hugging Face", iconSrc: "/AI2.webp" },
            { label: "LangChain4j", iconSrc: "/AI3.webp" },
            { label: "Vector DBs", iconSrc: "/AI4.webp" },
            { label: "RAG Architecture", iconSrc: "/AI5.webp" },
            { label: "DeepLearning4j", iconSrc: "/AI6.webp" }
          ]
        }
      ],
      careerOutcomes: [
        {
          title: "Full-Stack Developer",
          salary: "$85k–$140k",
          icon: "Cpu",
          gradient: "from-blue-500 to-cyan-500",
          bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
          borderColor: "border-blue-200",
          description: "Build complete web applications using Java + React + DevOps."
        },
        {
          title: "AI Integration Developer",
          salary: "$95k–$160k",
          icon: "Brain",
          gradient: "from-purple-500 to-pink-500",
          bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
          borderColor: "border-purple-200",
          description: "Integrate LLMs, APIs, vector search & RAG into applications."
        }
      ],
      capstoneData: {
        title: "Capstone Development",
        icon: "FileText",
        bgColor: "bg-white",
        borderColor: "border-red-200",
        projects: ["AI Ecommerce", "Healthcare System", "Job Portal", "Financial Dashboard"],
        outcome: "Production-ready AI-powered app"
      },
      interviewPrep: {
        title: "Interview Preparation",
        icon: "Users",
        bgColor: "bg-white",
        borderColor: "border-red-200",
        technical: ["DSA & LeetCode", "System Design", "Java + Spring"],
        career: ["Resume + LinkedIn", "Mock Interviews", "Salary Negotiation"],
        outcome: "Crack product-based interviews"
      }
    }
  };