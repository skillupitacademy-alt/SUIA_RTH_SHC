export interface DomainTheme {
  breadcrumbBg: string;
  sidebarAccent: string;
  activeItem: string;
  blockLayman: string;
  blockLaymanHeader: string;
  blockRealLife: string;
  blockRealLifeHeader: string;
  blockTechnical: string;
  blockTechnicalHeader: string;
  blockCode: string;
  blockCodeHeader: string;
  blockAITutor: string;
  blockAITutorHeader: string;
  blockNotes: string;
  blockNotesHeader: string;
  blockPractice: string;
  blockPracticeHeader: string;
  blockAssignment: string;
  blockAssignmentHeader: string;
  blockProject: string;
  blockProjectHeader: string;
  blockQuiz: string;
  blockQuizHeader: string;
  blockVisual: string;
  blockVisualHeader: string;
  blockSummary: string;
  blockSummaryHeader: string;
  blockInterview: string;
  blockInterviewHeader: string;
  progressFill: string;
  quizBtn: string;
  domainIcon: string;
}

export const DOMAIN_THEMES: Record<'indigo' | 'blue' | 'teal' | 'steel', DomainTheme> = {
  indigo: {
    breadcrumbBg: 'linear-gradient(135deg, #3b4f7a 0%, #4f6292 50%, #6b82b5 100%)',
    sidebarAccent: '#3d5a9e',
    activeItem: '#4f6aad',
    blockLayman: 'linear-gradient(135deg, #e8f0fe 0%, #dce8fd 100%)',
    blockLaymanHeader: '#3d5a9e',
    blockRealLife: 'linear-gradient(135deg, #e6f4ea 0%, #d4edda 100%)',
    blockRealLifeHeader: '#2e7d46',
    blockTechnical: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
    blockTechnicalHeader: '#e65100',
    blockCode: 'linear-gradient(135deg, #263238 0%, #1e272e 100%)',
    blockCodeHeader: '#546e7a',
    blockAITutor: 'linear-gradient(135deg, #f3e5f5 0%, #e8d5f0 100%)',
    blockAITutorHeader: '#6a1b9a',
    blockNotes: 'linear-gradient(135deg, #fffde7 0%, #fff9c4 100%)',
    progressFill: '#f9a825',
    quizBtn: 'linear-gradient(135deg, #f57c00 0%, #ef6c00 100%)',
    domainIcon: 'globe',
      blockNotesHeader: '#3d5a9e',
    blockPractice: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)',
    blockPracticeHeader: '#3d5a9e',
    blockAssignment: 'linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%)',
    blockAssignmentHeader: '#c53030',
    blockProject: 'linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%)',
    blockProjectHeader: '#276749',
    blockQuiz: 'linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%)',
    blockQuizHeader: '#2b6cb0',
    blockVisual: 'linear-gradient(135deg, #faf5ff 0%, #e9d8fd 100%)',
    blockVisualHeader: '#6b46c1',
    blockSummary: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
    blockSummaryHeader: '#0f766e',
    blockInterview: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
    blockInterviewHeader: '#c2410c',
},
  blue: {
    breadcrumbBg: 'linear-gradient(135deg, #1a3a6b 0%, #2557a7 50%, #4472c4 100%)',
    sidebarAccent: '#2557a7',
    activeItem: '#3568b8',
    blockLayman: 'linear-gradient(135deg, #e3eeff 0%, #d4e4fb 100%)',
    blockLaymanHeader: '#2557a7',
    blockRealLife: 'linear-gradient(135deg, #e6f4ea 0%, #d4edda 100%)',
    blockRealLifeHeader: '#2e7d46',
    blockTechnical: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
    blockTechnicalHeader: '#e65100',
    blockCode: 'linear-gradient(135deg, #1a2332 0%, #0d1520 100%)',
    blockCodeHeader: '#4a7c9e',
    blockAITutor: 'linear-gradient(135deg, #f3e5f5 0%, #e1d0ee 100%)',
    blockAITutorHeader: '#6a1b9a',
    blockNotes: 'linear-gradient(135deg, #fffde7 0%, #fff8e1 100%)',
    progressFill: '#f9a825',
    quizBtn: 'linear-gradient(135deg, #f57c00 0%, #e65100 100%)',
    domainIcon: 'chart',
      blockNotesHeader: '#2557a7',
    blockPractice: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)',
    blockPracticeHeader: '#2557a7',
    blockAssignment: 'linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%)',
    blockAssignmentHeader: '#c53030',
    blockProject: 'linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%)',
    blockProjectHeader: '#276749',
    blockQuiz: 'linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%)',
    blockQuizHeader: '#2b6cb0',
    blockVisual: 'linear-gradient(135deg, #faf5ff 0%, #e9d8fd 100%)',
    blockVisualHeader: '#6b46c1',
    blockSummary: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
    blockSummaryHeader: '#0f766e',
    blockInterview: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
    blockInterviewHeader: '#c2410c',
},
  teal: {
    breadcrumbBg: 'linear-gradient(135deg, #1a5c5c 0%, #2e7d72 50%, #4caf9f 100%)',
    sidebarAccent: '#2e7d72',
    activeItem: '#3d9e92',
    blockLayman: 'linear-gradient(135deg, #e0f5f2 0%, #d0ece8 100%)',
    blockLaymanHeader: '#2e7d72',
    blockRealLife: 'linear-gradient(135deg, #e8f5e9 0%, #d4edda 100%)',
    blockRealLifeHeader: '#2e7d46',
    blockTechnical: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
    blockTechnicalHeader: '#e65100',
    blockCode: 'linear-gradient(135deg, #1a2332 0%, #0d1520 100%)',
    blockCodeHeader: '#4a7c7e',
    blockAITutor: 'linear-gradient(135deg, #f3e5f5 0%, #e1d0ee 100%)',
    blockAITutorHeader: '#6a1b9a',
    blockNotes: 'linear-gradient(135deg, #fffde7 0%, #fff8e1 100%)',
    progressFill: '#f9a825',
    quizBtn: 'linear-gradient(135deg, #f57c00 0%, #e65100 100%)',
    domainIcon: 'brain',
      blockNotesHeader: '#2e7d72',
    blockPractice: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)',
    blockPracticeHeader: '#2e7d72',
    blockAssignment: 'linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%)',
    blockAssignmentHeader: '#c53030',
    blockProject: 'linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%)',
    blockProjectHeader: '#276749',
    blockQuiz: 'linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%)',
    blockQuizHeader: '#2b6cb0',
    blockVisual: 'linear-gradient(135deg, #faf5ff 0%, #e9d8fd 100%)',
    blockVisualHeader: '#6b46c1',
    blockSummary: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
    blockSummaryHeader: '#0f766e',
    blockInterview: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
    blockInterviewHeader: '#c2410c',
},
  steel: {
    breadcrumbBg: 'linear-gradient(135deg, #1c2833 0%, #2e4057 50%, #485e76 100%)',
    sidebarAccent: '#2e4057',
    activeItem: '#3d5470',
    blockLayman: 'linear-gradient(135deg, #e8edf5 0%, #d8e4f0 100%)',
    blockLaymanHeader: '#2e4057',
    blockRealLife: 'linear-gradient(135deg, #e6f4ea 0%, #d4edda 100%)',
    blockRealLifeHeader: '#2e7d46',
    blockTechnical: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
    blockTechnicalHeader: '#e65100',
    blockCode: 'linear-gradient(135deg, #1a1f2e 0%, #0d1018 100%)',
    blockCodeHeader: '#546880',
    blockAITutor: 'linear-gradient(135deg, #f3e5f5 0%, #e1d0ee 100%)',
    blockAITutorHeader: '#6a1b9a',
    blockNotes: 'linear-gradient(135deg, #fffde7 0%, #fff8e1 100%)',
    progressFill: '#f9a825',
    quizBtn: 'linear-gradient(135deg, #f57c00 0%, #e65100 100%)',
    domainIcon: 'gear',
      blockNotesHeader: '#2e4057',
    blockPractice: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)',
    blockPracticeHeader: '#2e4057',
    blockAssignment: 'linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%)',
    blockAssignmentHeader: '#c53030',
    blockProject: 'linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%)',
    blockProjectHeader: '#276749',
    blockQuiz: 'linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%)',
    blockQuizHeader: '#2b6cb0',
    blockVisual: 'linear-gradient(135deg, #faf5ff 0%, #e9d8fd 100%)',
    blockVisualHeader: '#6b46c1',
    blockSummary: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
    blockSummaryHeader: '#0f766e',
    blockInterview: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
    blockInterviewHeader: '#c2410c',
},
};

export function getDomainTheme(domainSlug: string): DomainTheme {
  const themeMap: Record<string, keyof typeof DOMAIN_THEMES> = {
    'full-stack': 'indigo',
    'web-development': 'indigo',
    'data-analyst': 'blue',
    'data-analysis': 'blue',
    'data-science': 'teal',
    'data-engineering': 'steel',
  };

  const key = themeMap[domainSlug.toLowerCase()] ?? 'indigo';
  return DOMAIN_THEMES[key];
}
