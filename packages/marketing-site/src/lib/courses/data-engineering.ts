import { Course } from '../CoursesCardData';
import { FaDatabase } from 'react-icons/fa';

export const dataEngineeringCourse: Course = {
  id: 9,
  category: "Specialist",
  format: "LIVE ONLINE",
  title: "Data Engineering",
  description: "Build robust data pipelines and scalable infrastructure. Master big data technologies and cloud data platforms.",
  features: [
    "ETL Pipelines",
    "Big Data Processing",
    "Data Warehousing",
    "Cloud Architecture",
    "Apache Spark",
    "Data Governance"
  ],
  image: "/Fourth.webp",
  slug: "data-engineering",
  heroTitle: "Data Engineering",
  heroSubtitle: "with Spark & Cloud",
  heroDescription: "Master Python, SQL, Apache Spark, Kafka, Airflow, Snowflake, and modern cloud architectures (AWS/Azure/GCP).",
  heroSubDescription: "Design scalable data pipelines and land high-paying roles as a Data Engineer at top tech companies.",
  companies: ["Amazon", "Netflix", "Uber", "Airbnb", "Snowflake", "Databricks"],
  ctaButtons: {
    primary: "Enroll Now - Limited Seats",
    secondary: "Explore Full Curriculum"
  },
  assessmentCertification: {
    assessmentCards: [
      {
        id: 0,
        title: "Weekly Pipeline Challenges",
        description: "Hands-on data engineering exercises to reinforce ETL/ELT concepts",
        features: ["Python Scripts", "SQL Queries", "Data Modeling"],
        backContent: {
          points: [
            "Python data extraction tasks",
            "Advanced SQL transformation challenges",
            "Data modeling and schema design",
            "Handling JSON and XML formats",
            "Code optimization exercises"
          ],
          frequency: "Every Week",
          weightage: "20% of final grade"
        }
      },
      {
        id: 1,
        title: "Module Assessments",
        description: "Comprehensive end-of-module exams covering core big data frameworks",
        features: ["Spark Processing", "Cloud Warehousing", "Architecture Design"],
        backContent: {
          points: [
            "Apache Spark dataframe operations",
            "Cloud data warehouse (Snowflake/Redshift) usage",
            "Data pipeline orchestration with Airflow",
            "Batch vs. Streaming architecture concepts",
            "Data governance and security policies"
          ],
          frequency: "After Each Module",
          weightage: "30% of final grade"
        }
      },
      {
        id: 2,
        title: "Project Evaluations",
        description: "Expert review of end-to-end data pipelines with detailed feedback",
        features: ["Code Review", "Scalability Check", "Performance Testing"],
        backContent: {
          points: [
            "End-to-end pipeline architecture review",
            "Performance and cost optimization analysis",
            "Data quality and error handling implementation",
            "Cloud resource provisioning and IaC",
            "CI/CD and deployment practices"
          ],
          frequency: "Per Project",
          weightage: "40% of final grade"
        }
      },
      {
        id: 3,
        title: "Certification Benefits",
        description: "Industry-recognized Data Engineering certificate with global hiring partner access",
        features: ["Industry Recognized", "Global Validity", "Hiring Partner Access"],
        backContent: {
          points: [
            "Data Engineering Professional certificate",
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
      title: "Industry-Recognized Data Engineering Certification",
      description: "Our certificate validates your ability to build scalable data infrastructure, process massive datasets, and deploy robust pipelines, demonstrating your competency to employers worldwide.",
      benefits: [
        "Data Engineering specialization certificate",
        "Global recognition and validity",
        "Hiring partner acceptance",
        "Verified by industry experts",
        "LinkedIn digital badge included",
        "Career placement network access"
      ],
      certificateDetails: {
        title: "Certificate of Completion",
        subtitle: "Data Engineering Professional",
        subSubtitle: "Covering Python, Advanced SQL, Data Modeling, Apache Spark, Kafka, Airflow, Cloud Data Warehouses, and Modern Data Stack Architectures.",
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
        subtitle: "Foundations: Python & Advanced SQL",
        icon: "Code",
        duration: "5-6 Weeks",
        gradient: "from-blue-500 to-indigo-600",
        bgColor: "bg-gradient-to-br from-blue-50 to-indigo-50",
        borderColor: "border-blue-200",
        topics: [
          {
            title: "Python for Data Engineering (3 Weeks)",
            color: "blue-500",
            items: [
              "Python syntax, data structures, and OOP",
              "File handling (CSV, JSON, Parquet, Avro)",
              "Web scraping and API interaction (Requests, BeautifulSoup)",
              "Data manipulation with Pandas and NumPy",
              "Writing efficient, modular, and tested Python code",
              "Virtual environments and package management"
            ]
          },
          {
            title: "Advanced SQL & Database Design (2-3 Weeks)",
            color: "indigo-500",
            items: [
              "Complex joins, subqueries, and CTEs",
              "Window functions and analytical queries",
              "Query optimization and execution plans",
              "Relational database design (PostgreSQL/MySQL)",
              "Data modeling: Star vs. Snowflake schemas",
              "Indexes, partitioning, and indexing strategies"
            ]
          }
        ],
        projects: [
          { title: "Mini Project:", description: "Automated API Data Extraction Script", color: "blue" },
          { title: "Mini Project:", description: "Designing an E-commerce Star Schema", color: "indigo" }
        ]
      },
      {
        id: 1,
        title: "Phase 2",
        subtitle: "The Modern Data Stack & Cloud Data Warehouses",
        icon: "Database",
        duration: "5-6 Weeks",
        gradient: "from-green-500 to-emerald-600",
        bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
        borderColor: "border-green-200",
        topics: [
          {
            title: "Data Warehousing Concepts (2-3 Weeks)",
            color: "green-500",
            items: [
              "OLTP vs. OLAP systems",
              "ETL vs. ELT architectures",
              "Dimensional modeling techniques",
              "Handling Slowly Changing Dimensions (SCDs)",
              "Data lakes vs. Data warehouses vs. Data lakehouses"
            ]
          },
          {
            title: "Cloud Data Platforms (3 Weeks)",
            color: "emerald-500",
            items: [
              "Introduction to AWS/Azure/GCP data services",
              "Working with cloud storage (S3, Azure Blob, GCS)",
              "Snowflake architecture and virtual warehouses",
              "Amazon Redshift or Google BigQuery fundamentals",
              "Loading data into cloud warehouses (Copy commands)",
              "Performance tuning in columnar databases"
            ]
          }
        ],
        projects: [
          { title: "Project 1:", description: "Building an ELT Pipeline with dbt and Snowflake", color: "green" },
          { title: "Project 2:", description: "Data Lake Implementation using AWS S3 and Athena", color: "emerald" }
        ]
      },
      {
        id: 2,
        title: "Phase 3",
        subtitle: "Big Data Processing with Apache Spark",
        icon: "Zap",
        duration: "6-8 Weeks",
        gradient: "from-purple-500 to-violet-600",
        bgColor: "bg-gradient-to-br from-purple-50 to-violet-50",
        borderColor: "border-purple-200",
        topics: [
          {
            title: "Spark Fundamentals & Architecture (3 Weeks)",
            color: "purple-500",
            items: [
              "Hadoop ecosystem overview (HDFS, YARN)",
              "Apache Spark architecture (Driver, Executors, Cluster Managers)",
              "Resilient Distributed Datasets (RDDs)",
              "Spark DataFrames and Datasets API",
              "Spark SQL and Catalyst Optimizer",
              "Reading/Writing various data formats at scale"
            ]
          },
          {
            title: "Advanced Spark & Databricks (3-4 Weeks)",
            color: "violet-500",
            items: [
              "Spark transformations and actions",
              "Handling shuffles and partitions",
              "Caching, persisting, and broadcasting",
              "Performance tuning and resolving out-of-memory errors",
              "Databricks workspace and notebooks",
              "Delta Lake: ACID transactions on Data Lakes"
            ]
          }
        ],
        projects: [
          { title: "Project 1:", description: "Processing 100GB+ Log Data with PySpark", color: "purple" },
          { title: "Project 2:", description: "Building a Medallion Architecture on Databricks", color: "violet" }
        ]
      },
      {
        id: 3,
        title: "Phase 4",
        subtitle: "Real-Time Data Streaming",
        icon: "Activity",
        duration: "5-6 Weeks",
        gradient: "from-red-500 to-rose-600",
        bgColor: "bg-gradient-to-br from-red-50 to-rose-50",
        borderColor: "border-red-200",
        topics: [
          {
            title: "Apache Kafka (3 Weeks)",
            color: "red-500",
            items: [
              "Pub/Sub messaging systems concepts",
              "Kafka architecture (Brokers, Topics, Partitions, Zookeeper/KRaft)",
              "Producers and Consumers in Python",
              "Consumer groups and offset management",
              "Kafka Connect and Schema Registry",
              "Kafka ecosystem (Confluent Cloud, MSK)"
            ]
          },
          {
            title: "Stream Processing (2-3 Weeks)",
            color: "rose-500",
            items: [
              "Batch vs. Streaming paradigms",
              "Spark Structured Streaming",
              "Event-time processing and windowing",
              "Handling late data and watermarks",
              "Introduction to Apache Flink (optional)",
              "Real-time dashboards and analytics"
            ]
          }
        ],
        projects: [
          { title: "Project:", description: "Real-Time Clickstream Analysis with Kafka and Spark", color: "red" },
          { title: "Project:", description: "Fraud Detection Streaming Pipeline", color: "rose" }
        ]
      },
      {
        id: 4,
        title: "Phase 5",
        subtitle: "Workflow Orchestration & Automation",
        icon: "Clock",
        duration: "4-5 Weeks",
        gradient: "from-teal-500 to-cyan-600",
        bgColor: "bg-gradient-to-br from-teal-50 to-cyan-50",
        borderColor: "border-teal-200",
        topics: [
          {
            title: "Apache Airflow (3 Weeks)",
            color: "teal-500",
            items: [
              "Workflow orchestration concepts",
              "Airflow architecture and components",
              "Writing DAGs (Directed Acyclic Graphs)",
              "Operators (Bash, Python, Branching, Dummy)",
              "Scheduling, sensors, and SLAs",
              "Managing connections, variables, and XComs"
            ]
          },
          {
            title: "DataOps & CI/CD (2 Weeks)",
            color: "cyan-500",
            items: [
              "Version control for data pipelines (Git)",
              "Containerization with Docker",
              "Infrastructure as Code (Terraform basics)",
              "Setting up CI/CD pipelines (GitHub Actions)",
              "Testing data pipelines (Great Expectations)",
              "Monitoring and alerting"
            ]
          }
        ],
        projects: [
          { title: "Project 1:", description: "Automating an ETL Pipeline with Airflow", color: "teal" },
          { title: "Project 2:", description: "Dockerizing and Deploying a Data Pipeline", color: "cyan" }
        ]
      },
      {
        id: 5,
        title: "Phase 6",
        subtitle: "NoSQL & Modern Data Architectures",
        icon: "Server",
        duration: "4-5 Weeks",
        gradient: "from-orange-500 to-amber-600",
        bgColor: "bg-gradient-to-br from-orange-50 to-amber-50",
        borderColor: "border-orange-200",
        topics: [
          {
            title: "NoSQL Databases (2-3 Weeks)",
            color: "orange-500",
            items: [
              "CAP Theorem and NoSQL paradigms",
              "Document stores (MongoDB)",
              "Key-Value stores (Redis, DynamoDB)",
              "Column-family stores (Cassandra)",
              "Graph databases (Neo4j)",
              "Choosing the right database for the workload"
            ]
          },
          {
            title: "Data Governance & Architecture (2 Weeks)",
            color: "amber-500",
            items: [
              "Data mesh and data fabric concepts",
              "Data cataloging and discovery",
              "Data lineage and observability",
              "Data privacy and compliance (GDPR, CCPA)",
              "Role-based access control (RBAC)",
              "Cost management in cloud data platforms"
            ]
          }
        ],
        projects: [
          { title: "Project:", description: "Building a Multi-Model Data Pipeline", color: "orange" },
          { title: "Project:", description: "Implementing Data Quality Checks and Lineage", color: "amber" }
        ]
      },
      {
        id: 6,
        title: "Phase 7",
        subtitle: "Capstone Projects & Interview Preparation",
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
              "End-to-end data pipeline architecture design",
              "Integrating batch and streaming data sources",
              "Deploying on a cloud provider (AWS/GCP)",
              "Implementing orchestration, monitoring, and CI/CD",
              "Optimizing for scale and cost",
              "Final project documentation and presentation"
            ]
          },
          {
            title: "Interview Preparation (2-3 Weeks)",
            color: "gray-800",
            items: [
              "SQL interview scenarios and LeetCode practice",
              "Python algorithmic and data manipulation questions",
              "System design for data engineering architectures",
              "Spark and big data optimization questions",
              "Resume optimization and portfolio review",
              "Mock interviews with industry experts"
            ]
          }
        ],
        projects: [
          { title: "Capstone Project:", description: "End-to-End Enterprise Data Platform", color: "gray" },
          { title: "Interview Outcome:", description: "Crack Data Engineering roles at top tech companies", color: "gray" }
        ]
      }
    ],
    projects: [
      {
        id: 0,
        title: "E-Commerce Data Warehouse",
        description: "Design and build a data warehouse on Snowflake, loading data from various sources using an ELT approach with dbt.",
        icon: "Database",
        gradient: "from-blue-500 to-cyan-500",
        bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
        borderColor: "border-blue-200",
        tags: ["Snowflake", "dbt", "SQL", "Data Modeling"]
      },
      {
        id: 1,
        title: "Real-Time Fraud Detection",
        description: "Stream credit card transactions through Kafka, process them in real-time with Spark Structured Streaming, and store results.",
        icon: "Activity",
        gradient: "from-red-500 to-rose-500",
        bgColor: "bg-gradient-to-br from-red-50 to-rose-50",
        borderColor: "border-red-200",
        tags: ["Kafka", "PySpark", "Streaming", "NoSQL"]
      },
      {
        id: 2,
        title: "Log Analytics Platform",
        description: "Process terabytes of server logs using Apache Spark on AWS EMR, transforming and loading them into S3 for analysis.",
        icon: "Server",
        gradient: "from-green-500 to-emerald-500",
        bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
        borderColor: "border-green-200",
        tags: ["AWS EMR", "Spark", "S3", "Parquet"]
      },
      {
        id: 3,
        title: "Automated Reporting Pipeline",
        description: "Extract data from marketing APIs, clean it using Python, and schedule daily loads to PostgreSQL using Apache Airflow.",
        icon: "Clock",
        gradient: "from-purple-500 to-pink-500",
        bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
        borderColor: "border-purple-200",
        tags: ["Airflow", "Python", "PostgreSQL", "APIs"]
      },
      {
        id: 4,
        title: "Databricks Lakehouse",
        description: "Implement a Medallion Architecture (Bronze, Silver, Gold) on Databricks using Delta Lake for ACID transactions.",
        icon: "Layers",
        gradient: "from-orange-500 to-amber-500",
        bgColor: "bg-gradient-to-br from-orange-50 to-amber-50",
        borderColor: "border-orange-200",
        tags: ["Databricks", "Delta Lake", "PySpark", "Data Lakehouse"]
      },
      {
        id: 5,
        title: "End-to-End Cloud Data Platform",
        description: "Deploy a fully automated data platform using Docker, Terraform, CI/CD, processing both batch and streaming data.",
        icon: "Cloud",
        gradient: "from-teal-500 to-cyan-500",
        bgColor: "bg-gradient-to-br from-teal-50 to-cyan-50",
        borderColor: "border-teal-200",
        tags: ["Docker", "Terraform", "CI/CD", "AWS/GCP"]
      }
    ],
    techStack: [
      {
        category: "Programming & Databases",
        icon: "Code",
        borderColor: "border-blue-200",
        bgColor: "bg-gradient-to-r from-blue-50 to-cyan-50",
        technologies: [
          { label: "Python", iconSrc: "/DAT1.webp" },
          { label: "SQL", iconSrc: "/DAT4.webp" },
          { label: "PostgreSQL", iconSrc: "/DDW1.webp" },
          { label: "MongoDB", iconSrc: "/DD2.webp" },
          { label: "Cassandra", iconSrc: "/DDW4.webp" },
          { label: "Bash", iconSrc: "/DevOps3.webp" }
        ]
      },
      {
        category: "Big Data & Processing",
        icon: "Zap",
        borderColor: "border-purple-200",
        bgColor: "bg-gradient-to-r from-purple-50 to-violet-50",
        technologies: [
          { label: "Apache Spark", iconSrc: "/DAT4.webp" },
          { label: "PySpark", iconSrc: "/DAT1.webp" },
          { label: "Hadoop", iconSrc: "/BE6.webp" },
          { label: "Kafka", iconSrc: "/DevOps4.webp" },
          { label: "Databricks", iconSrc: "/CP3.webp" },
          { label: "Delta Lake", iconSrc: "/DAT3.webp" }
        ]
      },
      {
        category: "Cloud & Warehousing",
        icon: "Cloud",
        borderColor: "border-green-200",
        bgColor: "bg-gradient-to-r from-green-50 to-emerald-50",
        technologies: [
          { label: "AWS", iconSrc: "/CP1.webp" },
          { label: "GCP", iconSrc: "/CP2.webp" },
          { label: "Snowflake", iconSrc: "/DDW5.svg" },
          { label: "Redshift", iconSrc: "/CP1.webp" },
          { label: "BigQuery", iconSrc: "/CP2.webp" },
          { label: "S3 / GCS", iconSrc: "/DDW4.webp" }
        ]
      },
      {
        category: "Orchestration & DevOps",
        icon: "Settings",
        borderColor: "border-orange-200",
        bgColor: "bg-gradient-to-r from-orange-50 to-amber-50",
        technologies: [
          { label: "Airflow", iconSrc: "/DevOps5.webp" },
          { label: "dbt", iconSrc: "/DAT3.webp" },
          { label: "Docker", iconSrc: "/DD4.webp" },
          { label: "Terraform", iconSrc: "/DevOps6.webp" },
          { label: "Git", iconSrc: "/DAT4.webp" },
          { label: "CI/CD", iconSrc: "/DevOps4.webp" }
        ]
      }
    ],
    careerOutcomes: [
      {
        title: "Data Engineer",
        salary: "$95k-$150k",
        icon: "Database",
        gradient: "from-blue-500 to-cyan-500",
        bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
        borderColor: "border-blue-200",
        description: "Design and build scalable data pipelines, ensuring data is clean, reliable, and accessible for analysis."
      },
      {
        title: "Big Data Developer",
        salary: "$110k-$160k",
        icon: "Zap",
        gradient: "from-purple-500 to-pink-500",
        bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
        borderColor: "border-purple-200",
        description: "Specialize in processing massive datasets using distributed frameworks like Apache Spark and Hadoop."
      },
      {
        title: "Cloud Data Architect",
        salary: "$130k-$180k",
        icon: "Cloud",
        gradient: "from-green-500 to-emerald-500",
        bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
        borderColor: "border-green-200",
        description: "Design enterprise-grade data platforms and architectures on cloud providers like AWS, Azure, or GCP."
      }
    ],
    capstoneData: {
      title: "Capstone Development",
      icon: "FileText",
      bgColor: "bg-white",
      borderColor: "border-gray-200",
      projects: ["End-to-End Enterprise Data Platform", "Real-Time Streaming Pipeline", "Cloud Data Warehouse Implementation"],
      outcome: "Production-grade portfolio demonstrating hands-on ability to build scalable data infrastructure"
    },
    interviewPrep: {
      title: "Interview Preparation",
      icon: "Users",
      bgColor: "bg-white",
      borderColor: "border-gray-200",
      technical: ["SQL Scenarios", "System Design", "Spark Optimization", "Data Modeling"],
      career: ["Resume + LinkedIn", "Mock Interviews", "Salary Negotiation"],
      outcome: "Crack Data Engineering interviews at FAANG, top startups, and enterprise companies"
    }
  },
  icon: FaDatabase
};