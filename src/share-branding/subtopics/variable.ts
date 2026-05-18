import { SubtopicContentPattern } from '../subtopicContentRegistry';

export const variableContent: SubtopicContentPattern = {
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
            heroVisual: {
              type: 'inline_svg',
              dataUri: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIHJ4PSI0MCIgZmlsbD0idXJsKCNwYWludDBfbGluZWFyKSIvPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQwX2xpbmVhciIgeDE9IjAiIHkxPSIwIiB4Mj0iODAwIiB5Mj0iNjAwIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHN0b3Agc3RvcC1jb2xvcj0iI0ZGRUEwMCIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI0ZGOTUwMCIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjwvc3ZnPg==',
              alt: 'Variables and Data Types Overview'
            }
        },
        everydayAnalogy: {
            title: "Think of It Like This",
            storyAnalogy: "The Labeled Kitchen Containers",
            comparisonPanel: "Imagine you have different labeled containers in your kitchen. One jar says Sugar, another says Rice, and another says Salt. The label is like the variable name, and what is inside is the data type. This helps you quickly know what each container holds and how to use it.",
            visualMetaphor: [
                { label: "Real World", comparison: "A school bag has different pockets for books, pencils, and lunch boxes. Each pocket stores a specific type of item." },
                { label: "Technical", comparison: "Variables are like those pockets, and data types are the type of items stored inside them, such as text, numbers, or yes/no values." }
            ],
            keyTakeaway: "Variables organize information, and data types explain what that information is.",
            analogyVisual: {
              type: 'inline_svg',
              dataUri: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIHJ4PSI0MCIgZmlsbD0idXJsKCNwYWludDBfbGluZWFyKSIvPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQwX2xpbmVhciIgeDE9IjAiIHkxPSIwIiB4Mj0iODAwIiB5Mj0iNjAwIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHN0b3Agc3RvcC1jb2xvcj0iI0ZGRUEwMCIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI0ZGOTUwMCIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjwvc3ZnPg==',
              alt: 'Kitchen Container Analogy'
            }
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
            conceptMap: [
                { id: "var", label: "Variable", type: "concept" },
                { id: "str", label: "String", type: "concept" },
                { id: "num", label: "Number", type: "concept" },
                { id: "bool", label: "Boolean", type: "concept" }
            ],
            visualLabels: [
                { from: "var", to: "str", label: "can hold" },
                { from: "var", to: "num", label: "can hold" },
                { from: "var", to: "bool", label: "can hold" }
            ],
            tooltips: "A variable is the box; the data type is what goes inside it."
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
            summaryTitle: "Variables Recap",
            keyTakeaways: [
                "Variables are storage boxes for information.",
                "Data types describe what kind of information is stored.",
                "Variables can hold names, ages, prices, and more.",
                "Data types help computers use information correctly.",
                "This concept is essential for all programming."
            ],
            simpleRecapPoints: [
                { id: "rp1", item: "Variable = Labeled Box", checked: true },
                { id: "rp2", item: "Data Type = Content Kind", checked: true },
                { id: "rp3", item: "Information is stored", checked: true }
            ],
            confidenceBoost: "The Variable Formula",
            memoryReinforcement: "Variables are labeled boxes that store data. Data types define what kind of data each box holds."
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
  }
};
