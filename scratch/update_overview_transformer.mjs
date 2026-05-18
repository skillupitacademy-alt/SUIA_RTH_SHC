import fs from 'fs';

const filePath = 'd:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/content-manager/add-section/route.ts';
let content = fs.readFileSync(filePath, 'utf8');

const startIndex = content.indexOf('function transformOverviewSection');
const endIndex = content.indexOf('function transformNotesSection');

if (startIndex === -1 || endIndex === -1) {
  console.error('Error: Could not find transformOverviewSection or transformNotesSection!');
  process.exit(1);
}

// Modernized transformOverviewSection code
const replacement = `function transformOverviewSection(content: JsonRecord, subtopicName: string): JsonRecord {
  const hero = asRecord(content.hero);
  const progressSummary = asRecord(content.progressSummary);
  const learningRoadmap = asRecord(content.learningRoadmap);
  const readinessContext = asRecord(content.readinessContext);
  const navigation = asRecord(content.navigation);

  const checklist = asArray<JsonRecord>(progressSummary.checklist).map((item, index) => ({
    label: asString(item.label, \`Step \${index + 1}\`),
    completed: typeof item.completed === 'boolean' ? item.completed : false,
  }));

  const rawOutcomes = asArray(content.learningOutcomes).map((o) => asString(o)).filter(Boolean);
  const outcomes = rawOutcomes.length > 0 ? rawOutcomes : ['Understand the core concepts', 'Explore key use cases', 'Apply practical skills'];

  const rawPre = asArray(readinessContext.prerequisites).map((p) => asString(p)).filter(Boolean);
  const prerequisites = rawPre.length > 0 ? rawPre : ['Basic computer skills'];

  const rawSuccess = asArray(readinessContext.successCriteria).map((s) => asString(s)).filter(Boolean);
  const successCriteria = rawSuccess.length > 0 ? rawSuccess : ['Score 80% on the quiz', 'Submit assignments'];

  const rawFlow = asArray(content.recommendedFlow).map((f) => asString(f)).filter(Boolean);
  const recommendedFlow = rawFlow.length > 0 ? rawFlow : ['Learn basic syntax', 'Review code examples', 'Solve practice questions'];

  const defaultContentCardTypes = ['notes', 'layman', 'example', 'code', 'deep-dive', 'visual', 'task', 'practice', 'assignment', 'project', 'quiz'];

  const rawContentCards = asArray(learningRoadmap.contentCards ?? content.contentCards).map((card, idx) => {
    const c = asRecord(card);
    const rawType = asString(c.type, 'notes');
    const type = defaultContentCardTypes.includes(rawType) ? rawType : 'notes';
    return {
      id: asString(c.id, \`cc\${idx + 1}\`),
      title: asString(c.title, \`Topic \${idx + 1}\`),
      type,
      content: asString(c.content, 'Review notes.'),
      ctaLabel: asString(c.ctaLabel, 'Start'),
      badge: c.badge ? {
        text: asString(asRecord(c.badge).text, 'Topic'),
        type: ['success', 'warning', 'info'].includes(asString(asRecord(c.badge).type))
          ? asString(asRecord(c.badge).type)
          : 'info',
      } : undefined,
    };
  });
  const contentCards = rawContentCards.length > 0 ? rawContentCards : [
    {
      id: 'cc1',
      title: 'Core Notes',
      type: 'notes',
      content: 'Get started with high-quality academic summaries.',
      ctaLabel: 'Read Notes',
    },
    {
      id: 'cc2',
      title: 'Layman Summary',
      type: 'layman',
      content: 'Learn through simple visual and everyday analogies.',
      ctaLabel: 'Read Layman',
    },
  ];

  const rawTaskCards = asArray(learningRoadmap.taskCards ?? content.taskCards).map((card, idx) => {
    const c = asRecord(card);
    const rawType = asString(c.type, 'task');
    const type = defaultContentCardTypes.includes(rawType) ? rawType : 'task';
    return {
      id: asString(c.id, \`tc\${idx + 1}\`),
      title: asString(c.title, \`Task \${idx + 1}\`),
      type,
      content: asString(c.content, 'Complete task.'),
      ctaLabel: asString(c.ctaLabel, 'Go'),
      badge: c.badge ? {
        text: asString(asRecord(c.badge).text, 'Task'),
        type: ['success', 'warning', 'info'].includes(asString(asRecord(c.badge).type))
          ? asString(asRecord(c.badge).type)
          : 'info',
      } : undefined,
    };
  });
  const taskCards = rawTaskCards.length > 0 ? rawTaskCards : [
    {
      id: 'tc1',
      title: 'Practice Challenge',
      type: 'practice',
      content: 'Solve interactive multiple-choice questions.',
      ctaLabel: 'Start Practice',
    },
    {
      id: 'tc2',
      title: 'Interactive Quiz',
      type: 'quiz',
      content: 'Test your understanding with active feedback.',
      ctaLabel: 'Start Quiz',
    },
  ];

  return {
    schemaVersion: 1,
    sectionType: 'overview',
    hero: {
      iconLabel: asString(hero.iconLabel, 'LayoutDashboard'),
      title: asString(hero.title, subtopicName),
      description: asString(hero.description, asString(content.description, \`Start learning \${subtopicName}.\`)),
      difficulty: asString(hero.difficulty, 'Beginner'),
      estimatedReadTime: asString(hero.estimatedReadTime, '45 mins'),
      xp: asNumber(hero.xp, 500),
      topicsCount: asNumber(hero.topicsCount, 10),
      lastUpdated: asString(hero.lastUpdated, 'Today'),
    },
    progressSummary: {
      percentage: asNumber(progressSummary.percentage, 0),
      checklist: checklist.length > 0 ? checklist : [
        { label: 'Notes', completed: false },
        { label: 'Practice', completed: false },
        { label: 'Assignment', completed: false },
        { label: 'Quiz', completed: false },
      ],
    },
    learningOutcomes: outcomes,
    learningRoadmap: {
      contentCards,
      taskCards,
    },
    recommendedFlow,
    readinessContext: {
      prerequisites,
      successCriteria,
    },
    navigation: {
      prevTitle: asString(navigation.prevTitle, 'Previous Topic'),
      nextTitle: asString(navigation.nextTitle, 'Next Topic'),
    },
  };
}

`;

content = content.slice(0, startIndex) + replacement + content.slice(endIndex);
fs.writeFileSync(filePath, content);
console.log('Successfully modernized transformOverviewSection in route.ts!');
