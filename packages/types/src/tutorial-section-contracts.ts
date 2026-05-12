export type TutorialSectionId =
  | 'overview'
  | 'notes'
  | 'layman'
  | 'visual'
  | 'real_life'
  | 'technical'
  | 'code'
  | 'practice'
  | 'assignment'
  | 'project'
  | 'quiz'
  | 'summary'
  | 'interview'
  | 'ai_tutor';

export type TutorialPromptSectionId = 'master' | Exclude<TutorialSectionId, 'real_life'> | 'reallife';
export type TutorialAdminSectionId = TutorialSectionId | 'reallife';
export type TutorialContentManagerSectionId = Exclude<TutorialAdminSectionId, 'real_life'>;

export interface TutorialSectionContract {
  dbType: TutorialSectionId;
  adminId: TutorialAdminSectionId;
  promptId: TutorialPromptSectionId;
  label: string;
  promptLabel: string;
  marker: string;
  tab: string;
  orderIndex: number;
  rootKeys: readonly string[];
  architectureKeys: readonly string[];
  uiuxKeys: readonly string[];
  schemaHints: readonly string[];
  mapperHints: readonly string[];
  rendererHints: readonly string[];
}

export const TUTORIAL_SECTION_DOC_PATHS = {
  architecture: 'docs/completeproject/TutorialPageComponents/AllSectionTutorialPage.json',
  uiuxDetailed: 'docs/completeproject/TutorialPageComponents/AllSectionTutorialPageUIUXDetailed.json',
} as const;

