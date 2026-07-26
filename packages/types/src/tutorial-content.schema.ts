import { z } from 'zod';

export const ContentImageSchema = z
  .object({
    type: z.enum(['svg_standard', 'r2_custom']),
    svgKey: z.string().nullable(),
    url: z.string().url().nullable(),
    alt: z.string().min(10),
    caption: z.string().max(120).nullable(),
    position: z.enum(['right', 'bottom', 'inline']),
    width: z.number().int().min(50).max(1200),
  })
  .refine(
    (data) =>
      (data.type === 'svg_standard' && data.svgKey !== null && data.url === null) ||
      (data.type === 'r2_custom' && data.url !== null && data.svgKey === null),
    { message: 'svg_standard requires svgKey, r2_custom requires url — not both' }
  )
  .refine(
    (data) => data.type !== 'r2_custom' || data.url!.startsWith('https://cdn.realtutorialhub.com/'),
    { message: 'Image URL must be from trusted CDN only' }
  );

export type ContentImage = z.infer<typeof ContentImageSchema>;


const BaseModularSchema = z.object({
  layout: z.any().optional(),
  spacing: z.any().optional(),
});

// --- SECTION-SPECIFIC MODULAR SCHEMAS (Sync with UI/UX Spec Templates) ---

const OverviewModularSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  metadata: z.any().optional(),
  hero: z.any().optional(),
  progressSummary: z.any().optional(),
  learningRoadmap: z.any().optional(),
  contentCards: z.array(z.any()).optional(),
  taskCards: z.array(z.any()).optional(),
  sidebar: z.any().optional(),
  navigation: z.any().optional(),
  rightSidebar: z.any().optional(),
}).merge(BaseModularSchema);

const NotesModularSchema = z.object({
  definition_block: z.any().optional(),
  concept_card: z.any().optional(),
  component_grid: z.any().optional(),
  syntax_block: z.any().optional(),
  example_panel: z.any().optional(),
  practice_card: z.any().optional(),
  warning_faq: z.any().optional(),
  summary_card: z.any().optional(),
}).merge(BaseModularSchema);

const LaymanModularSchema = z.object({
  intro_card: z.any().optional(),
  analogy_card: z.any().optional(),
  benefit_card: z.any().optional(),
  use_case_grid: z.any().optional(),
  accordion: z.any().optional(),
  diagram_renderer: z.any().optional(),
  faq_block: z.any().optional(),
  summary_card: z.any().optional(),
  simpleOverview: z.any().optional(),
  everydayAnalogy: z.any().optional(),
  whyItExists: z.any().optional(),
  simpleUseCases: z.any().optional(),
  beginnerBreakdown: z.any().optional(),
  visualAnalogy: z.any().optional(),
  introCard: z.any().optional(),
  analogyCard: z.any().optional(),
  benefitCard: z.any().optional(),
  useCaseGrid: z.any().optional(),
  diagramRenderer: z.any().optional(),
  faqBlock: z.any().optional(),
  summaryCard: z.any().optional(),
  mentalModel: z.any().optional(),
  commonConfusions: z.any().optional(),
  simpleRecap: z.any().optional(),
}).merge(BaseModularSchema);

const VisualModularSchema = z.object({
  visual_intro_card: z.any().optional(),
  diagram_panel: z.any().optional(),
  flow_sequence_panel: z.any().optional(),
  comparison_diagram: z.any().optional(),
  mental_model_canvas: z.any().optional(),
  real_world_visual_block: z.any().optional(),
  confusion_resolution_diagram: z.any().optional(),
  summary_infographic: z.any().optional(),
  visualOverview: z.any().optional(),
  conceptDiagram: z.any().optional(),
  flowchartExplanation: z.any().optional(),
  comparisonChart: z.any().optional(),
  timelineVisualization: z.any().optional(),
  architectureDiagram: z.any().optional(),
  mindMap: z.any().optional(),
  visualSummary: z.any().optional(),
  conceptVisualIntro: z.any().optional(),
  diagrammaticBreakdown: z.any().optional(),
  stepByStepVisualFlow: z.any().optional(),
  comparativeVisualization: z.any().optional(),
  mentalModelVisualization: z.any().optional(),
  realWorldVisualMapping: z.any().optional(),
  commonConfusionVisualization: z.any().optional(),
}).merge(BaseModularSchema);

const RealLifeModularSchema = z.object({
  context_intro_card: z.any().optional(),
  industry_example_card: z.any().optional(),
  career_use_case_grid: z.any().optional(),
  problem_solution_panel: z.any().optional(),
  workflow_renderer: z.any().optional(),
  decision_framework_card: z.any().optional(),
  mistake_prevention_block: z.any().optional(),
  practical_summary_card: z.any().optional(),
  industry_scenario: z.any().optional(),
  concept_mapping: z.any().optional(),
  interactive_case_study: z.any().optional(),
  domain_scenarios: z.any().optional(),
  pro_execution_tips: z.any().optional(),
  career_relevance: z.any().optional(),
  practical_recap: z.any().optional(),
  industryUseCase: z.any().optional(),
  conceptMapping: z.any().optional(),
  dailyLifeExample: z.any().optional(),
  problemSolutionContext: z.any().optional(),
  businessApplication: z.any().optional(),
  domainScenarios: z.any().optional(),
  practicalRecap: z.any().optional(),
  careerRelevance: z.any().optional(),
}).merge(BaseModularSchema);

