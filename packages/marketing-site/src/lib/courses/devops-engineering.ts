import { Course } from '../CoursesCardData';
import { FaCloud } from 'react-icons/fa';

export const devopsEngineeringCourse: Course = {
  id: 11,
  category: "Cloud & DevOps",
  format: "LIVE ONLINE",
  title: "DevOps Engineering",
  description: "Master modern infrastructure, CI/CD pipelines, and cloud automation. Bridge the gap between development and operations.",
  features: [
    "Linux & Bash Scripting",
    "CI/CD Pipelines",
    "Docker & Kubernetes",
    "Infrastructure as Code",
    "AWS / Cloud Architectures",
    "Monitoring & Observability"
  ],
  image: "/Fifth.webp",
  slug: "devops-engineering",
  heroTitle: "DevOps Engineering with Kubernetes & AWS",
  heroSubtitle: "with CI/CD, Terraform, & Cloud Architecture",
  heroDescription: "Master Linux, Git, Jenkins, Docker, Kubernetes, Terraform, Ansible, and AWS to automate software delivery and infrastructure management.",
  heroSubDescription: "Build robust, scalable infrastructure and become a highly sought-after DevOps Engineer.",
  companies: ["Amazon", "Google", "Microsoft", "Netflix", "Spotify", "Red Hat"],
  ctaButtons: {
    primary: "Enroll Now - Limited Seats",
    secondary: "Explore Full Curriculum"
  },
  assessmentCertification: {
    assessmentCards: [
      {
        id: 0,
        title: "Weekly Automation Labs",
        description: "Hands-on exercises configuring servers and writing automation scripts",
        features: ["Bash Scripting", "Linux Admin", "Config Management"],
        backContent: {
          points: [
            "Linux user and permissions management",
            "Writing custom Bash automation scripts",
            "Configuring web servers (Nginx, Apache)",
            "Writing Ansible playbooks for server setup",
            "Troubleshooting network connectivity"
          ],
          frequency: "Every Week",
          weightage: "20% of final grade"
        }
      },
      {
        id: 1,
        title: "Module Assessments",
        description: "Comprehensive end-of-module exams covering core DevOps tools",
        features: ["Containerization", "IaC Concepts", "CI/CD Strategies"],
        backContent: {
          points: [
            "Docker image optimization and security",
            "Kubernetes architecture and pod lifecycles",
            "Terraform state management and modules",
            "Jenkins pipeline syntax and stages",
            "Git branching strategies for DevOps"
          ],
          frequency: "After Each Module",
          weightage: "30% of final grade"
        }
      },
      {
        id: 2,
        title: "Project Evaluations",
        description: "Expert review of fully automated, deployed applications",
        features: ["Pipeline Review", "Security Check", "High Availability"],
        backContent: {
          points: [
            "End-to-end CI/CD pipeline efficiency",
            "Proper handling of secrets and credentials",
            "Kubernetes cluster high availability setup",
            "Infrastructure as Code (IaC) modularity",
            "Implementation of monitoring and alerts"
          ],
          frequency: "Per Project",
          weightage: "40% of final grade"
        }
      },
      {
        id: 3,
        title: "Certification Benefits",
        description: "Industry-recognized DevOps Engineering certificate with hiring partner access",
        features: ["Industry Recognized", "Global Validity", "Hiring Partner Access"],
        backContent: {
          points: [
            "DevOps Engineering Professional certificate",
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
      title: "Industry-Recognized DevOps Certification",
      description: "Our certificate validates your ability to automate software delivery, manage cloud infrastructure, and ensure high availability, demonstrating your competency to employers worldwide.",
      benefits: [
        "DevOps Engineering specialization certificate",
        "Global recognition and validity",
        "Hiring partner acceptance",
        "Verified by industry experts",
        "LinkedIn digital badge included",
        "Career placement network access"
      ],
      certificateDetails: {
        title: "Certificate of Completion",
        subtitle: "DevOps Engineering Professional",
        subSubtitle: "Covering Linux, Git, Jenkins, Docker, Kubernetes, Ansible, Terraform, AWS, and modern CI/CD practices.",
        rating: 5
      }
    }
  },
  curriculum: {
    title: "Comprehensive Curriculum",
    description: "6-8 Months · 450-550 Hours",
    phases: [
      {
        id: 0,
        title: "Phase 1",
        subtitle: "Linux, Git, & Scripting Basics",
        icon: "Terminal",
        duration: "5-6 Weeks",
        gradient: "from-gray-700 to-gray-900",
        bgColor: "bg-gradient-to-br from-gray-50 to-gray-100",
        borderColor: "border-gray-300",
        topics: [
          {
            title: "Linux Administration (3 Weeks)",
            color: "gray-700",
            items: [
              "Linux filesystem hierarchy and basic commands",
              "File permissions, users, and groups",
              "Process management (top, ps, kill)",
              "Networking fundamentals (DNS, TCP/IP, SSH)",
              "Package management (apt, yum)",
              "System monitoring and logs"
            ]
          },
          {
            title: "Bash Scripting & Version Control (2-3 Weeks)",
            color: "gray-800",
            items: [
              "Writing Bash scripts: variables, loops, conditionals",
              "Text processing (grep, awk, sed)",
              "Git fundamentals: init, add, commit, push, pull",
              "Branching, merging, and resolving conflicts",
              "GitHub workflows and Pull Requests",
              "Automating basic server tasks with scripts"
            ]
          }
        ],
        projects: [
          { title: "Mini Project:", description: "Automated Server Backup Bash Script", color: "gray" },
          { title: "Mini Project:", description: "Collaborative Git Workflow Simulation", color: "gray" }
        ]
      },
      {
        id: 1,
        title: "Phase 2",
        subtitle: "Cloud Computing Fundamentals (AWS)",
        icon: "Cloud",
        duration: "5-6 Weeks",
        gradient: "from-orange-500 to-amber-600",
        bgColor: "bg-gradient-to-br from-orange-50 to-amber-50",
        borderColor: "border-orange-200",
        topics: [
          {
            title: "AWS Core Services (3 Weeks)",
            color: "orange-500",
            items: [
              "Introduction to Cloud Computing models (IaaS, PaaS, SaaS)",
              "Identity and Access Management (IAM)",
              "Elastic Compute Cloud (EC2) and AMI management",
              "Virtual Private Cloud (VPC), Subnets, and Security Groups",
              "Simple Storage Service (S3) and EBS volumes",
              "Relational Database Service (RDS) concepts"
            ]
          },
          {
            title: "High Availability & Scaling (2 Weeks)",
            color: "amber-500",
            items: [
              "Elastic Load Balancing (ELB)",
              "Auto Scaling Groups (ASG)",
              "Route 53 (DNS Management)",
              "CloudFront (CDN)",
              "Designing fault-tolerant architectures",
              "AWS Pricing and Cost Management"
            ]
          }
        ],
        projects: [
          { title: "Project 1:", description: "Deploying a Highly Available Web App on AWS", color: "orange" },
          { title: "Project 2:", description: "Designing a Custom VPC Architecture", color: "amber" }
        ]
      },
      {
        id: 2,
        title: "Phase 3",
        subtitle: "Containerization with Docker",
        icon: "Box",
        duration: "4-5 Weeks",
        gradient: "from-blue-500 to-cyan-600",
        bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
        borderColor: "border-blue-200",
        topics: [
          {
            title: "Docker Fundamentals (2-3 Weeks)",
            color: "blue-500",
            items: [
              "Containers vs. Virtual Machines",
              "Docker architecture and daemon",
              "Writing Dockerfiles and building images",
              "Image optimization and multi-stage builds",
              "Docker networking and volumes",
              "Docker registry and Docker Hub"
            ]
          },
          {
            title: "Docker Compose & Microservices (2 Weeks)",
            color: "cyan-500",
            items: [
              "Introduction to microservices architecture",
              "Writing docker-compose.yml files",
              "Orchestrating multi-container applications",
              "Environment variables and secrets in Docker",
              "Debugging containerized applications",
              "Docker best practices for production"
            ]
          }
        ],
        projects: [
          { title: "Project 1:", description: "Containerizing a Full-Stack Node.js/React App", color: "blue" },
          { title: "Project 2:", description: "Multi-Environment Deployment with Docker Compose", color: "cyan" }
        ]
      },
      {
        id: 3,
        title: "Phase 4",
        subtitle: "Container Orchestration with Kubernetes",
        icon: "Hexagon",
        duration: "6-8 Weeks",
        gradient: "from-indigo-500 to-purple-600",
        bgColor: "bg-gradient-to-br from-indigo-50 to-purple-50",
        borderColor: "border-indigo-200",
        topics: [
          {
            title: "Kubernetes Architecture & Core Objects (3 Weeks)",
            color: "indigo-500",
            items: [
              "Kubernetes architecture (Control Plane, Worker Nodes)",
              "Setting up local clusters (Minikube, Kind)",
              "Pods, ReplicaSets, and Deployments",
              "Services (ClusterIP, NodePort, LoadBalancer)",
              "Ingress Controllers and routing",
              "ConfigMaps and Secrets management"
            ]
          },
          {
            title: "Advanced Kubernetes & Managed Clusters (3-4 Weeks)",
            color: "purple-500",
            items: [
              "Persistent Volumes (PV) and Persistent Volume Claims (PVC)",
              "StatefulSets and DaemonSets",
              "Helm charts for package management",
              "Kubernetes observability and resource limits",
              "Deploying managed clusters (AWS EKS, Google GKE)",
              "Zero-downtime rolling updates"
            ]
          }
        ],
        projects: [
          { title: "Project:", description: "Deploying a Microservices App to Kubernetes", color: "indigo" },
          { title: "Project:", description: "Creating and Deploying a Custom Helm Chart", color: "purple" }
        ]
      },
      {
        id: 4,
        title: "Phase 5",
        subtitle: "Infrastructure as Code & Configuration Management",
        icon: "Settings",
        duration: "5-6 Weeks",
        gradient: "from-teal-500 to-emerald-600",
        bgColor: "bg-gradient-to-br from-teal-50 to-emerald-50",
        borderColor: "border-teal-200",
        topics: [
          {
            title: "Terraform (IaC) (3 Weeks)",
            color: "teal-500",
            items: [
              "Infrastructure as Code principles",
              "Terraform syntax (HCL) and providers",
              "Variables, outputs, and local values",
              "Managing Terraform state locally and remotely (S3/DynamoDB)",
              "Creating reusable Terraform modules",
              "Provisioning AWS infrastructure with Terraform"
            ]
          },
          {
            title: "Ansible (Configuration Management) (2-3 Weeks)",
            color: "emerald-500",
            items: [
              "Configuration Management vs. Orchestration",
              "Ansible architecture (Agentless)",
              "Writing Playbooks (YAML)",
              "Inventory files and dynamic inventories",
              "Roles, variables, and templates (Jinja2)",
              "Integrating Terraform and Ansible"
            ]
          }
        ],
        projects: [
          { title: "Project 1:", description: "Provisioning a VPC and EKS Cluster with Terraform", color: "teal" },
          { title: "Project 2:", description: "Automated Web Server Setup using Ansible Roles", color: "emerald" }
        ]
      },
      {
        id: 5,
        title: "Phase 6",
        subtitle: "Continuous Integration & Delivery (CI/CD)",
        icon: "GitMerge",
        duration: "5-6 Weeks",
        gradient: "from-red-500 to-rose-600",
        bgColor: "bg-gradient-to-br from-red-50 to-rose-50",
        borderColor: "border-red-200",
        topics: [
          {
            title: "Jenkins Pipelines (3 Weeks)",
            color: "red-500",
            items: [
              "CI/CD concepts and benefits",
              "Jenkins architecture (Master/Slave nodes)",
              "Declarative vs. Scripted pipelines (Jenkinsfile)",
              "Integrating Jenkins with Git, Docker, and SonarQube",
              "Handling credentials and sensitive data",
              "Automated testing in pipelines"
            ]
          },
          {
            title: "GitHub Actions & GitOps (2-3 Weeks)",
            color: "rose-500",
            items: [
              "GitHub Actions workflows and syntax",
              "Building and pushing Docker images to registries",
              "GitOps principles",
              "Continuous Delivery with ArgoCD",
              "Blue-Green and Canary deployment strategies",
              "Securing the software supply chain"
            ]
          }
        ],
        projects: [
          { title: "Project:", description: "End-to-End Jenkins Pipeline Deploying to Kubernetes", color: "red" },
          { title: "Project:", description: "GitOps Implementation using GitHub Actions and ArgoCD", color: "rose" }
        ]
      },
      {
        id: 6,
        title: "Phase 7",
        subtitle: "Monitoring, Observability & Capstone",
        icon: "Activity",
        duration: "4-6 Weeks",
        gradient: "from-pink-500 to-fuchsia-600",
        bgColor: "bg-gradient-to-br from-pink-50 to-fuchsia-50",
        borderColor: "border-pink-200",
        topics: [
          {
            title: "Monitoring & Logging (2-3 Weeks)",
            color: "pink-500",
            items: [
              "Observability pillars: Metrics, Logs, Traces",
              "Prometheus architecture and PromQL",
              "Visualizing metrics with Grafana dashboards",
              "Setting up alerts with Alertmanager",
              "Centralized logging (ELK Stack / EFK Stack)",
              "Monitoring Kubernetes clusters"
            ]
          },
          {
            title: "Capstone & Interview Prep (2-3 Weeks)",
            color: "fuchsia-500",
            items: [
              "Designing an enterprise-grade DevOps architecture",
              "Integrating all tools (Git -> Jenkins -> Terraform -> EKS -> Grafana)",
              "DevSecOps: Scanning for vulnerabilities in pipelines",
              "DevOps interview scenarios and system design",
              "Resume building and portfolio showcasing",
              "AWS Certified Developer/SysOps prep tips"
            ]
          }
        ],
        projects: [
          { title: "Capstone Project:", description: "Fully Automated, Monitored Cloud-Native App Deployment", color: "pink" },
          { title: "Interview Outcome:", description: "Crack DevOps / Site Reliability Engineer (SRE) roles", color: "fuchsia" }
        ]
      }
    ],
    projects: [
      {
        id: 0,
        title: "Terraform Infrastructure Provisioning",
        description: "Write modular Terraform code to deploy a highly available VPC architecture with public/private subnets and an EKS cluster.",
        icon: "Settings",
        gradient: "from-blue-500 to-cyan-500",
        bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
        borderColor: "border-blue-200",
        tags: ["Terraform", "AWS", "IaC", "Networking"]
      },
      {
        id: 1,
        title: "Dockerized Microservices",
        description: "Containerize a multi-tier application (frontend, backend, database) using Docker and orchestrate locally with Docker Compose.",
        icon: "Box",
        gradient: "from-purple-500 to-pink-500",
        bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
        borderColor: "border-purple-200",
        tags: ["Docker", "Microservices", "Node.js", "Redis"]
      },
      {
        id: 2,
        title: "Kubernetes Cluster Deployment",
        description: "Deploy the microservices application to AWS EKS, configuring Ingress, Services, ConfigMaps, and Persistent Volumes.",
        icon: "Hexagon",
        gradient: "from-green-500 to-emerald-500",
        bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
        borderColor: "border-green-200",
        tags: ["Kubernetes", "AWS EKS", "Helm", "Scaling"]
      },
      {
        id: 3,
        title: "End-to-End Jenkins CI/CD Pipeline",
        description: "Build a Jenkins pipeline that tests code, builds Docker images, scans for vulnerabilities, and deploys to Kubernetes.",
        icon: "GitMerge",
        gradient: "from-red-500 to-rose-500",
        bgColor: "bg-gradient-to-br from-red-50 to-rose-50",
        borderColor: "border-red-200",
        tags: ["Jenkins", "Groovy", "CI/CD", "DevSecOps"]
      },
      {
        id: 4,
        title: "Ansible Configuration Management",
        description: "Write Ansible playbooks to configure EC2 instances, install dependencies, and deploy application code automatically.",
        icon: "Terminal",
        gradient: "from-orange-500 to-amber-500",
        bgColor: "bg-gradient-to-br from-orange-50 to-amber-50",
        borderColor: "border-orange-200",
        tags: ["Ansible", "Linux", "YAML", "Automation"]
      },
      {
        id: 5,
        title: "Prometheus & Grafana Observability",
        description: "Set up Prometheus to scrape metrics from a Kubernetes cluster and visualize them on custom Grafana dashboards.",
        icon: "Activity",
        gradient: "from-teal-500 to-cyan-500",
        bgColor: "bg-gradient-to-br from-teal-50 to-cyan-50",
        borderColor: "border-teal-200",
        tags: ["Prometheus", "Grafana", "Monitoring", "Alerting"]
      }
    ],
    techStack: [
      {
        category: "Cloud & OS",
        icon: "Cloud",
        borderColor: "border-blue-200",
        bgColor: "bg-gradient-to-r from-blue-50 to-cyan-50",
        technologies: [
          { label: "AWS", iconSrc: "/CP1.webp" },
          { label: "Linux", iconSrc: "/DevOps4.webp" },
          { label: "Bash", iconSrc: "/DevOps3.webp" },
          { label: "Ubuntu", iconSrc: "/CP3.webp" },
          { label: "VPC/Networking", iconSrc: "/DAT4.webp" },
          { label: "GCP (Bonus)", iconSrc: "/CP2.webp" }
        ]
      },
      {
        category: "Containerization & Orchestration",
        icon: "Box",
        borderColor: "border-purple-200",
        bgColor: "bg-gradient-to-r from-purple-50 to-violet-50",
        technologies: [
          { label: "Docker", iconSrc: "/DD4.webp" },
          { label: "Kubernetes", iconSrc: "/DevOps4.webp" },
          { label: "Helm", iconSrc: "/DDW4.webp" },
          { label: "Minikube", iconSrc: "/DD2.webp" },
          { label: "AWS EKS", iconSrc: "/CP1.webp" },
          { label: "Docker Compose", iconSrc: "/DD4.webp" }
        ]
      },
      {
        category: "CI/CD & Version Control",
        icon: "GitMerge",
        borderColor: "border-green-200",
        bgColor: "bg-gradient-to-r from-green-50 to-emerald-50",
        technologies: [
          { label: "Git", iconSrc: "/DAT3.webp" },
          { label: "GitHub", iconSrc: "/DAT4.webp" },
          { label: "Jenkins", iconSrc: "/DevOps5.webp" },
          { label: "GitHub Actions", iconSrc: "/DevOps6.webp" },
          { label: "ArgoCD", iconSrc: "/DDW1.webp" },
          { label: "SonarQube", iconSrc: "/AI1.webp" }
        ]
      },
      {
        category: "IaC & Monitoring",
        icon: "Settings",
        borderColor: "border-orange-200",
        bgColor: "bg-gradient-to-r from-orange-50 to-amber-50",
        technologies: [
          { label: "Terraform", iconSrc: "/DevOps6.webp" },
          { label: "Ansible", iconSrc: "/DevOps3.webp" },
          { label: "Prometheus", iconSrc: "/DAT5.webp" },
          { label: "Grafana", iconSrc: "/DAT1.webp" },
          { label: "ELK Stack", iconSrc: "/AI6.webp" },
          { label: "Python", iconSrc: "/DAT1.webp" }
        ]
      }
    ],
    careerOutcomes: [
      {
        title: "DevOps Engineer",
        salary: "$110k-$160k",
        icon: "Settings",
        gradient: "from-blue-500 to-cyan-500",
        bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
        borderColor: "border-blue-200",
        description: "Automate software delivery, manage infrastructure, and ensure smooth deployments across environments."
      },
      {
        title: "Site Reliability Engineer (SRE)",
        salary: "$120k-$180k",
        icon: "Activity",
        gradient: "from-purple-500 to-pink-500",
        bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
        borderColor: "border-purple-200",
        description: "Apply software engineering principles to operations to ensure scalable, highly reliable software systems."
      },
      {
        title: "Cloud Infrastructure Engineer",
        salary: "$105k-$150k",
        icon: "Cloud",
        gradient: "from-green-500 to-emerald-500",
        bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
        borderColor: "border-green-200",
        description: "Design and maintain robust cloud architectures using Infrastructure as Code (IaC) tools."
      }
    ],
    capstoneData: {
      title: "Capstone Development",
      icon: "FileText",
      bgColor: "bg-white",
      borderColor: "border-gray-200",
      projects: ["End-to-End Enterprise CI/CD Pipeline", "Kubernetes Microservices Architecture", "Automated AWS Infrastructure"],
      outcome: "A professional portfolio demonstrating the ability to architect, deploy, and monitor scalable cloud applications"
    },
    interviewPrep: {
      title: "Interview Preparation",
      icon: "Users",
      bgColor: "bg-white",
      borderColor: "border-gray-200",
      technical: ["System Design", "Linux Troubleshooting", "Kubernetes Concepts", "CI/CD Scenarios"],
      career: ["Resume + GitHub Portfolio", "Mock Interviews", "Salary Negotiation"],
      outcome: "Crack DevOps and SRE interviews at top tech companies and enterprises"
    }
  },
  icon: FaCloud
};