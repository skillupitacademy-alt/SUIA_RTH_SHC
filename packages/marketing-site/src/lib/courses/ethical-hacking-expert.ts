import { Course } from '../CoursesCardData';
import { FaBolt } from 'react-icons/fa';

export const ethicalHackingExpertCourse: Course =   {
    id: 8,
    category: "Cybersecurity",
    format: "LIVE ONLINE",
    title: "Ethical Hacking Expert",
    description: "Learn to think like a hacker to identify and fix security vulnerabilities. Master penetration testing and vulnerability assessment.",
    features: [
      "Penetration Testing",
      "Vulnerability Assessment",
      "Security Tools",
      "Red Team Tactics",
      "Web App Security",
      "Network Security"
    ],
    image: "/Second.webp",
    slug: "ethical-hacking-expert",
    heroTitle: "Ethical Hacking Expert",
    heroSubtitle: "with Red Team",
    heroDescription: "Master Penetration Testing, Vulnerability Assessment, Red Team Tactics & Web App Security.",
    heroSubDescription: "Think like a hacker, defend like a pro — and land high-paying security roles at top companies.",
    companies: ["Google", "FireEye", "Rapid7", "IBM X-Force", "HackerOne", "Bugcrowd"],
    ctaButtons: {
      primary: "Enroll Now - Limited Seats",
      secondary: "Explore Full Curriculum"
    },
    assessmentCertification: {
      assessmentCards: [
        {
          id: 0,
          title: "Weekly Hack Labs",
          description: "Hands-on offensive security exercises in safe, isolated virtual environments",
          features: ["CTF Challenges", "Exploit Practice", "Tool Mastery"],
          backContent: {
            points: [
              "Network scanning and enumeration labs",
              "Web application exploitation challenges",
              "Wireless network cracking exercises",
              "Social engineering simulations",
              "Custom script writing for automation"
            ],
            frequency: "Every Week",
            weightage: "20% of final grade"
          }
        },
        {
          id: 1,
          title: "Module Assessments",
          description: "Comprehensive end-of-module exams covering various hacking phases and techniques",
          features: ["Domain Tests", "Scenario Analysis", "Methodology Review"],
          backContent: {
            points: [
              "Reconnaissance and footprinting tests",
              "System hacking and privilege escalation scenarios",
              "Web and mobile application security checks",
              "Cryptography and steganography analysis",
              "Evading IDS, firewalls, and honeypots"
            ],
            frequency: "After Each Module",
            weightage: "30% of final grade"
          }
        },
        {
          id: 2,
          title: "Project Evaluations",
          description: "Expert review of penetration testing reports and red team engagements",
          features: ["Pentest Reports", "Vulnerability Audits", "Remediation Plans"],
          backContent: {
            points: [
              "Full scope penetration test execution",
              "Professional vulnerability reporting",
              "Risk scoring and CVSS evaluation",
              "Actionable remediation recommendations",
              "Executive summary presentation"
            ],
            frequency: "Per Project",
            weightage: "40% of final grade"
          }
        },
        {
          id: 3,
          title: "Certification Benefits",
          description: "Industry-recognized Ethical Hacking certificate aligning with CEH and OSCP domains",
          features: ["Industry Recognized", "Global Validity", "Hiring Partner Access"],
          backContent: {
            points: [
              "Ethical Hacking Expert certificate",
              "Global recognition by top tech companies",
              "Hiring partner network access",
              "Preparation for CEH / OSCP",
              "LinkedIn digital badge included"
            ],
            frequency: "Program Completion",
            weightage: "Official Certification"
          }
        }
      ],
      certificateData: {
        title: "Industry-Recognized Ethical Hacking Certification",
        description: "Our certificate validates your offensive security skills, demonstrating your ability to identify and exploit vulnerabilities responsibly to employers worldwide.",
        benefits: [
          "Offensive security specialization certificate",
          "Global recognition and validity",
          "Hiring partner acceptance",
          "Verified by industry experts",
          "LinkedIn digital badge included",
          "Career placement network access"
        ],
        certificateDetails: {
          title: "Certificate of Completion",
          subtitle: "Ethical Hacking & Penetration Testing",
          subSubtitle: "Covering Reconnaissance, Exploitation, Web App Security, Wireless Hacking, Social Engineering, and Professional Pentest Reporting.",
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
          subtitle: "Introduction to Ethical Hacking & Footprinting",
          icon: "Search",
          duration: "5-6 Weeks",
          gradient: "from-blue-500 to-indigo-600",
          bgColor: "bg-gradient-to-br from-blue-50 to-indigo-50",
          borderColor: "border-blue-200",
          topics: [
            {
              title: "Ethical Hacking Fundamentals (2-3 Weeks)",
              color: "blue-500",
              items: [
                "Information security overview and cyber kill chain",
                "Hacking concepts, phases, and attack vectors",
                "Information security controls and laws/standards",
                "Setting up a hacking lab (Kali Linux, Parrot OS)",
                "Basic networking and Linux command line skills",
                "Legal and ethical boundaries of penetration testing"
              ]
            },
            {
              title: "Footprinting and Reconnaissance (3-4 Weeks)",
              color: "indigo-500",
              items: [
                "Open Source Intelligence (OSINT) gathering",
                "Search engine footprinting (Google Dorks)",
                "Website and email footprinting",
                "DNS footprinting and network reconnaissance",
                "Social engineering footprinting",
                "Footprinting tools (Maltego, Recon-ng, Shodan)"
              ]
            }
          ],
          projects: [
            { title: "Mini Project:", description: "Comprehensive OSINT Profile Generation", color: "blue" },
            { title: "Mini Project:", description: "Automated Reconnaissance Script using Python", color: "indigo" }
          ]
        },
        {
          id: 1,
          title: "Phase 2",
          subtitle: "Network Scanning & Enumeration",
          icon: "Activity",
          duration: "4-5 Weeks",
          gradient: "from-green-500 to-emerald-600",
          bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
          borderColor: "border-green-200",
          topics: [
            {
              title: "Network Scanning (2-3 Weeks)",
              color: "green-500",
              items: [
                "TCP/IP communication and packet analysis",
                "Scanning techniques (TCP Connect, SYN, Xmas)",
                "Mastering Nmap for host discovery and port scanning",
                "OS fingerprinting and banner grabbing",
                "Evading IDS and Firewalls during scanning",
                "Network diagrams and mapping tools"
              ]
            },
            {
              title: "Enumeration (2-3 Weeks)",
              color: "emerald-500",
              items: [
                "NetBIOS, SMB, and RPC enumeration",
                "SNMP, LDAP, and NTP enumeration",
                "SMTP and DNS enumeration techniques",
                "Enumeration countermeasures",
                "Automated enumeration tools (Enum4linux, SNMPWalk)"
              ]
            }
          ],
          projects: [
            { title: "Project 1:", description: "Internal Network Mapping and Vulnerability Scan", color: "green" },
            { title: "Project 2:", description: "Custom Nmap Scripting Engine (NSE) Script", color: "emerald" }
          ]
        },
        {
          id: 2,
          title: "Phase 3",
          subtitle: "System Hacking & Vulnerability Analysis",
          icon: "Terminal",
          duration: "6-8 Weeks",
          gradient: "from-purple-500 to-violet-600",
          bgColor: "bg-gradient-to-br from-purple-50 to-violet-50",
          borderColor: "border-purple-200",
          topics: [
            {
              title: "Vulnerability Analysis (2-3 Weeks)",
              color: "purple-500",
              items: [
                "Vulnerability research and discovery",
                "Vulnerability classification and scoring (CVSS)",
                "Automated assessment tools (Nessus, OpenVAS)",
                "Manual vs. automated vulnerability analysis",
                "Analyzing and interpreting scan reports"
              ]
            },
            {
              title: "System Hacking (4-5 Weeks)",
              color: "violet-500",
              items: [
                "Password cracking techniques (Dictionary, Brute-force, Rainbow tables)",
                "Tools: John the Ripper, Hashcat, Hydra",
                "Privilege escalation (Windows & Linux)",
                "Executing applications and maintaining access (Backdoors, Rootkits)",
                "Hiding files (Steganography) and clearing logs",
                "Exploitation frameworks (Metasploit)"
              ]
            }
          ],
          projects: [
            { title: "Project 1:", description: "Password Cracking and Hash Analysis Challenge", color: "purple" },
            { title: "Project 2:", description: "Exploiting and Gaining Root on a Vulnerable VM", color: "violet" }
          ]
        },
        {
          id: 3,
          title: "Phase 4",
          subtitle: "Web Application & Database Hacking",
          icon: "Globe",
          duration: "6-7 Weeks",
          gradient: "from-red-500 to-rose-600",
          bgColor: "bg-gradient-to-br from-red-50 to-rose-50",
          borderColor: "border-red-200",
          topics: [
            {
              title: "Web App Hacking (OWASP Top 10) (3-4 Weeks)",
              color: "red-500",
              items: [
                "Web application architecture and threat modeling",
                "Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF)",
                "Broken authentication and session management",
                "Security misconfigurations and directory traversal",
                "Web app vulnerability scanners (Burp Suite, OWASP ZAP)",
                "Bypassing Web Application Firewalls (WAF)"
              ]
            },
            {
              title: "SQL Injection & Database Attacks (3-4 Weeks)",
              color: "rose-500",
              items: [
                "SQL injection concepts and methodologies",
                "Types of SQLi (In-band, Blind, Error-based)",
                "Exploitation tools (SQLmap)",
                "Database extraction and privilege escalation",
                "NoSQL injection basics",
                "SQL injection countermeasures and secure coding"
              ]
            }
          ],
          projects: [
            { title: "Project:", description: "Manual Web App Pentest using Burp Suite Professional", color: "red" },
            { title: "Project:", description: "Database Extraction via Blind SQL Injection", color: "rose" }
          ]
        },
        {
          id: 4,
          title: "Phase 5",
          subtitle: "Network, Wireless & Mobile Hacking",
          icon: "Wifi",
          duration: "5-6 Weeks",
          gradient: "from-teal-500 to-cyan-600",
          bgColor: "bg-gradient-to-br from-teal-50 to-cyan-50",
          borderColor: "border-teal-200",
          topics: [
            {
              title: "Network Threats & Wireless Hacking (3-4 Weeks)",
              color: "teal-500",
              items: [
                "Sniffing concepts (MAC attacks, DHCP attacks)",
                "ARP poisoning and Man-in-the-Middle (MITM) attacks",
                "Denial-of-Service (DoS) and DDoS attack techniques",
                "Wireless encryption (WEP, WPA, WPA2, WPA3)",
                "Cracking Wi-Fi passwords (Aircrack-ng, Wireshark)",
                "Rogue access points and Evil Twin attacks"
              ]
            },
            {
              title: "Mobile & IoT Security (2-3 Weeks)",
              color: "cyan-500",
              items: [
                "Mobile platform attack vectors (Android, iOS)",
                "App reverse engineering and traffic analysis",
                "Mobile device management (MDM) vulnerabilities",
                "IoT architecture and communication protocols",
                "Hacking smart devices and embedded systems",
                "OT (Operational Technology) security overview"
              ]
            }
          ],
          projects: [
            { title: "Project 1:", description: "Simulating a MITM Attack and Credential Sniffing", color: "teal" },
            { title: "Project 2:", description: "Cracking WPA2 Handshakes in a Lab Environment", color: "cyan" }
          ]
        },
        {
          id: 5,
          title: "Phase 6",
          subtitle: "Advanced Threats & Social Engineering",
          icon: "AlertOctagon",
          duration: "4-5 Weeks",
          gradient: "from-orange-500 to-amber-600",
          bgColor: "bg-gradient-to-br from-orange-50 to-amber-50",
          borderColor: "border-orange-200",
          topics: [
            {
              title: "Malware Threats & Evading Defenses (2-3 Weeks)",
              color: "orange-500",
              items: [
                "Trojans, Viruses, Worms, and Ransomware",
                "Advanced Persistent Threats (APTs) and botnets",
                "Malware analysis techniques (Static and Dynamic)",
                "Evading Antivirus (AV) and EDR solutions",
                "Payload obfuscation and encodings"
              ]
            },
            {
              title: "Social Engineering (2-3 Weeks)",
              color: "amber-500",
              items: [
                "Phishing, Spear Phishing, and Whaling",
                "Baiting, Tailgating, and Pretexting",
                "Social Engineering Toolkit (SET)",
                "Creating malicious payloads and documents",
                "Human psychology in cybersecurity attacks",
                "Physical security bypass techniques"
              ]
            }
          ],
          projects: [
            { title: "Project:", description: "Creating an Obfuscated Payload to Bypass AV", color: "orange" },
            { title: "Project:", description: "Designing a Spear Phishing Campaign with SET", color: "amber" }
          ]
        },
        {
          id: 6,
          title: "Phase 7",
          subtitle: "Capstone Projects, Reporting & Bug Bounties",
          icon: "Award",
          duration: "4-6 Weeks",
          gradient: "from-gray-700 to-gray-900",
          bgColor: "bg-gradient-to-br from-gray-100 to-gray-200",
          borderColor: "border-gray-400",
          topics: [
            {
              title: "Pentest Reporting & Capstone (2-3 Weeks)",
              color: "gray-700",
              items: [
                "Executing a full-scope simulated penetration test",
                "Writing professional penetration testing reports",
                "Executive summaries vs. technical details",
                "Providing actionable remediation strategies",
                "Post-testing cleanup and debriefing"
              ]
            },
            {
              title: "Bug Bounties & Interview Prep (2-3 Weeks)",
              color: "gray-800",
              items: [
                "Introduction to Bug Bounty platforms (HackerOne, Bugcrowd)",
                "Bug bounty methodologies and scope analysis",
                "Ethical hacking interview technical scenarios",
                "Offensive security certifications (CEH, OSCP, eJPT)",
                "Building a CTF portfolio (HackTheBox, TryHackMe)",
                "Resume building for Red Team roles"
              ]
            }
          ],
          projects: [
            { title: "Capstone Project:", description: "Full-Scope Penetration Test and Professional Report", color: "gray" },
            { title: "Interview Outcome:", description: "Crack Red Team, Pentester, or Bug Hunter roles", color: "gray" }
          ]
        }
      ],
      projects: [
        {
          id: 0,
          title: "Enterprise Vulnerability Scan",
          description: "Perform comprehensive vulnerability assessments on simulated corporate networks and provide prioritized remediation plans.",
          icon: "Target",
          gradient: "from-blue-500 to-cyan-500",
          bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
          borderColor: "border-blue-200",
          tags: ["Nessus", "Nmap", "CVSS", "Reporting"]
        },
        {
          id: 1,
          title: "Active Directory Exploitation",
          description: "Simulate attacks on a Windows Active Directory environment, escalating privileges from standard user to Domain Admin.",
          icon: "Lock",
          gradient: "from-red-500 to-rose-500",
          bgColor: "bg-gradient-to-br from-red-50 to-rose-50",
          borderColor: "border-red-200",
          tags: ["Active Directory", "BloodHound", "Mimikatz", "PrivEsc"]
        },
        {
          id: 2,
          title: "Web App Penetration Test",
          description: "Conduct a manual penetration test against a deliberately vulnerable web application targeting the OWASP Top 10.",
          icon: "Globe",
          gradient: "from-green-500 to-emerald-500",
          bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
          borderColor: "border-green-200",
          tags: ["Burp Suite", "SQLi", "XSS", "OWASP"]
        },
        {
          id: 3,
          title: "Custom Exploit Development",
          description: "Develop custom exploitation scripts and automate repetitive hacking tasks using Python.",
          icon: "Code",
          gradient: "from-purple-500 to-pink-500",
          bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
          borderColor: "border-purple-200",
          tags: ["Python", "Exploitation", "Automation", "Scripting"]
        },
        {
          id: 4,
          title: "Wireless Network Compromise",
          description: "Analyze, capture handshakes, and crack wireless network encryption keys in a controlled lab setting.",
          icon: "Wifi",
          gradient: "from-orange-500 to-amber-500",
          bgColor: "bg-gradient-to-br from-orange-50 to-amber-50",
          borderColor: "border-orange-200",
          tags: ["Aircrack-ng", "Wireshark", "WPA2", "Hashcat"]
        },
        {
          id: 5,
          title: "Red Team Phishing Campaign",
          description: "Design and execute a simulated social engineering campaign to test organizational security awareness.",
          icon: "Users",
          gradient: "from-teal-500 to-cyan-500",
          bgColor: "bg-gradient-to-br from-teal-50 to-cyan-50",
          borderColor: "border-teal-200",
          tags: ["SET", "Social Engineering", "OSINT", "Payloads"]
        }
      ],
      techStack: [
        {
          category: "Offensive Operating Systems",
          icon: "Terminal",
          borderColor: "border-blue-200",
          bgColor: "bg-gradient-to-r from-blue-50 to-cyan-50",
          technologies: [
            { label: "Kali Linux", iconSrc: "/DevOps3.webp" },
            { label: "Parrot OS", iconSrc: "/DAT3.webp" },
            { label: "Windows Active Directory", iconSrc: "/CP3.webp" },
            { label: "Metasploitable", iconSrc: "/AI2.webp" },
            { label: "Docker", iconSrc: "/DD4.webp" },
            { label: "Linux CLI", iconSrc: "/DevOps4.webp" }
          ]
        },
        {
          category: "Scanning & Enumeration",
          icon: "Search",
          borderColor: "border-green-200",
          bgColor: "bg-gradient-to-r from-green-50 to-emerald-50",
          technologies: [
            { label: "Nmap", iconSrc: "/AI4.webp" },
            { label: "Nessus", iconSrc: "/AI3.webp" },
            { label: "OpenVAS", iconSrc: "/AI6.webp" },
            { label: "Wireshark", iconSrc: "/AI5.webp" },
            { label: "Maltego", iconSrc: "/DAT4.webp" },
            { label: "BloodHound", iconSrc: "/DAT1.webp" }
          ]
        },
        {
          category: "Exploitation Tools",
          icon: "Target",
          borderColor: "border-red-200",
          bgColor: "bg-gradient-to-r from-red-50 to-rose-50",
          technologies: [
            { label: "Metasploit", iconSrc: "/AI4.webp" },
            { label: "Burp Suite", iconSrc: "/AI5.webp" },
            { label: "SQLmap", iconSrc: "/BE5.webp" },
            { label: "Hashcat", iconSrc: "/AI1.webp" },
            { label: "Hydra", iconSrc: "/CP1.webp" },
            { label: "Aircrack-ng", iconSrc: "/DevOps5.webp" }
          ]
        },
        {
          category: "Scripting & Automation",
          icon: "Code",
          borderColor: "border-purple-200",
          bgColor: "bg-gradient-to-r from-purple-50 to-violet-50",
          technologies: [
            { label: "Python", iconSrc: "/DAT1.webp" },
            { label: "Bash", iconSrc: "/DevOps3.webp" },
            { label: "PowerShell", iconSrc: "/CP3.webp" },
            { label: "Git", iconSrc: "/DAT3.webp" },
            { label: "Regex", iconSrc: "/BE6.webp" },
            { label: "Ruby", iconSrc: "/BE4.webp" }
          ]
        }
      ],
      careerOutcomes: [
        {
          title: "Penetration Tester",
          salary: "$85k-$135k",
          icon: "Target",
          gradient: "from-blue-500 to-cyan-500",
          bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
          borderColor: "border-blue-200",
          description: "Conduct authorized attacks on computer systems and networks to identify security vulnerabilities."
        },
        {
          title: "Red Team Operator",
          salary: "$110k-$160k",
          icon: "Shield",
          gradient: "from-red-500 to-rose-500",
          bgColor: "bg-gradient-to-br from-red-50 to-rose-50",
          borderColor: "border-red-200",
          description: "Simulate advanced persistent threats (APTs) to test an organization's detection and response capabilities."
        },
        {
          title: "Vulnerability Analyst",
          salary: "$80k-$120k",
          icon: "Search",
          gradient: "from-purple-500 to-pink-500",
          bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
          borderColor: "border-purple-200",
          description: "Continuously scan, identify, and manage vulnerabilities across enterprise IT infrastructure."
        }
      ],
      capstoneData: {
        title: "Capstone Development",
        icon: "FileText",
        bgColor: "bg-white",
        borderColor: "border-gray-200",
        projects: ["Full-Scope Network Pentest", "Web Application Security Audit", "Comprehensive Vulnerability Report"],
        outcome: "Professional portfolio of penetration testing reports demonstrating ability to identify and exploit vulnerabilities"
      },
      interviewPrep: {
        title: "Interview Preparation",
        icon: "Users",
        bgColor: "bg-white",
        borderColor: "border-gray-200",
        technical: ["Exploitation Techniques", "Networking Protocols", "Web Vulnerabilities", "Reporting Methods"],
        career: ["Resume + LinkedIn", "Mock Interviews", "Salary Negotiation"],
        outcome: "Crack offensive security interviews at top consulting firms, tech companies, and MSSPs"
      }
    },
    icon: FaBolt
  };