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

export interface InstructionManualStep {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

export interface InstructionManualViewData {
  eyebrow: string;
  title: string;
  subtitle: string;
  stageLabelPrefix: string;
  journeyScopeLabel: string;
  journeyScopeValueFormat: string;
  journeyScopeDescription: string;
  roadmapLabel: string;
  roadmapTitle: string;
  roadmapDescription: string;
  ctaLabel: string;
  steps: InstructionManualStep[];
}

export interface LaunchDifficultyTier {
  id: string;
  title: string;
  description: string;
  icon: 'shuffle' | 'target' | 'trending';
  iconBg: string;
}

export interface LaunchSelectionState {
  domain: LaunchDomain | null;
  subjects: LaunchSubject[];
  topics: LaunchTopic[];
  subtopics: LaunchSubtopic[];
  difficulty: string;
  questionCount: number;
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
    startConfigurationLabel: string;
    shellDescription: string;
    stepCounterLabel: string;
    currentFocusLabel: string;
    decisionRailLabel: string;
    assessmentProjectionLabel: string;
    estimatedDurationLabel: string;
    questionScopeLabel: string;
    selectedSuffix: string;
    selectedCountFormat: string;
    selectedCountWithContextFormat: string;
    difficultyModeSuffix: string;
    questionsSuffix: string;
    minutesSuffix: string;
  };
  steps: Array<{ number: number; title: string; subtitle: string; navLabel: string }>;
  domainSelection: {
    title: string;
    description: string;
    coverageLabel: string;
    emptyDomainPrompt: string;
    domains: LaunchDomain[];
  };
  subjectSelection: {
    title: string;
    descriptionPrefix: string;
    helperText: string;
    selectedCountFormat: string;
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
    topicSelectedFormat: string;
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
    description: string;
    domainLabel: string;
    subjectsLabel: string;
    topicsLabel: string;
    subtopicsLabel: string;
    notSelectedLabel: string;
    emptyDomainLabel: string;
    emptySubjectsLabel: string;
    emptyTopicsLabel: string;
    emptySubtopicsLabel: string;
    configurationTitle: string;
    pointsProjectionTitle: string;
    pointsProjectionSubtitle: string;
    progressTitle: string;
  };
  instructions: InstructionManualViewData;
}

export interface LaunchExamApiResponse {
  session: {
    activeTitle: string;
    activeDescription: string;
    resumeCta: string;
  };
  controls: {
    basicLabel: string;
    expertLabel: string;
    backLabel: string;
    continueLabel: string;
    launchLabel: string;
    exitDialog: {
      title: string;
      description: string;
      body: string;
      continueEditingLabel: string;
      exitAnywayLabel: string;
    };
  };
  shell: {
    startConfigurationLabel: string;
    description: string;
    currentFocusLabel: string;
    decisionRailLabel: string;
    assessmentProjectionLabel: string;
    stepCounterLabel: string;
    estimatedDurationLabel: string;
    questionScopeLabel: string;
    selectedSuffix: string;
    selectedCountFormat: string;
    selectedCountWithContextFormat: string;
    difficultyModeSuffix: string;
    questionsSuffix: string;
    minutesSuffix: string;
  };
  workflow: {
    steps: Array<{ number: number; title: string; subtitle: string; navLabel: string }>;
  };
  selections: {
    domain: {
      title: string;
      description: string;
      coverageLabel: string;
      emptyDomainPrompt: string;
      items: LaunchDomain[];
    };
    subject: {
      title: string;
      descriptionPrefix: string;
      helperText: string;
      selectedCountFormat: string;
      itemsByDomain: Record<string, LaunchSubject[]>;
    };
    topic: {
      title: string;
      description: string;
      maxSelections: number;
      limitTitle: string;
      limitDescription: string;
      helperFormat: string;
      itemsBySubject: Record<string, LaunchTopic[]>;
    };
    subtopic: {
      title: string;
      description: string;
      helperText: string;
      topicSelectedFormat: string;
      itemsByTopic: Record<string, LaunchSubtopic[]>;
    };
  };
  calibration: LaunchViewData['calibration'];
  summary: LaunchViewData['summary'];
  instructions: InstructionManualViewData;
}

