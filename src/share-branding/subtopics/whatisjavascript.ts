import { SubtopicContentPattern } from '../subtopicContentRegistry';

export const whatIsJavaScriptContent: SubtopicContentPattern = {
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
            importanceBlock: "Beginners should care because JavaScript is one of the main building blocks of modern websites. Learning it opens the door to creating websites, apps, and digital tools."
        },
        everydayAnalogy: {
            title: "Think of It Like This",
            storyAnalogy: "The TV Remote Analogy",
            comparisonPanel: "Imagine building a toy car. HTML creates the body, CSS paints and decorates it, and JavaScript is the engine that makes it drive, honk, and move. Without the engine, the car may look nice, but it cannot actually do anything.",
            visualMetaphor: [
                { label: "Real World", comparison: "A TV remote controls channels, volume, and settings instantly." },
                { label: "Technical", comparison: "JavaScript acts like the remote control for websites, allowing users to trigger actions and make things happen." }
            ],
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
            conceptMap: [
                { id: "html", label: "HTML", type: "concept" },
                { id: "css", label: "CSS", type: "concept" },
                { id: "js", label: "JavaScript", type: "output" },
                { id: "user", label: "User", type: "actor" }
            ],
            visualLabels: [
                { from: "user", to: "js", label: "Interacts" },
                { from: "js", to: "html", label: "Manipulates" },
                { from: "js", to: "css", label: "Modifies" }
            ],
            tooltips: "JavaScript is the engine that turns static HTML/CSS into interactive experiences."
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
            summaryTitle: "JavaScript Recap",
            keyTakeaways: [
                "JavaScript makes websites interactive.",
                "It helps websites respond to users.",
                "It works with HTML and CSS.",
                "It powers many real-world digital platforms.",
                "It is an essential skill for web developers."
            ],
            simpleRecapPoints: [
                { id: "rp1", item: "JS makes pages alive", checked: true },
                { id: "rp2", item: "JS reacts to clicks", checked: true },
                { id: "rp3", item: "JS is a core skill", checked: true }
            ],
            confidenceBoost: "The JavaScript Formula",
            memoryReinforcement: "JavaScript is the engine that turns static pages into interactive, smart digital experiences."
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
};
