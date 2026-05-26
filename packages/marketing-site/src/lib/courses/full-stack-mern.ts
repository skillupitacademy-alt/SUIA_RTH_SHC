import { Course } from '../CoursesCardData';
import { FaCode } from 'react-icons/fa';

export const fullStackMernCourse: Course =   {
    id: 6,
    category: "Development",
    format: "LIVE ONLINE",
    title: "Full Stack MERN",
    description: "End-to-end JavaScript development with MongoDB, Express, React, and Node.",
    features: [
      "React.js",
      "Node.js & Express",
      "MongoDB",
      "Redux / Context API",
      "REST APIs",
      "Authentication"
    ],
    image: "/Seventh.webp",
    slug: "full-stack-mern",
    heroTitle: "Full Stack MERN",
    heroSubtitle: "with Scalable AI",
    heroDescription: "Master MongoDB, Express.js, React, Node.js, REST APIs, Docker, AWS & AI integration.",
    heroSubDescription: "Build production-grade MERN applications and land high-paying jobs at top tech companies.",
    companies: ["Google", "Microsoft", "Amazon", "Meta", "Netflix", "Uber"],
    ctaButtons: {
      primary: "Enroll Now - Limited Seats",
      secondary: "Explore Full Curriculum"
    },
    assessmentCertification: {
      assessmentCards: [
        {
          id: 0,
          title: "Weekly Coding Challenges",
          description: "JavaScript and React challenges every week to reinforce hands-on development skills",
          features: ["JS Challenges", "React Exercises", "Code Reviews"],
          backContent: {
            points: [
              "ES6+ JavaScript coding tasks",
              "React component building exercises",
              "REST API integration challenges",
              "Git workflow and PR practices",
              "Bug fixing and debugging tasks"
            ],
            frequency: "Every Week",
            weightage: "20% of final grade"
          }
        },
        {
          id: 1,
          title: "Module Assessments",
          description: "End-of-module tests covering frontend, backend, and database topics",
          features: ["React + Node Tests", "MongoDB Queries", "API Design Evaluation"],
          backContent: {
            points: [
              "React hooks and state management tests",
              "Node.js / Express API design challenges",
              "MongoDB schema design evaluation",
              "JWT authentication implementation",
              "Full stack integration scenarios"
            ],
            frequency: "After Each Module",
            weightage: "30% of final grade"
          }
        },
        {
          id: 2,
          title: "Project Evaluations",
          description: "Expert review of full stack MERN applications with detailed feedback",
          features: ["Architecture Review", "Code Quality Check", "Deployment Validation"],
          backContent: {
            points: [
              "Frontend UI/UX and component architecture",
              "Backend REST API design and security",
              "Database schema and query optimization",
              "Authentication and authorization review",
              "Deployment and CI/CD pipeline assessment"
            ],
            frequency: "Per Project",
            weightage: "40% of final grade"
          }
        },
        {
          id: 3,
          title: "Certification Benefits",
          description: "Industry-recognized MERN Stack certificate with global hiring partner access",
          features: ["Industry Recognized", "Global Validity", "Hiring Partner Access"],
          backContent: {
            points: [
              "MERN Stack specialization certificate",
              "Global recognition by top tech companies",
              "Hiring partner network access",
              "Verified by industry experts",
              "LinkedIn digital badge included"
            ],
            frequency: "Program Completion",
            weightage: "Official Certification"
          }
        }
      ],
      certificateData: {
        title: "Industry-Recognized MERN Stack Certification",
        description: "Our certificate validates your full stack JavaScript skills and demonstrates production-grade MERN development competency to employers worldwide.",
        benefits: [
          "MERN Stack specialization certificate",
          "Global recognition and validity",
          "Hiring partner acceptance",
          "Verified by industry experts",
          "LinkedIn digital badge included",
          "Career placement network access"
        ],
        certificateDetails: {
          title: "Certificate of Completion",
          subtitle: "Full Stack MERN Development",
          subSubtitle: "Covering MongoDB, Express.js, React, Node.js, REST APIs, AI Integration, Cloud Deployment, Scalable Architecture, and Real-World Full Stack AI Application Projects.",
          rating: 5
        }
      }
    },
    curriculum: {
      title: "Comprehensive Curriculum",
      description: "6-8 Months · 550-650 Hours",
      phases: [
        {
          id: 0,
          title: "Phase 1",
          subtitle: "JavaScript & ES6+ Fundamentals",
          icon: "Code",
          duration: "6-8 Weeks",
          gradient: "from-yellow-500 to-orange-600",
          bgColor: "bg-gradient-to-br from-yellow-50 to-orange-50",
          borderColor: "border-yellow-200",
          topics: [
            {
              title: "Modern JavaScript (3-4 Weeks)",
              color: "yellow-500",
              items: [
                "Variables, data types, and scope (let, const, var)",
                "Arrow functions, destructuring, spread/rest",
                "Promises, async/await, and event loop",
                "ES6+ modules and import/export",
                "Array/object methods: map, filter, reduce",
                "DOM manipulation and browser APIs",
                "Error handling and debugging"
              ]
            },
            {
              title: "TypeScript Foundations (3-4 Weeks)",
              color: "orange-500",
              items: [
                "TypeScript types, interfaces and generics",
                "Classes and object-oriented patterns",
                "Type inference and strict typing",
                "Working with third-party type definitions",
                "tsconfig setup and compilation",
                "Migrating JS projects to TypeScript"
              ]
            }
          ],
          projects: [
            { title: "Mini Project:", description: "Interactive To-Do App with DOM & ES6+", color: "yellow" },
            { title: "Mini Project:", description: "Weather App using Fetch API & Async/Await", color: "orange" }
          ]
        },
        {
          id: 1,
          title: "Phase 2",
          subtitle: "React.js Frontend Development",
          icon: "Monitor",
          duration: "8-10 Weeks",
          gradient: "from-blue-500 to-cyan-600",
          bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
          borderColor: "border-blue-200",
          topics: [
            {
              title: "React Core Concepts (4-5 Weeks)",
              color: "blue-500",
              items: [
                "JSX syntax and component architecture",
                "Props, state and lifting state up",
                "React Hooks: useState, useEffect, useRef",
                "Context API for global state management",
                "React Router v6 for SPA navigation",
                "Forms, validation and controlled components",
                "Component lifecycle and optimization"
              ]
            },
            {
              title: "Advanced React & Redux (4-5 Weeks)",
              color: "cyan-500",
              items: [
                "Redux Toolkit and state management patterns",
                "RTK Query for data fetching and caching",
                "Custom hooks and code reusability",
                "Performance: memo, useMemo, useCallback",
                "React Testing Library basics",
                "Next.js fundamentals and SSR/SSG",
                "Tailwind CSS integration and responsive design"
              ]
            }
          ],
          projects: [
            { title: "Project 1:", description: "E-commerce Product Listing with Redux & Cart", color: "blue" },
            { title: "Project 2:", description: "Social Media Feed App with React Router & Hooks", color: "cyan" }
          ]
        },
        {
          id: 2,
          title: "Phase 3",
          subtitle: "Node.js & Express.js Backend",
          icon: "Server",
          duration: "6-8 Weeks",
          gradient: "from-green-500 to-emerald-600",
          bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
          borderColor: "border-green-200",
          topics: [
            {
              title: "Node.js Core (3-4 Weeks)",
              color: "green-500",
              items: [
                "Node.js runtime, event loop and modules",
                "File system, streams and buffers",
                "npm ecosystem and package management",
                "Environment variables and configuration",
                "Debugging Node.js applications",
                "Building CLIs and scripts with Node.js"
              ]
            },
            {
              title: "Express.js REST APIs (3-4 Weeks)",
              color: "emerald-500",
              items: [
                "Express routing and middleware architecture",
                "RESTful API design principles (CRUD)",
                "Request validation with Joi / Zod",
                "Error handling middleware patterns",
                "File uploads with Multer",
                "Rate limiting, Helmet and API security",
                "API documentation with Swagger / OpenAPI"
              ]
            }
          ],
          projects: [
            { title: "Project 1:", description: "RESTful Blog API with CRUD & Pagination", color: "green" },
            { title: "Project 2:", description: "File Upload Service with Express & Multer", color: "emerald" }
          ]
        },
        {
          id: 3,
          title: "Phase 4",
          subtitle: "MongoDB & Mongoose ODM",
          icon: "Database",
          duration: "5-6 Weeks",
          gradient: "from-purple-500 to-violet-600",
          bgColor: "bg-gradient-to-br from-purple-50 to-violet-50",
          borderColor: "border-purple-200",
          topics: [
            {
              title: "MongoDB Fundamentals (2-3 Weeks)",
              color: "purple-500",
              items: [
                "NoSQL vs relational database concepts",
                "MongoDB collections, documents and BSON",
                "CRUD operations and query operators",
                "Aggregation pipeline and lookups",
                "Indexing and query performance tuning",
                "MongoDB Atlas cloud setup and monitoring"
              ]
            },
            {
              title: "Mongoose ODM (3-4 Weeks)",
              color: "violet-500",
              items: [
                "Schema design and validation rules",
                "Model methods, statics and virtuals",
                "Population and document references",
                "Middleware: pre/post hooks",
                "Transactions and sessions",
                "Advanced queries, projections and sorting"
              ]
            }
          ],
          projects: [
            { title: "Project:", description: "Product Inventory System with MongoDB Atlas", color: "purple" },
            { title: "Project:", description: "Aggregation Analytics Dashboard for Sales Data", color: "violet" }
          ]
        },
        {
          id: 4,
          title: "Phase 5",
          subtitle: "Authentication, Security & Full Stack Integration",
          icon: "Shield",
          duration: "5-6 Weeks",
          gradient: "from-red-500 to-pink-600",
          bgColor: "bg-gradient-to-br from-red-50 to-pink-50",
          borderColor: "border-red-200",
          topics: [
            {
              title: "Auth & Security (2-3 Weeks)",
              color: "red-500",
              items: [
                "JWT access and refresh token strategy",
                "OAuth 2.0 and social login (Google, GitHub)",
                "Password hashing with bcrypt",
                "Role-based access control (RBAC)",
                "CORS, Helmet, XSS and CSRF protection",
                "Rate limiting and brute force prevention"
              ]
            },
            {
              title: "Full Stack Integration (3-4 Weeks)",
              color: "pink-500",
              items: [
                "Connecting React frontend to Express backend",
                "Axios with request/response interceptors",
                "Socket.io for real-time features",
                "Payment integration with Stripe",
                "Email notifications with Nodemailer/SendGrid",
                "Search and filtering with text indexes"
              ]
            }
          ],
          projects: [
            { title: "Project 1:", description: "Full Stack Auth System with JWT & Google OAuth", color: "red" },
            { title: "Project 2:", description: "Real-Time Chat App with Socket.io & MongoDB", color: "pink" }
          ]
        },
        {
          id: 5,
          title: "Phase 6",
          subtitle: "Cloud Deployment, Docker & AI Integration",
          icon: "Cloud",
          duration: "4-6 Weeks",
          gradient: "from-teal-500 to-cyan-600",
          bgColor: "bg-gradient-to-br from-teal-50 to-cyan-50",
          borderColor: "border-teal-200",
          topics: [
            {
              title: "Docker & DevOps (2-3 Weeks)",
              color: "teal-500",
              items: [
                "Docker containers and Dockerfile creation",
                "Docker Compose for multi-service MERN apps",
                "CI/CD pipelines with GitHub Actions",
                "Nginx reverse proxy configuration",
                "Environment management and secret handling",
                "AWS EC2 / Render / Railway deployment"
              ]
            },
            {
              title: "AI Integration & Advanced Features (2-3 Weeks)",
              color: "cyan-500",
              items: [
                "OpenAI API integration in MERN apps",
                "AI-powered search and recommendations",
                "Image processing and storage with Cloudinary",
                "Redis caching for API performance",
                "Microservices architecture introduction",
                "Application monitoring and logging"
              ]
            }
          ],
          projects: [
            { title: "Project:", description: "Dockerized MERN App deployed to AWS with CI/CD", color: "teal" },
            { title: "Project:", description: "AI-Powered Content Platform with OpenAI API", color: "cyan" }
          ]
        },
        {
          id: 6,
          title: "Phase 7",
          subtitle: "Capstone Projects & Interview Preparation",
          icon: "Rocket",
          duration: "4-6 Weeks",
          gradient: "from-indigo-500 to-blue-600",
          bgColor: "bg-gradient-to-br from-indigo-50 to-blue-50",
          borderColor: "border-indigo-200",
          topics: [
            {
              title: "Capstone Development (2-3 Weeks)",
              color: "indigo-500",
              items: [
                "End-to-end MERN application planning",
                "Database schema and API endpoint design",
                "Full stack development and unit testing",
                "Production deployment and monitoring",
                "Performance optimization techniques",
                "Portfolio and GitHub profile presentation"
              ]
            },
            {
              title: "Interview Preparation (2-3 Weeks)",
              color: "blue-500",
              items: [
                "JavaScript and React interview questions",
                "Node.js and MongoDB interview patterns",
                "System design for full stack applications",
                "Live coding challenge practice sessions",
                "Resume and LinkedIn profile optimization",
                "Mock interviews with industry experts"
              ]
            }
          ],
          projects: [
            { title: "Capstone Project:", description: "Full Stack E-Commerce Platform with AI Recommendations", color: "indigo" },
            { title: "Interview Outcome:", description: "Crack MERN Stack interviews at FAANG and top startups", color: "blue" }
          ]
        }
      ],
      projects: [
        {
          id: 0,
          title: "E-Commerce Platform",
          description: "Full stack shopping platform with product management, cart, Stripe payments and admin dashboard",
          icon: "ShoppingCart",
          gradient: "from-blue-500 to-cyan-500",
          bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
          borderColor: "border-blue-200",
          tags: ["React", "Node.js", "MongoDB", "Stripe", "Redux"]
        },
        {
          id: 1,
          title: "Real-Time Social Media App",
          description: "Social platform with posts, stories, real-time messaging and notifications using Socket.io",
          icon: "Users",
          gradient: "from-purple-500 to-pink-500",
          bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
          borderColor: "border-purple-200",
          tags: ["Socket.io", "React", "MongoDB", "JWT", "Cloudinary"]
        },
        {
          id: 2,
          title: "AI-Powered Job Board",
          description: "Job listing platform with AI job matching, resume parsing and recruiter dashboard",
          icon: "Briefcase",
          gradient: "from-green-500 to-emerald-500",
          bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
          borderColor: "border-green-200",
          tags: ["OpenAI", "React", "Express", "MongoDB", "AWS S3"]
        },
        {
          id: 3,
          title: "Project Management Tool",
          description: "Trello-like board with drag-and-drop, real-time collaboration and role-based access",
          icon: "Layout",
          gradient: "from-orange-500 to-amber-500",
          bgColor: "bg-gradient-to-br from-orange-50 to-amber-50",
          borderColor: "border-orange-200",
          tags: ["React", "Socket.io", "RBAC", "Docker", "CI/CD"]
        },
        {
          id: 4,
          title: "Healthcare Booking System",
          description: "Doctor appointment platform with calendar, video consultation and medical record management",
          icon: "Heart",
          gradient: "from-red-500 to-rose-500",
          bgColor: "bg-gradient-to-br from-red-50 to-rose-50",
          borderColor: "border-red-200",
          tags: ["React", "Node.js", "MongoDB", "Stripe", "WebRTC"]
        },
        {
          id: 5,
          title: "Learning Management System",
          description: "Full-featured LMS with video courses, quizzes, progress tracking and certificate generation",
          icon: "BookOpen",
          gradient: "from-teal-500 to-cyan-500",
          bgColor: "bg-gradient-to-br from-teal-50 to-cyan-50",
          borderColor: "border-teal-200",
          tags: ["React", "Express", "MongoDB", "Cloudinary", "PDF"]
        }
      ],
      techStack: [
        {
          category: "Frontend Technologies",
          icon: "Monitor",
          borderColor: "border-blue-200",
          bgColor: "bg-gradient-to-r from-blue-50 to-cyan-50",
          technologies: [
            { label: "React.js", iconSrc: "/FSE3.webp" },
            { label: "Next.js", iconSrc: "/FSE4.webp" },
            { label: "Redux Toolkit", iconSrc: "/FSE5.webp" },
            { label: "TypeScript", iconSrc: "/FSE2.webp" },
            { label: "Tailwind CSS", iconSrc: "/FSE6.webp" },
            { label: "JavaScript", iconSrc: "/FSE1.webp" }
          ]
        },
        {
          category: "Backend Technologies",
          icon: "Server",
          borderColor: "border-green-200",
          bgColor: "bg-gradient-to-r from-green-50 to-emerald-50",
          technologies: [
            { label: "Node.js", iconSrc: "/BE1.webp" },
            { label: "Express.js", iconSrc: "/BE2.webp" },
            { label: "MongoDB", iconSrc: "/DC3.webp" },
            { label: "Mongoose", iconSrc: "/DC4.webp" },
            { label: "Socket.io", iconSrc: "/BE5.webp" },
            { label: "REST APIs", iconSrc: "/BE6.webp" }
          ]
        },
        {
          category: "Cloud & DevOps",
          icon: "Cloud",
          borderColor: "border-purple-200",
          bgColor: "bg-gradient-to-r from-purple-50 to-violet-50",
          technologies: [
            { label: "Docker", iconSrc: "/DD4.webp" },
            { label: "AWS", iconSrc: "/CP1.webp" },
            { label: "GitHub Actions", iconSrc: "/DevOps6.webp" },
            { label: "Nginx", iconSrc: "/DevOps4.webp" },
            { label: "Redis", iconSrc: "/DDW4.webp" },
            { label: "Cloudinary", iconSrc: "/AI1.webp" }
          ]
        },
        {
          category: "AI & Testing Tools",
          icon: "Cpu",
          borderColor: "border-orange-200",
          bgColor: "bg-gradient-to-r from-orange-50 to-amber-50",
          technologies: [
            { label: "OpenAI API", iconSrc: "/AI2.webp" },
            { label: "Stripe", iconSrc: "/AI3.webp" },
            { label: "Jest", iconSrc: "/AI4.webp" },
            { label: "Postman", iconSrc: "/AI5.webp" },
            { label: "Swagger", iconSrc: "/AI6.webp" },
            { label: "Git", iconSrc: "/DAT3.webp" }
          ]
        }
      ],
      careerOutcomes: [
        {
          title: "MERN Stack Developer",
          salary: "$80k-$140k",
          icon: "Code",
          gradient: "from-blue-500 to-cyan-500",
          bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
          borderColor: "border-blue-200",
          description: "Build full stack JavaScript applications using MongoDB, Express, React and Node.js."
        },
        {
          title: "Full Stack Engineer",
          salary: "$95k-$160k",
          icon: "Layers",
          gradient: "from-green-500 to-emerald-500",
          bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
          borderColor: "border-green-200",
          description: "Own the full product stack from database to UI at high-growth startups and tech companies."
        },
        {
          title: "Software Architect",
          salary: "$130k-$200k",
          icon: "Star",
          gradient: "from-purple-500 to-pink-500",
          bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
          borderColor: "border-purple-200",
          description: "Design scalable, cloud-native MERN architectures for enterprise-grade applications."
        }
      ],
      capstoneData: {
        title: "Capstone Development",
        icon: "FileText",
        bgColor: "bg-white",
        borderColor: "border-red-200",
        projects: ["Full Stack E-Commerce", "Real-Time Chat App", "AI-Integrated Platform"],
        outcome: "Production-ready MERN application deployed to AWS with CI/CD and real users"
      },
      interviewPrep: {
        title: "Interview Preparation",
        icon: "Users",
        bgColor: "bg-white",
        borderColor: "border-red-200",
        technical: ["JavaScript/React", "Node.js/Express", "MongoDB Design", "System Design"],
        career: ["Resume + LinkedIn", "Mock Interviews", "Salary Negotiation"],
        outcome: "Crack MERN Stack interviews at FAANG, top startups and product companies"
      }
    },
    icon: FaCode
  };