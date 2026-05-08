'use client';

import React, { useState } from 'react';
import { useBrand, BrandProvider } from '@/share-branding/PostLandingPage/app/context/BrandContext';
import { skillUpConfig } from '@/share-branding/brandConfig';

type SectionType = 'master' | 'notes' | 'layman' | 'reallife' | 'technical' | 'code' | 'assignment' | 'project' | 'quiz' | 'visual' | 'practice';

function PromptGeneratorContent() {
  const brand = useBrand();
  const [domain, setDomain] = useState('Programming');
  const [subject, setSubject] = useState('JavaScript');
  const [topic, setTopic] = useState('Asynchronous Programming');
  const [subtopic, setSubtopic] = useState('JavaScript Promises');
  const [selectedSection, setSelectedSection] = useState<SectionType | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  const sections: { id: SectionType; label: string }[] = [
    { id: 'master', label: 'Master Prompt' },
    { id: 'notes', label: '1. Notes' },
    { id: 'layman', label: '2. Layman' },
    { id: 'reallife', label: '3. Real Life' },
    { id: 'technical', label: '4. Technical' },
    { id: 'code', label: '5. Code Example' },
    { id: 'assignment', label: '6. Assignment' },
    { id: 'project', label: '7. Project' },
    { id: 'quiz', label: '8. Quiz' },
    { id: 'visual', label: '9. Visual' },
    { id: 'practice', label: '10. Practice Test' },
  ];

  const generatePrompt = () => {
    if (!domain.trim() || !subject.trim() || !topic.trim() || !subtopic.trim()) {
      alert('Please fill in all fields: Domain, Subject, Topic, and Subtopic');
      return;
    }
    if (!selectedSection) {
      alert('Please select a section');
      return;
    }

    const prompt = getPromptForSection(selectedSection, domain, subject, topic, subtopic);
    setGeneratedPrompt(prompt);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getPromptForSection = (section: SectionType, domainName: string, subjectName: string, topicName: string, subtopicName: string): string => {
    const prompts: Record<SectionType, string> = {
      master: getMasterPrompt(domainName, subjectName, topicName, subtopicName),
      notes: getNotesPrompt(domainName, subjectName, topicName, subtopicName),
      layman: getLaymanPrompt(domainName, subjectName, topicName, subtopicName),
      reallife: getRealLifePrompt(domainName, subjectName, topicName, subtopicName),
      technical: getTechnicalPrompt(domainName, subjectName, topicName, subtopicName),
      code: getCodePrompt(domainName, subjectName, topicName, subtopicName),
      assignment: getAssignmentPrompt(domainName, subjectName, topicName, subtopicName),
      project: getProjectPrompt(domainName, subjectName, topicName, subtopicName),
      quiz: getQuizPrompt(domainName, subjectName, topicName, subtopicName),
      visual: getVisualPrompt(domainName, subjectName, topicName, subtopicName),
      practice: getPracticePrompt(domainName, subjectName, topicName, subtopicName),
    };

    return prompts[section];
  };


  // Master Prompt
  const getMasterPrompt = (domainName: string, subjectName: string, topicName: string, subtopicName: string) => `I need you to generate educational content for a subtopic in a structured format.

**Educational Hierarchy:**
- Domain: ${domainName}
- Subject: ${subjectName}
- Topic: ${topicName}
- Subtopic: ${subtopicName}

Generate detailed content specifically for the subtopic: "${subtopicName}"

**TARGET AUDIENCE**: Beginners to intermediate learners
**TONE**: Clear, friendly, educational, practical

**IMPORTANT RULES**:
1. Output MUST be in valid JSON format
2. Use double quotes for all strings
3. Escape special characters properly
4. Keep explanations clear and concise
5. Use real-world examples
6. Avoid jargon unless explained
7. Include practical applications

I will ask you to generate content for different sections one by one. Each section has 8 templates. Please follow the exact structure I provide.

Are you ready? Reply "Ready" and I'll give you the first section.`;


  // Notes Section Prompt
  const getNotesPrompt = (domainName: string, subjectName: string, topicName: string, subtopicName: string) => `Generate content for the NOTES SECTION

**Educational Hierarchy:**
- Domain: ${domainName}
- Subject: ${subjectName}
- Topic: ${topicName}
- Subtopic: ${subtopicName}

Generate detailed content specifically for the subtopic: "${subtopicName}"

This section has 8 templates. Output in this EXACT JSON format:

{
  "notes": {
    "coreDefinition": {
      "badge": "Core Concept",
      "headline": "[What is ${subtopicName}?]",
      "definition": "[Technical definition in 1-2 sentences]",
      "simpleExplanation": "[Explain in simple terms, 2-3 sentences]",
      "whyItMatters": "[Why is this important? 2-3 sentences]",
      "keyTakeaway": "[One sentence summary]"
    },
    "conceptExplanation": {
      "title": "Understanding ${subtopicName}",
      "introduction": "[2-3 sentences introducing the concept]",
      "mainConcept": "[Detailed explanation, 4-5 sentences]",
      "detailedBreakdown": "[Break down the concept into parts, 4-5 sentences]",
      "visualAnalogy": "[A simple analogy to understand this, 2-3 sentences]"
    },
    "keyComponents": {
      "title": "Key Components of ${subtopicName}",
      "components": [
        {
          "id": "comp1",
          "name": "[Component 1 name]",
          "description": "[What it does, 2 sentences]",
          "purpose": "[Why it's needed, 1 sentence]",
          "icon": "Box"
        },
        {
          "id": "comp2",
          "name": "[Component 2 name]",
          "description": "[What it does, 2 sentences]",
          "purpose": "[Why it's needed, 1 sentence]",
          "icon": "Layers"
        },
        {
          "id": "comp3",
          "name": "[Component 3 name]",
          "description": "[What it does, 2 sentences]",
          "purpose": "[Why it's needed, 1 sentence]",
          "icon": "Zap"
        }
      ]
    },
    "syntaxStructure": {
      "title": "Syntax and Structure",
      "syntaxTitle": "Basic Syntax",
      "code": "[Actual code example with \\\\n for newlines]",
      "language": "javascript",
      "explanation": "[Explain the syntax, 3-4 sentences]",
      "breakdown": [
        {
          "line": "[Code line 1]",
          "explanation": "[What this line does]"
        },
        {
          "line": "[Code line 2]",
          "explanation": "[What this line does]"
        },
        {
          "line": "[Code line 3]",
          "explanation": "[What this line does]"
        }
      ]
    },
    "examples": {
      "title": "Practical Examples",
      "exampleCards": [
        {
          "id": "ex1",
          "title": "[Example 1 title]",
          "scenario": "[Real-world scenario, 2 sentences]",
          "code": "[Code example with \\\\n for newlines]",
          "explanation": "[How it works, 2-3 sentences]"
        },
        {
          "id": "ex2",
          "title": "[Example 2 title]",
          "scenario": "[Real-world scenario, 2 sentences]",
          "code": "[Code example with \\\\n for newlines]",
          "explanation": "[How it works, 2-3 sentences]"
        }
      ]
    },
    "bestPractices": {
      "title": "Best Practices",
      "practices": [
        {
          "id": "bp1",
          "title": "[Practice 1 title]",
          "description": "[Why this is important, 2 sentences]",
          "doExample": "[Good example, 1 sentence]",
          "dontExample": "[Bad example to avoid, 1 sentence]"
        },
        {
          "id": "bp2",
          "title": "[Practice 2 title]",
          "description": "[Why this is important, 2 sentences]",
          "doExample": "[Good example, 1 sentence]",
          "dontExample": "[Bad example to avoid, 1 sentence]"
        },
        {
          "id": "bp3",
          "title": "[Practice 3 title]",
          "description": "[Why this is important, 2 sentences]",
          "doExample": "[Good example, 1 sentence]",
          "dontExample": "[Bad example to avoid, 1 sentence]"
        }
      ]
    },
    "commonErrors": {
      "title": "Common Mistakes and FAQs",
      "errors": [
        {
          "id": "err1",
          "error": "[Common mistake 1]",
          "why": "[Why this happens]",
          "fix": "[How to fix it]"
        },
        {
          "id": "err2",
          "error": "[Common mistake 2]",
          "why": "[Why this happens]",
          "fix": "[How to fix it]"
        },
        {
          "id": "err3",
          "error": "[Common mistake 3]",
          "why": "[Why this happens]",
          "fix": "[How to fix it]"
        }
      ],
      "faqItems": [
        {
          "id": "faq1",
          "question": "[Common question 1]",
          "answer": "[Clear answer, 2-3 sentences]"
        },
        {
          "id": "faq2",
          "question": "[Common question 2]",
          "answer": "[Clear answer, 2-3 sentences]"
        },
        {
          "id": "faq3",
          "question": "[Common question 3]",
          "answer": "[Clear answer, 2-3 sentences]"
        }
      ]
    },
    "revisionSummary": {
      "title": "Quick Revision Summary",
      "keyPoints": [
        "[Key point 1]",
        "[Key point 2]",
        "[Key point 3]",
        "[Key point 4]",
        "[Key point 5]"
      ],
      "quickRecap": [
        "[Recap point 1]",
        "[Recap point 2]",
        "[Recap point 3]"
      ],
      "examTips": [
        "[Exam tip 1]",
        "[Exam tip 2]"
      ],
      "rememberThis": "[One memorable sentence to remember this concept]"
    }
  }
}

**IMPORTANT**: 
- Replace ALL [...] placeholders with actual content
- Use \\\\n for newlines in code
- Use \\\\" for quotes in code
- Icon names: Box, Layers, Zap, Code2, CheckCircle, AlertCircle, Lightbulb, Rocket`;


  // Layman Explanation Section Prompt
  const getLaymanPrompt = (domainName: string, subjectName: string, topicName: string, subtopicName: string) => `Generate content for the LAYMAN EXPLANATION SECTION

**Educational Hierarchy:**
- Domain: ${domainName}
- Subject: ${subjectName}
- Topic: ${topicName}
- Subtopic: ${subtopicName}

Generate detailed content specifically for the subtopic: "${subtopicName}"

This section explains the concept to absolute beginners using simple language and analogies.

Output in this EXACT JSON format:

{
  "laymanExplanation": {
    "simpleOverview": {
      "badge": "Beginner Friendly",
      "headline": "${subtopicName} Explained Simply",
      "simpleDefinition": "[Explain in the simplest possible terms, like explaining to a 10-year-old, 2 sentences]",
      "subExplanation": "[Expand a bit more, still very simple, 2-3 sentences]",
      "importanceBlock": "[Why should a beginner care? 2 sentences]",
      "progressIndicator": "Perfect for beginners - no prior knowledge needed"
    },
    "everydayAnalogy": {
      "title": "Think of It Like This",
      "storyAnalogy": "[Tell a story using everyday objects/situations that everyone knows, 3-4 sentences]",
      "comparisonPanel": {
        "realWorld": "[Real-world example everyone can relate to, 2 sentences]",
        "technical": "[How the technical concept maps to that real-world example, 2 sentences]"
      },
      "visualMetaphor": "[A memorable metaphor or comparison, 1 sentence]",
      "keyTakeaway": "[The main insight from this analogy, 1 sentence]"
    },
    "whyItExists": {
      "sectionTitle": "Why Does This Exist?",
      "benefitCards": [
        {
          "id": "benefit1",
          "title": "[Career benefit title]",
          "description": "[How this helps in career/work, 2 sentences]",
          "icon": "Briefcase",
          "type": "career"
        },
        {
          "id": "benefit2",
          "title": "[Practical benefit title]",
          "description": "[Practical everyday benefit, 2 sentences]",
          "icon": "Zap",
          "type": "practical"
        },
        {
          "id": "benefit3",
          "title": "[Future benefit title]",
          "description": "[Future learning benefit, 2 sentences]",
          "icon": "TrendingUp",
          "type": "future"
        }
      ]
    },
    "simpleUseCases": {
      "gridTitle": "Where You'll See This",
      "useCaseCards": [
        {
          "id": "use1",
          "title": "[Use case 1 title]",
          "description": "[Simple example, 1-2 sentences]",
          "example": "[Specific example like 'Netflix uses this for...']",
          "icon": "Monitor"
        },
        {
          "id": "use2",
          "title": "[Use case 2 title]",
          "description": "[Simple example, 1-2 sentences]",
          "example": "[Specific example]",
          "icon": "Smartphone"
        },
        {
          "id": "use3",
          "title": "[Use case 3 title]",
          "description": "[Simple example, 1-2 sentences]",
          "example": "[Specific example]",
          "icon": "Globe"
        },
        {
          "id": "use4",
          "title": "[Use case 4 title]",
          "description": "[Simple example, 1-2 sentences]",
          "example": "[Specific example]",
          "icon": "ShoppingCart"
        }
      ]
    },
    "beginnerBreakdown": {
      "title": "Step-by-Step Breakdown",
      "steps": [
        {
          "id": "step1",
          "stepTitle": "Step 1: [Title]",
          "stepExplanation": "[Explain this step in simple terms, 2 sentences]",
          "microLearningChunk": "[One key thing to remember from this step]"
        },
        {
          "id": "step2",
          "stepTitle": "Step 2: [Title]",
          "stepExplanation": "[Explain this step in simple terms, 2 sentences]",
          "microLearningChunk": "[One key thing to remember from this step]"
        },
        {
          "id": "step3",
          "stepTitle": "Step 3: [Title]",
          "stepExplanation": "[Explain this step in simple terms, 2 sentences]",
          "microLearningChunk": "[One key thing to remember from this step]"
        },
        {
          "id": "step4",
          "stepTitle": "Step 4: [Title]",
          "stepExplanation": "[Explain this step in simple terms, 2 sentences]",
          "microLearningChunk": "[One key thing to remember from this step]"
        }
      ]
    },
    "mentalModel": {
      "title": "Mental Model",
      "conceptMap": "[Describe a simple visual mental model, like 'Think of it as a tree with branches' - 2-3 sentences]",
      "visualLabels": [
        {
          "id": "label1",
          "label": "[Part 1]",
          "description": "[What this part does]"
        },
        {
          "id": "label2",
          "label": "[Part 2]",
          "description": "[What this part does]"
        },
        {
          "id": "label3",
          "label": "[Part 3]",
          "description": "[What this part does]"
        }
      ]
    },
    "commonConfusions": {
      "title": "Common Beginner Confusions",
      "confusionItems": [
        {
          "id": "conf1",
          "confusion": "[What beginners often get confused about]",
          "clarification": "[Clear explanation to remove confusion, 2 sentences]"
        },
        {
          "id": "conf2",
          "confusion": "[What beginners often get confused about]",
          "clarification": "[Clear explanation to remove confusion, 2 sentences]"
        },
        {
          "id": "conf3",
          "confusion": "[What beginners often get confused about]",
          "clarification": "[Clear explanation to remove confusion, 2 sentences]"
        }
      ],
      "faqItems": [
        {
          "id": "faq1",
          "question": "[Simple beginner question]",
          "answer": "[Simple answer, 2 sentences]"
        },
        {
          "id": "faq2",
          "question": "[Simple beginner question]",
          "answer": "[Simple answer, 2 sentences]"
        },
        {
          "id": "faq3",
          "question": "[Simple beginner question]",
          "answer": "[Simple answer, 2 sentences]"
        }
      ],
      "misconceptionAlerts": [
        "[Common misconception 1]",
        "[Common misconception 2]",
        "[Common misconception 3]"
      ]
    },
    "simpleRecap": {
      "summaryTitle": "Let's Recap What You Learned",
      "keyTakeaways": [
        "[Simple takeaway 1]",
        "[Simple takeaway 2]",
        "[Simple takeaway 3]",
        "[Simple takeaway 4]",
        "[Simple takeaway 5]",
        "[Simple takeaway 6]"
      ],
      "simpleRecapPoints": [
        "[What you now understand, point 1]",
        "[What you now understand, point 2]",
        "[What you now understand, point 3]",
        "[What you now understand, point 4]"
      ],
      "confidenceBoost": "[Encouraging message to boost confidence, 1-2 sentences with emoji]",
      "memoryReinforcement": "[One memorable sentence to remember this concept forever]"
    }
  }
}

**IMPORTANT**: 
- Use VERY simple language - no jargon
- Use everyday analogies (LEGO, kitchen, traffic, etc.)
- Make it relatable and encouraging
- Icon names: Briefcase, Zap, TrendingUp, Monitor, Smartphone, Globe, ShoppingCart, Heart, Lightbulb`;


  // Real Life Examples Section Prompt
  const getRealLifePrompt = (domainName: string, subjectName: string, topicName: string, subtopicName: string) => `Generate content for the REAL LIFE EXAMPLES SECTION

**Educational Hierarchy:**
- Domain: ${domainName}
- Subject: ${subjectName}
- Topic: ${topicName}
- Subtopic: ${subtopicName}

Generate detailed content specifically for the subtopic: "${subtopicName}"

This section shows how this concept is used in real companies and industries.

Output in this EXACT JSON format:

{
  "realLifeExamples": {
    "conceptMapping": {
      "badge": "Real World Connection",
      "headline": "How ${subtopicName} Works in Real Life",
      "conceptDefinition": "[Technical definition, 2 sentences]",
      "realWorldTranslation": "[Translate to real-world terms, 2-3 sentences]",
      "importanceBlock": "[Why this matters in industry, 2 sentences]",
      "careerRelevance": "[How this helps your career, 1-2 sentences]"
    },
    "industryUseCase": {
      "title": "Industry Use Case",
      "industryName": "[Industry name like E-Commerce, Healthcare, Finance]",
      "scenarioDescription": "[Describe the real-world scenario, 2-3 sentences]",
      "businessContext": "[Business problem or need, 2 sentences]",
      "implementation": "[How ${subtopicName} is used to solve it, 3-4 sentences]",
      "impact": "[Business impact and results, 2 sentences]",
      "keyTakeaway": "[Main lesson from this use case, 1 sentence]"
    },
    "dailyLifeExample": {
      "title": "Daily Life Example",
      "storyTitle": "[Catchy title for the story]",
      "storyNarrative": "[Tell a relatable story using everyday situations, 4-5 sentences]",
      "everydayConnection": "[How people encounter this daily, 2 sentences]",
      "technicalMapping": "[Map the story back to technical concept, 2-3 sentences]",
      "relatableInsight": "[Memorable insight, 1 sentence]"
    },
    "careerRelevance": {
      "title": "Career Paths Using ${subtopicName}",
      "careerPaths": [
        {
          "id": "career1",
          "role": "[Job title like Frontend Developer]",
          "description": "[What they do with this skill, 2 sentences]",
          "skillLevel": "entry",
          "salaryRange": "[$XX,000 - $XX,000]",
          "icon": "Code"
        },
        {
          "id": "career2",
          "role": "[Job title like Full Stack Engineer]",
          "description": "[What they do with this skill, 2 sentences]",
          "skillLevel": "mid",
          "salaryRange": "[$XX,000 - $XX,000]",
          "icon": "Layers"
        },
        {
          "id": "career3",
          "role": "[Job title like Solutions Architect]",
          "description": "[What they do with this skill, 2 sentences]",
          "skillLevel": "mid",
          "salaryRange": "[$XX,000 - $XX,000]",
          "icon": "Briefcase"
        },
        {
          "id": "career4",
          "role": "[Job title like Tech Lead]",
          "description": "[What they do with this skill, 2 sentences]",
          "skillLevel": "senior",
          "salaryRange": "[$XX,000 - $XX,000]",
          "icon": "Award"
        }
      ],
      "industryDemand": "[Current job market demand, 2 sentences with statistics]",
      "futureGrowth": "[Future outlook, 2 sentences]"
    },
    "problemSolutionContext": {
      "title": "Real Problem, Real Solution",
      "problemStatement": "[Describe a real business problem, 2-3 sentences]",
      "context": "[Background and why it's challenging, 2 sentences]",
      "solution": "[How ${subtopicName} solves it, 3-4 sentences]",
      "implementation": "[Technical implementation details, 2-3 sentences]",
      "outcome": "[Results and benefits, 2 sentences]",
      "lessonsLearned": "[Key lessons, 1-2 sentences]"
    },
    "businessApplication": {
      "title": "Business Application",
      "companyType": "[Type of company like E-commerce Platform, SaaS Company]",
      "businessChallenge": "[Business challenge they faced, 2-3 sentences]",
      "technicalApplication": "[How ${subtopicName} was applied, 3-4 sentences]",
      "businessProcess": "[How it fits in business workflow, 2-3 sentences]",
      "roi": "[Return on investment and metrics, 2 sentences]",
      "scalability": "[How it scales with business growth, 2 sentences]",
      "keyInsight": "[Main business insight, 1 sentence]"
    },
    "domainScenarios": {
      "title": "Where You'll Use This",
      "scenarios": [
        {
          "id": "scenario1",
          "domain": "E-Commerce",
          "title": "[Scenario title]",
          "description": "[How it's used in e-commerce, 2 sentences]",
          "application": "[Specific application example, 1-2 sentences]",
          "icon": "ShoppingCart"
        },
        {
          "id": "scenario2",
          "domain": "Healthcare",
          "title": "[Scenario title]",
          "description": "[How it's used in healthcare, 2 sentences]",
          "application": "[Specific application example, 1-2 sentences]",
          "icon": "Heart"
        },
        {
          "id": "scenario3",
          "domain": "Finance",
          "title": "[Scenario title]",
          "description": "[How it's used in finance, 2 sentences]",
          "application": "[Specific application example, 1-2 sentences]",
          "icon": "DollarSign"
        },
        {
          "id": "scenario4",
          "domain": "Education",
          "title": "[Scenario title]",
          "description": "[How it's used in education, 2 sentences]",
          "application": "[Specific application example, 1-2 sentences]",
          "icon": "BookOpen"
        },
        {
          "id": "scenario5",
          "domain": "Entertainment",
          "title": "[Scenario title]",
          "description": "[How it's used in entertainment, 2 sentences]",
          "application": "[Specific application example, 1-2 sentences]",
          "icon": "Film"
        },
        {
          "id": "scenario6",
          "domain": "Social Media",
          "title": "[Scenario title]",
          "description": "[How it's used in social media, 2 sentences]",
          "application": "[Specific application example, 1-2 sentences]",
          "icon": "Share2"
        }
      ]
    },
    "practicalRecap": {
      "summaryTitle": "Real-World Impact Summary",
      "keyApplications": [
        "[Key application 1]",
        "[Key application 2]",
        "[Key application 3]",
        "[Key application 4]"
      ],
      "industryRelevance": [
        "[Industry relevance point 1]",
        "[Industry relevance point 2]",
        "[Industry relevance point 3]"
      ],
      "careerImpact": "[How learning this impacts your career, 2 sentences]",
      "nextSteps": [
        "[Next step 1]",
        "[Next step 2]",
        "[Next step 3]"
      ],
      "practicalAdvice": "[Practical advice for applying this knowledge, 2 sentences]"
    }
  }
}

**IMPORTANT**: 
- Use real company names (Amazon, Netflix, Google, Uber, Airbnb, etc.)
- Include actual salary ranges and statistics
- Make scenarios specific and relatable
- Icon names: Code, Layers, Briefcase, Award, ShoppingCart, Heart, DollarSign, BookOpen, Film, Share2`;


  // Technical Deep Dive Section Prompt
  const getTechnicalPrompt = (domainName: string, subjectName: string, topicName: string, subtopicName: string) => `Generate content for the TECHNICAL DEEP DIVE SECTION

**Educational Hierarchy:**
- Domain: ${domainName}
- Subject: ${subjectName}
- Topic: ${topicName}
- Subtopic: ${subtopicName}

Generate detailed content specifically for the subtopic: "${subtopicName}"

This section is for intermediate to advanced learners who want to understand the internal mechanics.

Output in this EXACT JSON format:

{
  "technicalDeepDive": {
    "title": "Technical Deep Dive: ${subtopicName}",
    "badge": "Advanced",
    "intro": "[2-3 sentences introducing the technical aspects of ${subtopicName}]",
    "sections": [
      {
        "id": "section1",
        "title": "Architecture Overview",
        "content": "[Detailed explanation of the architecture, system design, and how components interact. 4-5 sentences covering high-level structure, data flow, and key architectural decisions.]",
        "keyPoints": [
          "[Key architectural point 1]",
          "[Key architectural point 2]",
          "[Key architectural point 3]"
        ]
      },
      {
        "id": "section2",
        "title": "Internal Mechanics",
        "content": "[Deep dive into how it works internally. Explain algorithms, state management, memory model, and execution flow. 5-6 sentences.]",
        "steps": [
          { "id": "step1", "text": "Step 1: [What happens first]" },
          { "id": "step2", "text": "Step 2: [What happens next]" },
          { "id": "step3", "text": "Step 3: [Final step]" }
        ],
        "code": {
          "language": "javascript",
          "code": "[Code example showing internal mechanics with \\\\n for newlines]",
          "output": "[Expected output or behavior]"
        }
      },
      {
        "id": "section3",
        "title": "Performance Optimization",
        "content": "[Explain performance considerations, optimization strategies, benchmarks, and profiling techniques. 4-5 sentences.]",
        "keyPoints": [
          "[Optimization technique 1 with impact]",
          "[Optimization technique 2 with impact]",
          "[Benchmarking and profiling approach]"
        ],
        "code": {
          "language": "javascript",
          "code": "[Code example showing optimization with \\\\n for newlines]",
          "output": "[Performance improvement result]"
        }
      },
      {
        "id": "section4",
        "title": "Advanced Concepts",
        "content": "[Explain advanced concepts, patterns, and techniques. Cover when and why to use them. 4-5 sentences.]",
        "keyPoints": [
          "[Advanced concept 1 with use case]",
          "[Advanced concept 2 with use case]",
          "[Advanced concept 3 with use case]"
        ],
        "code": {
          "language": "javascript",
          "code": "[Code example showing advanced usage with \\\\n for newlines]"
        }
      },
      {
        "id": "section5",
        "title": "Edge Cases and Gotchas",
        "content": "[Explain common edge cases, gotchas, and how to handle them. 4-5 sentences.]",
        "keyPoints": [
          "[Edge case 1: problem and solution]",
          "[Edge case 2: problem and solution]",
          "[Edge case 3: problem and solution]"
        ],
        "highlight": "[Important warning or note about common mistakes]"
      },
      {
        "id": "section6",
        "title": "Design Patterns",
        "content": "[Explain relevant design patterns and best practices. Cover when to use each pattern. 4-5 sentences.]",
        "keyPoints": [
          "[Pattern 1: description and when to use]",
          "[Pattern 2: description and when to use]",
          "[Pattern 3: description and when to use]"
        ],
        "code": {
          "language": "javascript",
          "code": "[Code example showing design pattern with \\\\n for newlines]"
        }
      },
      {
        "id": "section7",
        "title": "Security Considerations",
        "content": "[Explain security risks, vulnerabilities, and mitigation strategies. 4-5 sentences.]",
        "keyPoints": [
          "[Security issue 1 and how to prevent it]",
          "[Security issue 2 and how to prevent it]",
          "[Security best practice]"
        ],
        "highlight": "[Critical security warning]",
        "code": {
          "language": "javascript",
          "code": "[Secure code example with \\\\n for newlines]"
        }
      },
      {
        "id": "section8",
        "title": "Technical Summary",
        "content": "[Comprehensive summary of all technical concepts covered. 3-4 sentences.]",
        "keyPoints": [
          "[Key technical takeaway 1]",
          "[Key technical takeaway 2]",
          "[Key technical takeaway 3]",
          "[Key technical takeaway 4]",
          "[Architectural insight]",
          "[Performance tip]"
        ]
      }
    ]
  }
}

**IMPORTANT**: 
- Use technical terminology appropriately
- Include actual code examples with proper escaping (use \\\\n for newlines, \\\\" for quotes)
- Focus on implementation details
- Explain the "why" behind design decisions
- Each section should be self-contained but build on previous sections`;


  // Code Example Section Prompt
  const getCodePrompt = (domainName: string, subjectName: string, topicName: string, subtopicName: string) => `Generate content for the CODE EXAMPLE SECTION

**Educational Hierarchy:**
- Domain: ${domainName}
- Subject: ${subjectName}
- Topic: ${topicName}
- Subtopic: ${subtopicName}

Generate detailed content specifically for the subtopic: "${subtopicName}"

This section provides hands-on code examples with detailed explanations.

Output in this EXACT JSON format:

{
  "codeExample": {
    "problemContext": {
      "title": "The Problem We're Solving",
      "scenario": "[Real-world scenario, 2-3 sentences]",
      "requirements": [
        "[Requirement 1]",
        "[Requirement 2]",
        "[Requirement 3]"
      ],
      "constraints": "[Any constraints or considerations, 1-2 sentences]"
    },
    "basicCodeExample": {
      "title": "Basic Implementation",
      "description": "[What this code does, 2 sentences]",
      "code": "[Complete working code with \\\\n for newlines and \\\\" for quotes]",
      "language": "javascript",
      "explanation": "[Overall explanation, 3-4 sentences]"
    },
    "lineByLineExplanation": {
      "title": "Line-by-Line Breakdown",
      "lines": [
        {
          "id": "line1",
          "lineNumber": 1,
          "code": "[Code line 1]",
          "explanation": "[What this line does and why, 2 sentences]"
        },
        {
          "id": "line2",
          "lineNumber": 2,
          "code": "[Code line 2]",
          "explanation": "[What this line does and why, 2 sentences]"
        },
        {
          "id": "line3",
          "lineNumber": 3,
          "code": "[Code line 3]",
          "explanation": "[What this line does and why, 2 sentences]"
        },
        {
          "id": "line4",
          "lineNumber": 4,
          "code": "[Code line 4]",
          "explanation": "[What this line does and why, 2 sentences]"
        },
        {
          "id": "line5",
          "lineNumber": 5,
          "code": "[Code line 5]",
          "explanation": "[What this line does and why, 2 sentences]"
        }
      ]
    },
    "outputDemonstration": {
      "title": "Output and Results",
      "input": "[Sample input data]",
      "output": "[Expected output]",
      "explanation": "[Explain the output, 2-3 sentences]",
      "visualRepresentation": "[Describe what happens visually, 2 sentences]"
    },
    "bestPracticeVersion": {
      "title": "Best Practice Implementation",
      "improvements": [
        "[Improvement 1]",
        "[Improvement 2]",
        "[Improvement 3]"
      ],
      "code": "[Improved code with \\\\n for newlines and \\\\" for quotes]",
      "explanation": "[Why this version is better, 3-4 sentences]",
      "benefits": [
        "[Benefit 1]",
        "[Benefit 2]",
        "[Benefit 3]"
      ]
    },
    "commonMistakes": {
      "title": "Common Mistakes to Avoid",
      "mistakes": [
        {
          "id": "mistake1",
          "mistake": "[Common mistake 1]",
          "badCode": "[Bad code example with \\\\n for newlines]",
          "why": "[Why this is wrong, 2 sentences]",
          "goodCode": "[Correct code with \\\\n for newlines]",
          "lesson": "[Key lesson, 1 sentence]"
        },
        {
          "id": "mistake2",
          "mistake": "[Common mistake 2]",
          "badCode": "[Bad code example with \\\\n for newlines]",
          "why": "[Why this is wrong, 2 sentences]",
          "goodCode": "[Correct code with \\\\n for newlines]",
          "lesson": "[Key lesson, 1 sentence]"
        },
        {
          "id": "mistake3",
          "mistake": "[Common mistake 3]",
          "badCode": "[Bad code example with \\\\n for newlines]",
          "why": "[Why this is wrong, 2 sentences]",
          "goodCode": "[Correct code with \\\\n for newlines]",
          "lesson": "[Key lesson, 1 sentence]"
        }
      ]
    },
    "realWorldImplementation": {
      "title": "Real-World Implementation",
      "scenario": "[Production-ready scenario, 2-3 sentences]",
      "code": "[Production-quality code with \\\\n for newlines and \\\\" for quotes]",
      "features": [
        "[Feature 1]",
        "[Feature 2]",
        "[Feature 3]"
      ],
      "explanation": "[How this works in production, 3-4 sentences]",
      "scalability": "[How it scales, 2 sentences]"
    },
    "codeSummary": {
      "title": "Code Summary",
      "keyTakeaways": [
        "[Takeaway 1]",
        "[Takeaway 2]",
        "[Takeaway 3]",
        "[Takeaway 4]"
      ],
      "practiceExercise": "[Suggested practice exercise, 2 sentences]",
      "nextSteps": [
        "[Next step 1]",
        "[Next step 2]",
        "[Next step 3]"
      ]
    }
  }
}

**IMPORTANT**: 
- All code must be valid and runnable
- Use proper JSON escaping: \\\\n for newlines, \\\\" for quotes
- Include complete, working examples
- Explain the "why" not just the "what"`;


  // Assignment Section Prompt
  const getAssignmentPrompt = (domainName: string, subjectName: string, topicName: string, subtopicName: string) => `Generate content for the ASSIGNMENT SECTION

**Educational Hierarchy:**
- Domain: ${domainName}
- Subject: ${subjectName}
- Topic: ${topicName}
- Subtopic: ${subtopicName}

Generate detailed content specifically for the subtopic: "${subtopicName}"

This section provides a hands-on assignment for learners to practice.

Output in this EXACT JSON format:

{
  "assignment": {
    "assignmentOverview": {
      "title": "${subtopicName} - Hands-On Assignment",
      "description": "[What students will build, 2-3 sentences]",
      "difficulty": "beginner",
      "estimatedTime": "30-45 minutes",
      "xpReward": 100,
      "badge": "Assignment"
    },
    "learningObjectives": {
      "title": "What You'll Learn",
      "objectives": [
        "[Learning objective 1]",
        "[Learning objective 2]",
        "[Learning objective 3]",
        "[Learning objective 4]"
      ],
      "skills": [
        "[Skill 1]",
        "[Skill 2]",
        "[Skill 3]"
      ]
    },
    "taskRequirements": {
      "title": "Assignment Requirements",
      "description": "[Overall task description, 2-3 sentences]",
      "requirements": [
        {
          "id": "req1",
          "requirement": "[Requirement 1]",
          "details": "[Details about this requirement, 2 sentences]",
          "priority": "must-have"
        },
        {
          "id": "req2",
          "requirement": "[Requirement 2]",
          "details": "[Details about this requirement, 2 sentences]",
          "priority": "must-have"
        },
        {
          "id": "req3",
          "requirement": "[Requirement 3]",
          "details": "[Details about this requirement, 2 sentences]",
          "priority": "must-have"
        },
        {
          "id": "req4",
          "requirement": "[Requirement 4]",
          "details": "[Details about this requirement, 2 sentences]",
          "priority": "nice-to-have"
        }
      ],
      "constraints": [
        "[Constraint 1]",
        "[Constraint 2]"
      ]
    },
    "starterCode": {
      "title": "Starter Code",
      "description": "[What's provided in starter code, 2 sentences]",
      "code": "[Starter code with TODO comments, use \\\\n for newlines]",
      "language": "javascript",
      "instructions": [
        "[Instruction 1]",
        "[Instruction 2]",
        "[Instruction 3]"
      ]
    },
    "hintsAndTips": {
      "title": "Hints and Tips",
      "hints": [
        {
          "id": "hint1",
          "hint": "[Hint 1]",
          "level": "beginner"
        },
        {
          "id": "hint2",
          "hint": "[Hint 2]",
          "level": "intermediate"
        },
        {
          "id": "hint3",
          "hint": "[Hint 3]",
          "level": "advanced"
        }
      ],
      "commonPitfalls": [
        "[Pitfall 1]",
        "[Pitfall 2]",
        "[Pitfall 3]"
      ],
      "resources": [
        "[Resource 1]",
        "[Resource 2]"
      ]
    },
    "testCases": {
      "title": "Test Your Solution",
      "description": "[How to test, 1-2 sentences]",
      "testCases": [
        {
          "id": "test1",
          "input": "[Test input 1]",
          "expectedOutput": "[Expected output 1]",
          "description": "[What this tests]"
        },
        {
          "id": "test2",
          "input": "[Test input 2]",
          "expectedOutput": "[Expected output 2]",
          "description": "[What this tests]"
        },
        {
          "id": "test3",
          "input": "[Test input 3]",
          "expectedOutput": "[Expected output 3]",
          "description": "[What this tests]"
        }
      ]
    },
    "solutionApproach": {
      "title": "Solution Approach",
      "steps": [
        {
          "id": "step1",
          "step": "Step 1: [Title]",
          "description": "[What to do, 2 sentences]",
          "tip": "[Helpful tip]"
        },
        {
          "id": "step2",
          "step": "Step 2: [Title]",
          "description": "[What to do, 2 sentences]",
          "tip": "[Helpful tip]"
        },
        {
          "id": "step3",
          "step": "Step 3: [Title]",
          "description": "[What to do, 2 sentences]",
          "tip": "[Helpful tip]"
        },
        {
          "id": "step4",
          "step": "Step 4: [Title]",
          "description": "[What to do, 2 sentences]",
          "tip": "[Helpful tip]"
        }
      ],
      "sampleSolution": "[Complete solution code with \\\\n for newlines]",
      "explanation": "[Explain the solution, 3-4 sentences]"
    },
    "submissionFeedback": {
      "title": "Submission Guidelines",
      "guidelines": [
        "[Guideline 1]",
        "[Guideline 2]",
        "[Guideline 3]"
      ],
      "rubric": [
        {
          "id": "rub1",
          "criteria": "[Criteria 1]",
          "points": 25
        },
        {
          "id": "rub2",
          "criteria": "[Criteria 2]",
          "points": 25
        },
        {
          "id": "rub3",
          "criteria": "[Criteria 3]",
          "points": 25
        },
        {
          "id": "rub4",
          "criteria": "[Criteria 4]",
          "points": 25
        }
      ],
      "nextSteps": "[What to do after completing, 2 sentences]"
    }
  }
}

**IMPORTANT**: 
- Make it practical and achievable
- Provide clear requirements
- Include starter code with TODOs
- Difficulty levels: beginner, intermediate, advanced`;


  // Project Section Prompt
  const getProjectPrompt = (domainName: string, subjectName: string, topicName: string, subtopicName: string) => `Generate content for the PROJECT SECTION

**Educational Hierarchy:**
- Domain: ${domainName}
- Subject: ${subjectName}
- Topic: ${topicName}
- Subtopic: ${subtopicName}

Generate detailed content specifically for the subtopic: "${subtopicName}"

This section provides a larger, more comprehensive project to build.

Output in this EXACT JSON format:

{
  "project": {
    "projectOverview": {
      "title": "Build a [Project Name] using ${subtopicName}",
      "description": "[What students will build, 3-4 sentences]",
      "difficulty": "intermediate",
      "estimatedTime": "3-5 hours",
      "xpReward": 500,
      "badge": "Project Complete"
    },
    "projectGoals": {
      "title": "Project Goals",
      "mainGoal": "[Primary goal, 2 sentences]",
      "learningOutcomes": [
        "[Learning outcome 1]",
        "[Learning outcome 2]",
        "[Learning outcome 3]",
        "[Learning outcome 4]"
      ],
      "realWorldRelevance": "[How this relates to real jobs, 2-3 sentences]"
    },
    "featureRequirements": {
      "title": "Feature Requirements",
      "features": [
        {
          "id": "feat1",
          "feature": "[Feature 1]",
          "description": "[What it does, 2 sentences]",
          "priority": "must-have",
          "complexity": "medium"
        },
        {
          "id": "feat2",
          "feature": "[Feature 2]",
          "description": "[What it does, 2 sentences]",
          "priority": "must-have",
          "complexity": "medium"
        },
        {
          "id": "feat3",
          "feature": "[Feature 3]",
          "description": "[What it does, 2 sentences]",
          "priority": "must-have",
          "complexity": "high"
        },
        {
          "id": "feat4",
          "feature": "[Feature 4]",
          "description": "[What it does, 2 sentences]",
          "priority": "nice-to-have",
          "complexity": "medium"
        },
        {
          "id": "feat5",
          "feature": "[Feature 5]",
          "description": "[What it does, 2 sentences]",
          "priority": "nice-to-have",
          "complexity": "low"
        }
      ]
    },
    "technicalSpecifications": {
      "title": "Technical Specifications",
      "technologies": [
        "[Technology 1]",
        "[Technology 2]",
        "[Technology 3]"
      ],
      "architecture": "[Architecture description, 3-4 sentences]",
      "dataModel": "[Data structure description, 2-3 sentences]",
      "apiEndpoints": [
        "[Endpoint 1]",
        "[Endpoint 2]",
        "[Endpoint 3]"
      ],
      "dependencies": [
        "[Dependency 1]",
        "[Dependency 2]"
      ]
    },
    "implementationGuide": {
      "title": "Implementation Guide",
      "phases": [
        {
          "id": "phase1",
          "phase": "Phase 1: [Title]",
          "description": "[What to build in this phase, 2-3 sentences]",
          "tasks": [
            "[Task 1]",
            "[Task 2]",
            "[Task 3]"
          ],
          "estimatedTime": "1 hour",
          "deliverable": "[What you should have at the end]"
        },
        {
          "id": "phase2",
          "phase": "Phase 2: [Title]",
          "description": "[What to build in this phase, 2-3 sentences]",
          "tasks": [
            "[Task 1]",
            "[Task 2]",
            "[Task 3]"
          ],
          "estimatedTime": "1.5 hours",
          "deliverable": "[What you should have at the end]"
        },
        {
          "id": "phase3",
          "phase": "Phase 3: [Title]",
          "description": "[What to build in this phase, 2-3 sentences]",
          "tasks": [
            "[Task 1]",
            "[Task 2]",
            "[Task 3]"
          ],
          "estimatedTime": "1 hour",
          "deliverable": "[What you should have at the end]"
        },
        {
          "id": "phase4",
          "phase": "Phase 4: [Title]",
          "description": "[What to build in this phase, 2-3 sentences]",
          "tasks": [
            "[Task 1]",
            "[Task 2]",
            "[Task 3]"
          ],
          "estimatedTime": "1.5 hours",
          "deliverable": "[What you should have at the end]"
        }
      ]
    },
    "codeStructure": {
      "title": "Project Structure",
      "fileStructure": "[Describe folder/file structure, 3-4 sentences]",
      "keyFiles": [
        {
          "id": "file1",
          "file": "[File name 1]",
          "purpose": "[What this file does]",
          "keyCode": "[Important code snippet with \\\\n for newlines]"
        },
        {
          "id": "file2",
          "file": "[File name 2]",
          "purpose": "[What this file does]",
          "keyCode": "[Important code snippet with \\\\n for newlines]"
        },
        {
          "id": "file3",
          "file": "[File name 3]",
          "purpose": "[What this file does]",
          "keyCode": "[Important code snippet with \\\\n for newlines]"
        }
      ],
      "designPatterns": [
        "[Pattern 1]",
        "[Pattern 2]"
      ]
    },
    "testingDeployment": {
      "title": "Testing and Deployment",
      "testingStrategy": "[How to test the project, 2-3 sentences]",
      "testCases": [
        "[Test case 1]",
        "[Test case 2]",
        "[Test case 3]"
      ],
      "deploymentSteps": [
        "[Deployment step 1]",
        "[Deployment step 2]",
        "[Deployment step 3]"
      ],
      "deploymentPlatforms": [
        "[Platform 1 like Vercel, Netlify]",
        "[Platform 2]"
      ]
    },
    "projectShowcase": {
      "title": "Showcase Your Project",
      "portfolioTips": [
        "[Portfolio tip 1]",
        "[Portfolio tip 2]",
        "[Portfolio tip 3]"
      ],
      "demoInstructions": "[How to demo the project, 2 sentences]",
      "githubBestPractices": [
        "[GitHub tip 1]",
        "[GitHub tip 2]",
        "[GitHub tip 3]"
      ],
      "nextEnhancements": [
        "[Enhancement idea 1]",
        "[Enhancement idea 2]",
        "[Enhancement idea 3]"
      ]
    }
  }
}

**IMPORTANT**: 
- Make it a real, portfolio-worthy project
- Provide clear phases and milestones
- Include 4 implementation phases
- 3 must-have features, 2 nice-to-have features`;


  // Quiz Section Prompt
  const getQuizPrompt = (domainName: string, subjectName: string, topicName: string, subtopicName: string) => `Generate content for the QUIZ SECTION

**Educational Hierarchy:**
- Domain: ${domainName}
- Subject: ${subjectName}
- Topic: ${topicName}
- Subtopic: ${subtopicName}

Generate detailed content specifically for the subtopic: "${subtopicName}"

This section tests the learner's understanding with various question types.

Output in this EXACT JSON format with 20 total questions:

{
  "quiz": {
    "quizOverview": {
      "title": "${subtopicName} - Knowledge Check",
      "description": "[What this quiz tests, 2 sentences]",
      "totalQuestions": 20,
      "passingScore": 70,
      "timeLimit": "20 minutes",
      "xpReward": 150
    },
    "multipleChoice": {
      "title": "Multiple Choice Questions",
      "questions": [
        {
          "id": "mc1",
          "question": "[Question 1]",
          "options": [
            { "id": "a", "text": "[Option A]" },
            { "id": "b", "text": "[Option B]" },
            { "id": "c", "text": "[Option C]" },
            { "id": "d", "text": "[Option D]" }
          ],
          "correctAnswer": "a",
          "explanation": "[Why this is correct, 2 sentences]",
          "difficulty": "easy"
        },
        {
          "id": "mc2",
          "question": "[Question 2]",
          "options": [
            { "id": "a", "text": "[Option A]" },
            { "id": "b", "text": "[Option B]" },
            { "id": "c", "text": "[Option C]" },
            { "id": "d", "text": "[Option D]" }
          ],
          "correctAnswer": "b",
          "explanation": "[Why this is correct, 2 sentences]",
          "difficulty": "medium"
        },
        {
          "id": "mc3",
          "question": "[Question 3]",
          "options": [
            { "id": "a", "text": "[Option A]" },
            { "id": "b", "text": "[Option B]" },
            { "id": "c", "text": "[Option C]" },
            { "id": "d", "text": "[Option D]" }
          ],
          "correctAnswer": "c",
          "explanation": "[Why this is correct, 2 sentences]",
          "difficulty": "hard"
        }
      ]
    },
    "trueFalse": {
      "title": "True or False",
      "questions": [
        {
          "id": "tf1",
          "statement": "[Statement 1]",
          "correctAnswer": true,
          "explanation": "[Explanation, 2 sentences]",
          "difficulty": "easy"
        },
        {
          "id": "tf2",
          "statement": "[Statement 2]",
          "correctAnswer": false,
          "explanation": "[Explanation, 2 sentences]",
          "difficulty": "medium"
        },
        {
          "id": "tf3",
          "statement": "[Statement 3]",
          "correctAnswer": true,
          "explanation": "[Explanation, 2 sentences]",
          "difficulty": "medium"
        }
      ]
    },
    "codeOutput": {
      "title": "What's the Output?",
      "questions": [
        {
          "id": "co1",
          "code": "[Code snippet with \\\\n for newlines]",
          "question": "What will this code output?",
          "options": [
            { "id": "a", "text": "[Output A]" },
            { "id": "b", "text": "[Output B]" },
            { "id": "c", "text": "[Output C]" },
            { "id": "d", "text": "[Output D]" }
          ],
          "correctAnswer": "a",
          "explanation": "[Why this is the output, 2-3 sentences]",
          "difficulty": "medium"
        },
        {
          "id": "co2",
          "code": "[Code snippet with \\\\n for newlines]",
          "question": "What will this code output?",
          "options": [
            { "id": "a", "text": "[Output A]" },
            { "id": "b", "text": "[Output B]" },
            { "id": "c", "text": "[Output C]" },
            { "id": "d", "text": "[Output D]" }
          ],
          "correctAnswer": "b",
          "explanation": "[Why this is the output, 2-3 sentences]",
          "difficulty": "hard"
        },
        {
          "id": "co3",
          "code": "[Code snippet with \\\\n for newlines]",
          "question": "What will this code output?",
          "options": [
            { "id": "a", "text": "[Output A]" },
            { "id": "b", "text": "[Output B]" },
            { "id": "c", "text": "[Output C]" },
            { "id": "d", "text": "[Output D]" }
          ],
          "correctAnswer": "c",
          "explanation": "[Why this is the output, 2-3 sentences]",
          "difficulty": "hard"
        }
      ]
    },
    "fillInBlank": {
      "title": "Fill in the Blanks",
      "questions": [
        {
          "id": "fb1",
          "question": "[Question with _____ blank]",
          "correctAnswer": "[Correct answer]",
          "explanation": "[Explanation, 2 sentences]",
          "difficulty": "easy"
        },
        {
          "id": "fb2",
          "question": "[Question with _____ blank]",
          "correctAnswer": "[Correct answer]",
          "explanation": "[Explanation, 2 sentences]",
          "difficulty": "medium"
        },
        {
          "id": "fb3",
          "question": "[Question with _____ blank]",
          "correctAnswer": "[Correct answer]",
          "explanation": "[Explanation, 2 sentences]",
          "difficulty": "medium"
        }
      ]
    },
    "codeDebugging": {
      "title": "Debug the Code",
      "questions": [
        {
          "id": "db1",
          "code": "[Buggy code with \\\\n for newlines]",
          "question": "What's wrong with this code?",
          "options": [
            { "id": "a", "text": "[Bug A]" },
            { "id": "b", "text": "[Bug B]" },
            { "id": "c", "text": "[Bug C]" },
            { "id": "d", "text": "[Bug D]" }
          ],
          "correctAnswer": "a",
          "explanation": "[Explanation of the bug and fix, 2-3 sentences]",
          "fixedCode": "[Fixed code with \\\\n for newlines]",
          "difficulty": "medium"
        },
        {
          "id": "db2",
          "code": "[Buggy code with \\\\n for newlines]",
          "question": "What's wrong with this code?",
          "options": [
            { "id": "a", "text": "[Bug A]" },
            { "id": "b", "text": "[Bug B]" },
            { "id": "c", "text": "[Bug C]" },
            { "id": "d", "text": "[Bug D]" }
          ],
          "correctAnswer": "b",
          "explanation": "[Explanation of the bug and fix, 2-3 sentences]",
          "fixedCode": "[Fixed code with \\\\n for newlines]",
          "difficulty": "hard"
        },
        {
          "id": "db3",
          "code": "[Buggy code with \\\\n for newlines]",
          "question": "What's wrong with this code?",
          "options": [
            { "id": "a", "text": "[Bug A]" },
            { "id": "b", "text": "[Bug B]" },
            { "id": "c", "text": "[Bug C]" },
            { "id": "d", "text": "[Bug D]" }
          ],
          "correctAnswer": "c",
          "explanation": "[Explanation of the bug and fix, 2-3 sentences]",
          "fixedCode": "[Fixed code with \\\\n for newlines]",
          "difficulty": "hard"
        }
      ]
    },
    "scenarioBased": {
      "title": "Scenario-Based Questions",
      "questions": [
        {
          "id": "sb1",
          "scenario": "[Real-world scenario, 2-3 sentences]",
          "question": "[Question about the scenario]",
          "options": [
            { "id": "a", "text": "[Solution A]" },
            { "id": "b", "text": "[Solution B]" },
            { "id": "c", "text": "[Solution C]" },
            { "id": "d", "text": "[Solution D]" }
          ],
          "correctAnswer": "a",
          "explanation": "[Why this is the best solution, 2-3 sentences]",
          "difficulty": "medium"
        },
        {
          "id": "sb2",
          "scenario": "[Real-world scenario, 2-3 sentences]",
          "question": "[Question about the scenario]",
          "options": [
            { "id": "a", "text": "[Solution A]" },
            { "id": "b", "text": "[Solution B]" },
            { "id": "c", "text": "[Solution C]" },
            { "id": "d", "text": "[Solution D]" }
          ],
          "correctAnswer": "b",
          "explanation": "[Why this is the best solution, 2-3 sentences]",
          "difficulty": "hard"
        },
        {
          "id": "sb3",
          "scenario": "[Real-world scenario, 2-3 sentences]",
          "question": "[Question about the scenario]",
          "options": [
            { "id": "a", "text": "[Solution A]" },
            { "id": "b", "text": "[Solution B]" },
            { "id": "c", "text": "[Solution C]" },
            { "id": "d", "text": "[Solution D]" }
          ],
          "correctAnswer": "c",
          "explanation": "[Why this is the best solution, 2-3 sentences]",
          "difficulty": "hard"
        }
      ]
    },
    "quizResults": {
      "title": "Quiz Results",
      "scoreRanges": [
        {
          "range": "90-100%",
          "message": "[Excellent message]",
          "badge": "Quiz Master",
          "nextSteps": "[What to do next]"
        },
        {
          "range": "70-89%",
          "message": "[Good message]",
          "badge": "Quiz Passed",
          "nextSteps": "[What to do next]"
        },
        {
          "range": "50-69%",
          "message": "[Needs improvement message]",
          "badge": "Keep Trying",
          "nextSteps": "[What to review]"
        },
        {
          "range": "0-49%",
          "message": "[Encouraging message]",
          "badge": "Review Needed",
          "nextSteps": "[What to study]"
        }
      ]
    }
  }
}

**IMPORTANT**: 
- Create 20 total questions (3 MC, 3 TF, 3 Code Output, 3 Fill Blank, 3 Debug, 3 Scenario, 2 Results)
- Mix difficulty: easy (30%), medium (40%), hard (30%)
- Test understanding, not just memorization`;


  // Visual Explanation Section Prompt
  const getVisualPrompt = (domainName: string, subjectName: string, topicName: string, subtopicName: string) => `Generate content for the VISUAL EXPLANATION SECTION

**Educational Hierarchy:**
- Domain: ${domainName}
- Subject: ${subjectName}
- Topic: ${topicName}
- Subtopic: ${subtopicName}

Generate detailed content specifically for the subtopic: "${subtopicName}"

This section uses diagrams, flowcharts, and visual aids to explain concepts.

Output in this EXACT JSON format:

{
  "visualExplanation": {
    "visualOverview": {
      "title": "Visual Guide to ${subtopicName}",
      "description": "[Why visuals help understand this, 2-3 sentences]",
      "learningStyle": "Visual learners will love this section!"
    },
    "conceptDiagram": {
      "title": "Concept Diagram",
      "description": "[What this diagram shows, 2 sentences]",
      "components": [
        {
          "id": "comp1",
          "name": "[Component 1]",
          "description": "[What it represents]",
          "position": "top"
        },
        {
          "id": "comp2",
          "name": "[Component 2]",
          "description": "[What it represents]",
          "position": "middle"
        },
        {
          "id": "comp3",
          "name": "[Component 3]",
          "description": "[What it represents]",
          "position": "bottom"
        }
      ],
      "connections": [
        {
          "from": "comp1",
          "to": "comp2",
          "label": "[Relationship]"
        },
        {
          "from": "comp2",
          "to": "comp3",
          "label": "[Relationship]"
        }
      ],
      "explanation": "[How to read this diagram, 2-3 sentences]"
    },
    "flowchartExplanation": {
      "title": "Process Flowchart",
      "description": "[What this flowchart shows, 2 sentences]",
      "steps": [
        {
          "id": "step1",
          "type": "start",
          "label": "[Start label]",
          "description": "[What happens here]"
        },
        {
          "id": "step2",
          "type": "process",
          "label": "[Process label]",
          "description": "[What happens here]"
        },
        {
          "id": "step3",
          "type": "decision",
          "label": "[Decision label]",
          "description": "[What's being decided]",
          "branches": ["Yes", "No"]
        },
        {
          "id": "step4",
          "type": "process",
          "label": "[Process label]",
          "description": "[What happens here]"
        },
        {
          "id": "step5",
          "type": "end",
          "label": "[End label]",
          "description": "[Final result]"
        }
      ],
      "explanation": "[How the flow works, 2-3 sentences]"
    },
    "comparisonChart": {
      "title": "Comparison Chart",
      "description": "[What's being compared, 2 sentences]",
      "items": [
        {
          "id": "item1",
          "name": "[Item 1]",
          "pros": ["[Pro 1]", "[Pro 2]", "[Pro 3]"],
          "cons": ["[Con 1]", "[Con 2]"],
          "useCase": "[When to use]"
        },
        {
          "id": "item2",
          "name": "[Item 2]",
          "pros": ["[Pro 1]", "[Pro 2]", "[Pro 3]"],
          "cons": ["[Con 1]", "[Con 2]"],
          "useCase": "[When to use]"
        },
        {
          "id": "item3",
          "name": "[Item 3]",
          "pros": ["[Pro 1]", "[Pro 2]", "[Pro 3]"],
          "cons": ["[Con 1]", "[Con 2]"],
          "useCase": "[When to use]"
        }
      ]
    },
    "timelineVisualization": {
      "title": "Timeline Visualization",
      "description": "[What this timeline shows, 2 sentences]",
      "events": [
        {
          "id": "event1",
          "time": "[Time/Phase 1]",
          "event": "[Event name]",
          "description": "[What happens, 2 sentences]"
        },
        {
          "id": "event2",
          "time": "[Time/Phase 2]",
          "event": "[Event name]",
          "description": "[What happens, 2 sentences]"
        },
        {
          "id": "event3",
          "time": "[Time/Phase 3]",
          "event": "[Event name]",
          "description": "[What happens, 2 sentences]"
        },
        {
          "id": "event4",
          "time": "[Time/Phase 4]",
          "event": "[Event name]",
          "description": "[What happens, 2 sentences]"
        }
      ]
    },
    "architectureDiagram": {
      "title": "Architecture Diagram",
      "description": "[What this architecture shows, 2-3 sentences]",
      "layers": [
        {
          "id": "layer1",
          "name": "[Layer 1 name]",
          "description": "[What this layer does]",
          "components": ["[Component 1]", "[Component 2]"]
        },
        {
          "id": "layer2",
          "name": "[Layer 2 name]",
          "description": "[What this layer does]",
          "components": ["[Component 1]", "[Component 2]"]
        },
        {
          "id": "layer3",
          "name": "[Layer 3 name]",
          "description": "[What this layer does]",
          "components": ["[Component 1]", "[Component 2]"]
        }
      ],
      "dataFlow": "[How data flows through layers, 2 sentences]"
    },
    "mindMap": {
      "title": "Mind Map",
      "description": "[What this mind map organizes, 2 sentences]",
      "centralConcept": "${subtopicName}",
      "branches": [
        {
          "id": "branch1",
          "title": "[Branch 1]",
          "subtopics": ["[Subtopic 1]", "[Subtopic 2]", "[Subtopic 3]"]
        },
        {
          "id": "branch2",
          "title": "[Branch 2]",
          "subtopics": ["[Subtopic 1]", "[Subtopic 2]", "[Subtopic 3]"]
        },
        {
          "id": "branch3",
          "title": "[Branch 3]",
          "subtopics": ["[Subtopic 1]", "[Subtopic 2]", "[Subtopic 3]"]
        },
        {
          "id": "branch4",
          "title": "[Branch 4]",
          "subtopics": ["[Subtopic 1]", "[Subtopic 2]", "[Subtopic 3]"]
        }
      ]
    },
    "visualSummary": {
      "title": "Visual Summary",
      "keyVisualTakeaways": [
        "[Visual takeaway 1]",
        "[Visual takeaway 2]",
        "[Visual takeaway 3]",
        "[Visual takeaway 4]"
      ],
      "visualLearningTips": [
        "[Tip 1]",
        "[Tip 2]",
        "[Tip 3]"
      ],
      "nextSteps": "[What to do next, 2 sentences]"
    }
  }
}

**IMPORTANT**: 
- Describe visuals in text format
- Use clear, descriptive language
- Include 5 steps in flowchart (start, process, decision, process, end)
- Include 4 timeline events, 3 architecture layers, 4 mind map branches`;


  // Practice Test Section Prompt
  const getPracticePrompt = (domainName: string, subjectName: string, topicName: string, subtopicName: string) => `Generate content for the PRACTICE TEST SECTION

**Educational Hierarchy:**
- Domain: ${domainName}
- Subject: ${subjectName}
- Topic: ${topicName}
- Subtopic: ${subtopicName}

Generate detailed content specifically for the subtopic: "${subtopicName}"

This section provides a comprehensive practice test similar to real exams.

Output in this EXACT JSON format with 30 total questions:

{
  "practiceTest": {
    "testOverview": {
      "title": "${subtopicName} - Comprehensive Practice Test",
      "description": "[What this test covers, 2-3 sentences]",
      "totalQuestions": 30,
      "passingScore": 75,
      "timeLimit": "45 minutes",
      "xpReward": 300,
      "difficulty": "mixed"
    },
    "theoryQuestions": {
      "title": "Theory Questions",
      "questions": [
        {
          "id": "theory1",
          "question": "[Conceptual question]",
          "options": [
            { "id": "a", "text": "[Option A]" },
            { "id": "b", "text": "[Option B]" },
            { "id": "c", "text": "[Option C]" },
            { "id": "d", "text": "[Option D]" }
          ],
          "correctAnswer": "a",
          "explanation": "[Detailed explanation, 3-4 sentences]",
          "difficulty": "easy",
          "points": 5
        },
        {
          "id": "theory2",
          "question": "[Conceptual question]",
          "options": [
            { "id": "a", "text": "[Option A]" },
            { "id": "b", "text": "[Option B]" },
            { "id": "c", "text": "[Option C]" },
            { "id": "d", "text": "[Option D]" }
          ],
          "correctAnswer": "b",
          "explanation": "[Detailed explanation, 3-4 sentences]",
          "difficulty": "medium",
          "points": 5
        },
        {
          "id": "theory3",
          "question": "[Conceptual question]",
          "options": [
            { "id": "a", "text": "[Option A]" },
            { "id": "b", "text": "[Option B]" },
            { "id": "c", "text": "[Option C]" },
            { "id": "d", "text": "[Option D]" }
          ],
          "correctAnswer": "c",
          "explanation": "[Detailed explanation, 3-4 sentences]",
          "difficulty": "hard",
          "points": 5
        }
      ]
    },
    "practicalQuestions": {
      "title": "Practical Application Questions",
      "questions": [
        {
          "id": "prac1",
          "scenario": "[Real-world scenario, 2-3 sentences]",
          "question": "[Question about implementation]",
          "options": [
            { "id": "a", "text": "[Solution A]" },
            { "id": "b", "text": "[Solution B]" },
            { "id": "c", "text": "[Solution C]" },
            { "id": "d", "text": "[Solution D]" }
          ],
          "correctAnswer": "a",
          "explanation": "[Why this is best, 3-4 sentences]",
          "difficulty": "medium",
          "points": 10
        },
        {
          "id": "prac2",
          "scenario": "[Real-world scenario, 2-3 sentences]",
          "question": "[Question about implementation]",
          "options": [
            { "id": "a", "text": "[Solution A]" },
            { "id": "b", "text": "[Solution B]" },
            { "id": "c", "text": "[Solution C]" },
            { "id": "d", "text": "[Solution D]" }
          ],
          "correctAnswer": "b",
          "explanation": "[Why this is best, 3-4 sentences]",
          "difficulty": "hard",
          "points": 10
        }
      ]
    },
    "codeAnalysisQuestions": {
      "title": "Code Analysis Questions",
      "questions": [
        {
          "id": "analysis1",
          "code": "[Complex code snippet with \\\\n for newlines]",
          "question": "[Question about the code]",
          "options": [
            { "id": "a", "text": "[Answer A]" },
            { "id": "b", "text": "[Answer B]" },
            { "id": "c", "text": "[Answer C]" },
            { "id": "d", "text": "[Answer D]" }
          ],
          "correctAnswer": "a",
          "explanation": "[Detailed code analysis, 3-4 sentences]",
          "difficulty": "medium",
          "points": 10
        },
        {
          "id": "analysis2",
          "code": "[Complex code snippet with \\\\n for newlines]",
          "question": "[Question about the code]",
          "options": [
            { "id": "a", "text": "[Answer A]" },
            { "id": "b", "text": "[Answer B]" },
            { "id": "c", "text": "[Answer C]" },
            { "id": "d", "text": "[Answer D]" }
          ],
          "correctAnswer": "b",
          "explanation": "[Detailed code analysis, 3-4 sentences]",
          "difficulty": "hard",
          "points": 10
        }
      ]
    },
    "debuggingQuestions": {
      "title": "Debugging Questions",
      "questions": [
        {
          "id": "debug1",
          "code": "[Buggy code with \\\\n for newlines]",
          "question": "Identify and fix the bug",
          "options": [
            { "id": "a", "text": "[Fix A]" },
            { "id": "b", "text": "[Fix B]" },
            { "id": "c", "text": "[Fix C]" },
            { "id": "d", "text": "[Fix D]" }
          ],
          "correctAnswer": "a",
          "explanation": "[Bug explanation and fix, 3-4 sentences]",
          "fixedCode": "[Corrected code with \\\\n for newlines]",
          "difficulty": "hard",
          "points": 15
        },
        {
          "id": "debug2",
          "code": "[Buggy code with \\\\n for newlines]",
          "question": "Identify and fix the bug",
          "options": [
            { "id": "a", "text": "[Fix A]" },
            { "id": "b", "text": "[Fix B]" },
            { "id": "c", "text": "[Fix C]" },
            { "id": "d", "text": "[Fix D]" }
          ],
          "correctAnswer": "b",
          "explanation": "[Bug explanation and fix, 3-4 sentences]",
          "fixedCode": "[Corrected code with \\\\n for newlines]",
          "difficulty": "medium",
          "points": 15
        }
      ]
    },
    "bestPracticeQuestions": {
      "title": "Best Practice Questions",
      "questions": [
        {
          "id": "bp1",
          "scenario": "[Code scenario, 2 sentences]",
          "question": "What's the best practice approach?",
          "options": [
            { "id": "a", "text": "[Approach A]" },
            { "id": "b", "text": "[Approach B]" },
            { "id": "c", "text": "[Approach C]" },
            { "id": "d", "text": "[Approach D]" }
          ],
          "correctAnswer": "a",
          "explanation": "[Why this is best practice, 3-4 sentences]",
          "difficulty": "medium",
          "points": 10
        },
        {
          "id": "bp2",
          "scenario": "[Code scenario, 2 sentences]",
          "question": "What's the best practice approach?",
          "options": [
            { "id": "a", "text": "[Approach A]" },
            { "id": "b", "text": "[Approach B]" },
            { "id": "c", "text": "[Approach C]" },
            { "id": "d", "text": "[Approach D]" }
          ],
          "correctAnswer": "b",
          "explanation": "[Why this is best practice, 3-4 sentences]",
          "difficulty": "hard",
          "points": 10
        }
      ]
    },
    "performanceQuestions": {
      "title": "Performance Optimization Questions",
      "questions": [
        {
          "id": "perf1",
          "scenario": "[Performance scenario, 2-3 sentences]",
          "question": "How would you optimize this?",
          "options": [
            { "id": "a", "text": "[Optimization A]" },
            { "id": "b", "text": "[Optimization B]" },
            { "id": "c", "text": "[Optimization C]" },
            { "id": "d", "text": "[Optimization D]" }
          ],
          "correctAnswer": "a",
          "explanation": "[Performance analysis, 3-4 sentences]",
          "difficulty": "hard",
          "points": 15
        }
      ]
    },
    "comprehensiveScenarios": {
      "title": "Comprehensive Scenarios",
      "questions": [
        {
          "id": "comp1",
          "scenario": "[Complex real-world scenario, 3-4 sentences]",
          "question": "[Multi-part question]",
          "options": [
            { "id": "a", "text": "[Solution A]" },
            { "id": "b", "text": "[Solution B]" },
            { "id": "c", "text": "[Solution C]" },
            { "id": "d", "text": "[Solution D]" }
          ],
          "correctAnswer": "a",
          "explanation": "[Comprehensive explanation, 4-5 sentences]",
          "difficulty": "hard",
          "points": 20
        },
        {
          "id": "comp2",
          "scenario": "[Complex real-world scenario, 3-4 sentences]",
          "question": "[Multi-part question]",
          "options": [
            { "id": "a", "text": "[Solution A]" },
            { "id": "b", "text": "[Solution B]" },
            { "id": "c", "text": "[Solution C]" },
            { "id": "d", "text": "[Solution D]" }
          ],
          "correctAnswer": "b",
          "explanation": "[Comprehensive explanation, 4-5 sentences]",
          "difficulty": "hard",
          "points": 20
        }
      ]
    },
    "testResults": {
      "title": "Test Results and Feedback",
      "scoreRanges": [
        {
          "range": "90-100%",
          "grade": "A",
          "message": "[Excellent performance message]",
          "badge": "Test Master",
          "feedback": "[Specific feedback]",
          "nextSteps": "[What to do next]"
        },
        {
          "range": "75-89%",
          "grade": "B",
          "message": "[Good performance message]",
          "badge": "Test Passed",
          "feedback": "[Specific feedback]",
          "nextSteps": "[What to improve]"
        },
        {
          "range": "60-74%",
          "grade": "C",
          "message": "[Needs improvement message]",
          "badge": "Keep Practicing",
          "feedback": "[Specific feedback]",
          "nextSteps": "[What to review]"
        },
        {
          "range": "0-59%",
          "grade": "F",
          "message": "[Encouraging message]",
          "badge": "Review Required",
          "feedback": "[Specific feedback]",
          "nextSteps": "[What to study]"
        }
      ]
    }
  }
}

**IMPORTANT**: 
- Create 30 total questions: 3 theory (easy/med/hard), 2 practical (med/hard), 2 code analysis (med/hard), 2 debugging (hard/med), 2 best practice (med/hard), 1 performance (hard), 2 comprehensive (hard/hard)
- Mix difficulty: easy (30%), medium (40%), hard (30%)
- Points: easy=5, medium=10, hard=15-20`;


  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="p-8 text-center" style={{ backgroundColor: brand.primaryColor }}>
            <h1 className="text-4xl font-bold text-white mb-3">🤖 AI Content Prompt Generator</h1>
            <p className="text-white text-lg font-semibold">Generate perfect prompts for ChatGPT, Claude, Gemini, or DeepSeek</p>
          </div>

          {/* Info Box */}
          <div className="p-6 bg-blue-50 border-l-4 border-blue-500 m-6 rounded-lg">
            <p className="text-blue-900 font-medium leading-relaxed">
              <strong>How to use:</strong> Enter your subtopic name, select a section, and click Generate. 
              Copy the prompt and paste it into any AI model to get perfectly formatted JSON content.
            </p>
          </div>

          {/* Input Section */}
          <section className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="domain" className="block text-lg font-semibold text-gray-800 mb-3">
                  Domain
                </label>
                <input
                  type="text"
                  id="domain"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g., Programming, Cloud Computing, Finance"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-lg font-semibold text-gray-800 mb-3">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., JavaScript, AWS, Stock Market"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="topic" className="block text-lg font-semibold text-gray-800 mb-3">
                  Topic
                </label>
                <input
                  type="text"
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Asynchronous Programming, EC2, Trading Strategies"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="subtopic" className="block text-lg font-semibold text-gray-800 mb-3">
                  Subtopic
                </label>
                <input
                  type="text"
                  id="subtopic"
                  value={subtopic}
                  onChange={(e) => setSubtopic(e.target.value)}
                  placeholder="e.g., JavaScript Promises, Instance Types, Day Trading"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                Select Section
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setSelectedSection(section.id)}
                    className={`p-4 border-2 rounded-xl font-semibold text-sm transition-all ${
                      selectedSection === section.id
                        ? 'text-white shadow-lg'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-blue-500 hover:bg-blue-50'
                    }`}
                    style={
                      selectedSection === section.id
                        ? { backgroundColor: brand.primaryColor, borderColor: brand.primaryColor }
                        : {}
                    }
                  >
                    {section.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generatePrompt}
              className="w-full py-4 text-white text-xl font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              style={{ backgroundColor: brand.primaryColor }}
            >
              Generate Prompt
            </button>
          </section>
        </header>

        {/* Output Section */}
        {generatedPrompt && (
          <section className="bg-white rounded-2xl shadow-2xl overflow-hidden" aria-label="Generated prompt output">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-800">Generated Prompt</h3>
              <button
                onClick={copyToClipboard}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  copied ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                {copied ? '✓ Copied!' : 'Copy to Clipboard'}
              </button>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap max-h-[600px] overflow-y-auto">
                {generatedPrompt}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default function PromptGeneratorPage() {
  return (
    <BrandProvider brand={skillUpConfig}>
      <PromptGeneratorContent />
    </BrandProvider>
  );
}