export function mapLaunchExamApiToViewData(api: LaunchExamApiResponse): LaunchViewData {
  return {
    labels: {
      activeSessionTitle: api.session.activeTitle,
      activeSessionDescription: api.session.activeDescription,
      activeSessionResumeLabel: api.session.resumeCta,
      basicModeLabel: api.controls.basicLabel,
      expertModeLabel: api.controls.expertLabel,
      backLabel: api.controls.backLabel,
      continueLabel: api.controls.continueLabel,
      launchLabel: api.controls.launchLabel,
      exitDialogTitle: api.controls.exitDialog.title,
      exitDialogDescription: api.controls.exitDialog.description,
      exitDialogBody: api.controls.exitDialog.body,
      continueEditingLabel: api.controls.exitDialog.continueEditingLabel,
      exitAnywayLabel: api.controls.exitDialog.exitAnywayLabel,
      startConfigurationLabel: api.shell.startConfigurationLabel,
      shellDescription: api.shell.description,
      stepCounterLabel: api.shell.stepCounterLabel,
      currentFocusLabel: api.shell.currentFocusLabel,
      decisionRailLabel: api.shell.decisionRailLabel,
      assessmentProjectionLabel: api.shell.assessmentProjectionLabel,
      estimatedDurationLabel: api.shell.estimatedDurationLabel,
      questionScopeLabel: api.shell.questionScopeLabel,
      selectedSuffix: api.shell.selectedSuffix,
      selectedCountFormat: api.shell.selectedCountFormat,
      selectedCountWithContextFormat: api.shell.selectedCountWithContextFormat,
      difficultyModeSuffix: api.shell.difficultyModeSuffix,
      questionsSuffix: api.shell.questionsSuffix,
      minutesSuffix: api.shell.minutesSuffix,
    },
    steps: api.workflow.steps,
    domainSelection: {
      title: api.selections.domain.title,
      description: api.selections.domain.description,
      coverageLabel: api.selections.domain.coverageLabel,
      emptyDomainPrompt: api.selections.domain.emptyDomainPrompt,
      domains: api.selections.domain.items,
    },
    subjectSelection: {
      title: api.selections.subject.title,
      descriptionPrefix: api.selections.subject.descriptionPrefix,
      helperText: api.selections.subject.helperText,
      selectedCountFormat: api.selections.subject.selectedCountFormat,
      subjectsByDomain: api.selections.subject.itemsByDomain,
    },
    topicSelection: {
      title: api.selections.topic.title,
      description: api.selections.topic.description,
      maxSelections: api.selections.topic.maxSelections,
      limitTitle: api.selections.topic.limitTitle,
      limitDescription: api.selections.topic.limitDescription,
      helperFormat: api.selections.topic.helperFormat,
      topicsBySubject: api.selections.topic.itemsBySubject,
    },
    subtopicSelection: {
      title: api.selections.subtopic.title,
      description: api.selections.subtopic.description,
      helperText: api.selections.subtopic.helperText,
      topicSelectedFormat: api.selections.subtopic.topicSelectedFormat,
      subtopicsByTopic: api.selections.subtopic.itemsByTopic,
    },
    calibration: api.calibration,
    summary: api.summary,
    instructions: api.instructions,
  };
}