const TechnicalModularSchema = z.object({
  technical_definition_block: z.any().optional(),
  system_mechanics_panel: z.any().optional(),
  architecture_diagram_block: z.any().optional(),
  performance_analysis_panel: z.any().optional(),
  tradeoff_matrix: z.any().optional(),
  pattern_library: z.any().optional(),
  enterprise_use_case_panel: z.any().optional(),
  technical_summary_card: z.any().optional(),
  expert_intro_panel: z.any().optional(),
  deep_system_breakdown: z.any().optional(),
  interactive_architecture_workspace: z.any().optional(),
  benchmark_dashboard: z.any().optional(),
  decision_framework_panel: z.any().optional(),
  architecture_pattern_repository: z.any().optional(),
  real_world_scaling_dashboard: z.any().optional(),
  expert_revision_summary: z.any().optional(),
  coreTechnicalDefinition: z.any().optional(),
  mechanismBreakdown: z.any().optional(),
  architectureWorkspace: z.any().optional(),
  performanceTradeoffs: z.any().optional(),
  expertRevisionSummary: z.any().optional(),
  deepSystemBreakdown: z.any().optional(),
  interactiveArchitectureWorkspace: z.any().optional(),
  benchmarkDashboard: z.any().optional(),
  decisionFrameworkPanel: z.any().optional(),
  architecturePatternRepository: z.any().optional(),
  realWorldScalingDashboard: z.any().optional(),
}).merge(BaseModularSchema);

const CodeModularSchema = z.object({
  problem_context_card: z.any().optional(),
  code_block: z.any().optional(),
  annotated_code_panel: z.any().optional(),
  output_preview: z.any().optional(),
  optimized_code_block: z.any().optional(),
  error_prevention_block: z.any().optional(),
  project_usage_panel: z.any().optional(),
  code_summary_card: z.any().optional(),
  problem_intro_workspace: z.any().optional(),
  primary_code_workspace: z.any().optional(),
  guided_code_breakdown: z.any().optional(),
  live_execution_preview: z.any().optional(),
  best_practice_code_workspace: z.any().optional(),
  mistake_prevention_dashboard: z.any().optional(),
  final_implementation_summary: z.any().optional(),
  problemContextCard: z.any().optional(),
  codeBlock: z.any().optional(),
  annotatedCodePanel: z.any().optional(),
  outputPreview: z.any().optional(),
  optimizedCodeBlock: z.any().optional(),
  errorPreventionBlock: z.any().optional(),
  projectUsagePanel: z.any().optional(),
  codeSummaryCard: z.any().optional(),
  problemIntroWorkspace: z.any().optional(),
  primaryCodeWorkspace: z.any().optional(),
  guidedCodeBreakdown: z.any().optional(),
  liveExecutionPreview: z.any().optional(),
  bestPracticeCodeWorkspace: z.any().optional(),
  mistakePreventionDashboard: z.any().optional(),
  finalImplementationSummary: z.any().optional(),
  developer_revision_summary: z.any().optional(),
  problemContext: z.any().optional(),
  basicCodeExample: z.any().optional(),
  lineByLineExplanation: z.any().optional(),
  outputDemonstration: z.any().optional(),
  commonMistakes: z.any().optional(),
  realWorldImplementation: z.any().optional(),
  codeSummary: z.any().optional(),
}).merge(BaseModularSchema);

const QuizModularSchema = z.object({
  quiz_intro_card: z.any().optional(),
  question_block: z.any().optional(),
  timed_challenge_panel: z.any().optional(),
  adaptive_quiz_flow: z.any().optional(),
  instant_feedback_card: z.any().optional(),
  performance_snapshot_panel: z.any().optional(),
  weakness_detection_block: z.any().optional(),
  next_step_recommendation_card: z.any().optional(),
  quizOverview: z.any().optional(),
  questions: z.array(z.any()).optional(),
  quizResults: z.any().optional(),
}).merge(BaseModularSchema);

const PracticeModularSchema = z.object({
  assessment_intro_card: z.any().optional(),
  mcq_block: z.any().optional(),
  scenario_test_panel: z.any().optional(),
  adaptive_test_flow: z.any().optional(),
  feedback_explanation_card: z.any().optional(),
  mistake_analysis_panel: z.any().optional(),
  score_dashboard: z.any().optional(),
  remediation_path_panel: z.any().optional(),
  testOverview: z.any().optional(),
  theoryQuestions: z.any().optional(),
  practicalQuestions: z.any().optional(),
  testResults: z.any().optional(),
}).merge(BaseModularSchema);

