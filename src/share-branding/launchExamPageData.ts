import { BrandConfig } from './brandConfig';

export interface LaunchDomain {
  id: string;
  title: string;
  description: string;
  category: string;
  coverage: number;
  icon: string;
}

export interface LaunchSubject {
  id: string;
  title: string;
  topicCount: number;
}

export interface LaunchTopic {
  id: string;
  title: string;
  subtopicCount: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  parentSubjectId: string;
}

export interface LaunchSubtopic {
  id: string;
  title: string;
  questionCount: number;
  parentTopicId: string;
}

export interface LaunchDifficultyTier {
  id: string;
  title: string;
  description: string;
  icon: 'shuffle' | 'target' | 'trending';
  iconBg: string;
}

export interface LaunchViewData {
  labels: {
    activeSessionTitle: string;
    activeSessionDescription: string;
    activeSessionResumeLabel: string;
    basicModeLabel: string;
    expertModeLabel: string;
    backLabel: string;
    continueLabel: string;
    launchLabel: string;
    exitDialogTitle: string;
    exitDialogDescription: string;
    exitDialogBody: string;
    continueEditingLabel: string;
    exitAnywayLabel: string;
  };
  steps: Array<{ number: number; title: string; subtitle: string }>;
  domainSelection: {
    title: string;
    description: string;
    coverageLabel: string;
    domains: LaunchDomain[];
  };
  subjectSelection: {
    title: string;
    descriptionPrefix: string;
    helperText: string;
    subjectsByDomain: Record<string, LaunchSubject[]>;
  };
  topicSelection: {
    title: string;
    description: string;
    maxSelections: number;
    limitTitle: string;
    limitDescription: string;
    helperFormat: string;
    topicsBySubject: Record<string, LaunchTopic[]>;
  };
  subtopicSelection: {
    title: string;
    description: string;
    helperText: string;
    subtopicsByTopic: Record<string, LaunchSubtopic[]>;
  };
  calibration: {
    title: string;
    description: string;
    difficultyLabel: string;
    questionCountLabel: string;
    previewTitle: string;
    previewDifficultyLabel: string;
    previewQuestionsLabel: string;
    previewTimeLabel: string;
    difficultyTiers: LaunchDifficultyTier[];
    questionCounts: number[];
  };
  summary: {
    title: string;
    domainLabel: string;
    subjectsLabel: string;
    topicsLabel: string;
    subtopicsLabel: string;
    notSelectedLabel: string;
    configurationTitle: string;
    pointsProjectionTitle: string;
    pointsProjectionSubtitle: string;
    progressTitle: string;
  };
}

export interface LaunchExamApiResponse extends LaunchViewData {}

export function mapLaunchExamApiToViewData(api: LaunchExamApiResponse): LaunchViewData {
  return api;
}

