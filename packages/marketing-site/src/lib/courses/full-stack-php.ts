import { Course } from '../CoursesCardData';
import { FaCode } from 'react-icons/fa';

export const fullStackPhpCourse: Course =   {
    id: 5,
    category: "Development",
    format: "LIVE ONLINE",
    title: "Full Stack PHP",
    description: "Master PHP with Laravel framework and build dynamic web applications with MySQL database.",
    features: [
      "Laravel Framework",
      "MySQL Database",
      "RESTful APIs",
      "Vue.js Integration",
      "Authentication",
      "Deployment"
    ],
    image: "/Third.webp",
    slug: "full-stack-php",
    heroTitle: "Full Stack PHP with AI & Cloud Integration",
    heroSubtitle: "with Laravel & Enterprise Architecture",
    heroDescription: "Master PHP, Laravel, MySQL, REST APIs, Vue.js, Docker, AWS & cutting-edge AI integration.",
    heroSubDescription: "Build production-grade full stack applications and land high-paying jobs at top companies.",
    companies: ["Microsoft", "IBM", "Accenture", "TCS", "Infosys", "Wipro"],
    ctaButtons: {
      primary: "Enroll Now - Limited Seats",
      secondary: "Explore Full Curriculum"
    },
    assessmentCertification: {
      assessmentCards: [
        {
          id: 0,
          title: "Weekly PHP & Laravel Challenges",
          description: "Hands-on coding exercises every week to reinforce server-side concepts",
          features: ["PHP Scripts", "Laravel Routing", "Code Reviews"],
          backContent: {
            points: [
              "OOP PHP coding tasks",
              "Laravel controller and routing exercises",
              "Database migration challenges",
              "Blade templating tasks",
              "Form validation implementation"
            ],
            frequency: "Every Week",
            weightage: "20% of final grade"
          }
        },
        {
          id: 1,
          title: "Module Assessments",
          description: "Comprehensive end-of-module tests covering core framework concepts",
          features: ["Eloquent ORM Tests", "API Design", "Security Evaluation"],
          backContent: {
            points: [
              "Eloquent relationship management tests",
              "REST API structure and responses",
              "Authentication and middleware challenges",
              "Vue.js component integration",
              "Debugging and error handling"
            ],
            frequency: "After Each Module",
            weightage: "30% of final grade"
          }
        },
        {
          id: 2,
          title: "Project Evaluations",
          description: "Expert review of full stack Laravel applications with detailed feedback",
          features: ["Architecture Review", "Code Quality Check", "Deployment Validation"],
          backContent: {
            points: [
              "MVC architecture and code organization",
              "Database schema and query efficiency",
              "Security best practices (CSRF, XSS)",
              "Frontend (Vue.js/Blade) integration",
              "CI/CD and production deployment"
            ],
            frequency: "Per Project",
            weightage: "40% of final grade"
          }
        },
        {
          id: 3,
          title: "Certification Benefits",
          description: "Industry-recognized PHP/Laravel certificate with global hiring partner access",
          features: ["Industry Recognized", "Global Validity", "Hiring Partner Access"],
          backContent: {
            points: [
              "Laravel specialization certificate",
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
        title: "Industry-Recognized PHP & Laravel Certification",
        description: "Our certificate validates your server-side development skills and demonstrates production-grade Laravel competency to employers worldwide.",
        benefits: [
          "PHP/Laravel specialization certificate",
          "Global recognition and validity",
          "Hiring partner acceptance",
          "Verified by industry experts",
          "LinkedIn digital badge included",
          "Career placement network access"
        ],
        certificateDetails: {
          title: "Certificate of Completion",
          subtitle: "Full Stack PHP Development",
          subSubtitle: "Covering PHP, Laravel, MySQL, Vue.js, REST APIs, Object-Oriented Programming, MVC Architecture, Cloud Deployment, and Real-World Web Application Projects.",
          rating: 5
        }
      }
    },
    curriculum: {
      title: "Comprehensive Curriculum",
      description: "6-8 Months · 500-600 Hours",
      phases: [
        {
          id: 0,
          title: "Phase 1",
          subtitle: "PHP Fundamentals & OOP",
          icon: "Code",
          duration: "6-8 Weeks",
          gradient: "from-blue-500 to-indigo-600",
          bgColor: "bg-gradient-to-br from-blue-50 to-indigo-50",
          borderColor: "border-blue-200",
          topics: [
            {
              title: "Modern PHP Core (3-4 Weeks)",
              color: "blue-500",
              items: [
                "PHP syntax, variables, and data types",
                "Control structures and functions",
                "Working with arrays and superglobals",
                "File handling and sessions",
                "Error and exception handling",
                "Composer and dependency management",
                "PHP 8+ new features"
              ]
            },
            {
              title: "Object-Oriented PHP (3-4 Weeks)",
              color: "indigo-500",
              items: [
                "Classes, objects, properties, and methods",
                "Constructors, inheritance, and overriding",
                "Visibility (public, private, protected)",
                "Static properties and methods",
                "Interfaces, abstract classes, and traits",
                "Namespaces and autoloading"
              ]
            }
          ],
          projects: [
            { title: "Mini Project:", description: "Command-line Task Manager using OOP", color: "blue" },
            { title: "Mini Project:", description: "Custom MVC Framework core", color: "indigo" }
          ]
        },
        {
          id: 1,
          title: "Phase 2",
          subtitle: "Database Management with MySQL",
          icon: "Database",
          duration: "4-6 Weeks",
          gradient: "from-orange-500 to-amber-600",
          bgColor: "bg-gradient-to-br from-orange-50 to-amber-50",
          borderColor: "border-orange-200",
          topics: [
            {
              title: "MySQL Fundamentals (2-3 Weeks)",
              color: "orange-500",
              items: [
                "Relational database concepts",
                "SQL syntax: SELECT, INSERT, UPDATE, DELETE",
                "Filtering and sorting data",
                "Joins (INNER, LEFT, RIGHT)",
                "Grouping and aggregate functions",
                "Database normalization"
              ]
            },
            {
              title: "Advanced Database Concepts (2-3 Weeks)",
              color: "amber-500",
              items: [
                "Connecting PHP to MySQL using PDO",
                "Prepared statements and SQL injection prevention",
                "Transactions and ACID properties",
                "Indexing for performance",
                "Stored procedures and triggers",
                "Database backups and migrations"
              ]
            }
          ],
          projects: [
            { title: "Project 1:", description: "Employee Management System with PDO", color: "orange" },
            { title: "Project 2:", description: "E-commerce Database Schema Design", color: "amber" }
          ]
        },
        {
          id: 2,
          title: "Phase 3",
          subtitle: "Laravel Framework Core",
          icon: "Layers",
          duration: "8-10 Weeks",
          gradient: "from-red-500 to-rose-600",
          bgColor: "bg-gradient-to-br from-red-50 to-rose-50",
          borderColor: "border-red-200",
          topics: [
            {
              title: "Routing, Controllers & Blade (4-5 Weeks)",
              color: "red-500",
              items: [
                "Laravel installation and directory structure",
                "Routing, route parameters, and named routes",
                "Controllers and resource controllers",
                "Blade templating engine and components",
                "Form handling, CSRF protection, and validation",
                "Session and flash messaging",
                "File storage and image uploads"
              ]
            },
            {
              title: "Eloquent ORM & Migrations (4-5 Weeks)",
              color: "rose-500",
              items: [
                "Database migrations and schema building",
                "Seeders and model factories",
                "Eloquent models and CRUD operations",
                "Eloquent relationships (1:1, 1:N, N:N, polymorphic)",
                "Query builder and advanced Eloquent",
                "Accessors, mutators, and attribute casting",
                "Eager loading and N+1 query problem"
              ]
            }
          ],
          projects: [
            { title: "Project 1:", description: "Blogging Platform with Blade and Eloquent", color: "red" },
            { title: "Project 2:", description: "Job Board with Advanced Filtering", color: "rose" }
          ]
        },
        {
          id: 3,
          title: "Phase 4",
          subtitle: "Advanced Laravel & API Development",
          icon: "Server",
          duration: "6-8 Weeks",
          gradient: "from-purple-500 to-violet-600",
          bgColor: "bg-gradient-to-br from-purple-50 to-violet-50",
          borderColor: "border-purple-200",
          topics: [
            {
              title: "Security & Architecture (3-4 Weeks)",
              color: "purple-500",
              items: [
                "Authentication with Laravel Breeze/Jetstream",
                "Authorization: Gates and Policies",
                "Middleware creation and usage",
                "Service container and dependency injection",
                "Service providers and facades",
                "Events, listeners, and job queues",
                "Sending emails and notifications"
              ]
            },
            {
              title: "RESTful API Development (3-4 Weeks)",
              color: "violet-500",
              items: [
                "API routing and versioning",
                "API resources and JSON transformation",
                "API authentication with Laravel Sanctum",
                "Rate limiting and API security",
                "Handling CORS",
                "API testing with Postman and PHPUnit"
              ]
            }
          ],
          projects: [
            { title: "Project:", description: "E-commerce Backend API with Sanctum Auth", color: "purple" },
            { title: "Project:", description: "Background Email Processing System with Queues", color: "violet" }
          ]
        },
        {
          id: 4,
          title: "Phase 5",
          subtitle: "Frontend Integration (Vue.js / Inertia)",
          icon: "Monitor",
          duration: "5-6 Weeks",
          gradient: "from-green-500 to-emerald-600",
          bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
          borderColor: "border-green-200",
          topics: [
            {
              title: "Vue.js & Modern Frontend (2-3 Weeks)",
              color: "green-500",
              items: [
                "Vue 3 Composition API basics",
                "Component architecture and props",
                "State management in Vue",
                "Tailwind CSS integration with Laravel Mix/Vite",
                "Making API requests with Axios",
                "Handling frontend forms and validation"
              ]
            },
            {
              title: "Inertia.js Integration (2-3 Weeks)",
              color: "emerald-500",
              items: [
                "Understanding the Inertia.js monolith approach",
                "Setting up Laravel with Inertia and Vue",
                "Routing and data passing with Inertia",
                "Shared data and persistent layouts",
                "Form handling and error validation in Inertia",
                "SPA transitions and performance"
              ]
            }
          ],
          projects: [
            { title: "Project 1:", description: "Vue.js SPA consuming Laravel REST API", color: "green" },
            { title: "Project 2:", description: "Inertia.js based Real Estate Listing App", color: "emerald" }
          ]
        },
        {
          id: 5,
          title: "Phase 6",
          subtitle: "Testing, Deployment & DevOps",
          icon: "Cloud",
          duration: "4-6 Weeks",
          gradient: "from-teal-500 to-cyan-600",
          bgColor: "bg-gradient-to-br from-teal-50 to-cyan-50",
          borderColor: "border-teal-200",
          topics: [
            {
              title: "Testing & Code Quality (2-3 Weeks)",
              color: "teal-500",
              items: [
                "Test-Driven Development (TDD) concepts",
                "Writing feature and unit tests with PHPUnit/Pest",
                "Mocking dependencies and database testing",
                "Browser testing with Laravel Dusk",
                "Static analysis tools (PHPStan)",
                "Code styling (Laravel Pint)"
              ]
            },
            {
              title: "Deployment & CI/CD (2-3 Weeks)",
              color: "cyan-500",
              items: [
                "Server provisioning (Ubuntu, Nginx, PHP-FPM)",
                "Deploying with Laravel Forge / Envoyer",
                "Dockerizing Laravel applications (Laravel Sail)",
                "Setting up CI/CD pipelines with GitHub Actions",
                "Managing environment variables in production",
                "Application monitoring and error tracking (Sentry)"
              ]
            }
          ],
          projects: [
            { title: "Project:", description: "Fully Tested Laravel Package Development", color: "teal" },
            { title: "Project:", description: "Dockerized Deployment of E-Commerce App via CI/CD", color: "cyan" }
          ]
        },
        {
          id: 6,
          title: "Phase 7",
          subtitle: "Capstone Projects & Interview Preparation",
          icon: "Rocket",
          duration: "4-6 Weeks",
          gradient: "from-yellow-500 to-amber-600",
          bgColor: "bg-gradient-to-br from-yellow-50 to-amber-50",
          borderColor: "border-yellow-200",
          topics: [
            {
              title: "Capstone Development (2-3 Weeks)",
              color: "yellow-500",
              items: [
                "End-to-end application planning and architecture",
                "Database design and implementation",
                "Full stack development and automated testing",
                "Production deployment and server configuration",
                "Performance optimization and caching (Redis)",
                "Portfolio presentation"
              ]
            },
            {
              title: "Interview Preparation (2-3 Weeks)",
              color: "amber-500",
              items: [
                "PHP and Laravel specific interview questions",
                "Database and SQL optimization scenarios",
                "System design for monolithic and API-driven apps",
                "Live coding and debugging practice",
                "Resume and LinkedIn profile optimization",
                "Mock interviews with industry experts"
              ]
            }
          ],
          projects: [
            { title: "Capstone Project:", description: "SaaS Application with Multi-tenancy and Subscription Billing", color: "yellow" },
            { title: "Interview Outcome:", description: "Crack backend and full-stack interviews at top companies", color: "amber" }
          ]
        }
      ],
      projects: [
        {
          id: 0,
          title: "Multi-vendor E-Commerce",
          description: "Full-featured shopping platform with vendor dashboards, cart, Stripe payments, and order tracking.",
          icon: "ShoppingCart",
          gradient: "from-blue-500 to-cyan-500",
          bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
          borderColor: "border-blue-200",
          tags: ["Laravel", "Vue.js", "MySQL", "Stripe", "Tailwind"]
        },
        {
          id: 1,
          title: "Project Management SaaS",
          description: "Multi-tenant SaaS application for managing projects, tasks, and teams with subscription billing.",
          icon: "Layout",
          gradient: "from-purple-500 to-pink-500",
          bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
          borderColor: "border-purple-200",
          tags: ["Laravel Cashier", "Inertia.js", "MySQL", "Queues"]
        },
        {
          id: 2,
          title: "Real-time Support Helpdesk",
          description: "Ticketing system with real-time chat, email parsing, and agent performance analytics.",
          icon: "Headset",
          gradient: "from-green-500 to-emerald-500",
          bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
          borderColor: "border-green-200",
          tags: ["Laravel Echo", "WebSockets", "Vue.js", "Redis"]
        },
        {
          id: 3,
          title: "Headless CMS API",
          description: "Robust REST API for content management with role-based access control and media handling.",
          icon: "Server",
          gradient: "from-orange-500 to-amber-500",
          bgColor: "bg-gradient-to-br from-orange-50 to-amber-50",
          borderColor: "border-orange-200",
          tags: ["Laravel Sanctum", "REST API", "Postman", "S3"]
        },
        {
          id: 4,
          title: "Property Booking Platform",
          description: "Airbnb-clone with advanced search filters, map integration, and date availability management.",
          icon: "Home",
          gradient: "from-red-500 to-rose-500",
          bgColor: "bg-gradient-to-br from-red-50 to-rose-50",
          borderColor: "border-red-200",
          tags: ["Laravel", "Blade", "Livewire", "Alpine.js", "MySQL"]
        },
        {
          id: 5,
          title: "Social Network for Developers",
          description: "Platform for developers to share code snippets, follow users, and engage in technical discussions.",
          icon: "Users",
          gradient: "from-teal-500 to-cyan-500",
          bgColor: "bg-gradient-to-br from-teal-50 to-cyan-50",
          borderColor: "border-teal-200",
          tags: ["Laravel", "Eloquent", "Vue.js", "Redis Caching"]
        }
      ],
      techStack: [
        {
          category: "Backend Frameworks",
          icon: "Server",
          borderColor: "border-red-200",
          bgColor: "bg-gradient-to-r from-red-50 to-rose-50",
          technologies: [
            { label: "PHP 8+", iconSrc: "/BE3.webp" },
            { label: "Laravel", iconSrc: "/BE4.webp" },
            { label: "Composer", iconSrc: "/BE5.webp" },
            { label: "REST APIs", iconSrc: "/BE6.webp" },
            { label: "PHPUnit", iconSrc: "/AI4.webp" },
            { label: "Redis", iconSrc: "/DDW4.webp" }
          ]
        },
        {
          category: "Database & Storage",
          icon: "Database",
          borderColor: "border-orange-200",
          bgColor: "bg-gradient-to-r from-orange-50 to-amber-50",
          technologies: [
            { label: "MySQL", iconSrc: "/DD1.webp" },
            { label: "PostgreSQL", iconSrc: "/DDW1.webp" },
            { label: "Eloquent ORM", iconSrc: "/DC4.webp" },
            { label: "AWS S3", iconSrc: "/CP1.webp" },
            { label: "Database Design", iconSrc: "/DC3.webp" },
            { label: "Memcached", iconSrc: "/DDW5.svg" }
          ]
        },
        {
          category: "Frontend Integration",
          icon: "Monitor",
          borderColor: "border-green-200",
          bgColor: "bg-gradient-to-r from-green-50 to-emerald-50",
          technologies: [
            { label: "Vue.js", iconSrc: "/FSE3.webp" },
            { label: "Inertia.js", iconSrc: "/FSE4.webp" },
            { label: "Blade", iconSrc: "/FSE1.webp" },
            { label: "Livewire", iconSrc: "/FSE5.webp" },
            { label: "Tailwind CSS", iconSrc: "/FSE6.webp" },
            { label: "Alpine.js", iconSrc: "/FSE2.webp" }
          ]
        },
        {
          category: "DevOps & Tooling",
          icon: "Cloud",
          borderColor: "border-blue-200",
          bgColor: "bg-gradient-to-r from-blue-50 to-cyan-50",
          technologies: [
            { label: "Docker", iconSrc: "/DD4.webp" },
            { label: "Laravel Sail", iconSrc: "/DevOps4.webp" },
            { label: "GitHub Actions", iconSrc: "/DevOps6.webp" },
            { label: "Nginx", iconSrc: "/DevOps5.webp" },
            { label: "Git", iconSrc: "/DAT3.webp" },
            { label: "Postman", iconSrc: "/AI5.webp" }
          ]
        }
      ],
      careerOutcomes: [
        {
          title: "Laravel Developer",
          salary: "$75k-$130k",
          icon: "Code",
          gradient: "from-red-500 to-rose-500",
          bgColor: "bg-gradient-to-br from-red-50 to-rose-50",
          borderColor: "border-red-200",
          description: "Build robust backend systems and REST APIs using the elegant Laravel framework."
        },
        {
          title: "Full Stack PHP Engineer",
          salary: "$85k-$150k",
          icon: "Layers",
          gradient: "from-blue-500 to-cyan-500",
          bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
          borderColor: "border-blue-200",
          description: "Develop complete end-to-end web applications combining Laravel with modern frontends like Vue.js."
        },
        {
          title: "Backend Architect",
          salary: "$120k-$180k",
          icon: "Server",
          gradient: "from-purple-500 to-pink-500",
          bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
          borderColor: "border-purple-200",
          description: "Design scalable database architectures and microservices for enterprise applications."
        }
      ],
      capstoneData: {
        title: "Capstone Development",
        icon: "FileText",
        bgColor: "bg-white",
        borderColor: "border-red-200",
        projects: ["SaaS Platform with Billing", "Multi-vendor E-Commerce", "Headless CMS API"],
        outcome: "Production-ready Laravel application deployed to the cloud with automated testing and CI/CD"
      },
      interviewPrep: {
        title: "Interview Preparation",
        icon: "Users",
        bgColor: "bg-white",
        borderColor: "border-red-200",
        technical: ["PHP/OOP Concepts", "Laravel Architecture", "Database Optimization", "System Design"],
        career: ["Resume + LinkedIn", "Mock Interviews", "Salary Negotiation"],
        outcome: "Crack backend and full-stack interviews at top tech companies and digital agencies"
      }
    },
    icon: FaCode
  };