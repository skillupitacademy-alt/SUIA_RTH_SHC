import { Course } from '../CoursesCardData';
import { FaShieldAlt } from 'react-icons/fa';

export const cybersecurityProfessionalCourse: Course =   {
    id: 7,
    category: "Cybersecurity",
    format: "LIVE ONLINE",
    title: "Cybersecurity Professional",
    description: "Protect systems and networks from digital attacks and security breaches. Master the latest security protocols and threat detection techniques.",
    features: [
      "Network Security",
      "Threat Detection",
      "Security Protocols",
      "Incident Response",
      "Penetration Testing",
      "Risk Management"
    ],
    image: "/First.webp",
    slug: "cybersecurity-professional",
    heroTitle: "Cybersecurity Professional",
    heroSubtitle: "with Pen Testing",
    heroDescription: "Master Network Security, Cryptography, Penetration Testing, Cloud Security & Incident Response.",
    heroSubDescription: "Build real-world security expertise and land high-paying cybersecurity roles at top companies.",
    companies: ["IBM", "Cisco", "Palo Alto Networks", "CrowdStrike", "Deloitte", "Microsoft"],
    ctaButtons: {
      primary: "Enroll Now - Limited Seats",
      secondary: "Explore Full Curriculum"
    },
    assessmentCertification: {
      assessmentCards: [
        {
          id: 0,
          title: "Weekly Security Labs",
          description: "Hands-on virtual lab exercises every week to reinforce security concepts and protocols",
          features: ["Virtual Labs", "Threat Simulation", "Vulnerability Scanning"],
          backContent: {
            points: [
              "Network traffic analysis tasks",
              "Firewall and IDS configuration",
              "Vulnerability scanning exercises",
              "Cryptography application",
              "Security policy drafting"
            ],
            frequency: "Every Week",
            weightage: "20% of final grade"
          }
        },
        {
          id: 1,
          title: "Module Assessments",
          description: "Comprehensive end-of-module exams covering critical security domains",
          features: ["Domain Tests", "Scenario Analysis", "Security Audits"],
          backContent: {
            points: [
              "Network security protocol exams",
              "Risk management and compliance tests",
              "Incident response scenarios",
              "Identity and access management checks",
              "Cloud security architecture reviews"
            ],
            frequency: "After Each Module",
            weightage: "30% of final grade"
          }
        },
        {
          id: 2,
          title: "Project Evaluations",
          description: "Expert review of security implementations and incident response plans",
          features: ["Architecture Review", "Response Plan Check", "Audit Reporting"],
          backContent: {
            points: [
              "Enterprise security architecture design",
              "Incident response playbook evaluation",
              "Comprehensive vulnerability assessment",
              "Security awareness program creation",
              "Disaster recovery plan review"
            ],
            frequency: "Per Project",
            weightage: "40% of final grade"
          }
        },
        {
          id: 3,
          title: "Certification Benefits",
          description: "Industry-recognized Cybersecurity certificate aligning with CompTIA Security+ and CISSP domains",
          features: ["Industry Recognized", "Global Validity", "Hiring Partner Access"],
          backContent: {
            points: [
              "Cybersecurity Professional certificate",
              "Global recognition by top tech companies",
              "Hiring partner network access",
              "Preparation for Security+ / CISSP",
              "LinkedIn digital badge included"
            ],
            frequency: "Program Completion",
            weightage: "Official Certification"
          }
        }
      ],
      certificateData: {
        title: "Industry-Recognized Cybersecurity Certification",
        description: "Our certificate validates your ability to protect networks, detect threats, and respond to incidents, demonstrating your competency to employers worldwide.",
        benefits: [
          "Cybersecurity specialization certificate",
          "Global recognition and validity",
          "Hiring partner acceptance",
          "Verified by industry experts",
          "LinkedIn digital badge included",
          "Career placement network access"
        ],
        certificateDetails: {
          title: "Certificate of Completion",
          subtitle: "Cybersecurity Professional",
          subSubtitle: "Covering Network Security, Cryptography, Identity Management, Risk Assessment, Cloud Security, and Incident Response Strategies.",
          rating: 5
        }
      }
    },
    curriculum: {
      title: "Comprehensive Curriculum",
      description: "5-7 Months · 450-550 Hours",
      phases: [
        {
          id: 0,
          title: "Phase 1",
          subtitle: "Cybersecurity Fundamentals & Networking",
          icon: "Shield",
          duration: "5-6 Weeks",
          gradient: "from-blue-500 to-indigo-600",
          bgColor: "bg-gradient-to-br from-blue-50 to-indigo-50",
          borderColor: "border-blue-200",
          topics: [
            {
              title: "Security Principles (2-3 Weeks)",
              color: "blue-500",
              items: [
                "The CIA Triad (Confidentiality, Integrity, Availability)",
                "Security governance, risk, and compliance (GRC)",
                "Common threat actors and attack vectors",
                "Social engineering techniques",
                "Physical security controls",
                "Security policies and procedures"
              ]
            },
            {
              title: "Networking Concepts (3-4 Weeks)",
              color: "indigo-500",
              items: [
                "OSI and TCP/IP models",
                "IP addressing, subnetting, and DNS",
                "Network protocols (HTTP/S, SSH, FTP, SMTP)",
                "Routing and switching fundamentals",
                "Wireless network security (WPA2/WPA3)",
                "Network analysis tools (Wireshark, tcpdump)"
              ]
            }
          ],
          projects: [
            { title: "Mini Project:", description: "Network Traffic Analysis using Wireshark", color: "blue" },
            { title: "Mini Project:", description: "Drafting a Corporate Security Policy", color: "indigo" }
          ]
        },
        {
          id: 1,
          title: "Phase 2",
          subtitle: "Endpoint Security & Access Management",
          icon: "Lock",
          duration: "4-5 Weeks",
          gradient: "from-green-500 to-emerald-600",
          bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
          borderColor: "border-green-200",
          topics: [
            {
              title: "Identity & Access Management (IAM) (2-3 Weeks)",
              color: "green-500",
              items: [
                "Authentication vs. Authorization",
                "Multi-factor authentication (MFA) and Biometrics",
                "Single Sign-On (SSO) and Federation (SAML, OAuth)",
                "Role-Based Access Control (RBAC)",
                "Active Directory and LDAP fundamentals",
                "Privileged Access Management (PAM)"
              ]
            },
            {
              title: "Endpoint & Host Security (2-3 Weeks)",
              color: "emerald-500",
              items: [
                "OS hardening (Windows, Linux, macOS)",
                "Antivirus, EDR, and XDR solutions",
                "Patch management and system updates",
                "Mobile device management (MDM)",
                "Data loss prevention (DLP)",
                "Secure boot and firmware protection"
              ]
            }
          ],
          projects: [
            { title: "Project 1:", description: "Implementing an IAM Solution with MFA", color: "green" },
            { title: "Project 2:", description: "Windows and Linux Server Hardening", color: "emerald" }
          ]
        },
        {
          id: 2,
          title: "Phase 3",
          subtitle: "Network Security & Cryptography",
          icon: "Network",
          duration: "6-8 Weeks",
          gradient: "from-purple-500 to-violet-600",
          bgColor: "bg-gradient-to-br from-purple-50 to-violet-50",
          borderColor: "border-purple-200",
          topics: [
            {
              title: "Network Defense (3-4 Weeks)",
              color: "purple-500",
              items: [
                "Firewall architecture and rule configuration",
                "Intrusion Detection/Prevention Systems (IDS/IPS)",
                "Virtual Private Networks (VPNs) and IPsec",
                "Network segmentation and VLANs",
                "Zero Trust Network Architecture (ZTNA)",
                "Securing network devices and IoT"
              ]
            },
            {
              title: "Cryptography (3-4 Weeks)",
              color: "violet-500",
              items: [
                "Symmetric vs. Asymmetric encryption",
                "Hashing algorithms (SHA, MD5) and digital signatures",
                "Public Key Infrastructure (PKI) and Certificates",
                "SSL/TLS protocols and HTTPS implementation",
                "Data at rest, in transit, and in use",
                "Steganography and quantum cryptography concepts"
              ]
            }
          ],
          projects: [
            { title: "Project 1:", description: "Configuring a Next-Gen Firewall (Pfsense/Fortinet)", color: "purple" },
            { title: "Project 2:", description: "Implementing a PKI and Certificate Authority", color: "violet" }
          ]
        },
        {
          id: 3,
          title: "Phase 4",
          subtitle: "Vulnerability Management & Pen Testing Basics",
          icon: "Target",
          duration: "5-6 Weeks",
          gradient: "from-red-500 to-rose-600",
          bgColor: "bg-gradient-to-br from-red-50 to-rose-50",
          borderColor: "border-red-200",
          topics: [
            {
              title: "Vulnerability Assessment (2-3 Weeks)",
              color: "red-500",
              items: [
                "Vulnerability scanning tools (Nessus, OpenVAS)",
                "CVSS scoring and risk prioritization",
                "Vulnerability lifecycle management",
                "Interpreting scan reports and remediation",
                "Threat intelligence feeds (OSINT, STIX/TAXII)"
              ]
            },
            {
              title: "Ethical Hacking Fundamentals (3-4 Weeks)",
              color: "rose-500",
              items: [
                "Reconnaissance and footprinting",
                "Network scanning (Nmap)",
                "Web application vulnerabilities (OWASP Top 10)",
                "Exploitation basics (Metasploit framework)",
                "Post-exploitation and privilege escalation",
                "Reporting and ethical considerations"
              ]
            }
          ],
          projects: [
            { title: "Project:", description: "Conducting a Vulnerability Assessment on a Lab Network", color: "red" },
            { title: "Project:", description: "Web Application Security Audit", color: "rose" }
          ]
        },
        {
          id: 4,
          title: "Phase 5",
          subtitle: "Cloud Security & DevSecOps",
          icon: "Cloud",
          duration: "4-5 Weeks",
          gradient: "from-teal-500 to-cyan-600",
          bgColor: "bg-gradient-to-br from-teal-50 to-cyan-50",
          borderColor: "border-teal-200",
          topics: [
            {
              title: "Cloud Security Architecture (2-3 Weeks)",
              color: "teal-500",
              items: [
                "Cloud service models (IaaS, PaaS, SaaS)",
                "Shared responsibility model (AWS, Azure, GCP)",
                "Cloud identity and access management",
                "Securing cloud storage and databases",
                "Cloud Security Posture Management (CSPM)",
                "CASB (Cloud Access Security Broker)"
              ]
            },
            {
              title: "DevSecOps Fundamentals (2-3 Weeks)",
              color: "cyan-500",
              items: [
                "Integrating security into the CI/CD pipeline",
                "SAST (Static) and DAST (Dynamic) application testing",
                "Container security (Docker, Kubernetes)",
                "Infrastructure as Code (IaC) security scanning",
                "Secrets management (HashiCorp Vault)"
              ]
            }
          ],
          projects: [
            { title: "Project 1:", description: "Securing an AWS/Azure Cloud Environment", color: "teal" },
            { title: "Project 2:", description: "Implementing SAST in a GitHub Actions Pipeline", color: "cyan" }
          ]
        },
        {
          id: 5,
          title: "Phase 6",
          subtitle: "Security Operations & Incident Response",
          icon: "AlertTriangle",
          duration: "5-6 Weeks",
          gradient: "from-orange-500 to-amber-600",
          bgColor: "bg-gradient-to-br from-orange-50 to-amber-50",
          borderColor: "border-orange-200",
          topics: [
            {
              title: "Security Operations Center (SOC) (2-3 Weeks)",
              color: "orange-500",
              items: [
                "SOC roles, responsibilities, and workflows",
                "Log management and aggregation",
                "SIEM solutions (Splunk, Elastic Security, Sentinel)",
                "Writing detection rules and alerts",
                "SOAR (Security Orchestration, Automation, and Response)",
                "Threat hunting methodologies"
              ]
            },
            {
              title: "Incident Response & Forensics (3-4 Weeks)",
              color: "amber-500",
              items: [
                "The Incident Response Lifecycle (NIST/SANS)",
                "Creating and utilizing Playbooks/Runbooks",
                "Malware analysis basics (Static and Dynamic)",
                "Digital forensics principles and chain of custody",
                "Memory and disk acquisition techniques",
                "Post-incident activities and lessons learned"
              ]
            }
          ],
          projects: [
            { title: "Project:", description: "Deploying and Configuring a SIEM (Elastic/Splunk)", color: "orange" },
            { title: "Project:", description: "Simulated Ransomware Incident Response Exercise", color: "amber" }
          ]
        },
        {
          id: 6,
          title: "Phase 7",
          subtitle: "Capstone Projects & Certification Prep",
          icon: "Rocket",
          duration: "4-6 Weeks",
          gradient: "from-gray-700 to-gray-900",
          bgColor: "bg-gradient-to-br from-gray-100 to-gray-200",
          borderColor: "border-gray-400",
          topics: [
            {
              title: "Capstone Development (2-3 Weeks)",
              color: "gray-700",
              items: [
                "Designing a comprehensive enterprise security architecture",
                "Implementing network, endpoint, and cloud controls",
                "Simulating attacks and demonstrating defense mechanisms",
                "Drafting incident response documentation",
                "Final project presentation and peer review"
              ]
            },
            {
              title: "Certification & Interview Prep (2-3 Weeks)",
              color: "gray-800",
              items: [
                "CompTIA Security+ / CISSP domain review",
                "Practice exams and testing strategies",
                "Cybersecurity interview scenarios and technical questions",
                "Resume building for security roles",
                "Building a home lab portfolio",
                "Networking in the cybersecurity community"
              ]
            }
          ],
          projects: [
            { title: "Capstone Project:", description: "End-to-End Enterprise Security Architecture and Audit", color: "gray" },
            { title: "Interview Outcome:", description: "Crack roles like SOC Analyst, Security Engineer, or Consultant", color: "gray" }
          ]
        }
      ],
      projects: [
        {
          id: 0,
          title: "SIEM Implementation",
          description: "Deploy and configure a SIEM solution (Splunk/Elastic) to ingest logs, create dashboards, and generate alerts for suspicious activity.",
          icon: "Activity",
          gradient: "from-blue-500 to-cyan-500",
          bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
          borderColor: "border-blue-200",
          tags: ["Splunk", "SIEM", "Log Analysis", "Dashboards"]
        },
        {
          id: 1,
          title: "Vulnerability Assessment Report",
          description: "Conduct a full vulnerability scan on a target network, prioritize risks using CVSS, and draft an executive remediation report.",
          icon: "Target",
          gradient: "from-red-500 to-rose-500",
          bgColor: "bg-gradient-to-br from-red-50 to-rose-50",
          borderColor: "border-red-200",
          tags: ["Nessus", "Nmap", "CVSS", "Reporting"]
        },
        {
          id: 2,
          title: "Cloud Security Architecture",
          description: "Design and implement a secure cloud architecture in AWS/Azure applying IAM policies, network security groups, and encryption.",
          icon: "Cloud",
          gradient: "from-green-500 to-emerald-500",
          bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
          borderColor: "border-green-200",
          tags: ["AWS", "Azure", "IAM", "Encryption"]
        },
        {
          id: 3,
          title: "Incident Response Playbook",
          description: "Develop a comprehensive incident response playbook for a ransomware attack, detailing containment, eradication, and recovery steps.",
          icon: "FileText",
          gradient: "from-purple-500 to-pink-500",
          bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
          borderColor: "border-purple-200",
          tags: ["Incident Response", "Ransomware", "NIST", "Documentation"]
        },
        {
          id: 4,
          title: "Network Traffic Analysis",
          description: "Capture and analyze network traffic using Wireshark to identify plaintext credentials, malware beacons, and network anomalies.",
          icon: "Network",
          gradient: "from-orange-500 to-amber-500",
          bgColor: "bg-gradient-to-br from-orange-50 to-amber-50",
          borderColor: "border-orange-200",
          tags: ["Wireshark", "PCAP", "TCP/IP", "Packet Analysis"]
        },
        {
          id: 5,
          title: "Enterprise IAM Rollout",
          description: "Plan and configure an Identity and Access Management solution integrating Active Directory with Multi-Factor Authentication.",
          icon: "Lock",
          gradient: "from-teal-500 to-cyan-500",
          bgColor: "bg-gradient-to-br from-teal-50 to-cyan-50",
          borderColor: "border-teal-200",
          tags: ["Active Directory", "MFA", "SSO", "RBAC"]
        }
      ],
      techStack: [
        {
          category: "Network & Infrastructure",
          icon: "Network",
          borderColor: "border-blue-200",
          bgColor: "bg-gradient-to-r from-blue-50 to-cyan-50",
          technologies: [
            { label: "Cisco IOS", iconSrc: "/DevOps4.webp" },
            { label: "Wireshark", iconSrc: "/AI5.webp" },
            { label: "Pfsense", iconSrc: "/DevOps5.webp" },
            { label: "TCP/IP", iconSrc: "/BE6.webp" },
            { label: "Nmap", iconSrc: "/AI4.webp" },
            { label: "Linux", iconSrc: "/DevOps3.webp" }
          ]
        },
        {
          category: "Security Operations (SOC)",
          icon: "Activity",
          borderColor: "border-green-200",
          bgColor: "bg-gradient-to-r from-green-50 to-emerald-50",
          technologies: [
            { label: "Splunk", iconSrc: "/DAT1.webp" },
            { label: "Elastic Security", iconSrc: "/DAT3.webp" },
            { label: "Snort/Suricata", iconSrc: "/AI2.webp" },
            { label: "CrowdStrike", iconSrc: "/CP3.webp" },
            { label: "MISP", iconSrc: "/DAT4.webp" },
            { label: "TheHive", iconSrc: "/AI1.webp" }
          ]
        },
        {
          category: "Vulnerability & Pentesting",
          icon: "Target",
          borderColor: "border-red-200",
          bgColor: "bg-gradient-to-r from-red-50 to-rose-50",
          technologies: [
            { label: "Nessus", iconSrc: "/AI3.webp" },
            { label: "Metasploit", iconSrc: "/AI4.webp" },
            { label: "Burp Suite", iconSrc: "/AI5.webp" },
            { label: "Kali Linux", iconSrc: "/DevOps3.webp" },
            { label: "OpenVAS", iconSrc: "/AI6.webp" },
            { label: "OWASP", iconSrc: "/BE6.webp" }
          ]
        },
        {
          category: "Cloud & IAM",
          icon: "Cloud",
          borderColor: "border-purple-200",
          bgColor: "bg-gradient-to-r from-purple-50 to-violet-50",
          technologies: [
            { label: "AWS Security", iconSrc: "/CP1.webp" },
            { label: "Azure Security", iconSrc: "/CP3.webp" },
            { label: "Active Directory", iconSrc: "/DAT3.webp" },
            { label: "Okta", iconSrc: "/BE5.webp" },
            { label: "Docker Security", iconSrc: "/DD4.webp" },
            { label: "HashiCorp Vault", iconSrc: "/DevOps6.webp" }
          ]
        }
      ],
      careerOutcomes: [
        {
          title: "Cybersecurity Analyst (SOC)",
          salary: "$75k-$110k",
          icon: "Activity",
          gradient: "from-blue-500 to-cyan-500",
          bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
          borderColor: "border-blue-200",
          description: "Monitor network traffic, analyze alerts, and serve as the first line of defense against cyber attacks."
        },
        {
          title: "Security Engineer",
          salary: "$100k-$150k",
          icon: "Shield",
          gradient: "from-green-500 to-emerald-500",
          bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
          borderColor: "border-green-200",
          description: "Design, implement, and maintain security systems, firewalls, and data protection measures."
        },
        {
          title: "Incident Responder",
          salary: "$95k-$140k",
          icon: "AlertTriangle",
          gradient: "from-red-500 to-rose-500",
          bgColor: "bg-gradient-to-br from-red-50 to-rose-50",
          borderColor: "border-red-200",
          description: "Investigate security breaches, contain threats, and perform digital forensics to prevent future incidents."
        }
      ],
      capstoneData: {
        title: "Capstone Development",
        icon: "FileText",
        bgColor: "bg-white",
        borderColor: "border-gray-200",
        projects: ["Enterprise Architecture Audit", "SIEM Deployment", "Incident Response Playbook"],
        outcome: "Comprehensive portfolio demonstrating hands-on ability to secure enterprise networks and respond to threats"
      },
      interviewPrep: {
        title: "Interview Preparation",
        icon: "Users",
        bgColor: "bg-white",
        borderColor: "border-gray-200",
        technical: ["Networking Concepts", "Cryptography", "Threat Scenarios", "Tool Proficiency"],
        career: ["Resume + LinkedIn", "Mock Interviews", "Salary Negotiation"],
        outcome: "Crack cybersecurity interviews at top enterprises, MSSPs, and government contractors"
      }
    },
    icon: FaShieldAlt
  };