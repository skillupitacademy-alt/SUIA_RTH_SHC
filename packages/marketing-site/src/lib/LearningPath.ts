import {
  FaCode,
  FaBrain,
  FaThLarge,
  FaServer,
  FaBolt,
  FaCloudUploadAlt
} from "react-icons/fa";
import type { IconType } from "react-icons";

/* ================= TYPES ================= */

export interface LearningModule {
  num: number;
  title: string;
  subtitle: string;
  points: string[];
}

export type LearningPaths = Record<string, LearningModule[]>;

/* ================= CATEGORIES ================= */

export const categories = [
  "Full Stack with AI",
  "AI & ML Engineering",
  "Data Analyst",
  "Data Engineering",
  "Cybersecurity",
  "Cloud & DevOps"
];

/* ================= ICONS ================= */

export const icons: Record<number, IconType> = {
  1: FaCode,
  2: FaBrain,
  3: FaThLarge,
  4: FaServer,
  5: FaBolt,
  6: FaCloudUploadAlt
};

/* ================= CATEGORY COLORS ================= */

export const categoryColors: Record<
  string,
  {
    primary: string;
    secondary: string;
    accent: string;
    light: string;
    solid: string;
    hover: string;
  }
> = {
  "Full Stack with AI": {
    primary: "from-blue-400 to-purple-400",
    secondary: "bg-blue-50",
    accent: "text-blue-600",
    light: "bg-blue-100",
    solid: "bg-blue-500",
    hover: "hover:border-blue-400 hover:shadow-blue-100"
  },
  "AI & ML Engineering": {
    primary: "from-emerald-400 to-teal-400",
    secondary: "bg-emerald-50",
    accent: "text-emerald-600",
    light: "bg-emerald-100",
    solid: "bg-emerald-500",
    hover: "hover:border-emerald-400 hover:shadow-emerald-100"
  },
  "Data Analyst": {
    primary: "from-amber-400 to-orange-400",
    secondary: "bg-amber-50",
    accent: "text-amber-600",
    light: "bg-amber-100",
    solid: "bg-amber-500",
    hover: "hover:border-amber-400 hover:shadow-amber-100"
  },
  "Data Engineering": {
    primary: "from-violet-300 to-indigo-300",
    secondary: "bg-violet-50",
    accent: "text-violet-300",
    light: "bg-violet-300",
    solid: "bg-violet-300",
    hover: "hover:border-violet-300 hover:shadow-violet-100"
  },
  "Cybersecurity": {
    primary: "from-blue-200 to-blue-200",
    secondary: "bg-blue-50",
    accent: "text-blue-200",
    light: "bg-blue-200",
    solid: "bg-blue-200",
    hover: "hover:border-blue-200 hover:shadow-blue-100"
  },
  "Cloud & DevOps": {
    primary: "from-cyan-400 to-sky-400",
    secondary: "bg-cyan-50",
    accent: "text-cyan-600",
    light: "bg-cyan-100",
    solid: "bg-cyan-500",
    hover: "hover:border-cyan-400 hover:shadow-cyan-100"
  }
};

/* ================= LEARNING PATHS ================= */