const AssignmentModularSchema = z.object({
  assignment_brief_card: z.any().optional(),
  objective_panel: z.any().optional(),
  task_flow_block: z.any().optional(),
  submission_requirements_panel: z.any().optional(),
  rubric_matrix: z.any().optional(),
  real_world_project_panel: z.any().optional(),
  mistake_prevention_panel: z.any().optional(),
  assignment_summary_card: z.any().optional(),
  assignmentOverview: z.any().optional(),
  taskRequirements: z.any().optional(),
  starterCode: z.any().optional(),
}).merge(BaseModularSchema);

const ProjectModularSchema = z.object({
  project_vision_card: z.any().optional(),
  business_objective_panel: z.any().optional(),
  architecture_master_block: z.any().optional(),
  module_breakdown_grid: z.any().optional(),
  development_workflow_panel: z.any().optional(),
  deployment_scaling_panel: z.any().optional(),
  risk_management_panel: z.any().optional(),
  project_summary_card: z.any().optional(),
  projectOverview: z.any().optional(),
  featureRequirements: z.any().optional(),
  implementationGuide: z.any().optional(),
}).merge(BaseModularSchema);

const SummaryModularSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  metadata: z.any().optional(),
  mastery_recap_card: z.any().optional(),
  key_takeaway_grid: z.any().optional(),
  revision_checklist: z.any().optional(),
  next_step_panel: z.any().optional(),
  masteryRecapCard: z.any().optional(),
  keyTakeawayGrid: z.any().optional(),
  revisionChecklist: z.any().optional(),
  nextStepPanel: z.any().optional(),
}).merge(BaseModularSchema);

const InterviewModularSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  metadata: z.any().optional(),
  interview_intro_card: z.any().optional(),
  question_bank_panel: z.any().optional(),
  answer_framework_card: z.any().optional(),
  mock_interview_flow: z.any().optional(),
  interviewIntroCard: z.any().optional(),
  questionBankPanel: z.any().optional(),
  answerFrameworkCard: z.any().optional(),
  mockInterviewFlow: z.any().optional(),
}).merge(BaseModularSchema);

const AITutorModularSchema = z.object({
  greeting: z.string().optional(),
  qa_pairs: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })).optional(),
  qaPairs: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })).optional(),
  metadata: z.any().optional(),
  tutor_prompt_card: z.any().optional(),
  misconception_detector: z.any().optional(),
  adaptive_hint_panel: z.any().optional(),
  tutorPromptCard: z.any().optional(),
  misconceptionDetector: z.any().optional(),
  adaptiveHintPanel: z.any().optional(),
}).merge(BaseModularSchema);

// --- MAIN WRAPPER SCHEMA ---

export const TutorialContentSchema = z.object({
  overview: OverviewModularSchema.optional(),
  notes: z.union([
    z.object({ markdown: z.string().min(1), image: ContentImageSchema.optional().nullable() }).merge(BaseModularSchema),
    NotesModularSchema
  ]),
  layman: z.union([
    z.object({
      simpleExplanation: z.string().min(1),
      analogyOrStory: z.string().min(1),
      example1: z.object({ company: z.string().min(1), content: z.string().min(1) }).merge(BaseModularSchema),
      example2: z.object({ company: z.string().min(1), content: z.string().min(1) }),
      image: ContentImageSchema.optional().nullable(),
    }),
    LaymanModularSchema
  ]),
  real_life: z.union([
    z.object({
      title: z.string().min(1),
      scenario: z.string().min(1),
      bullets: z.array(z.object({ label: z.string().min(1), detail: z.string().min(1) })),
      tip: z.string().min(1),
      image: ContentImageSchema.optional().nullable(),
    }).merge(BaseModularSchema),
    RealLifeModularSchema
  ]),
  technical: z.union([
    z.object({
      markdown: z.string().min(1),
      bullets: z.array(z.object({ term: z.string().min(1), detail: z.string().min(1) })),
      tip: z.string().min(1),
      image: ContentImageSchema.optional().nullable(),
    }).merge(BaseModularSchema),
    TechnicalModularSchema
  ]),
  code: z.union([
    z.object({
      language: z.enum(['javascript', 'typescript', 'python', 'sql', 'scala', 'java', 'bash']),
      intro: z.string().min(1),
      code: z.string().min(1),
      steps: z.array(z.string().min(1)),
      image: ContentImageSchema.optional().nullable(),
    }).merge(BaseModularSchema),
    CodeModularSchema
  ]),
  visual: VisualModularSchema.optional(),
  quiz: QuizModularSchema.optional(),
  practice: PracticeModularSchema.optional(),
  assignment: AssignmentModularSchema.optional(),
  project: ProjectModularSchema.optional(),
  summary: SummaryModularSchema.optional(),
  interview: InterviewModularSchema.optional(),
  ai_tutor: z.union([
    z.object({
      greeting: z.string().min(1),
      qa_pairs: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })),
    }),
    AITutorModularSchema,
  ]).optional(),
});

export type TutorialContentJSON = z.infer<typeof TutorialContentSchema>;