function buildLaunchExamApiResponse(): LaunchExamApiResponse {
  return {
    session: {
      activeTitle: 'Active Session In Progress',
      activeDescription: '"Algebra Fundamentals" is currently active',
      resumeCta: 'Resume',
    },
    controls: {
      basicLabel: 'Basic',
      expertLabel: 'Expert',
      backLabel: 'Back',
      continueLabel: 'Continue',
      launchLabel: 'Launch Evaluation',
      exitDialog: {
        title: 'Unsaved Configuration',
        description: 'Your progress will be lost',
        body: 'Are you sure you want to exit? Your current configuration will not be saved.',
        continueEditingLabel: 'Continue Editing',
        exitAnywayLabel: 'Exit Anyway',
      },
    },
    shell: {
      startConfigurationLabel: 'Start Configuration',
      description: 'Build the assessment in focused steps. Choose the scope first, then refine the blueprint before launch.',
      currentFocusLabel: 'Current Focus',
      decisionRailLabel: 'Decision Rail',
      assessmentProjectionLabel: 'Assessment Projection',
      stepCounterLabel: 'Step {current} of {total}',
      estimatedDurationLabel: 'Estimated Duration',
      questionScopeLabel: 'Question Scope',
      selectedSuffix: 'selected',
      selectedCountFormat: '{count} selected',
      selectedCountWithContextFormat: '{count} {label} selected',
      difficultyModeSuffix: 'Mode',
      questionsSuffix: 'Questions',
      minutesSuffix: 'minutes',
    },
    workflow: {
      steps: [
        { number: 1, title: 'Knowledge Mapping', subtitle: 'Select Domain', navLabel: 'Domain' },
        { number: 2, title: 'Knowledge Mapping', subtitle: 'Select Subjects', navLabel: 'Subjects' },
        { number: 3, title: 'Knowledge Mapping', subtitle: 'Select Topics', navLabel: 'Topics' },
        { number: 4, title: 'Knowledge Mapping', subtitle: 'Select Subtopics', navLabel: 'Subtopics' },
        { number: 5, title: 'Engine Calibration', subtitle: 'Configure Assessment', navLabel: 'Assessment' },
      ],
    },
    selections: {
      domain: {
        title: 'Select Your Domain',
        description: 'Choose the subject area you want to practice',
        coverageLabel: 'Coverage',
        emptyDomainPrompt: 'Choose a domain to unlock the subject blueprint',
        items: [
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
      subject: {
        title: 'Select Subjects',
        descriptionPrefix: 'Choose one or more subjects within',
        helperText: 'You can select multiple subjects to combine topics',
        selectedCountFormat: '{count} {label} selected',
        itemsByDomain: {
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
      topic: {
        title: 'Select Topics',
        description: 'Choose up to {maxSelections} topics to focus on',
        maxSelections: 4,
        limitTitle: 'Maximum topics reached',
        limitDescription: 'Deselect a topic to choose a different one',
        helperFormat: '{selected} of {maxSelections} topics selected - {remaining} remaining',
        itemsBySubject: {
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
      subtopic: {
        title: 'Select Subtopics',
        description: 'Refine your focus by selecting specific subtopics',
        helperText: '{selected} subtopic(s) selected across {topicCount} topic(s)',
        topicSelectedFormat: '{selected} of {total} selected',
        itemsByTopic: {
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
      description: 'Track the current blueprint and validate what will carry into the assessment.',
      domainLabel: 'Domain',
      subjectsLabel: 'Subjects',
      topicsLabel: 'Topics',
      subtopicsLabel: 'Subtopics',
      notSelectedLabel: 'Not selected',
      emptyDomainLabel: 'Choose a domain to unlock the subject blueprint',
      emptySubjectsLabel: 'No subjects selected yet',
      emptyTopicsLabel: 'No topics selected yet',
      emptySubtopicsLabel: 'Subtopics will appear after topic selection',
      configurationTitle: 'Configuration',
      pointsProjectionTitle: 'Points Projection',
      pointsProjectionSubtitle: 'Maximum mastery points',
      progressTitle: 'Configuration Progress',
    },
    instructions: {
      eyebrow: 'Exam Engine Briefing',
      title: 'Before You Launch',
      subtitle: 'Understand your assessment journey',
      stageLabelPrefix: 'Stage',
      journeyScopeLabel: 'Journey Scope',
      journeyScopeValueFormat: '{count} defined stages',
      journeyScopeDescription: 'Domain mapping through final summary.',
      roadmapLabel: 'Start Configuration',
      roadmapTitle: 'Enter the guided assessment setup',
      roadmapDescription: 'The next screen applies the exact six-stage journey described above, beginning with domain mapping and ending with the pre-flight summary.',
      ctaLabel: 'I Understand, Start Configuration',
      steps: [
        {
          id: 'domain',
          title: 'Domain Mapping',
          description: 'Define the broad engineering or data field. This establishes the foundation for your entire diagnostic journey.',
          iconName: 'globe',
        },
        {
          id: 'subject',
          title: 'Subject Filtering',
          description: 'Filter curriculum-aligned subjects based on your domain. This determines the scope of your assessment.',
          iconName: 'library',
        },
        {
          id: 'topic',
          title: 'Topic Isolation',
          description: 'Identify specific high-impact topics for testing. This narrows your focus to areas that matter most.',
          iconName: 'target',
        },
        {
          id: 'subtopic',
          title: 'Subtopic Precision',
          description: 'Refine the assessment to specific skills and subtopics. This creates the blueprint for your exam.',
          iconName: 'cpu',
        },
        {
          id: 'calibration',
          title: 'Engine Calibration',
          description: 'Configure difficulty levels from Fundamentals to Pro, and set question density for optimal challenge.',
          iconName: 'sliders',
        },
        {
          id: 'summary',
          title: 'Final Summary',
          description: 'Review your total mastery points projection and confirm your configuration before launch.',
          iconName: 'rocket',
        },
      ],
    },
  };
}

type HierarchyDomain = {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  subjects?: HierarchySubject[];
};

type HierarchySubject = {
  id: string;
  name: string;
  topics?: HierarchyTopic[];
};

type HierarchyTopic = {
  id: string;
  name: string;
  complexity?: string | null;
  subtopics?: HierarchySubtopic[];
};

type HierarchySubtopic = {
  id: string;
  name: string;
};

function getLaunchGatewayUrl(brand: BrandConfig): string | undefined {
  const isSkillUp = brand.name.toLowerCase().includes('skillup');
  const configured = process.env.INTERNAL_API_URL ?? process.env.API_SERVER_URL ?? (isSkillUp
    ? process.env.GATEWAY_URL_SKILLUP ?? process.env.GATEWAY_URL
    : process.env.GATEWAY_URL);

  return configured?.trim().replace(/\/+$/, '').replace(/\/api$/i, '');
}

async function fetchLaunchJson<T>(url: string): Promise<T> {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (process.env.INTERNAL_API_SECRET !== undefined && process.env.INTERNAL_API_SECRET !== '') {
    headers['x-internal-secret'] = process.env.INTERNAL_API_SECRET;
  }
  if (process.env.INTERNAL_API_KEY !== undefined && process.env.INTERNAL_API_KEY !== '') {
    headers['x-internal-key'] = process.env.INTERNAL_API_KEY;
  }

  const response = await fetch(url, {
    cache: 'no-store',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Launch hierarchy request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function toLaunchDifficulty(complexity?: string | null): LaunchTopic['difficulty'] {
  if (complexity === 'advanced' || complexity === 'expert') return 'Advanced';
  if (complexity === 'intermediate') return 'Intermediate';
  return 'Beginner';
}

function buildLaunchExamApiResponseFromHierarchy(domains: HierarchyDomain[]): LaunchExamApiResponse {
  const base = buildLaunchExamApiResponse();
  const subjectsByDomain: Record<string, LaunchSubject[]> = {};
  const topicsBySubject: Record<string, LaunchTopic[]> = {};
  const subtopicsByTopic: Record<string, LaunchSubtopic[]> = {};

  const launchDomains = domains.map((domain) => {
    const subjects = Array.isArray(domain.subjects) ? domain.subjects : [];
    subjectsByDomain[domain.id] = subjects.map((subject) => {
      const topics = Array.isArray(subject.topics) ? subject.topics : [];
      topicsBySubject[subject.id] = topics.map((topic) => {
        const subtopics = Array.isArray(topic.subtopics) ? topic.subtopics : [];
        subtopicsByTopic[topic.id] = subtopics.map((subtopic) => ({
          id: subtopic.id,
          title: subtopic.name,
          questionCount: 0,
          parentTopicId: topic.id,
        }));

        return {
          id: topic.id,
          title: topic.name,
          subtopicCount: subtopics.length,
          difficulty: toLaunchDifficulty(topic.complexity),
          parentSubjectId: subject.id,
        };
      });

      return {
        id: subject.id,
        title: subject.name,
        topicCount: topics.length,
      };
    });

    return {
      id: domain.id,
      title: domain.name,
      description: domain.description ?? 'Assessment-ready question bank',
      category: domain.category ?? 'Learning',
      coverage: 100,
      icon: 'code',
    };
  });

  return {
    ...base,
    selections: {
      ...base.selections,
      domain: {
        ...base.selections.domain,
        items: launchDomains,
      },
      subject: {
        ...base.selections.subject,
        itemsByDomain: subjectsByDomain,
      },
      topic: {
        ...base.selections.topic,
        itemsBySubject: topicsBySubject,
      },
      subtopic: {
        ...base.selections.subtopic,
        itemsByTopic: subtopicsByTopic,
      },
    },
  };
}

async function loadDbLaunchExamApiResponse(brand: BrandConfig): Promise<LaunchExamApiResponse | null> {
  const gatewayUrl = getLaunchGatewayUrl(brand);
  if (gatewayUrl === undefined || gatewayUrl === '') return null;

  const domains = await fetchLaunchJson<HierarchyDomain[]>(`${gatewayUrl}/api/domains`);
  if (!Array.isArray(domains) || domains.length === 0) return null;

  const hierarchy = await Promise.all(
    domains.map(async (domain) => {
      try {
        return await fetchLaunchJson<HierarchyDomain>(`${gatewayUrl}/api/domains?id=${encodeURIComponent(domain.id)}`);
      } catch {
        return domain;
      }
    }),
  );

  return buildLaunchExamApiResponseFromHierarchy(hierarchy);
}

export async function loadLaunchExamData(brand: BrandConfig): Promise<LaunchViewData> {
  const apiResponse = await loadDbLaunchExamApiResponse(brand).catch(() => null) ?? buildLaunchExamApiResponse();
  return mapLaunchExamApiToViewData(apiResponse);
}