export const learningPaths: LearningPaths = {
  "Full Stack with AI": [
    {
      num: 1,
      title: "Full Stack Foundation",
      subtitle: "Build strong web fundamentals",
      points: [
        "JavaScript (ES6+)",
        "React & Next.js",
        "Node.js / FastAPI",
        "SQL & NoSQL",
        "REST & GraphQL APIs"
      ]
    },
    {
      num: 2,
      title: "AI Integration",
      subtitle: "Use AI inside applications",
      points: [
        "Python for AI",
        "ML fundamentals",
        "OpenAI & Hugging Face APIs",
        "Prompt engineering",
        "AI service consumption"
      ]
    },
    {
      num: 3,
      title: "AI Frontend",
      subtitle: "Build AI-powered UI",
      points: [
        "AI UI/UX patterns",
        "Chat interfaces",
        "Voice & vision UI",
        "Real-time AI features",
        "Browser ML"
      ]
    },
    {
      num: 4,
      title: "AI Backend",
      subtitle: "Scale AI services",
      points: [
        "AI microservices",
        "Vector databases",
        "Model APIs",
        "Auth & security",
        "Performance optimization"
      ]
    },
    {
      num: 5,
      title: "AI Products",
      subtitle: "Ship real AI apps",
      points: [
        "Chatbots",
        "Content generators",
        "Smart search",
        "Recommendations",
        "Prediction engines"
      ]
    },
    {
      num: 6,
      title: "Deployment",
      subtitle: "Production readiness",
      points: [
        "Docker",
        "Cloud deployment",
        "MLOps basics",
        "Monitoring",
        "Scaling"
      ]
    }
  ],

  "AI & ML Engineering": [
    {
      num: 1,
      title: "Math & Python",
      subtitle: "Strong AI foundation",
      points: [
        "Python advanced",
        "Linear algebra",
        "Probability",
        "Statistics",
        "DSA basics"
      ]
    },
    {
      num: 2,
      title: "Machine Learning",
      subtitle: "Core ML algorithms",
      points: [
        "Supervised learning",
        "Unsupervised learning",
        "Feature engineering",
        "Model evaluation",
        "Hyperparameter tuning"
      ]
    },
    {
      num: 3,
      title: "Deep Learning",
      subtitle: "Neural networks",
      points: [
        "Neural networks",
        "CNNs",
        "RNNs & LSTMs",
        "Transformers",
        "Transfer learning"
      ]
    },
    {
      num: 4,
      title: "Generative AI",
      subtitle: "Modern AI systems",
      points: [
        "LLMs",
        "Diffusion models",
        "Image & video generation",
        "Audio AI",
        "Code generation"
      ]
    },
    {
      num: 5,
      title: "Agentic AI",
      subtitle: "Autonomous systems",
      points: [
        "AI agents",
        "Multi-agent systems",
        "Reinforcement learning",
        "AI safety",
        "System design"
      ]
    },
    {
      num: 6,
      title: "MLOps",
      subtitle: "Production AI",
      points: [
        "Model deployment",
        "CI/CD for ML",
        "Monitoring & drift",
        "Scalable pipelines",
        "Cloud AI infra"
      ]
    }
  ],

  "Data Analyst": [
    {
      num: 1,
      title: "Core Tools",
      subtitle: "Analyst essentials",
      points: [
        "Advanced Excel",
        "SQL basics",
        "Statistics",
        "Business math",
        "Data types"
      ]
    },
    {
      num: 2,
      title: "Data Cleaning",
      subtitle: "Prepare data",
      points: [
        "Advanced SQL",
        "Missing values",
        "Data validation",
        "Power Query",
        "Data modeling"
      ]
    },
    {
      num: 3,
      title: "Visualization",
      subtitle: "Data storytelling",
      points: [
        "Power BI",
        "Tableau",
        "Dashboard design",
        "UX for data",
        "Reporting"
      ]
    },
    {
      num: 4,
      title: "Python Analysis",
      subtitle: "Automate analysis",
      points: [
        "Python basics",
        "Pandas",
        "Matplotlib & Seaborn",
        "EDA",
        "Automation"
      ]
    },
    {
      num: 5,
      title: "Business Analytics",
      subtitle: "Decision making",
      points: [
        "A/B testing",
        "Cohort analysis",
        "Customer metrics",
        "Marketing analytics",
        "Finance KPIs"
      ]
    },
    {
      num: 6,
      title: "Advanced Analytics",
      subtitle: "Specialization",
      points: [
        "Time series",
        "Statistical tests",
        "ML basics",
        "Domain analytics",
        "Case studies"
      ]
    }
  ],

  "Data Engineering": [
    {
      num: 1,
      title: "Data Foundations",
      subtitle: "Database mastery",
      points: [
        "Advanced SQL",
        "Database design",
        "NoSQL",
        "Warehousing",
        "Python"
      ]
    },
    {
      num: 2,
      title: "Big Data",
      subtitle: "Large-scale systems",
      points: [
        "Spark",
        "Kafka",
        "Hadoop",
        "Data lakes",
        "Optimization"
      ]
    },
    {
      num: 3,
      title: "Pipelines",
      subtitle: "ETL & ELT",
      points: [
        "Pipeline design",
        "Airflow",
        "CDC",
        "Data quality",
        "Governance"
      ]
    },
    {
      num: 4,
      title: "Cloud Data",
      subtitle: "Cloud platforms",
      points: [
        "AWS data stack",
        "BigQuery",
        "Azure Synapse",
        "Snowflake",
        "Migration"
      ]
    },
    {
      num: 5,
      title: "Streaming",
      subtitle: "Real-time data",
      points: [
        "Streaming architecture",
        "Spark streaming",
        "Flink",
        "Realtime analytics",
        "Fault tolerance"
      ]
    },
    {
      num: 6,
      title: "DataOps",
      subtitle: "Reliability",
      points: [
        "Monitoring",
        "CI/CD",
        "Security",
        "Cost optimization",
        "Scaling"
      ]
    }
  ],

  "Cybersecurity": [
    {
      num: 1,
      title: "Security Basics",
      subtitle: "Foundations",
      points: [
        "Networking",
        "Linux",
        "OS basics",
        "Security principles",
        "System architecture"
      ]
    },
    {
      num: 2,
      title: "Core Security",
      subtitle: "Essential skills",
      points: [
        "Cryptography",
        "Firewalls",
        "IAM",
        "Threat modeling",
        "Risk assessment"
      ]
    },
    {
      num: 3,
      title: "Ethical Hacking",
      subtitle: "Offensive security",
      points: [
        "Kali Linux",
        "Metasploit",
        "Burp Suite",
        "Vulnerability scanning",
        "Scripting"
      ]
    },
    {
      num: 4,
      title: "Defensive Security",
      subtitle: "Blue team",
      points: [
        "SIEM",
        "Log analysis",
        "Incident response",
        "Malware analysis",
        "Forensics"
      ]
    },
    {
      num: 5,
      title: "Cloud Security",
      subtitle: "Secure cloud infra",
      points: [
        "AWS security",
        "Azure security",
        "IAM",
        "Compliance",
        "Network security"
      ]
    },
    {
      num: 6,
      title: "Advanced Security",
      subtitle: "Expert skills",
      points: [
        "Advanced pentesting",
        "Secure coding",
        "IoT security",
        "Auditing",
        "Compliance"
      ]
    }
  ],

  "Cloud & DevOps": [
    {
      num: 1,
      title: "Linux & Networking",
      subtitle: "Infrastructure basics",
      points: [
        "Linux admin",
        "Networking",
        "Shell scripting",
        "Server management",
        "Security basics"
      ]
    },
    {
      num: 2,
      title: "Cloud Platforms",
      subtitle: "Cloud mastery",
      points: [
        "AWS",
        "Azure",
        "GCP",
        "Architecture",
        "Cost optimization"
      ]
    },
    {
      num: 3,
      title: "Containers",
      subtitle: "Modern deployment",
      points: [
        "Docker",
        "Kubernetes",
        "Scaling",
        "Security",
        "Registries"
      ]
    },
    {
      num: 4,
      title: "Infrastructure as Code",
      subtitle: "Automation",
      points: [
        "Terraform",
        "Ansible",
        "CloudFormation",
        "Config management",
        "State handling"
      ]
    },
    {
      num: 5,
      title: "CI/CD",
      subtitle: "Delivery pipelines",
      points: [
        "Jenkins",
        "GitHub Actions",
        "Testing",
        "Deployment strategies",
        "Approvals"
      ]
    },
    {
      num: 6,
      title: "Monitoring & Security",
      subtitle: "Reliability",
      points: [
        "Prometheus",
        "Grafana",
        "Alerting",
        "IAM",
        "Automation"
      ]
    }
  ]
};


export interface CategoryColors {
  primary: string;
  secondary: string;
  accent: string;
  light: string;
  solid: string;
  hover: string;
}

export interface CategorySelectorProps {
  active: string;
  onCategoryChange: (category: string) => void;
  onHoverStart?: (category: string) => void;
  onHoverEnd?: () => void;
}

export interface PathwayCardProps {
  item: LearningModule;
  category: string;
  isFlipped: boolean;
  onFlip: () => void;
}

export interface MobileCategoryPanelProps {
  isOpen: boolean;
  activeCategory: string;
  onClose: () => void;
  onCategorySelect: (category: string) => void;
}

export interface VerticalScrollButtonProps {
  isVisible: boolean;
  onClick: () => void;
}

export interface HeaderSectionProps {
  title?: string;
  description?: string;
}

export const LEARNINGPATH_CONFIG = {
    title: "Learning Path",
  description: "Select a career track below to explore the step-by-step learning journey designed to make you job-ready."
}