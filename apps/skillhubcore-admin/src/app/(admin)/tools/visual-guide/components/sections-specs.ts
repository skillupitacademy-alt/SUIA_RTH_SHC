import { SectionSpec } from './types';

export const SECTIONS_SPECS: SectionSpec[] = [
  {
    id: 'overview',
    label: '1. Overview',
    description: 'Establishes the educational context, high-level readiness, and recommended learning flow.',
    color: 'from-pink-500 to-rose-600',
    glowColor: 'rgba(236, 72, 153, 0.4)',
    subsections: [
      { id: 'hero', label: 'Hero Block', purpose: 'Large conceptual introduction visual banner', components: ['Hero Title', 'Intro Subtitle', 'Concept Image Overlay'], svgId: 'overview-hero', svgLabel: 'Overview Hero Banner' },
      { id: 'progressSummary', label: 'Progress Summary', purpose: 'Indicates user stage and checklist progress', components: ['Linear Progress Bar', 'Percent Badge', 'Next Step Button'] },
      { id: 'learningOutcomes', label: 'Learning Outcomes', purpose: 'What the student will build or master', components: ['Tick Items', 'Skill Grid'] },
      { id: 'learningRoadmap', label: 'Learning Roadmap', purpose: 'Sequential flow diagram showing topic progress', components: ['Roadmap Nodes', 'Connection Lines'] },
      { id: 'recommendedFlow', label: 'Recommended Flow', purpose: 'Step-by-step pathway advice based on level', components: ['Pills', 'Next Recommended Tab Badge'] },
      { id: 'readinessContext', label: 'Readiness Context', purpose: 'List of pre-requisites and mindset framing', components: ['Mindset Alert', 'Prerequisite Links'] },
      { id: 'navigation', label: 'Navigation Links', purpose: 'Quick jump anchors to other major sections', components: ['Jump buttons'] }
    ]
  },
  {
    id: 'notes',
    label: '2. Notes (Deep-Dive)',
    description: 'The core educational textbook layer, containing terms, definitions, and code syntax breakdown.',
    color: 'from-orange-500 to-pink-500',
    glowColor: 'rgba(249, 115, 22, 0.4)',
    subsections: [
      { id: 'concept_card', label: 'Concept Card', purpose: 'Learner-facing academic overview hero for the notes section', components: ['NotesHero.tsx', 'Hero title', 'Hero subtitle', 'Quick-look tags'] },
      { id: 'definition_block', label: 'Definition Block', purpose: 'Canonical definition and simple explanation card', components: ['CoreDefinition.tsx', 'Concept badge', 'Definition', 'Simple explanation', 'Why it matters'] },
      { id: 'component_grid', label: 'Component Grid', purpose: 'Mechanics card that explains how the concept works', components: ['SystemMechanics.tsx', 'Mechanic timeline', 'Labels', 'Details'] },
      { id: 'syntax_block', label: 'Syntax Block', purpose: 'Syntax/code structure panel with copy action and breakdown', components: ['SyntaxStructure.tsx', 'Code snippet', 'Copy button', 'Breakdown cards'], svgId: 'notes-syntax', svgLabel: 'Syntax Diagram' },
      { id: 'example_panel', label: 'Example Panel', purpose: 'Polished key-component/example grid for practical inspection', components: ['KeyComponents.tsx', 'Component cards', 'Supporting points'] },
      { id: 'practice_card', label: 'Practice Card', purpose: 'Best-practice guidance for immediate learner application', components: ['BestPractices.tsx', 'Practice tips', 'Check styling'] },
      { id: 'warning_faq', label: 'Warning FAQ', purpose: 'Mistake prevention and correction guidance', components: ['CommonMistakes.tsx', 'Mistake cards', 'Fix notes'] },
      { id: 'summary_card', label: 'Summary Card', purpose: 'Visual revision summary and key takeaways', components: ['VisualSummary.tsx', 'Concept flow', 'Takeaways', 'Optional image'] }
    ]
  },
  {
    id: 'layman',
    label: '3. Layman',
    description: 'Simplifies advanced theory using relatable analogies and a friendly, intuitive mental model.',
    color: 'from-amber-500 to-orange-500',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    subsections: [
      { id: 'simpleOverview', label: 'Simple Overview', purpose: 'Welcoming non-technical introduction banner', components: ['Friendly title'] },
      { id: 'everydayAnalogy', label: 'Everyday Analogy', purpose: 'The core comparison card detailing a real-life analog', components: ['Analogy card title', 'Real-world analog story'] },
      { id: 'whyItExists', label: 'Why It Exists', purpose: 'Highlights historical reasons for creation', components: ['Problem solved cards', 'Before-and-after grid'] },
      { id: 'simpleUseCases', label: 'Simple Use Cases', purpose: 'Simple situations where this tool is standard', components: ['Layman Use Case cards'] },
      { id: 'beginnerBreakdown', label: 'Beginner Breakdown', purpose: 'Step-by-step plain English breakdown of components', components: ['Accordion cards', 'No-code process flow'] },
      { id: 'mentalModel', label: 'Mental Model Framework', purpose: 'A structured mental model connection diagram', components: ['Mental model mapping'] },
      { id: 'commonConfusions', label: 'Common Confusions', purpose: 'Common layman-level misconceptions clarified', components: ['Myth vs Fact cards'] },
      { id: 'simpleRecap', label: 'Simple Recap', purpose: 'A short, cheerful closing summary card', components: ['Recap bullet points'] },
      { id: 'heroVisualSvg', label: 'Hero Visual (SVG)', purpose: 'A simple, welcoming hero visual introducing the concept to a complete beginner', components: ['SVG Concept Overview'], svgId: 'layman-overview', svgLabel: 'Concept Overview' },
      { id: 'analogySvg', label: 'Analogy Graphic (SVG)', purpose: 'A clean educational analogy illustration that visually explains the everyday comparison', components: ['SVG Analogy Graphic'], svgId: 'layman-analogy', svgLabel: 'Everyday Analogy' },
      { id: 'mentalModelSvg', label: 'Mental Model diagram (SVG)', purpose: 'A concept-map style diagram that shows how the key ideas connect', components: ['SVG Mental Model Diagram'], svgId: 'layman-mental-model', svgLabel: 'Mental Model Diagram' }
    ]
  },
  {
    id: 'real_life',
    label: '4. Real Life',
    description: 'Demonstrates professional industry usage, workflows, and job relevance.',
    color: 'from-blue-500 to-indigo-500',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    subsections: [
      { id: 'conceptMapping', label: 'Concept Mapping', purpose: 'Connecting educational terms to real software systems', components: ['System map', 'Glow labels'] },
      { id: 'industryUseCase', label: 'Industry Use Case', purpose: 'How companies (e.g. Netflix, Amazon) apply this subtopic', components: ['Company brand logo', 'Production metrics', 'Workflow diagram SVG'], svgId: 'reallife-workflow', svgLabel: 'Industry Workflow Diagram' },
      { id: 'dailyLifeExample', label: 'Daily Life Example', purpose: 'A developer-level day-to-day workflow scenario', components: ['Developer story card', 'Command outputs'] },
      { id: 'careerRelevance', label: 'Career Relevance', purpose: 'Job title relevance, salaries, and resume bullets', components: ['Salary slider', 'Job title pills', 'Resume bullet highlights'], svgId: 'reallife-career', svgLabel: 'Career Context Visual' },
      { id: 'problemSolutionContext', label: 'Problem & Solution', purpose: 'Strict business-level problem statement', components: ['Problem statement banner', 'Surgical architecture solution'] },
      { id: 'businessApplication', label: 'Business Application', purpose: 'Financial and operational impact of using this subtopic', components: ['ROI metrics card', 'Scale illustration SVG'], svgId: 'reallife-business-case', svgLabel: 'Business Case Visual' },
      { id: 'domainScenarios', label: 'Domain Scenarios', purpose: 'Scenarios in FinTech, EdTech, Healthcare, etc.', components: ['Domain cards', 'Scenario comparisons'] },
      { id: 'practicalRecap', label: 'Practical Recap', purpose: 'Horizontal timeline workflow summarizing the section', components: ['Timeline nodes', 'User journey SVG diagram'], svgId: 'reallife-user-journey', svgLabel: 'User Journey Map' }
    ]
  },
  {
    id: 'technical',
    label: '5. Technical',
    description: 'Deep dive into advanced system internals, sequence lifecycles, and data structures.',
    color: 'from-purple-500 to-indigo-600',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    subsections: [
      { id: 'title', label: 'Title', purpose: 'Main advanced technical header block', components: ['Section title', 'Execution badge'] },
      { id: 'badge', label: 'Badge', purpose: 'Advanced concepts difficulty badge indicator', components: ['Level pill', 'Topics covered indicator'] },
      { id: 'intro', label: 'Introduction', purpose: 'Architectural overview introduction text', components: ['Advanced introductory brief'] },
      { id: 'sections', label: 'Technical Sections', purpose: 'Internal details, workflows, and advanced sequence diagrams', components: ['Technical paragraph panels', 'Architecture SVG', 'Sequence flowchart SVG'], svgId: 'tech-architecture', svgLabel: 'System Architecture' }
    ]
  },
  {
    id: 'code',
    label: '6. Code',
    description: 'Clean coding paradigms, line-by-line internal breakdowns, and mistake highlights.',
    color: 'from-emerald-500 to-teal-600',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    subsections: [
      { id: 'problemContext', label: 'Problem Context', purpose: 'Describes what program objective we are writing', components: ['Objective bullet points', 'Constraints box'] },
      { id: 'basicCodeExample', label: 'Basic Code Example', purpose: 'Interactive editor card containing clean code snippet', components: ['Active file tab', 'Syntax highlighted editor window'] },
      { id: 'lineByLineExplanation', label: 'Line Breakdown', purpose: 'Granular explanation of critical code lines', components: ['Interactive line highlighted explanation table'] },
      { id: 'outputDemonstration', label: 'Output Preview', purpose: 'A simulated terminal console depicting output logs', components: ['Terminal shell card', 'Simulated preview layout SVG'], svgId: 'code-preview', svgLabel: 'Output Preview' },
      { id: 'bestPracticeVersion', label: 'Best Practice Version', purpose: 'Optimized version of the code snippet (e.g. caching, DRY)', components: ['Optimization logs', 'Performance comparison graph'] },
      { id: 'commonMistakes', label: 'Common Mistakes', purpose: 'Surgical before/after comparison of buggy vs corrected code', components: ['Buggy red code card', 'Corrected green code card'] },
      { id: 'realWorldImplementation', label: 'Real World Block', purpose: 'How to deploy or build this in an app environment', components: ['Deployment steps', 'Production config box'] },
      { id: 'codeSummary', label: 'Code Summary', purpose: 'Closing recap checklist for programmers', components: ['Programmer checklist'] }
    ]
  },
  {
    id: 'visual',
    label: '7. Visual (System Diagram)',
    description: 'Dedicated purely to visualizing abstract systems using dynamic charts and lifecycles.',
    color: 'from-teal-500 to-cyan-500',
    glowColor: 'rgba(20, 184, 166, 0.4)',
    subsections: [
      { id: 'conceptVisualIntro', label: 'Visual Intro', purpose: 'Introductory caption text for visual diagrams', components: ['Ecosystem intro paragraph'] },
      { id: 'diagrammaticBreakdown', label: 'Diagram Breakdown', purpose: 'Core diagrammatic view of the educational concept', components: ['Interactive svg container', 'Visual legends'], svgId: 'visual-hero', svgLabel: 'Full Concept Visualization' },
      { id: 'stepByStepVisualFlow', label: 'Step Flowchart', purpose: 'Process sequence visual chart', components: ['Process sequence nodes', 'Step details'], svgId: 'visual-process-flow', svgLabel: 'Process Flow Diagram' },
      { id: 'comparativeVisualization', label: 'Comparison Matrix', purpose: 'Matrix diagram highlighting conceptual contrasts', components: ['Side-by-side SVG matrix'], svgId: 'visual-comparison', svgLabel: 'Comparative Framework' },
      { id: 'mentalModelVisualization', label: 'Mental Model Diagram', purpose: 'SVG translation diagram of LAYMAN model', components: ['Visual metaphor card'], svgId: 'visual-mental-model', svgLabel: 'Mental Model Diagram' },
      { id: 'realWorldVisualMapping', label: 'Real World Map', purpose: 'Multi-layer system deployment pipeline diagram', components: ['High fidelity deployment map SVG'], svgId: 'visual-architecture', svgLabel: 'Multi-Layer Architecture' },
      { id: 'commonConfusionVisualization', label: 'Confusion Visual', purpose: 'Visual timeline showing progression and state changes', components: ['State lifecycle chart SVG'], svgId: 'visual-timeline', svgLabel: 'Timeline / Lifecycle' },
      { id: 'visualSummary', label: 'Visual Summary', purpose: 'Closing memory compression visual chart', components: ['Rapid revision visual infographic'], svgId: 'visual-summary', svgLabel: 'Memory Compression Infographic' }
    ]
  },
  {
    id: 'practice',
    label: '8. Practice',
    description: 'Interactive concept recall quizzes, scenario challenges, and instant correction.',
    color: 'from-violet-500 to-fuchsia-500',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    subsections: [
      { id: 'assessmentIntro', label: 'Assessment Intro', purpose: 'Motivation prompt card for practice test', components: ['Motivational tagline', 'Ready badge', 'XP potential banner'], svgId: 'practice-hero', svgLabel: 'Practice Test Hero Dashboard' },
      { id: 'conceptRecallQuestions', label: 'Recall Questions', purpose: 'Core pool of basic conceptual MCQs', components: ['Question label', 'Option grids'] },
      { id: 'scenarioBasedQuestions', label: 'Scenario Questions', purpose: 'Advanced scenario-based developer questions', components: ['Scenario paragraph', 'Complex options'] },
      { id: 'difficultyProgression', label: 'Difficulty Progression', purpose: 'Visual progression showing easy, medium, hard paths', components: ['Difficulty slider', 'Adaptive route path'] },
      { id: 'instantFeedback', label: 'Feedback Config', purpose: 'Configuration detailing explanations and readiness charts', components: ['Score meter', 'Recommendation advice SVG'], svgId: 'practice-benchmark', svgLabel: 'Readiness Benchmark' },
      { id: 'commonMistakeDetection', label: 'Common Mistake Detection', purpose: 'A system to scan student answers for typical misunderstandings', components: ['Misconception prompt', 'Dynamic help hint'] },
      { id: 'performanceAnalytics', label: 'Performance Analytics', purpose: 'Radar or bar charts charting student strength across subtopics', components: ['Radar chart', 'Strength breakdown'] },
      { id: 'revisionRecommendations', label: 'Revision Recommendations', purpose: 'Smart revision resources recommended based on quiz performance', components: ['Recommended resources links'] }
    ]
  },
  {
    id: 'assignment',
    label: '9. Assignment',
    description: 'Individual developer tasks, duration specs, objectives, and starter templates.',
    color: 'from-rose-500 to-pink-500',
    glowColor: 'rgba(244, 63, 94, 0.4)',
    subsections: [
      { id: 'title', label: 'Title', purpose: 'Main assignment header card', components: ['Task title', 'XP Reward indicator', 'Difficulty badge'], svgId: 'assignment-hero', svgLabel: 'Assignment Hero Dashboard' },
      { id: 'description', label: 'Description', purpose: 'Introductory problem context details', components: ['Summary text'] },
      { id: 'duration', label: 'Duration Spec', purpose: 'Estimated time limit to build this task', components: ['Estimated hours badge'] },
      { id: 'task', label: 'Task Steps', purpose: 'Step-by-step task flow infographic guiding the build', components: ['Task flow SVG infographic'], svgId: 'assignment-workflow', svgLabel: 'Task Workflow Diagram' },
      { id: 'objectives', label: 'Objectives', purpose: 'Surgical learning goals to achieve', components: ['Target milestones checklist'] },
      { id: 'starterCode', label: 'Starter Code', purpose: 'Starter template code snippet', components: ['Pre-populated starter editor'] },
      { id: 'submissionGuidelines', label: 'Submission Rules', purpose: 'Guidelines to submit and verify code', components: ['Verification terminal steps'] }
    ]
  },
  {
    id: 'project',
    label: '10. Project',
    description: 'Capstone project guides, multi-phase build plans, and target deliverables.',
    color: 'from-indigo-500 to-violet-600',
    glowColor: 'rgba(99, 102, 241, 0.4)',
    subsections: [
      { id: 'title', label: 'Title', purpose: 'Main capstone project dashboard header card', components: ['Project Title', 'Career relevance context'], svgId: 'project-hero', svgLabel: 'Project Hero Dashboard' },
      { id: 'description', label: 'Description', purpose: 'Complete production spec details', components: ['Operational objectives brief'] },
      { id: 'buildItems', label: 'Build Phases', purpose: 'Detailed timeline roadmap guiding development phases', components: ['Phased roadmap SVG diagram'], svgId: 'project-roadmap', svgLabel: 'Development Roadmap' },
      { id: 'deliverables', label: 'Deliverables List', purpose: 'Blueprint detailing exact system layers to submit', components: ['Target output deliverables', 'System architecture blueprint SVG'], svgId: 'project-architecture', svgLabel: 'System Architecture' }
    ]
  },
  {
    id: 'interview',
    label: '11. Interview Prep',
    description: 'Core interview Q&A bank, confidence frameworks, and mock dialogue flow.',
    color: 'from-pink-600 to-orange-600',
    glowColor: 'rgba(219, 39, 119, 0.4)',
    subsections: [
      { id: 'title', label: 'Title', purpose: 'Main interview preparation dashboard header', components: ['Prep title', 'Confidence framework illustration SVG'], svgId: 'interview-hero', svgLabel: 'Interview Prep Hero' },
      { id: 'description', label: 'Description', purpose: 'Introductory context for job seekers', components: ['Aspirational job role matching tags'] },
      { id: 'interviewIntroCard', label: 'Interview Intro', purpose: 'Introduction to common question types', components: ['Intro details list'] },
      { id: 'questionBankPanel', label: 'Question Bank', purpose: 'Interactive question bank with accordion panels', components: ['Question list', 'Show answer buttons'] },
      { id: 'answerFrameworkCard', label: 'Answer Framework', purpose: 'The structure of a perfect answer (e.g. STAR method)', components: ['STAR method cards', 'Protip badges'] },
      { id: 'mockInterviewFlow', label: 'Mock Interview Flow', purpose: 'Simulated mock interviewer-student dialogue cards', components: ['Dialog bubbles', 'Feedback ratings'] }
    ]
  },
  {
    id: 'quiz',
    label: '12. Quiz',
    description: 'Canonical conceptual multiple choice questions to grade readiness.',
    color: 'from-indigo-600 to-blue-600',
    glowColor: 'rgba(79, 70, 229, 0.4)',
    subsections: [
      { id: 'title', label: 'Title', purpose: 'Main quiz evaluation dashboard header', components: ['Evaluation title', 'Grade requirements'], svgId: 'quiz-hero', svgLabel: 'Quiz Evaluation Hero' },
      { id: 'description', label: 'Description', purpose: 'Rules and timing advice context', components: ['Description text'] },
      { id: 'totalQuestions', label: 'Total Questions Count', purpose: 'Metric showing number of items to complete', components: ['Total questions badge'] },
      { id: 'questions', label: 'Questions Pool', purpose: 'The full multiple choice questions array pool', components: ['Interactive option buttons', 'Question prompt block'] }
    ]
  },
  {
    id: 'summary',
    label: '13. Summary',
    description: 'Rapid revision checklist, mastery recap cards, and next step guidelines.',
    color: 'from-teal-600 to-emerald-600',
    glowColor: 'rgba(13, 148, 136, 0.4)',
    subsections: [
      { id: 'title', label: 'Title', purpose: 'Main summary review header card', components: ['Summary heading', 'Rapid revision intent'] },
      { id: 'description', label: 'Description', purpose: 'High-level synthesis overview text', components: ['Synthesis brief'] },
      { id: 'masteryRecapCard', label: 'Mastery Recap Card', purpose: 'Personalized recap showing confidence signal and SVG infographic', components: ['Recap list', 'SVG mastery infographic'], svgId: 'summary-hero', svgLabel: 'Mastery Summary Infographic' },
      { id: 'keyTakeawayGrid', label: 'Key Takeaway Grid', purpose: 'Grid of most important architectural concepts', components: ['3-column takeaway cards'] },
      { id: 'revisionChecklist', label: 'Revision Checklist', purpose: 'A detailed interactive checked milestone list', components: ['Interactive checkmark buttons'] },
      { id: 'nextStepPanel', label: 'Next Step Panel', purpose: 'Advice on next lessons or actions to take', components: ['Action button links'] }
    ]
  },
  {
    id: 'ai_tutor',
    label: '14. AI Tutor',
    description: 'Adaptive hints, misconceptions detector, and interactive tutor system prompt configuration.',
    color: 'from-fuchsia-600 to-pink-600',
    glowColor: 'rgba(192, 38, 211, 0.4)',
    subsections: [
      { id: 'greeting', label: 'Greeting', purpose: 'Welcoming greeting customized to student profile', components: ['Greeting headline'] },
      { id: 'qaPairs', label: 'Q&A Pairs', purpose: 'Pool of dialog prompts and predefined chatbot answers', components: ['Dialogue card bubble pool'] },
      { id: 'tutorPromptCard', label: 'Tutor Prompt Card', purpose: 'AI system prompt parameters and starter prompts', components: ['System prompt layout specs'] },
      { id: 'misconceptionDetector', label: 'Misconception Detector', purpose: 'Scans student input for common errors and corrects them', components: ['Correction cards', 'SVG misconception graph'], svgId: 'tutor-conversation', svgLabel: 'Misconception Scan Visual' },
      { id: 'adaptiveHintPanel', label: 'Adaptive Hint Panel', purpose: 'Incremental hints guiding student to solution', components: ['Progressive hints accordion list'] }
    ]
  }
];