export const TUTORIAL_SECTION_CONTRACTS = [
  {
    dbType: 'overview',
    adminId: 'overview',
    promptId: 'overview',
    label: 'Overview',
    promptLabel: '1. Overview',
    marker: 'O',
    tab: 'overview',
    orderIndex: 1,
    rootKeys: ['overview'],
    architectureKeys: ['overview_section_architecture', 'overview_section_uiux_architecture'],
    uiuxKeys: ['overview_section_default_templates', 'overview_section_layout_template_defaults'],
    schemaHints: ['OverviewModularSchema', 'overview:'],
    mapperHints: ['transformOverviewSection', 'overviewContent'],
    rendererHints: ['SubtopicViewPage', 'SubtopicHeader', 'SubtopicContentGrid'],
  },
  {
    dbType: 'notes',
    adminId: 'notes',
    promptId: 'notes',
    label: 'Notes Section',
    promptLabel: '2. Notes',
    marker: 'N',
    tab: 'notes',
    orderIndex: 2,
    rootKeys: ['notes'],
    architectureKeys: ['notes_section_architecture', 'notes_section_uiux_architecture'],
    uiuxKeys: ['notes_section_default_templates', 'notes_section_layout_template_defaults'],
    schemaHints: ['NotesModularSchema', 'notes:'],
    mapperHints: ['normalizeNotesSection', 'definitionBlock'],
    rendererHints: ['NotesMainContent'],
  },
  {
    dbType: 'layman',
    adminId: 'layman',
    promptId: 'layman',
    label: 'Layman Explanation',
    promptLabel: '3. Layman',
    marker: 'L',
    tab: 'layman',
    orderIndex: 3,
    rootKeys: ['laymanExplanation', 'layman'],
    architectureKeys: ['layman_section_architecture'],
    uiuxKeys: ['layman_section_default_templates', 'layman_section_layout_template_defaults'],
    schemaHints: ['LaymanModularSchema', 'layman:'],
    mapperHints: ['normalizeLaymanSection', 'simpleOverview'],
    rendererHints: ['LaymanExplanationContent'],
  },
  {
    dbType: 'real_life',
    adminId: 'reallife',
    promptId: 'reallife',
    label: 'Real Life Examples',
    promptLabel: '4. Real Life',
    marker: 'R',
    tab: 'real-life',
    orderIndex: 4,
    rootKeys: ['realLifeExamples', 'real_life', 'reallife'],
    architectureKeys: ['real_life_example_section_architecture', 'real_life_example_section_uiux_architecture'],
    uiuxKeys: ['real_life_example_section_default_templates', 'real_life_example_section_layout_template_defaults'],
    schemaHints: ['RealLifeModularSchema', 'real_life:'],
    mapperHints: ['normalizeRealLifeSection', 'conceptMapping'],
    rendererHints: ['RealLifeExamplesContent'],
  },
  {
    dbType: 'technical',
    adminId: 'technical',
    promptId: 'technical',
    label: 'Technical Deep Dive',
    promptLabel: '5. Technical',
    marker: 'T',
    tab: 'technical-deep-dive',
    orderIndex: 5,
    rootKeys: ['technicalDeepDive', 'technical'],
    architectureKeys: ['technical_deep_dive_section_architecture', 'technical_deep_dive_section_uiux_architecture'],
    uiuxKeys: ['technical_deep_dive_section_default_templates', 'technical_deep_dive_section_layout_template_defaults'],
    schemaHints: ['TechnicalModularSchema', 'technical:'],
    mapperHints: ['technicalContent'],
    rendererHints: ['TechnicalDeepDiveContent'],
  },
  {
    dbType: 'code',
    adminId: 'code',
    promptId: 'code',
    label: 'Code Example',
    promptLabel: '6. Code Example',
    marker: 'C',
    tab: 'code-example',
    orderIndex: 6,
    rootKeys: ['codeExample', 'code'],
    architectureKeys: ['code_example_section_architecture', 'code_example_section_uiux_architecture'],
    uiuxKeys: ['code_example_section_default_templates', 'code_example_section_layout_template_defaults'],
    schemaHints: ['CodeModularSchema', 'code:'],
    mapperHints: ['normalizeCodeSection', 'problemContext'],
    rendererHints: ['CodeExampleContent'],
  },
  {
    dbType: 'visual',
    adminId: 'visual',
    promptId: 'visual',
    label: 'Visual Explanation',
    promptLabel: '7. Visual',
    marker: 'V',
    tab: 'visual-explanation',
    orderIndex: 7,
    rootKeys: ['visualExplanation', 'visual'],
    architectureKeys: ['visual_explanation_section_architecture', 'visual_explanation_section_uiux_architecture'],
    uiuxKeys: ['visual_explanation_section_default_templates', 'visual_explanation_section_layout_template_defaults'],
    schemaHints: ['VisualModularSchema', 'visual:'],
    mapperHints: ['normalizeVisualSection', 'conceptVisualIntro'],
    rendererHints: ['VisualExplanationContent'],
  },
  {
    dbType: 'practice',
    adminId: 'practice',
    promptId: 'practice',
    label: 'Practice Test',
    promptLabel: '8. Practice Test',
    marker: 'P',
    tab: 'practice-test',
    orderIndex: 8,
    rootKeys: ['practiceTest', 'practice'],
    architectureKeys: ['practice_test_section_architecture', 'practice_test_section_uiux_architecture'],
    uiuxKeys: ['practice_test_section_default_templates', 'practice_test_section_layout_template_defaults'],
    schemaHints: ['PracticeModularSchema', 'practice:'],
    mapperHints: ['normalizePracticeSection', 'assessmentIntro'],
    rendererHints: ['PracticeTestContent'],
  },
  {
    dbType: 'assignment',
    adminId: 'assignment',
    promptId: 'assignment',
    label: 'Assignment',
    promptLabel: '9. Assignment',
    marker: 'A',
    tab: 'assignments',
    orderIndex: 9,
    rootKeys: ['assignment'],
    architectureKeys: ['assignment_section_architecture', 'assignment_section_uiux_architecture'],
    uiuxKeys: ['assignment_section_default_templates', 'assignment_section_layout_template_defaults'],
    schemaHints: ['AssignmentModularSchema', 'assignment:'],
    mapperHints: ['assignmentContent'],
    rendererHints: ['AssignmentContent'],
  },
  {
    dbType: 'project',
    adminId: 'project',
    promptId: 'project',
    label: 'Project',
    promptLabel: '10. Project',
    marker: 'B',
    tab: 'project',
    orderIndex: 10,
    rootKeys: ['project'],
    architectureKeys: ['project_section_architecture', 'project_section_uiux_architecture'],
    uiuxKeys: ['project_section_default_templates', 'project_section_layout_template_defaults'],
    schemaHints: ['ProjectModularSchema', 'project:'],
    mapperHints: ['projectContent'],
    rendererHints: ['ProjectContent'],
  },
  {
    dbType: 'quiz',
    adminId: 'quiz',
    promptId: 'quiz',
    label: 'Quiz',
    promptLabel: '11. Quiz',
    marker: 'Q',
    tab: 'quiz',
    orderIndex: 11,
    rootKeys: ['quiz'],
    architectureKeys: ['quiz_section_architecture', 'quiz_section_uiux_architecture'],
    uiuxKeys: ['quiz_section_default_templates', 'quiz_section_layout_template_defaults'],
    schemaHints: ['QuizModularSchema', 'quiz:'],
    mapperHints: ['quizContent'],
    rendererHints: ['QuizContent'],
  },
  {
    dbType: 'summary',
    adminId: 'summary',
    promptId: 'summary',
    label: 'Summary',
    promptLabel: '12. Summary',
    marker: 'S',
    tab: 'summary',
    orderIndex: 12,
    rootKeys: ['summary'],
    architectureKeys: ['summary_section_architecture', 'summary_section_uiux_architecture'],
    uiuxKeys: ['summary_section_default_templates', 'summary_section_layout_template_defaults'],
    schemaHints: ['SummaryModularSchema', 'summary:'],
    mapperHints: ['summaryContent'],
    rendererHints: ['SummaryContent'],
  },
  {
    dbType: 'interview',
    adminId: 'interview',
    promptId: 'interview',
    label: 'Interview Prep',
    promptLabel: '13. Interview Prep',
    marker: 'I',
    tab: 'interview',
    orderIndex: 13,
    rootKeys: ['interview'],
    architectureKeys: ['interview_section_architecture', 'interview_section_uiux_architecture'],
    uiuxKeys: ['interview_section_default_templates', 'interview_section_layout_template_defaults'],
    schemaHints: ['InterviewModularSchema', 'interview:'],
    mapperHints: ['interviewContent'],
    rendererHints: ['InterviewPrepContent'],
  },
  {
    dbType: 'ai_tutor',
    adminId: 'ai_tutor',
    promptId: 'ai_tutor',
    label: 'AI Tutor',
    promptLabel: '14. AI Tutor',
    marker: 'AI',
    tab: 'ai-tutor',
    orderIndex: 14,
    rootKeys: ['ai_tutor', 'aiTutor', 'aiTutorContent'],
    architectureKeys: ['ai_tutor_section_architecture', 'ai_tutor_section_uiux_architecture'],
    uiuxKeys: ['ai_tutor_section_default_templates', 'ai_tutor_section_layout_template_defaults'],
    schemaHints: ['AITutorModularSchema', 'ai_tutor:'],
    mapperHints: ['aiTutorContent', 'qaPairs'],
    rendererHints: ['AITutorContent'],
  },
] as const satisfies readonly TutorialSectionContract[];

