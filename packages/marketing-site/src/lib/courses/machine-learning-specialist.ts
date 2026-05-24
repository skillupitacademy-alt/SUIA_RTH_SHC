import { Course } from '../CoursesCardData';
import { FaMicrochip } from 'react-icons/fa';

export const machineLearningSpecialistCourse: Course = {
  id: 12,
  category: "Data Science & AI",
  format: "LIVE ONLINE",
  title: "Machine Learning Specialist",
  description: "Dive deep into advanced machine learning algorithms, deep learning, and generative AI. Build intelligent, predictive models.",
  features: [
    "Deep Learning",
    "Generative AI",
    "NLP & Computer Vision",
    "TensorFlow & PyTorch",
    "MLOps & Deployment",
    "AI Agents"
  ],
  image: "/Third.webp",
  slug: "machine-learning-specialist",
  heroTitle: "Machine Learning & Generative AI Specialist",
  heroSubtitle: "with Deep Learning, NLP & MLOps",
  heroDescription: "Master Scikit-Learn, TensorFlow, PyTorch, LLMs, and MLOps to build, train, and deploy production-ready AI models.",
  heroSubDescription: "Become an AI Engineer and secure high-paying roles at top tech companies building the future of AI.",
  companies: ["OpenAI", "Google DeepMind", "Meta", "Tesla", "Nvidia", "Microsoft"],
  ctaButtons: {
    primary: "Enroll Now - Limited Seats",
    secondary: "Explore Full Curriculum"
  },
  assessmentCertification: {
    assessmentCards: [
      {
        id: 0,
        title: "Weekly Modeling Labs",
        description: "Hands-on exercises building and tuning machine learning models in Python",
        features: ["Python Notebooks", "Algorithm Tuning", "Data Preprocessing"],
        backContent: {
          points: [
            "Data cleaning and feature engineering",
            "Implementing regression and classification algorithms",
            "Hyperparameter tuning using GridSearch",
            "Handling imbalanced datasets",
            "Evaluating model performance metrics"
          ],
          frequency: "Every Week",
          weightage: "20% of final grade"
        }
      },
      {
        id: 1,
        title: "Module Assessments",
        description: "Comprehensive end-of-module exams covering mathematical foundations and ML theory",
        features: ["Math Foundations", "DL Architectures", "LLM Concepts"],
        backContent: {
          points: [
            "Linear algebra and calculus for ML",
            "Understanding neural network backpropagation",
            "CNN and RNN architectures",
            "Transformer architecture and attention mechanisms",
            "MLOps and deployment strategies"
          ],
          frequency: "After Each Module",
          weightage: "30% of final grade"
        }
      },
      {
        id: 2,
        title: "Project Evaluations",
        description: "Expert review of end-to-end deployed AI applications",
        features: ["Model Accuracy", "Code Quality", "Deployment"],
        backContent: {
          points: [
            "End-to-end model pipeline construction",
            "Preventing data leakage and overfitting",
            "Proper use of training/validation/test splits",
            "Integration with APIs and web applications",
            "Efficiency of deployed model (latency/throughput)"
          ],
          frequency: "Per Project",
          weightage: "40% of final grade"
        }
      },
      {
        id: 3,
        title: "Certification Benefits",
        description: "Industry-recognized AI Engineering certificate with hiring partner access",
        features: ["Industry Recognized", "Global Validity", "Hiring Partner Access"],
        backContent: {
          points: [
            "Machine Learning Specialist certificate",
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
      title: "Industry-Recognized AI & ML Certification",
      description: "Our certificate validates your deep technical expertise in machine learning, neural networks, and modern generative AI, proving your ability to deploy scalable AI solutions.",
      benefits: [
        "AI Engineering specialization certificate",
        "Global recognition and validity",
        "Hiring partner acceptance",
        "Verified by industry experts",
        "LinkedIn digital badge included",
        "Career placement network access"
      ],
      certificateDetails: {
        title: "Certificate of Completion",
        subtitle: "Machine Learning & AI Engineering Professional",
        subSubtitle: "Covering Deep Learning, NLP, Computer Vision, Transformers, LLMs, RAG, and MLOps Production Deployment.",
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
        subtitle: "Math & Python Foundations for AI",
        icon: "Code",
        duration: "5-6 Weeks",
        gradient: "from-blue-500 to-indigo-600",
        bgColor: "bg-gradient-to-br from-blue-50 to-indigo-50",
        borderColor: "border-blue-200",
        topics: [
          {
            title: "Python for Data Science (3 Weeks)",
            color: "blue-500",
            items: [
              "Advanced Python: OOP, decorators, and generators",
              "Numerical computing with NumPy (Vectorization)",
              "Data manipulation with Pandas",
              "Data visualization (Matplotlib, Seaborn, Plotly)",
              "Exploratory Data Analysis (EDA)",
              "Handling missing data and outliers"
            ]
          },
          {
            title: "Mathematics for Machine Learning (2-3 Weeks)",
            color: "indigo-500",
            items: [
              "Linear Algebra: Vectors, matrices, eigen decomposition",
              "Calculus: Derivatives, gradients, chain rule",
              "Probability distributions and Bayes' Theorem",
              "Descriptive and inferential statistics",
              "Hypothesis testing and p-values",
              "Understanding cost functions and gradient descent"
            ]
          }
        ],
        projects: [
          { title: "Mini Project:", description: "Statistical Analysis of Real Estate Data", color: "blue" },
          { title: "Mini Project:", description: "Building Gradient Descent from Scratch in NumPy", color: "indigo" }
        ]
      },
      {
        id: 1,
        title: "Phase 2",
        subtitle: "Classical Machine Learning (Scikit-Learn)",
        icon: "Cpu",
        duration: "6-7 Weeks",
        gradient: "from-green-500 to-emerald-600",
        bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
        borderColor: "border-green-200",
        topics: [
          {
            title: "Supervised Learning (3-4 Weeks)",
            color: "green-500",
            items: [
              "Linear and Polynomial Regression",
              "Logistic Regression and Classification metrics",
              "Support Vector Machines (SVM)",
              "Decision Trees and Random Forests",
              "Ensemble learning (XGBoost, LightGBM, AdaBoost)",
              "Cross-validation and hyperparameter tuning"
            ]
          },
          {
            title: "Unsupervised Learning & Feature Engineering (3 Weeks)",
            color: "emerald-500",
            items: [
              "K-Means and Hierarchical Clustering",
              "Principal Component Analysis (PCA) for dimensionality reduction",
              "Anomaly detection algorithms",
              "Advanced feature engineering (Encoding, Scaling)",
              "Handling imbalanced datasets (SMOTE)",
              "Model interpretability (SHAP, LIME)"
            ]
          }
        ],
        projects: [
          { title: "Project 1:", description: "Predictive Maintenance using XGBoost", color: "green" },
          { title: "Project 2:", description: "Customer Segmentation Engine using K-Means and PCA", color: "emerald" }
        ]
      },
      {
        id: 2,
        title: "Phase 3",
        subtitle: "Deep Learning & Neural Networks",
        icon: "Zap",
        duration: "5-6 Weeks",
        gradient: "from-purple-500 to-violet-600",
        bgColor: "bg-gradient-to-br from-purple-50 to-violet-50",
        borderColor: "border-purple-200",
        topics: [
          {
            title: "Artificial Neural Networks (ANNs) (3 Weeks)",
            color: "purple-500",
            items: [
              "Perceptrons and multi-layer perceptrons (MLP)",
              "Activation functions (ReLU, Sigmoid, Softmax)",
              "Backpropagation and weight initialization",
              "Optimizers (Adam, RMSprop, SGD with momentum)",
              "Preventing overfitting (Dropout, Batch Normalization)",
              "Introduction to TensorFlow 2.0 and Keras"
            ]
          },
          {
            title: "PyTorch Framework Fundamentals (2 Weeks)",
            color: "violet-500",
            items: [
              "Tensors and computational graphs",
              "Building custom datasets and dataloaders",
              "Writing training loops from scratch",
              "PyTorch Lightning for structured code",
              "Transferring models to GPUs/TPUs",
              "Saving and loading model checkpoints"
            ]
          }
        ],
        projects: [
          { title: "Project 1:", description: "Customer Churn Prediction with Keras ANNs", color: "purple" },
          { title: "Project 2:", description: "Building a Custom PyTorch Image Classifier", color: "violet" }
        ]
      },
      {
        id: 3,
        title: "Phase 4",
        subtitle: "Computer Vision & NLP",
        icon: "Eye",
        duration: "6-7 Weeks",
        gradient: "from-red-500 to-rose-600",
        bgColor: "bg-gradient-to-br from-red-50 to-rose-50",
        borderColor: "border-red-200",
        topics: [
          {
            title: "Computer Vision (CNNs) (3 Weeks)",
            color: "red-500",
            items: [
              "Convolutional Neural Networks architecture",
              "Pooling, padding, and strides",
              "Transfer learning (ResNet, VGG, MobileNet)",
              "Object detection (YOLO, SSD)",
              "Image segmentation (U-Net)",
              "Data augmentation techniques"
            ]
          },
          {
            title: "Natural Language Processing (NLP) (3-4 Weeks)",
            color: "rose-500",
            items: [
              "Text preprocessing (Tokenization, Stemming, Lemmatization)",
              "Word embeddings (Word2Vec, GloVe)",
              "Recurrent Neural Networks (RNNs) and LSTMs",
              "Sequence-to-sequence models",
              "Sentiment analysis and text classification",
              "Named Entity Recognition (NER)"
            ]
          }
        ],
        projects: [
          { title: "Project:", description: "Real-time Object Detection System using YOLO", color: "red" },
          { title: "Project:", description: "Financial News Sentiment Analyzer using LSTMs", color: "rose" }
        ]
      },
      {
        id: 4,
        title: "Phase 5",
        subtitle: "Generative AI, Transformers & LLMs",
        icon: "Cpu",
        duration: "6-8 Weeks",
        gradient: "from-teal-500 to-cyan-600",
        bgColor: "bg-gradient-to-br from-teal-50 to-cyan-50",
        borderColor: "border-teal-200",
        topics: [
          {
            title: "Transformer Architecture (3 Weeks)",
            color: "teal-500",
            items: [
              "Self-attention mechanisms",
              "The original Transformer model (Vaswani et al.)",
              "BERT vs. GPT architectures",
              "Hugging Face Transformers library",
              "Fine-tuning pre-trained models (PEFT, LoRA)",
              "Evaluating LLMs (BLEU, ROUGE)"
            ]
          },
          {
            title: "LLMs, RAG, & AI Agents (3-4 Weeks)",
            color: "cyan-500",
            items: [
              "Prompt engineering best practices",
              "OpenAI and Anthropic APIs",
              "Retrieval-Augmented Generation (RAG) pipelines",
              "Vector Databases (Pinecone, ChromaDB, Weaviate)",
              "Building autonomous AI Agents with LangChain/LlamaIndex",
              "Deploying local LLMs (Ollama, vLLM)"
            ]
          }
        ],
        projects: [
          { title: "Project 1:", description: "Fine-tuning a LLaMA model for Domain-Specific Tasks", color: "teal" },
          { title: "Project 2:", description: "Building a Multi-Agent RAG Support Chatbot", color: "cyan" }
        ]
      },
      {
        id: 5,
        title: "Phase 6",
        subtitle: "MLOps & Production Deployment",
        icon: "Server",
        duration: "4-5 Weeks",
        gradient: "from-orange-500 to-amber-600",
        bgColor: "bg-gradient-to-br from-orange-50 to-amber-50",
        borderColor: "border-orange-200",
        topics: [
          {
            title: "Model Deployment (2-3 Weeks)",
            color: "orange-500",
            items: [
              "Serving models via REST APIs (FastAPI, Flask)",
              "Containerizing ML models with Docker",
              "Deploying to cloud platforms (AWS SageMaker, GCP Vertex AI)",
              "Building interactive web apps with Streamlit and Gradio",
              "Optimizing models for inference (ONNX, TensorRT)"
            ]
          },
          {
            title: "MLOps Practices (2 Weeks)",
            color: "amber-500",
            items: [
              "Experiment tracking and model registry (MLflow, Weights & Biases)",
              "Data and model versioning (DVC)",
              "Continuous Integration/Continuous Training (CI/CT) for ML",
              "Monitoring data drift and model degradation",
              "Automated retraining pipelines"
            ]
          }
        ],
        projects: [
          { title: "Project:", description: "Deploying an Image Classifier API with FastAPI and Docker", color: "orange" },
          { title: "Project:", description: "Setting up an End-to-End MLOps Pipeline with MLflow", color: "amber" }
        ]
      },
      {
        id: 6,
        title: "Phase 7",
        subtitle: "Capstone Projects & AI Interview Prep",
        icon: "Rocket",
        duration: "4-6 Weeks",
        gradient: "from-gray-700 to-gray-900",
        bgColor: "bg-gradient-to-br from-gray-100 to-gray-200",
        borderColor: "border-gray-400",
        topics: [
          {
            title: "Capstone Development (3 Weeks)",
            color: "gray-700",
            items: [
              "Formulating an original AI/ML problem",
              "Data sourcing, cleaning, and modeling",
              "Applying deep learning or LLM techniques",
              "Full production deployment with a web interface",
              "Writing a technical blog post or research paper"
            ]
          },
          {
            title: "Interview Preparation (2-3 Weeks)",
            color: "gray-800",
            items: [
              "Machine learning theory interview questions",
              "Python coding and algorithmic challenges",
              "Machine Learning System Design (MLSD)",
              "Showcasing ML projects on GitHub and Kaggle",
              "Navigating interviews for AI Engineer vs. Data Scientist roles",
              "Salary negotiation for specialist roles"
            ]
          }
        ],
        projects: [
          { title: "Capstone Project:", description: "End-to-End Generative AI Application deployed on AWS", color: "gray" },
          { title: "Interview Outcome:", description: "Crack AI Engineer, ML Engineer, or Data Scientist roles", color: "gray" }
        ]
      }
    ],
    projects: [
      {
        id: 0,
        title: "Customer Churn Prediction",
        description: "Build a complete supervised learning pipeline using XGBoost, including feature engineering and hyperparameter tuning.",
        icon: "Users",
        gradient: "from-blue-500 to-cyan-500",
        bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
        borderColor: "border-blue-200",
        tags: ["Scikit-Learn", "XGBoost", "Pandas", "Classification"]
      },
      {
        id: 1,
        title: "Autonomous Vehicle Vision System",
        description: "Develop a YOLO-based real-time object detection system to identify pedestrians, vehicles, and traffic signs from video feeds.",
        icon: "Video",
        gradient: "from-red-500 to-rose-500",
        bgColor: "bg-gradient-to-br from-red-50 to-rose-50",
        borderColor: "border-red-200",
        tags: ["PyTorch", "Computer Vision", "YOLO", "CNNs"]
      },
      {
        id: 2,
        title: "Enterprise RAG Chatbot",
        description: "Create an intelligent AI assistant that answers questions based on thousands of internal PDF documents using LangChain and a Vector DB.",
        icon: "MessageSquare",
        gradient: "from-green-500 to-emerald-500",
        bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
        borderColor: "border-green-200",
        tags: ["LLMs", "RAG", "LangChain", "Pinecone"]
      },
      {
        id: 3,
        title: "Algorithmic Trading Predictor",
        description: "Use LSTM Recurrent Neural Networks to analyze historical stock data and predict short-term price movements.",
        icon: "TrendingUp",
        gradient: "from-purple-500 to-pink-500",
        bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
        borderColor: "border-purple-200",
        tags: ["TensorFlow", "Keras", "LSTMs", "Time Series"]
      },
      {
        id: 4,
        title: "LLM Fine-Tuning Pipeline",
        description: "Fine-tune an open-source LLaMA model using QLoRA to generate specific domain expertise (e.g., legal or medical coding).",
        icon: "Cpu",
        gradient: "from-orange-500 to-amber-500",
        bgColor: "bg-gradient-to-br from-orange-50 to-amber-50",
        borderColor: "border-orange-200",
        tags: ["Hugging Face", "LoRA", "Transformers", "PyTorch"]
      },
      {
        id: 5,
        title: "Scalable MLOps Deployment",
        description: "Package an ML model into a Docker container, deploy it via FastAPI, and monitor its performance using MLflow.",
        icon: "Server",
        gradient: "from-teal-500 to-cyan-500",
        bgColor: "bg-gradient-to-br from-teal-50 to-cyan-50",
        borderColor: "border-teal-200",
        tags: ["FastAPI", "Docker", "MLflow", "AWS/GCP"]
      }
    ],
    techStack: [
      {
        category: "Python & Data Science",
        icon: "Code",
        borderColor: "border-blue-200",
        bgColor: "bg-gradient-to-r from-blue-50 to-cyan-50",
        technologies: [
          { label: "Python", iconSrc: "/DAT1.webp" },
          { label: "NumPy", iconSrc: "/AI1.webp" },
          { label: "Pandas", iconSrc: "/DAT3.webp" },
          { label: "Matplotlib", iconSrc: "/DAT5.webp" },
          { label: "SciPy", iconSrc: "/AI2.webp" },
          { label: "Jupyter", iconSrc: "/AI6.webp" }
        ]
      },
      {
        category: "Machine & Deep Learning",
        icon: "Cpu",
        borderColor: "border-purple-200",
        bgColor: "bg-gradient-to-r from-purple-50 to-violet-50",
        technologies: [
          { label: "Scikit-Learn", iconSrc: "/AI2.webp" },
          { label: "TensorFlow", iconSrc: "/AI4.webp" },
          { label: "PyTorch", iconSrc: "/AI3.webp" },
          { label: "Keras", iconSrc: "/AI4.webp" },
          { label: "XGBoost", iconSrc: "/AI5.webp" },
          { label: "OpenCV", iconSrc: "/DAT2.webp" }
        ]
      },
      {
        category: "Generative AI & LLMs",
        icon: "Zap",
        borderColor: "border-green-200",
        bgColor: "bg-gradient-to-r from-green-50 to-emerald-50",
        technologies: [
          { label: "Hugging Face", iconSrc: "/AI1.webp" },
          { label: "LangChain", iconSrc: "/DAT3.webp" },
          { label: "OpenAI API", iconSrc: "/AI6.webp" },
          { label: "Pinecone", iconSrc: "/DDW4.webp" },
          { label: "LlamaIndex", iconSrc: "/DAT1.webp" },
          { label: "Ollama", iconSrc: "/DD1.webp" }
        ]
      },
      {
        category: "MLOps & Deployment",
        icon: "Settings",
        borderColor: "border-orange-200",
        bgColor: "bg-gradient-to-r from-orange-50 to-amber-50",
        technologies: [
          { label: "Docker", iconSrc: "/DD4.webp" },
          { label: "FastAPI", iconSrc: "/BE5.webp" },
          { label: "MLflow", iconSrc: "/DAT4.webp" },
          { label: "AWS SageMaker", iconSrc: "/CP1.webp" },
          { label: "Streamlit", iconSrc: "/DDW1.webp" },
          { label: "Git", iconSrc: "/DAT3.webp" }
        ]
      }
    ],
    careerOutcomes: [
      {
        title: "Machine Learning Engineer",
        salary: "$130k-$200k+",
        icon: "Cpu",
        gradient: "from-blue-500 to-cyan-500",
        bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
        borderColor: "border-blue-200",
        description: "Design, build, and deploy robust machine learning models into production environments at scale."
      },
      {
        title: "AI Engineer",
        salary: "$140k-$220k+",
        icon: "Zap",
        gradient: "from-purple-500 to-pink-500",
        bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
        borderColor: "border-purple-200",
        description: "Specialize in integrating Large Language Models (LLMs), Generative AI, and autonomous agents into enterprise software."
      },
      {
        title: "Data Scientist",
        salary: "$115k-$170k+",
        icon: "BarChart2",
        gradient: "from-green-500 to-emerald-500",
        bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
        borderColor: "border-green-200",
        description: "Extract actionable insights from complex datasets and build predictive models to drive business strategy."
      }
    ],
    capstoneData: {
      title: "Capstone Development",
      icon: "FileText",
      bgColor: "bg-white",
      borderColor: "border-gray-200",
      projects: ["End-to-End GenAI Application", "Computer Vision Tracking System", "Deployed MLOps Pipeline"],
      outcome: "A cutting-edge portfolio demonstrating hands-on ability to build and deploy modern AI architectures"
    },
    interviewPrep: {
      title: "Interview Preparation",
      icon: "Users",
      bgColor: "bg-white",
      borderColor: "border-gray-200",
      technical: ["ML System Design", "Math/Stats Fundamentals", "Python Algorithms", "Deep Learning Theory"],
      career: ["Resume + Kaggle/GitHub", "Mock Interviews", "Salary Negotiation"],
      outcome: "Crack competitive AI and ML roles at FAANG, top AI labs, and high-growth startups"
    }
  },
  icon: FaMicrochip
};