function buildLaunchExamApiResponse(): LaunchExamApiResponse {
  return {
    labels: {
      activeSessionTitle: 'Active Session In Progress',
      activeSessionDescription: '"Algebra Fundamentals" is currently active',
      activeSessionResumeLabel: 'Resume',
      basicModeLabel: 'Basic',
      expertModeLabel: 'Expert',
      backLabel: 'Back',
      continueLabel: 'Continue',
      launchLabel: 'Launch Evaluation',
      exitDialogTitle: 'Unsaved Configuration',
      exitDialogDescription: 'Your progress will be lost',
      exitDialogBody: 'Are you sure you want to exit? Your current configuration will not be saved.',
      continueEditingLabel: 'Continue Editing',
      exitAnywayLabel: 'Exit Anyway',
    },
    steps: [
      { number: 1, title: 'Knowledge Mapping', subtitle: 'Select Domain' },
      { number: 2, title: 'Knowledge Mapping', subtitle: 'Select Subjects' },
      { number: 3, title: 'Knowledge Mapping', subtitle: 'Select Topics' },
      { number: 4, title: 'Knowledge Mapping', subtitle: 'Select Subtopics' },
      { number: 5, title: 'Engine Calibration', subtitle: 'Configure Assessment' },
    ],
    domainSelection: {
      title: 'Select Your Domain',
      description: 'Choose the subject area you want to practice',
      coverageLabel: 'Coverage',
      domains: [
        { id: 'fullstack', title: 'Full Stack Development', description: 'Front End, Back End, Database Architecture', category: 'Engineering', coverage: 95, icon: 'code' },
        { id: 'datascience', title: 'Data Science', description: 'ML, Analytics, Statistical Modeling', category: 'Data', coverage: 88, icon: 'brain' },
        { id: 'dataeng', title: 'Data Engineering', description: 'Pipelines, ETL, Data Warehousing', category: 'Data', coverage: 92, icon: 'database' },
        { id: 'cybersecurity', title: 'Cybersecurity', description: 'Security, Penetration Testing, Compliance', category: 'Security', coverage: 85, icon: 'shield' },
        { id: 'devops', title: 'DevOps & Cloud', description: 'CI/CD, Infrastructure, Cloud Architecture', category: 'Operations', coverage: 78, icon: 'cloud' },
        { id: 'mobile', title: 'Mobile Development', description: 'iOS, Android, Cross-Platform', category: 'Engineering', coverage: 72, icon: 'laptop' },
        { id: 'networking', title: 'Network Engineering', description: 'Protocols, Infrastructure, Administration', category: 'Infrastructure', coverage: 68, icon: 'network' },
        { id: 'sysadmin', title: 'System Administration', description: 'Linux, Windows, Server Management', category: 'Operations', coverage: 75, icon: 'settings' },
      ],
    },
    subjectSelection: {
      title: 'Select Subjects',
      descriptionPrefix: 'Choose one or more subjects within',
      helperText: 'You can select multiple subjects to combine topics',
      subjectsByDomain: {
        fullstack: [
          { id: 'frontend', title: 'Front End Development', topicCount: 45 },
          { id: 'backend', title: 'Back End Development', topicCount: 38 },
          { id: 'database', title: 'Database Architecture', topicCount: 52 },
          { id: 'api', title: 'API Design & Integration', topicCount: 34 },
          { id: 'testing', title: 'Testing & QA', topicCount: 28 },
          { id: 'deployment', title: 'Deployment & Hosting', topicCount: 24 },
        ],
        datascience: [
          { id: 'ml', title: 'Machine Learning', topicCount: 48 },
          { id: 'stats', title: 'Statistical Analysis', topicCount: 44 },
          { id: 'visualization', title: 'Data Visualization', topicCount: 32 },
          { id: 'nlp', title: 'Natural Language Processing', topicCount: 36 },
        ],
        dataeng: [
          { id: 'pipelines', title: 'Data Pipelines', topicCount: 40 },
          { id: 'etl', title: 'ETL Processes', topicCount: 35 },
          { id: 'warehousing', title: 'Data Warehousing', topicCount: 38 },
          { id: 'streaming', title: 'Stream Processing', topicCount: 30 },
        ],
        cybersecurity: [
          { id: 'netsec', title: 'Network Security', topicCount: 42 },
          { id: 'appsec', title: 'Application Security', topicCount: 38 },
          { id: 'pentesting', title: 'Penetration Testing', topicCount: 35 },
          { id: 'compliance', title: 'Compliance & Governance', topicCount: 28 },
        ],
      },
    },
    topicSelection: {
      title: 'Select Topics',
      description: 'Choose up to {maxSelections} topics to focus on',
      maxSelections: 4,
      limitTitle: 'Maximum topics reached',
      limitDescription: 'Deselect a topic to choose a different one',
      helperFormat: '{selected} of {maxSelections} topics selected - {remaining} remaining',
      topicsBySubject: {
        frontend: [
          { id: 'react', title: 'React', subtopicCount: 12, difficulty: 'Intermediate', parentSubjectId: 'frontend' },
          { id: 'vue', title: 'Vue.js', subtopicCount: 10, difficulty: 'Intermediate', parentSubjectId: 'frontend' },
          { id: 'html-css', title: 'HTML & CSS', subtopicCount: 15, difficulty: 'Beginner', parentSubjectId: 'frontend' },
          { id: 'javascript', title: 'JavaScript', subtopicCount: 18, difficulty: 'Intermediate', parentSubjectId: 'frontend' },
          { id: 'typescript', title: 'TypeScript', subtopicCount: 14, difficulty: 'Advanced', parentSubjectId: 'frontend' },
          { id: 'responsive', title: 'Responsive Design', subtopicCount: 11, difficulty: 'Beginner', parentSubjectId: 'frontend' },
        ],
        backend: [
          { id: 'nodejs', title: 'Node.js', subtopicCount: 15, difficulty: 'Intermediate', parentSubjectId: 'backend' },
          { id: 'python', title: 'Python', subtopicCount: 13, difficulty: 'Beginner', parentSubjectId: 'backend' },
          { id: 'rest-api', title: 'REST API', subtopicCount: 10, difficulty: 'Intermediate', parentSubjectId: 'backend' },
          { id: 'auth', title: 'Authentication', subtopicCount: 12, difficulty: 'Advanced', parentSubjectId: 'backend' },
          { id: 'microservices', title: 'Microservices', subtopicCount: 16, difficulty: 'Advanced', parentSubjectId: 'backend' },
        ],
        database: [
          { id: 'sql', title: 'SQL', subtopicCount: 14, difficulty: 'Beginner', parentSubjectId: 'database' },
          { id: 'nosql', title: 'NoSQL', subtopicCount: 11, difficulty: 'Intermediate', parentSubjectId: 'database' },
          { id: 'optimization', title: 'Query Optimization', subtopicCount: 9, difficulty: 'Advanced', parentSubjectId: 'database' },
          { id: 'modeling', title: 'Data Modeling', subtopicCount: 13, difficulty: 'Intermediate', parentSubjectId: 'database' },
        ],
      },
    },
    subtopicSelection: {
      title: 'Select Subtopics',
      description: 'Refine your focus by selecting specific subtopics',
      helperText: '{selected} subtopic(s) selected across {topicCount} topic(s)',
      subtopicsByTopic: {
        react: [
          { id: 'react-1', title: 'Components & Props', questionCount: 24, parentTopicId: 'react' },
          { id: 'react-2', title: 'State Management', questionCount: 28, parentTopicId: 'react' },
          { id: 'react-3', title: 'Hooks', questionCount: 32, parentTopicId: 'react' },
          { id: 'react-4', title: 'Context API', questionCount: 26, parentTopicId: 'react' },
          { id: 'react-5', title: 'Performance Optimization', questionCount: 30, parentTopicId: 'react' },
        ],
        javascript: [
          { id: 'js-1', title: 'ES6+ Features', questionCount: 35, parentTopicId: 'javascript' },
          { id: 'js-2', title: 'Async/Await', questionCount: 28, parentTopicId: 'javascript' },
          { id: 'js-3', title: 'Closures & Scope', questionCount: 24, parentTopicId: 'javascript' },
          { id: 'js-4', title: 'Prototypes & Inheritance', questionCount: 30, parentTopicId: 'javascript' },
        ],
        nodejs: [
          { id: 'node-1', title: 'Express.js Framework', questionCount: 32, parentTopicId: 'nodejs' },
          { id: 'node-2', title: 'Event Loop', questionCount: 20, parentTopicId: 'nodejs' },
          { id: 'node-3', title: 'File System Operations', questionCount: 25, parentTopicId: 'nodejs' },
          { id: 'node-4', title: 'Middleware', questionCount: 28, parentTopicId: 'nodejs' },
        ],
        sql: [
          { id: 'sql-1', title: 'SELECT Queries', questionCount: 30, parentTopicId: 'sql' },
          { id: 'sql-2', title: 'JOINs', questionCount: 35, parentTopicId: 'sql' },
          { id: 'sql-3', title: 'Indexes & Performance', questionCount: 28, parentTopicId: 'sql' },
          { id: 'sql-4', title: 'Transactions', questionCount: 24, parentTopicId: 'sql' },
        ],
      },
    },
    calibration: {
      title: 'Configure Your Assessment',
      description: 'Customize difficulty level and question count',
      difficultyLabel: 'Difficulty Level',
      questionCountLabel: 'Number of Questions',
      previewTitle: 'Assessment Preview',
      previewDifficultyLabel: 'Difficulty',
      previewQuestionsLabel: 'Questions',
      previewTimeLabel: 'Est. Time',
      difficultyTiers: [
        { id: 'Mixed', title: 'Mixed Mode', description: 'Balanced mix of easy, medium, and hard questions', icon: 'shuffle', iconBg: 'bg-blue-500' },
        { id: 'Simple', title: 'Fundamentals', description: 'Focus on core concepts and basic applications', icon: 'target', iconBg: 'bg-green-500' },
        { id: 'Expert', title: 'Advanced', description: 'Challenging problems requiring deep understanding', icon: 'trending', iconBg: 'bg-purple-600' },
      ],
      questionCounts: [10, 20, 30, 40],
    },
    summary: {
      title: 'Assessment Summary',
      domainLabel: 'Domain',
      subjectsLabel: 'Subjects',
      topicsLabel: 'Topics',
      subtopicsLabel: 'Subtopics',
      notSelectedLabel: 'Not selected',
      configurationTitle: 'Configuration',
      pointsProjectionTitle: 'Points Projection',
      pointsProjectionSubtitle: 'Maximum mastery points',
      progressTitle: 'Configuration Progress',
    },
  };
}

export async function loadLaunchExamData(_brand: BrandConfig): Promise<LaunchViewData> {
  const apiResponse = buildLaunchExamApiResponse();
  return mapLaunchExamApiToViewData(apiResponse);
}
