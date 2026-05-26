import { Course } from '../CoursesCardData';
import { FaBrain } from 'react-icons/fa';

export const dataScienceAiBootcampCourse: Course =   {
    id: 2,
    category: "Data Science & AI",
    format: "LIVE ONLINE",
    title: "Data Science & AI Mastery Bootcamp",
    description:
      "Master Python, Machine Learning, Deep Learning, NLP, Computer Vision & MLOps. Build production-grade AI applications and land high-paying jobs at top tech companies.",
    features: [
      "Machine Learning",
      "Deep Learning",
      "NLP & Computer Vision",
      "Statistics & ML Foundations",
      "Advanced AI Techniques",
      "MLOps & Deployment"
    ],
    image: "/T.webp", // You'll need to create/use this image
    slug: "data-science-ai-bootcamp",
    icon: FaBrain,

    // Hero Section Data
    heroTitle: "Data Science & AI",
    heroSubtitle: "with Deep Learning",
    heroDescription: "Master Python, Statistics, Machine Learning, Deep Learning, NLP, Computer Vision, MLOps & cutting-edge AI tools.",
    heroSubDescription: "Build production-grade AI applications and land high-paying jobs at top tech companies.",


    companies: ["Google", "Microsoft", "Amazon", "TCS", "Infosys", "Wipro", "Meta", "Netflix"],
    ctaButtons: {
      primary: "Enroll Now - Limited Seats",
      secondary: "Explore Full Curriculum"
    },

    // Assessment & Certification Data
    assessmentCertification: {
      assessmentCards: [
        {
          id: 0,
          title: 'Weekly Assignments',
          description: 'Hands-on data science tasks and exercises after each concept to reinforce learning',
          features: [
            'Weekly Data Challenges',
            'Automated Evaluation',
            'Progress Tracking'
          ],
          backContent: {
            points: [
              'Python coding and data manipulation exercises',
              'Statistical analysis tasks',
              'ML model implementation challenges',
              'Data visualization assignments',
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
            'Statistics + ML Challenges',
            'Python Coding Tests',
            'Detailed Analytics Reports'
          ],
          backContent: {
            points: [
              'Statistical hypothesis testing',
              'Machine learning algorithm implementation',
              'Python data science libraries proficiency',
              'Model evaluation and validation',
              'Data preprocessing and feature engineering'
            ],
            frequency: 'After Each Module',
            weightage: '30% of final grade'
          }
        },
        {
          id: 2,
          title: 'Project Evaluations',
          description: 'Comprehensive review of data science projects with detailed feedback',
          features: [
            'ML Pipeline Review',
            'Model Performance Check',
            'Deployment Readiness'
          ],
          backContent: {
            points: [
              'End-to-end ML pipeline evaluation',
              'Model performance and accuracy assessment',
              'Code quality and best practices review',
              'Deployment readiness evaluation',
              'Documentation and presentation assessment'
            ],
            frequency: 'Per Project',
            weightage: '40% of final grade'
          }
        },
        {
          id: 3,
          title: 'Certification Benefits',
          description: 'Industry-recognized data science certificate with global recognition',
          features: [
            'Industry Recognized',
            'Global Validity',
            'Hiring Partner Access'
          ],
          backContent: {
            points: [
              'Industry-recognized data science certificate',
              'Global recognition and validity',
              'Hiring partner acceptance',
              'Alumni network access',
              'Verified data science and AI skills'
            ],
            frequency: 'Program Completion',
            weightage: 'Official Certification'
          }
        }
      ],
      certificateData: {
        title: 'Industry-Recognized Data Science Certification',
        description: 'Our certificate validates your data science and AI skills and demonstrates your competency to employers worldwide. It showcases your ability to build production-grade AI applications.',
        benefits: [
          'Industry-recognized certificate',
          'Global recognition and validity',
          'Hiring partner acceptance',
          'Alumni network access',
          'Verified by industry experts',
          'Includes digital badge for LinkedIn'
        ],
        certificateDetails: {
          title: 'Certificate of Completion',
          subtitle: 'Data Science & AI Mastery',
          subSubtitle: 'Covering Python, Machine Learning, Deep Learning, Data Visualization, Statistics, Artificial Intelligence, Predictive Modeling, and Real-World Data Science Projects.',
          rating: 5
        }
      }
    },

    // Comprehensive Curriculum Data
    curriculum: {
      title: "Comprehensive Curriculum",
      description: "6–8 Months • 600–700 Hours",
      phases: [
        {
          id: 0,
          title: "Phase 1",
          subtitle: "Python Fundamentals & Data Analysis",
          icon: "Code",
          duration: "6-8 Weeks",
          gradient: "from-blue-500 to-indigo-600",
          bgColor: "bg-gradient-to-br from-blue-200 to-indigo-200",
          borderColor: "border-blue-700",
          topics: [
            {
              title: "Python Programming Essentials (3-4 Weeks)",
              color: "blue-500",
              items: [
                "Python installation, IDEs (VS Code, PyCharm)",
                "Data types, variables, operators, control structures",
                "Functions, modules, and object-oriented programming",
                "Exception handling and debugging",
                "File I/O and data serialization",
                "Essential libraries: NumPy, Pandas, Matplotlib"
              ]
            },
            {
              title: "Data Analysis & Visualization (3-4 Weeks)",
              color: "indigo-500",
              items: [
                "Pandas for data manipulation and cleaning",
                "Data visualization with Matplotlib and Seaborn",
                "Exploratory Data Analysis (EDA) techniques",
                "Statistical analysis and hypothesis testing",
                "Working with different data formats (CSV, JSON, Excel)",
                "Web scraping with BeautifulSoup and Requests"
              ]
            }
          ],
          projects: [
            {
              title: "Mini Project:",
              description: "Data analysis of real-world datasets (Sales, Weather, etc.)",
              color: "blue"
            },
            {
              title: "Main Project:",
              description: "Comprehensive EDA on a real-world dataset with insights",
              color: "indigo"
            }
          ]
        },
        {
          id: 1,
          title: "Phase 2",
          subtitle: "Statistics & Machine Learning Foundations",
          icon: "BarChart",
          duration: "8-10 Weeks",
          gradient: "from-green-500 to-emerald-600",
          bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
          borderColor: "border-green-200",
          topics: [
            {
              title: "Statistics for Data Science (4-5 Weeks)",
              color: "green-500",
              items: [
                "Descriptive statistics and probability theory",
                "Probability distributions and their applications",
                "Statistical inference and hypothesis testing",
                "Correlation and regression analysis",
                "Bayesian statistics fundamentals",
                "A/B testing and experimental design"
              ]
            },
            {
              title: "Machine Learning Fundamentals (4-5 Weeks)",
              color: "emerald-500",
              items: [
                "Linear and logistic regression",
                "Decision trees and ensemble methods (Random Forest, XGBoost)",
                "Clustering algorithms (K-Means, Hierarchical, DBSCAN)",
                "Model evaluation and validation techniques",
                "Feature engineering and selection",
                "Cross-validation and hyperparameter tuning",
                "Introduction to Scikit-learn"
              ]
            }
          ],
          projects: [
            {
              title: "Project 1:",
              description: "Statistical analysis of business problems",
              color: "green"
            },
            {
              title: "Project 2:",
              description: "End-to-end ML pipeline for classification/regression problem",
              color: "emerald"
            }
          ]
        },
        {
          id: 2,
          title: "Phase 3",
          subtitle: "Advanced Machine Learning & Deep Learning",
          icon: "Brain",
          duration: "8-10 Weeks",
          gradient: "from-purple-500 to-violet-600",
          bgColor: "bg-gradient-to-br from-purple-50 to-violet-50",
          borderColor: "border-purple-200",
          topics: [
            {
              title: "Advanced ML Algorithms (4-5 Weeks)",
              color: "purple-500",
              items: [
                "Support Vector Machines (SVM)",
                "Principal Component Analysis (PCA)",
                "Gradient Boosting algorithms (LightGBM, CatBoost)",
                "Time series analysis and forecasting",
                "Recommendation systems",
                "Anomaly detection techniques",
                "Model interpretability (SHAP, LIME)"
              ]
            },
            {
              title: "Deep Learning Fundamentals (4-5 Weeks)",
              color: "violet-500",
              items: [
                "Neural networks fundamentals",
                "TensorFlow and Keras for deep learning",
                "PyTorch fundamentals",
                "Convolutional Neural Networks (CNNs)",
                "Recurrent Neural Networks (RNNs, LSTMs)",
                "Transfer learning and fine-tuning",
                "Hyperparameter optimization for neural networks"
              ]
            }
          ],
          projects: [
            {
              title: "Project 1:",
              description: "Time series forecasting or recommendation system",
              color: "purple"
            },
            {
              title: "Project 2:",
              description: "Image classification or text generation with deep learning",
              color: "violet"
            }
          ]
        },
        {
          id: 3,
          title: "Phase 4",
          subtitle: "Natural Language Processing & Computer Vision",
          icon: "Eye",
          duration: "8-10 Weeks",
          gradient: "from-orange-500 to-amber-600",
          bgColor: "bg-gradient-to-br from-orange-50 to-amber-50",
          borderColor: "border-orange-200",
          topics: [
            {
              title: "Natural Language Processing (4-5 Weeks)",
              color: "orange-500",
              items: [
                "Text preprocessing and tokenization",
                "TF-IDF and word embeddings (Word2Vec, GloVe)",
                "Transformer architecture and BERT",
                "Sentiment analysis and text classification",
                "Named Entity Recognition (NER)",
                "Text generation with GPT models",
                "Hugging Face Transformers library"
              ]
            },
            {
              title: "Computer Vision (4-5 Weeks)",
              color: "amber-500",
              items: [
                "Image processing fundamentals",
                "Object detection (YOLO, SSD)",
                "Image segmentation (U-Net, Mask R-CNN)",
                "Generative Adversarial Networks (GANs)",
                "Face recognition and analysis",
                "Optical Character Recognition (OCR)",
                "Video analysis and processing"
              ]
            }
          ],
          projects: [
            {
              title: "Project 1:",
              description: "Sentiment analysis or text classification system",
              color: "orange"
            },
            {
              title: "Project 2:",
              description: "Object detection or image segmentation application",
              color: "amber"
            }
          ]
        },
        {
          id: 4,
          title: "Phase 5",
          subtitle: "MLOps & Deployment",
          icon: "Cloud",
          duration: "6-8 Weeks",
          gradient: "from-red-500 to-pink-600",
          bgColor: "bg-gradient-to-br from-red-50 to-pink-50",
          borderColor: "border-red-200",
          topics: [
            {
              title: "MLOps Fundamentals (3-4 Weeks)",
              color: "red-500",
              items: [
                "Model versioning and experiment tracking (MLflow)",
                "Docker containerization for ML",
                "Model deployment strategies",
                "CI/CD for machine learning",
                "Model monitoring and maintenance",
                "Feature stores and data versioning"
              ]
            },
            {
              title: "Cloud Deployment (3-4 Weeks)",
              color: "pink-500",
              items: [
                "Deploy ML applications to cloud platforms",
                "AWS SageMaker for model deployment",
                "Google AI Platform deployment",
                "Azure Machine Learning deployment",
                "Serverless deployment with AWS Lambda",
                "Model serving with TensorFlow Serving",
                "Building ML web applications with Streamlit"
              ]
            }
          ],
          projects: [
            {
              title: "Project:",
              description: "Deploy complete ML pipeline to cloud",
              color: "pink"
            }
          ]
        },
        {
          id: 5,
          title: "Phase 6",
          subtitle: "Capstone Projects & Interview Preparation",
          icon: "Rocket",
          duration: "6-8 Weeks",
          gradient: "from-teal-500 to-cyan-600",
          bgColor: "bg-gradient-to-br from-teal-50 to-cyan-50",
          borderColor: "border-teal-200",
          topics: [
            {
              title: "Capstone Project Development (4-5 Weeks)",
              color: "teal-500",
              items: [
                "End-to-end data science project execution",
                "Computer vision application development",
                "NLP or text analysis system",
                "Time series forecasting application",
                "Recommendation engine implementation",
                "Anomaly detection system",
                "Agile development methodology"
              ]
            },
            {
              title: "Interview Preparation (2-3 Weeks)",
              color: "cyan-500",
              items: [
                "Statistics and probability questions",
                "Machine learning theory and concepts",
                "Coding challenges on LeetCode, HackerRank",
                "Case study and business problems",
                "System design for ML systems",
                "Resume building and LinkedIn optimization",
                "Mock interviews and feedback"
              ]
            }
          ],
          projects: [
            {
              title: "Capstone Outcome:",
              description: "Production-ready data science application",
              color: "teal"
            },
            {
              title: "Interview Outcome:",
              description: "Crack data science interviews at top companies",
              color: "cyan"
            }
          ]
        }
      ],

      // Portfolio Projects Section
      projects: [
        {
          id: 0,
          title: "Medical Image Analysis System",
          description: "Deep learning application for medical image classification and segmentation with high accuracy",
          icon: "Stethoscope",
          gradient: "from-blue-500 to-cyan-500",
          bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
          borderColor: "border-blue-200",
          tags: ["Deep Learning", "Computer Vision", "Healthcare", "TensorFlow", "Python"]
        },
        {
          id: 1,
          title: "Autonomous Vehicle Object Detection",
          description: "Real-time object detection system for autonomous vehicles using YOLO and computer vision",
          icon: "Car",
          gradient: "from-green-500 to-emerald-500",
          bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
          borderColor: "border-green-200",
          tags: ["Computer Vision", "Real-time", "YOLO", "Deep Learning", "Python"]
        },
        {
          id: 2,
          title: "Fraud Detection System",
          description: "Machine learning system for real-time fraud detection in financial transactions",
          icon: "Shield",
          gradient: "from-purple-500 to-pink-500",
          bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
          borderColor: "border-purple-200",
          tags: ["Machine Learning", "Real-time", "Finance", "Anomaly Detection", "Python"]
        },
        {
          id: 3,
          title: "E-commerce Recommendation Engine",
          description: "Personalized product recommendation system using collaborative filtering and content-based approaches",
          icon: "ShoppingCart",
          gradient: "from-orange-500 to-amber-500",
          bgColor: "bg-gradient-to-br from-orange-50 to-amber-50",
          borderColor: "border-orange-200",
          tags: ["Machine Learning", "Recommendation Systems", "E-commerce", "Python"]
        },
        {
          id: 4,
          title: "Social Media Sentiment Analysis",
          description: "Real-time sentiment analysis of social media posts with interactive dashboards and visualizations",
          icon: "MessageSquare",
          gradient: "from-red-500 to-rose-500",
          bgColor: "bg-gradient-to-br from-red-50 to-rose-50",
          borderColor: "border-red-200",
          tags: ["NLP", "Sentiment Analysis", "Social Media", "Python", "Dashboard"]
        },
        {
          id: 5,
          title: "COVID-19 Spread Prediction",
          description: "Time series forecasting model for COVID-19 spread with interactive visualization",
          icon: "Activity",
          gradient: "from-indigo-500 to-violet-500",
          bgColor: "bg-gradient-to-br from-indigo-50 to-violet-50",
          borderColor: "border-indigo-200",
          tags: ["Time Series", "Forecasting", "Healthcare", "Python", "Visualization"]
        },
        {
          id: 6,
          title: "Credit Risk Assessment Model",
          description: "Machine learning model for credit risk assessment with explainable AI techniques",
          icon: "TrendingUp",
          gradient: "from-teal-500 to-cyan-500",
          bgColor: "bg-gradient-to-br from-teal-50 to-cyan-50",
          borderColor: "border-teal-200",
          tags: ["Machine Learning", "Finance", "Risk Assessment", "XAI", "Python"]
        },
        {
          id: 7,
          title: "Multilingual Text Translation",
          description: "Neural machine translation system for multiple languages using transformer models",
          icon: "Globe",
          gradient: "from-yellow-500 to-amber-500",
          bgColor: "bg-gradient-to-br from-yellow-50 to-amber-50",
          borderColor: "border-yellow-200",
          tags: ["NLP", "Translation", "Transformers", "Deep Learning", "Python"]
        }
      ],

      // Tech Stack Section
      techStack: [
        {
          category: "Programming & Core Libraries",
          icon: "Code",
          borderColor: "border-blue-200",
          bgColor: "bg-gradient-to-r from-blue-50 to-indigo-50",
          technologies: [
            { label: "Python", iconSrc: "/DAT1.webp" },
            { label: "NumPy", iconSrc: "/DAT6.webp" },
            { label: "Pandas", iconSrc: "/DAT5.webp" },
            { label: "Matplotlib", iconSrc: "/DDW5.svg" },
            { label: "Seaborn", iconSrc: "/VT4.webp" },
            { label: "Scikit-learn", iconSrc: "/ML1.webp" }
          ]
        },
        {
          category: "Machine Learning Frameworks",
          icon: "Brain",
          borderColor: "border-purple-200",
          bgColor: "bg-gradient-to-r from-purple-50 to-violet-50",
          technologies: [
            { label: "TensorFlow", iconSrc: "/ML2.webp" },
            { label: "PyTorch", iconSrc: "/ML3.webp" },
            { label: "Keras", iconSrc: "/MLF3.webp" },
            { label: "XGBoost", iconSrc: "/MLF4.webp" },
            { label: "LightGBM", iconSrc: "/MLF5.webp" },
            { label: "CatBoost", iconSrc: "/MLF6.webp" }
          ]
        },
        {
          category: "Data & Deployment",
          icon: "Database",
          borderColor: "border-green-200",
          bgColor: "bg-gradient-to-r from-green-50 to-emerald-50",
          technologies: [
            { label: "MySQL", iconSrc: "/DD1.webp" },
            { label: "Docker", iconSrc: "/DD4.webp" },
            { label: "Kubernetes", iconSrc: "/DP3.webp" },
            { label: "Streamlit", iconSrc: "/Data4.webp" },
            { label: "AWS SageMaker", iconSrc: "/CP1.webp" },
            { label: "MLflow", iconSrc: "/AI1.webp" }
          ]
        },
        {
          category: "Advanced AI & Specialized Tools",
          icon: "Cpu",
          borderColor: "border-orange-200",
          bgColor: "bg-gradient-to-r from-orange-50 to-amber-50",
          technologies: [
            { label: "OpenAI", iconSrc: "/AI1.webp" },
            { label: "Hugging Face", iconSrc: "/AI2.webp" },
            { label: "LangChain", iconSrc: "/AI3.webp" },
            { label: "Transformers", iconSrc: "/AI4.webp" },
            { label: "TensorBoard", iconSrc: "/AI5.webp" },
            { label: "FastAPI", iconSrc: "/AI6.webp" }
          ]
        }
      ],

      // Career Outcomes
      careerOutcomes: [
        {
          title: "Data Scientist",
          salary: "$85k–$140k",
          icon: "Brain",
          gradient: "from-blue-500 to-cyan-500",
          bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
          borderColor: "border-blue-200",
          description: "Build predictive models, perform advanced analytics, and derive insights from complex datasets."
        },
        {
          title: "Machine Learning Engineer",
          salary: "$90k–$150k",
          icon: "Cpu",
          gradient: "from-purple-500 to-pink-500",
          bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
          borderColor: "border-purple-200",
          description: "Design, build, and deploy machine learning models and systems at scale."
        },
        {
          title: "AI/ML Specialist",
          salary: "$95k–$160k",
          icon: "Zap",
          gradient: "from-green-500 to-emerald-500",
          bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
          borderColor: "border-green-200",
          description: "Focus on advanced AI techniques like NLP, Computer Vision, and Deep Learning applications."
        }
      ],

      // Capstone Data
      capstoneData: {
        title: "Capstone Development",
        icon: "FileText",
        bgColor: "bg-white",
        borderColor: "border-red-200",
        projects: ["End-to-end Data Science Project", "Real Business Problem", "Complete ML Pipeline"],
        outcome: "Production-ready AI/ML application with full documentation and deployment"
      },

      // Interview Prep
      interviewPrep: {
        title: "Interview Preparation",
        icon: "Users",
        bgColor: "bg-white",
        borderColor: "border-red-200",
        technical: ["Statistics & Probability", "ML Algorithms", "Coding Challenges", "System Design"],
        career: ["Resume + LinkedIn", "Mock Interviews", "Portfolio Presentation", "Salary Negotiation"],
        outcome: "Crack data science interviews at top tech companies"
      }
    }
  };