export const TUTORIAL_MASTER_PROMPT_OPTION = {
  id: 'master',
  label: 'Master Prompt',
} as const;

export const TUTORIAL_PROMPT_SECTION_OPTIONS = [
  TUTORIAL_MASTER_PROMPT_OPTION,
  ...TUTORIAL_SECTION_CONTRACTS.map((section) => ({
    id: section.promptId,
    label: section.promptLabel,
  })),
] as const;

export const TUTORIAL_CONTENT_MANAGER_SECTION_OPTIONS = TUTORIAL_SECTION_CONTRACTS.map((section) => ({
  id: section.adminId as TutorialContentManagerSectionId,
  label: section.label,
  marker: section.marker,
  tab: section.tab,
}));

export const TUTORIAL_SECTION_TABS = Object.fromEntries(
  [
    ...TUTORIAL_SECTION_CONTRACTS.map((section) => [section.adminId, section.tab]),
    ['real_life', 'real-life'],
  ]
) as Record<TutorialAdminSectionId, string>;

export function normalizeTutorialAdminSectionId(section: TutorialAdminSectionId): TutorialAdminSectionId {
  return section === 'real_life' ? 'reallife' : section;
}

export function getTutorialSectionContractByAdminId(section: TutorialAdminSectionId): TutorialSectionContract | undefined {
  const normalized = normalizeTutorialAdminSectionId(section);
  return TUTORIAL_SECTION_CONTRACTS.find((contract) => contract.adminId === normalized);
}

export function getTutorialSectionContractByPromptId(section: TutorialPromptSectionId): TutorialSectionContract | undefined {
  if (section === 'master') return undefined;
  return TUTORIAL_SECTION_CONTRACTS.find((contract) => contract.promptId === section);
}

export function getTutorialSectionContractByDbType(section: TutorialSectionId): TutorialSectionContract | undefined {
  return TUTORIAL_SECTION_CONTRACTS.find((contract) => contract.dbType === section);
}

export function buildTutorialSectionSourceNote(section: TutorialSectionContract): string {
  return [
    '**CANONICAL SECTION CONTRACT SOURCE**:',
    `- Education architecture: ${TUTORIAL_SECTION_DOC_PATHS.architecture}`,
    `- UI/UX detail architecture: ${TUTORIAL_SECTION_DOC_PATHS.uiuxDetailed}`,
    `- Architecture keys: ${section.architectureKeys.join(', ')}`,
    `- UI/UX keys: ${section.uiuxKeys.join(', ')}`,
    `- DB section_type: ${section.dbType}`,
    `- Learner tab: ${section.tab}`,
  ].join('\n');
}
