/**
 * SVG Asset Specifications for ALL 14 Tutorial Sections
 * 
 * Source of truth: docs/completeproject/TutorialPageComponents/AllSectionTutorialPageImage.json
 * Each section's mandatory visual components are mapped to SVG prompt generation targets.
 * The Prompt Generator uses these specs to build "Select Visual Asset (SVG) Prompt" dropdown items.
 */

export interface AssetSpec {
  id: string;
  label: string;
  fieldPath: string;
  width: number;
  height: number;
  purpose: string;
}

export const ASSET_SPECS: Record<string, AssetSpec[]> = {
  // ─────────────────────────────────────────────────────────────────
  // 1. OVERVIEW SECTION
  // ─────────────────────────────────────────────────────────────────
  overview: [
    {
      id: 'overview-hero',
      label: 'Overview Hero Banner',
      fieldPath: 'heroVisual',
      width: 1440,
      height: 800,
      purpose: 'A high-level conceptual hero banner introducing the subtopic with a modern educational infographic style.',
    },
  ],

  // ─────────────────────────────────────────────────────────────────
  // 2. NOTES SECTION (9 assets)
  // ─────────────────────────────────────────────────────────────────
  notes: [
    {
      id: 'notes-hero',
      label: 'Hero Infographic',
      fieldPath: 'summaryHeroInfographic.image',
      width: 1440,
      height: 800,
      purpose: 'A large, premium hero infographic that explains "How it Works" at a glance for this subtopic.',
    },
    {
      id: 'notes-memory-map',
      label: 'Concept Memory Map',
      fieldPath: 'conceptMemoryMap.image',
      width: 1200,
      height: 900,
      purpose: 'A node-and-connection diagram showing the relationships between different parts of the concept.',
    },
    {
      id: 'notes-cheatsheet',
      label: 'Cheat Sheet',
      fieldPath: 'cheatSheetSVG.image',
      width: 1200,
      height: 800,
      purpose: 'A quick-reference cheat sheet diagram summarizing the most important syntax, commands, or rules for this subtopic.',
    },
    {
      id: 'notes-syntax',
      label: 'Syntax Diagram',
      fieldPath: 'syntaxBlock.image',
      width: 1200,
      height: 600,
      purpose: 'A visual diagram that points out and explains specific parts of the code syntax.',
    },
    {
      id: 'notes-summary',
      label: 'Revision Summary',
      fieldPath: 'summaryCard.image',
      width: 1200,
      height: 700,
      purpose: 'A summary infographic that visually reinforces the core idea, memory hook, and revision intent.',
    },
    {
      id: 'notes-flashcard',
      label: 'Flashcard Visual',
      fieldPath: 'flashcardVisualSystem.image',
      width: 1200,
      height: 700,
      purpose: 'A visual flashcard-style diagram that presents key question-answer pairs in a memorable visual format.',
    },
    {
      id: 'notes-comparison',
      label: 'Comparison Chart',
      fieldPath: 'comparisonSummaryChart.image',
      width: 1200,
      height: 700,
      purpose: 'A side-by-side comparison chart diagram illustrating key differences or similarities related to this subtopic.',
    },
    {
      id: 'notes-mnemonic',
      label: 'Mnemonic Graphic',
      fieldPath: 'mnemonicRetentionGraphic.image',
      width: 1200,
      height: 700,
      purpose: 'A creative mnemonic or memory-aid graphic that helps learners remember key concepts using visual associations.',
    },
    {
      id: 'notes-footer',
      label: 'Footer Visual',
      fieldPath: 'footerBlock.image',
      width: 1200,
      height: 400,
      purpose: 'A clean closing visual or banner that reinforces the final takeaway and encourages the learner to move to the next section.',
    },
  ],

  // ─────────────────────────────────────────────────────────────────
  // 3. LAYMAN SECTION (3 assets)
  // ─────────────────────────────────────────────────────────────────
  layman: [
    {
      id: 'layman-overview',
      label: 'Concept Overview',
      fieldPath: 'simpleOverview.heroVisual',
      width: 1200,
      height: 700,
      purpose: 'A simple, welcoming hero visual introducing the concept to a complete beginner with friendly illustrations.',
    },
    {
      id: 'layman-analogy',
      label: 'Everyday Analogy',
      fieldPath: 'everydayAnalogy.image',
      width: 1200,
      height: 700,
      purpose: 'A clean educational analogy illustration that visually explains the everyday comparison for this subtopic.',
    },
    {
      id: 'layman-mental-model',
      label: 'Mental Model Diagram',
      fieldPath: 'mentalModel.image',
      width: 1200,
      height: 800,
      purpose: 'A concept-map style diagram that shows how the key ideas connect, helping beginners build a mental model.',
    },
  ],

  // ─────────────────────────────────────────────────────────────────
  // 4. REAL LIFE SECTION
  // ─────────────────────────────────────────────────────────────────
  real_life: [
    {
      id: 'reallife-hero',
      label: 'Real-World Scenario Hero',
      fieldPath: 'heroVisual',
      width: 1440,
      height: 800,
      purpose: 'A professional industry scenario hero visual showing WHERE and WHY this concept is used in real products and companies.',
    },
    {
      id: 'reallife-workflow',
      label: 'Industry Workflow Diagram',
      fieldPath: 'industryWorkflow.image',
      width: 1200,
      height: 700,
      purpose: 'An operational workflow diagram showing the concept as part of a real industry system (e.g., ecommerce checkout, authentication flow).',
    },
    {
      id: 'reallife-business-case',
      label: 'Business Case Visual',
      fieldPath: 'businessCase.image',
      width: 1200,
      height: 700,
      purpose: 'A business infographic or company case study visual demonstrating industry significance (e.g., Netflix, Amazon).',
    },
    {
      id: 'reallife-user-journey',
      label: 'User Journey Map',
      fieldPath: 'userJourney.image',
      width: 1200,
      height: 600,
      purpose: 'A user journey map visualizing end-user interactions and system outcomes through a horizontal or vertical timeline.',
    },
    {
      id: 'reallife-career',
      label: 'Career Context Visual',
      fieldPath: 'careerContext.image',
      width: 1200,
      height: 700,
      purpose: 'A career roadmap infographic connecting this concept to professional opportunities and skill-to-job pathways.',
    },
  ],

  // ─────────────────────────────────────────────────────────────────
  // 5. TECHNICAL SECTION
  // ─────────────────────────────────────────────────────────────────
  technical: [
    {
      id: 'tech-architecture',
      label: 'System Architecture',
      fieldPath: 'sections.0.diagramAsset',
      width: 1440,
      height: 900,
      purpose: 'A system or runtime architecture diagram suitable for an advanced technical explanation of the subtopic.',
    },
    {
      id: 'tech-sequence',
      label: 'Workflow Sequence Diagram',
      fieldPath: 'sections.1.diagramAsset',
      width: 1200,
      height: 800,
      purpose: 'An internal workflow sequence diagram showing step-by-step process execution (e.g., event loop, authentication lifecycle).',
    },
    {
      id: 'tech-data-flow',
      label: 'Data Flow Diagram',
      fieldPath: 'sections.2.diagramAsset',
      width: 1200,
      height: 700,
      purpose: 'An advanced data flow diagram revealing movement of data across frontend, backend, and database systems.',
    },
  ],

  // ─────────────────────────────────────────────────────────────────
  // 6. CODE SECTION
  // ─────────────────────────────────────────────────────────────────
  code: [
    {
      id: 'code-preview',
      label: 'Output Preview',
      fieldPath: 'outputDemonstration.previewAsset',
      width: 1280,
      height: 720,
      purpose: 'A UI-style output preview showing before/after or result-state for the code example.',
    },
    {
      id: 'code-architecture',
      label: 'Code Architecture Visual',
      fieldPath: 'architectureVisual',
      width: 1440,
      height: 800,
      purpose: 'An implementation architecture diagram introducing the code structure and execution environment.',
    },
    {
      id: 'code-execution-flow',
      label: 'Execution Flowchart',
      fieldPath: 'executionFlow.image',
      width: 1200,
      height: 700,
      purpose: 'A code execution flowchart showing runtime logic, control flow, and step-by-step process execution.',
    },
  ],

  // ─────────────────────────────────────────────────────────────────
  // 7. VISUAL SECTION
  // ─────────────────────────────────────────────────────────────────
  visual: [
    {
      id: 'visual-hero',
      label: 'Full Concept Visualization',
      fieldPath: 'heroVisualization.image',
      width: 1440,
      height: 900,
      purpose: 'A complete conceptual hero visualization providing a system-wide overview through an educational ecosystem map.',
    },
    {
      id: 'visual-process-flow',
      label: 'Process Flow Diagram',
      fieldPath: 'processFlow.image',
      width: 1200,
      height: 800,
      purpose: 'An interactive process flow diagram showing dynamic system movement, lifecycle, and conceptual execution.',
    },
    {
      id: 'visual-comparison',
      label: 'Comparative Framework',
      fieldPath: 'comparativeFramework.image',
      width: 1200,
      height: 700,
      purpose: 'A comparative framework SVG clarifying distinctions between related systems (e.g., REST vs GraphQL, CSR vs SSR).',
    },
    {
      id: 'visual-mental-model',
      label: 'Mental Model Diagram',
      fieldPath: 'mentalModel.image',
      width: 1200,
      height: 700,
      purpose: 'A mental model diagram creating intuitive understanding through analogy systems and concept translation.',
    },
    {
      id: 'visual-architecture',
      label: 'Multi-Layer Architecture',
      fieldPath: 'architectureMap.image',
      width: 1440,
      height: 900,
      purpose: 'A multi-layer architecture map visualizing complete multi-system relationships (e.g., full stack, deployment pipeline).',
    },
    {
      id: 'visual-timeline',
      label: 'Timeline / Lifecycle',
      fieldPath: 'timeline.image',
      width: 1200,
      height: 600,
      purpose: 'A timeline or lifecycle visualization showing progression, evolution, and state changes over time.',
    },
    {
      id: 'visual-summary',
      label: 'Memory Compression Infographic',
      fieldPath: 'memorySummary.image',
      width: 1200,
      height: 700,
      purpose: 'A memory compression infographic condensing large systems into rapid revision visual systems.',
    },
  ],

  // ─────────────────────────────────────────────────────────────────
  // 8. PRACTICE SECTION
  // ─────────────────────────────────────────────────────────────────
  practice: [
    {
      id: 'practice-hero',
      label: 'Practice Test Hero Dashboard',
      fieldPath: 'heroDashboard.image',
      width: 1440,
      height: 800,
      purpose: 'A professional assessment dashboard providing exam framing, competency expectations, and readiness overview.',
    },
    {
      id: 'practice-benchmark',
      label: 'Readiness Benchmark',
      fieldPath: 'readinessBenchmark.image',
      width: 1200,
      height: 700,
      purpose: 'A readiness benchmark dashboard measuring exam, certification, or job readiness with industry-standard scoring.',
    },
  ],

  // ─────────────────────────────────────────────────────────────────
  // 9. ASSIGNMENT SECTION
  // ─────────────────────────────────────────────────────────────────
  assignment: [
    {
      id: 'assignment-hero',
      label: 'Assignment Hero Dashboard',
      fieldPath: 'heroDashboard.image',
      width: 1440,
      height: 800,
      purpose: 'A guided assignment dashboard providing task framing, objectives, difficulty level, and learning outcome expectations.',
    },
    {
      id: 'assignment-workflow',
      label: 'Task Workflow Diagram',
      fieldPath: 'taskWorkflow.image',
      width: 1200,
      height: 700,
      purpose: 'A step-by-step guided task workflow diagram showing the assignment execution lifecycle (Research → Plan → Build → Test → Submit).',
    },
  ],

  // ─────────────────────────────────────────────────────────────────
  // 10. PROJECT SECTION
  // ─────────────────────────────────────────────────────────────────
  project: [
    {
      id: 'project-hero',
      label: 'Project Hero Dashboard',
      fieldPath: 'heroDashboard.image',
      width: 1440,
      height: 800,
      purpose: 'A professional capstone project dashboard providing full project framing, objectives, timeline, and career relevance.',
    },
    {
      id: 'project-roadmap',
      label: 'Development Roadmap',
      fieldPath: 'developmentRoadmap.image',
      width: 1200,
      height: 700,
      purpose: 'A full product development roadmap guiding the lifecycle from Ideation → Architecture → Development → Testing → Deployment → Showcase.',
    },
    {
      id: 'project-architecture',
      label: 'System Architecture',
      fieldPath: 'systemArchitecture.image',
      width: 1440,
      height: 900,
      purpose: 'A technical blueprint showing the full project system architecture including frontend, backend, database, and deployment layers.',
    },
  ],

  // ─────────────────────────────────────────────────────────────────
  // 11. QUIZ SECTION
  // ─────────────────────────────────────────────────────────────────
  quiz: [
    {
      id: 'quiz-hero',
      label: 'Quiz Hero Dashboard',
      fieldPath: 'heroDashboard.image',
      width: 1440,
      height: 800,
      purpose: 'A gamified quiz hero dashboard with motivational XP/reward panels, difficulty overview, and streak launch visuals.',
    },
  ],

  // ─────────────────────────────────────────────────────────────────
  // 12. SUMMARY SECTION
  // ─────────────────────────────────────────────────────────────────
  summary: [
    {
      id: 'summary-mastery',
      label: 'Mastery Recap',
      fieldPath: 'masteryRecapCard.heroAsset',
      width: 1200,
      height: 700,
      purpose: 'A celebratory recap graphic that visually summarizes the concept and completion state.',
    },
  ],

  // ─────────────────────────────────────────────────────────────────
  // 13. INTERVIEW SECTION
  // ─────────────────────────────────────────────────────────────────
  interview: [
    {
      id: 'interview-hero',
      label: 'Interview Prep Hero',
      fieldPath: 'heroVisual',
      width: 1440,
      height: 800,
      purpose: 'A professional interview preparation hero visual showing key concepts, common questions, and confidence-building frameworks.',
    },
  ],

  // ─────────────────────────────────────────────────────────────────
  // 14. AI TUTOR SECTION
  // ─────────────────────────────────────────────────────────────────
  ai_tutor: [
    {
      id: 'ai-tutor-hero',
      label: 'AI Tutor Hero Visual',
      fieldPath: 'heroVisual',
      width: 1440,
      height: 800,
      purpose: 'An AI tutor hero visual illustrating the interactive learning assistant concept with a modern, friendly AI-guided design.',
    },
  ],
};
