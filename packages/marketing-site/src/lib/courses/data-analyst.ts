import { Course } from '../CoursesCardData';
import { FaChartLine } from 'react-icons/fa';

export const dataAnalystCourse: Course =   {
    id: 1,
    category: "Data Science & AI",
    format: "LIVE ONLINE",
    title: "Data Analyst",
    description:
      "Analyze, visualize & communicate insights from data effectively using SQL and BI tools.",
    features: [
      "SQL & Database Queries",
      "Data Visualization",
      "Statistical Analysis",
      "Business Intelligence",
      "Python",
      "Excel"
    ],
    image: "/Fourth.webp",
    slug: "data-analyst",
    icon: FaChartLine,
    heroTitle: "Data Analyst",
    heroSubtitle: "with AI & ML",
    heroDescription: "Master Python, SQL, Tableau, Power BI, Machine Learning & cutting-edge AI tools.",
    heroSubDescription: "Build production-grade dashboards and land high-paying jobs at top companies.",

    // Add stats specific to Data Analyst course
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
          description: 'Data analysis tasks and exercises after each concept to reinforce learning',
          features: [
            'Weekly Data Challenges',
            'Automated Evaluation',
            'Progress Tracking'
          ],
          backContent: {
            points: [
              'Data cleaning and preprocessing tasks',
              'SQL query challenges',
              'Python data analysis exercises',
              'Dashboard creation assignments',
              'Real-world dataset analysis'
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
            'SQL + Python Challenges',
            'Dashboard Creation',
            'Detailed Analytics Reports'
          ],
          backContent: {
            points: [
              'SQL query optimization tests',
              'Python data analysis challenges',
              'Dashboard design evaluation',
              'Business insight generation',
              'Statistical analysis validation'
            ],
            frequency: 'After Each Module',
            weightage: '30% of final grade'
          }
        },
        {
          id: 2,
          title: 'Project Evaluations',
          description: 'Comprehensive review of data analytics projects with detailed feedback',
          features: [
            'Data Pipeline Review',
            'Dashboard UX/UI Check',
            'Business Insights Validation'
          ],
          backContent: {
            points: [
              'Data pipeline architecture evaluation',
              'Dashboard design and usability assessment',
              'Business insight accuracy check',
              'Visualization best practices review',
              'Storytelling effectiveness evaluation'
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
              'Verified data analytics skills'
            ],
            frequency: 'Program Completion',
            weightage: 'Official Certification'
          }
        }
      ],
      certificateData: {
        title: 'Industry-Recognized Certification',
        description: 'Our certificate validates your data analytics skills and demonstrates your competency to employers worldwide.',
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
          subtitle: 'Data Analytics & Business Intelligence',
          subSubtitle: 'Covering Python, Machine Learning, Deep Learning, Data Visualization, Statistics, Artificial Intelligence, Predictive Modeling, and Real-World Data Science Projects.',
          rating: 5
        }
      }
    },

    curriculum: {
      title: "Comprehensive Curriculum",
      description: "6–8 Months • 500–600 Hours",
      phases: [
        {
          id: 0,
          title: "Phase 1",
          subtitle: "Data Fundamentals & Excel",
          icon: "FileSpreadsheet",
          duration: "6-8 Weeks",
          gradient: "from-blue-500 to-indigo-600",
          bgColor: "bg-gradient-to-br from-blue-200 to-indigo-200",
          borderColor: "border-blue-700",
          topics: [
            {
              title: "Excel Mastery (3-4 Weeks)",
              color: "blue-500",
              items: [
                "Advanced formulas and functions",
                "Data cleaning and preprocessing",
                "Pivot tables and data summarization",
                "Advanced charting and visualization",
                "What-if analysis and scenario manager",
                "Power Query for data transformation",
                "Dashboard creation"
              ]
            },
            {
              title: "Statistics for Data Analysis (3-4 Weeks)",
              color: "indigo-500",
              items: [
                "Descriptive statistics",
                "Probability distributions",
                "Hypothesis testing",
                "Correlation and regression",
                "ANOVA and chi-square tests",
                "Statistical inference"
              ]
            }
          ],
          projects: [
            {
              title: "Mini Project:",
              description: "Sales Performance Dashboard",
              color: "blue"
            },
            {
              title: "Mini Project:",
              description: "Statistical Analysis of Business Dataset",
              color: "indigo"
            }
          ]
        },
        {
          id: 1,
          title: "Phase 2",
          subtitle: "SQL & Database Management",
          icon: "Database",
          duration: "6-7 Weeks",
          gradient: "from-green-500 to-emerald-600",
          bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
          borderColor: "border-green-200",
          topics: [
            {
              title: "SQL Fundamentals (3-4 Weeks)",
              color: "green-500",
              items: [
                "Database design and normalization",
                "SELECT statements and filtering",
                "JOIN operations and subqueries",
                "Aggregate functions and GROUP BY",
                "Window functions and CTEs",
                "Data modification and transactions"
              ]
            },
            {
              title: "Advanced SQL & Database Systems (3-4 Weeks)",
              color: "emerald-500",
              items: [
                "Stored procedures and functions",
                "Query optimization and indexing",
                "Working with NoSQL databases",
                "Data warehousing concepts",
                "ETL processes",
                "Database administration basics"
              ]
            }
          ],
          projects: [
            {
              title: "Project 1:",
              description: "Complex Business Queries for Real Database",
              color: "green"
            },
            {
              title: "Project 2:",
              description: "Data Warehouse Implementation",
              color: "emerald"
            }
          ]
        },
        {
          id: 2,
          title: "Phase 3",
          subtitle: "Python for Data Analysis",
          icon: "Code",
          duration: "8-10 Weeks",
          gradient: "from-purple-500 to-violet-600",
          bgColor: "bg-gradient-to-br from-purple-50 to-violet-50",
          borderColor: "border-purple-200",
          topics: [
            {
              title: "Python Fundamentals (3-4 Weeks)",
              color: "purple-500",
              items: [
                "Python syntax and data types",
                "Control structures and functions",
                "Object-oriented programming",
                "File handling and modules",
                "Error handling and debugging",
                "Working with APIs"
              ]
            },
            {
              title: "Data Analysis with Pandas & NumPy (5-6 Weeks)",
              color: "violet-500",
              items: [
                "NumPy arrays and operations",
                "Pandas DataFrames and Series",
                "Data cleaning and preprocessing",
                "Data aggregation and grouping",
                "Time series analysis",
                "Data merging and joining"
              ]
            }
          ],
          projects: [
            {
              title: "Project 1:",
              description: "Data Processing Script with Error Handling",
              color: "purple"
            },
            {
              title: "Project 2:",
              description: "Comprehensive Data Analysis of e-commerce Dataset",
              color: "violet"
            }
          ]
        },
        {
          id: 3,
          title: "Phase 4",
          subtitle: "Data Visualization with Python",
          icon: "BarChart",
          duration: "4-5 Weeks",
          gradient: "from-orange-500 to-amber-600",
          bgColor: "bg-gradient-to-br from-orange-50 to-amber-50",
          borderColor: "border-orange-200",
          topics: [
            {
              title: "Data Visualization Libraries (4-5 Weeks)",
              color: "orange-500",
              items: [
                "Matplotlib for basic plotting",
                "Seaborn for statistical visualization",
                "Plotly for interactive charts",
                "Geospatial visualization",
                "Dashboard building with Dash",
                "Best practices in data visualization"
              ]
            }
          ],
          projects: [
            {
              title: "Capstone Project:",
              description: "Interactive Dashboard for Business Metrics",
              color: "orange"
            }
          ]
        },
        {
          id: 4,
          title: "Phase 5",
          subtitle: "Business Intelligence & Visualization",
          icon: "PieChart",
          duration: "6-8 Weeks",
          gradient: "from-red-500 to-pink-600",
          bgColor: "bg-gradient-to-br from-red-50 to-pink-50",
          borderColor: "border-red-200",
          topics: [
            {
              title: "Tableau for Visualization (3-4 Weeks)",
              color: "red-500",
              items: [
                "Tableau interface and worksheet",
                "Connecting to various data sources",
                "Creating basic and advanced charts",
                "Calculated fields and parameters",
                "Dashboard design and layout",
                "Story points and presentation"
              ]
            },
            {
              title: "Power BI Mastery (3-4 Weeks)",
              color: "pink-500",
              items: [
                "Power BI desktop and service",
                "Data modeling and relationships",
                "DAX formulas and measures",
                "Advanced visualization techniques",
                "Power Query for ETL",
                "Report publishing and sharing"
              ]
            }
          ],
          projects: [
            {
              title: "Project 1:",
              description: "Sales Performance Dashboard in Tableau",
              color: "red"
            },
            {
              title: "Project 2:",
              description: "Customer Dashboard in Power BI",
              color: "pink"
            }
          ]
        },
        {
          id: 5,
          title: "Phase 6",
          subtitle: "Machine Learning & AI for Data Analysis",
          icon: "Brain",
          duration: "8-10 Weeks",
          gradient: "from-teal-500 to-cyan-600",
          bgColor: "bg-gradient-to-br from-teal-50 to-cyan-50",
          borderColor: "border-teal-200",
          topics: [
            {
              title: "Machine Learning Fundamentals (5-6 Weeks)",
              color: "teal-500",
              items: [
                "Supervised vs unsupervised learning",
                "Linear and logistic regression",
                "Decision trees and random forests",
                "Clustering algorithms",
                "Model evaluation and validation",
                "Feature engineering and selection"
              ]
            },
            {
              title: "Advanced ML & AI Integration (3-4 Weeks)",
              color: "cyan-500",
              items: [
                "Natural Language Processing (NLP)",
                "Time series forecasting",
                "Neural networks and deep learning",
                "Model deployment and monitoring",
                "AI-powered analytics",
                "MLOps fundamentals"
              ]
            }
          ],
          projects: [
            {
              title: "Project 1:",
              description: "Customer Churn Prediction Model",
              color: "teal"
            },
            {
              title: "Project 2:",
              description: "Sales Forecasting with ML",
              color: "cyan"
            }
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
              title: "Capstone Project Development (2-3 Weeks)",
              color: "yellow-500",
              items: [
                "End-to-end data analysis project",
                "Real-world business problem solving",
                "Data pipeline development",
                "Dashboard and report creation",
                "Presentation and storytelling",
                "Project documentation"
              ]
            },
            {
              title: "Interview Preparation (1-2 Weeks)",
              color: "amber-500",
              items: [
                "SQL interview questions",
                "Python coding challenges",
                "Statistics and probability questions",
                "Case study business problems",
                "Behavioral interview preparation",
                "Resume building and LinkedIn optimization"
              ]
            }
          ],
          projects: [
            {
              title: "Capstone Outcome:",
              description: "Production-ready data analysis project",
              color: "yellow"
            },
            {
              title: "Interview Outcome:",
              description: "Crack technical interviews at top companies",
              color: "amber"
            }
          ]
        }
      ],
      projects: [
        {
          id: 0,
          title: "Sales Performance Dashboard",
          description: "Interactive dashboard with sales metrics, customer insights, and revenue performance tracking",
          icon: "BarChart",
          gradient: "from-blue-500 to-cyan-500",
          bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
          borderColor: "border-blue-200",
          tags: ["Excel", "Tableau", "SQL", "Dashboard", "Business Intelligence"]
        },
        {
          id: 1,
          title: "E-commerce Analytics Platform",
          description: "Comprehensive analysis of customer behavior, sales trends, and inventory optimization with predictive models",
          icon: "ShoppingCart",
          gradient: "from-emerald-500 to-teal-500",
          bgColor: "bg-gradient-to-br from-emerald-50 to-teal-50",
          borderColor: "border-emerald-200",
          tags: ["Python", "Pandas", "SQL", "ML", "Tableau"]
        },
        {
          id: 2,
          title: "Healthcare Data Analysis",
          description: "Patient outcomes analysis, treatment effectiveness, and hospital performance metrics with visualization",
          icon: "Stethoscope",
          gradient: "from-purple-500 to-pink-500",
          bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
          borderColor: "border-purple-200",
          tags: ["Python", "SQL", "Power BI", "Statistics", "Healthcare"]
        },
        {
          id: 3,
          title: "Customer Churn Prediction",
          description: "Machine learning models to predict customer churn with feature importance analysis and business recommendations",
          icon: "Users",
          gradient: "from-amber-500 to-orange-500",
          bgColor: "bg-gradient-to-br from-amber-50 to-orange-50",
          borderColor: "border-amber-200",
          tags: ["Python", "Scikit-learn", "ML", "SQL", "Business Analytics"]
        },
        {
          id: 4,
          title: "Financial Market Analysis",
          description: "Stock price prediction, portfolio optimization, and risk forecasting with time series analysis",
          icon: "TrendingUp",
          gradient: "from-indigo-500 to-blue-500",
          bgColor: "bg-gradient-to-br from-indigo-50 to-blue-50",
          borderColor: "border-indigo-200",
          tags: ["Python", "Pandas", "Time Series", "Finance", "ML"]
        },
        {
          id: 5,
          title: "Social Media Sentiment Analysis",
          description: "NLP-based sentiment analysis of social media data to understand brand perception and collective sentiment",
          icon: "MessageSquare",
          gradient: "from-rose-500 to-pink-500",
          bgColor: "bg-gradient-to-br from-rose-50 to-pink-50",
          borderColor: "border-rose-200",
          tags: ["Python", "NLP", "Text Analysis", "Sentiment", "AI"]
        }
      ],
      techStack: [
        {
          category: "Data Analysis Tools",
          icon: "BarChart",
          borderColor: "border-blue-200",
          bgColor: "bg-gradient-to-r from-blue-50 to-indigo-50",
          technologies: [
            { label: "Python", iconSrc: "/DAT1.webp" },
            { label: "SQL", iconSrc: "/DAT2.webp" },
            { label: "Excel", iconSrc: "/DAT3.webp" },
            { label: "Statistics", iconSrc: "/DAT4.webp" },
            { label: "Pandas", iconSrc: "/DAT5.webp" },
            { label: "NumPy", iconSrc: "/DAT6.webp" }
          ]
        },
        {
          category: "Visualization Tools",
          icon: "PieChart",
          borderColor: "border-purple-200",
          bgColor: "bg-gradient-to-r from-purple-50 to-violet-50",
          technologies: [
            { label: "Tableau", iconSrc: "/VT1.webp" },
            { label: "Power BI", iconSrc: "/VT2.webp" },
            { label: "Matplotlib", iconSrc: "/VT3.svg" },
            { label: "Seaborn", iconSrc: "/VT4.webp" },
            { label: "Plotly", iconSrc: "/VT5.webp" },
            { label: "Dash", iconSrc: "/VT6.webp" }
          ]
        },
        {
          category: "Database & Cloud",
          icon: "Database",
          borderColor: "border-green-200",
          bgColor: "bg-gradient-to-r from-green-50 to-emerald-50",
          technologies: [
            { label: "MySQL", iconSrc: "/DD1.webp" },
            { label: "PostgreSQL", iconSrc: "/DC2.webp" },
            { label: "MongoDB", iconSrc: "/DC3.webp" },
            { label: "AWS", iconSrc: "/DC4.webp" },
            { label: "Google Cloud", iconSrc: "/DC5.webp" },
            { label: "Azure", iconSrc: "/DC6.webp" }
          ]
        },
        {
          category: "AI & ML Tools",
          icon: "Brain",
          borderColor: "border-orange-200",
          bgColor: "bg-gradient-to-r from-orange-50 to-amber-50",
          technologies: [
            { label: "Scikit-learn", iconSrc: "/ML1.webp" },
            { label: "TensorFlow", iconSrc: "/ML2.webp" },
            { label: "PyTorch", iconSrc: "/ML3.webp" },
            { label: "NLTK", iconSrc: "/ML4.webp" },
            { label: "spaCy", iconSrc: "/ML5.webp" },
            { label: "Hugging Face", iconSrc: "/ML6.webp" }
          ]
        }
      ],
      careerOutcomes: [
        {
          title: "Data Analyst",
          salary: "$65k–$110k",
          icon: "BarChart",
          gradient: "from-blue-500 to-cyan-500",
          bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
          borderColor: "border-blue-200",
          description: "Analyze data, create reports, and provide business insights using SQL, Python, and BI tools."
        },
        {
          title: "Business Intelligence Analyst",
          salary: "$70k–$120k",
          icon: "PieChart",
          gradient: "from-purple-500 to-pink-500",
          bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
          borderColor: "border-purple-200",
          description: "Design and implement BI solutions, dashboards, and data visualization systems."
        },
        {
          title: "Data Scientist",
          salary: "$85k–$140k",
          icon: "Brain",
          gradient: "from-green-500 to-emerald-500",
          bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
          borderColor: "border-green-200",
          description: "Build predictive models, perform advanced analytics, and derive insights from complex datasets."
        }
      ],
      capstoneData: {
        title: "Capstone Development",
        icon: "FileText",
        bgColor: "bg-white",
        borderColor: "border-red-200",
        projects: ["End-to-end Data Analysis", "Real Business Problem", "Complete Data Pipeline"],
        outcome: "Production-ready data analytics project with full documentation"
      },
      interviewPrep: {
        title: "Interview Preparation",
        icon: "Users",
        bgColor: "bg-white",
        borderColor: "border-red-200",
        technical: ["SQL Queries", "Python Coding", "Statistics & Probability", "Case Studies"],
        career: ["Resume + LinkedIn", "Mock Interviews", "Salary Negotiation"],
        outcome: "Crack data analyst interviews at top companies"
      }
    }
  };