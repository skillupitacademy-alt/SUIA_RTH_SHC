import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface SectionContent {
  [key: string]: unknown;
}

interface RequestBody {
  subtopicId: string;
  subtopicInfo: {
    subtopic: string;
    subject: string;
  };
  section: string;
  content: string | SectionContent;
}

interface TransformedData {
  [key: string]: unknown;
}

interface NotesAIJson {
  notes: {
    coreDefinition: {
      badge: string;
      headline: string;
      definition: string;
      whyItMatters: string;
      simpleExplanation: string;
      keyTakeaway: string;
    };
    conceptExplanation: {
      title: string;
      introduction: string;
      mainConcept: string;
      detailedBreakdown: string;
      visualAnalogy: string;
    };
    keyComponents: {
      title: string;
      components: {
        id: string;
        name: string;
        description: string;
        icon: string;
        purpose: string;
      }[];
    };
    syntaxStructure?: {
      title: string;
      syntaxTitle: string;
      explanation: string;
      code: string;
    };
    examples?: {
      exampleCards: {
        title: string;
        scenario: string;
        code: string;
        explanation: string;
      }[];
    };
    bestPractices: {
      title: string;
      practices: {
        id: string;
        title: string;
        description: string;
        doExample: string;
        dontExample: string;
      }[];
    };
    commonErrors: {
      errors: {
        id: string;
        error: string;
        why: string;
        fix: string;
      }[];
      faqItems: {
        id: string;
        question: string;
        answer: string;
      }[];
    };
    revisionSummary: {
      title: string;
      keyPoints: string[];
      quickRecap: string[];
      rememberThis: string;
      examTips: string[];
    };
  };
}

interface LaymanAIJson {
  laymanExplanation: {
    simpleOverview: unknown;
    everydayAnalogy: unknown;
    whyItExists: unknown;
    simpleUseCases: {
      gridTitle: string;
      useCaseCards: {
        id: string;
        title: string;
        description: string;
        example?: string;
        category?: string;
        icon: string;
      }[];
    };
    beginnerBreakdown: unknown;
    mentalModel: {
      title: string;
      visualLabels?: (string | { label: string; description: string })[];
    };
    commonConfusions: unknown;
    simpleRecap: unknown;
  };
}

interface CodeAIJson {
  codeExample: {
    problemContext?: {
      title: string;
      scenario: string;
      requirements: string[];
      constraints: string;
    };
    basicCodeExample?: {
      title: string;
      description: string;
      code: string;
      language: string;
      explanation: string;
    };
    lineByLineExplanation?: {
      title: string;
      lines: unknown[];
    };
    outputDemonstration?: {
      title: string;
      input: string;
      output: string;
      explanation: string;
      visualRepresentation: string;
    };
    bestPracticeVersion?: {
      title: string;
      improvements: string[];
      code: string;
      explanation: string;
      benefits: string[];
    };
    commonMistakes?: {
      title: string;
      mistakes: unknown[];
    };
    realWorldImplementation?: {
      title: string;
      scenario: string;
      code: string;
      features: string[];
      explanation: string;
      scalability: string;
    };
    codeSummary?: {
      title: string;
      keyTakeaways: string[];
      practiceExercise: string;
      nextSteps: string[];
    };
  };
}

interface AssignmentAIJson {
  assignment: {
    assignmentOverview?: {
      title?: string;
      description?: string;
      xpReward?: number;
      estimatedTime?: string;
    };
    learningObjectives?: {
      objectives?: string[];
    };
    taskRequirements?: {
      title?: string;
      description?: string;
      requirements?: { requirement: string; details?: string }[];
    };
    starterCode?: string | { code: string };
    submissionFeedback?: {
      guidelines?: string[];
    };
    initialCode?: string | { code: string };
    title?: string;
    description?: string;
    xp?: number;
    duration?: string;
    task?: {
      title: string;
      description: string;
      requirements: string[];
    };
    objectives?: string[];
    submissionGuidelines?: string[];
    guidelines?: string[];
  };
}

interface ProjectAIJson {
  project: {
    projectOverview?: {
      title?: string;
      description?: string;
      xpReward?: number;
      estimatedTime?: string;
      badge?: string;
      difficulty?: string;
    };
    projectGoals?: {
      learningOutcomes?: string[];
      mainGoal?: string;
      realWorldRelevance?: string;
    };
    featureRequirements?: {
      features?: { feature?: string; title?: string; description?: string }[];
    };
    technicalSpecifications?: {
      technologies?: string[];
    };
    implementationGuide?: {
      phases?: { phase?: string; title?: string; description?: string }[];
    };
    title?: string;
    description?: string;
    xp?: number;
    deadline?: string;
    hero?: unknown;
    image?: string;
    realWorldUse?: string;
    applications?: string;
    skills?: string[];
    buildItems?: string[];
    tasks?: string[];
    deliverables?: string[];
  };
}

interface QuizQuestion {
  id: string;
  questionNumber: number;
  type: string;
  points: number;
  question: string;
  options: { id: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  code?: string;
  difficulty?: string;
  scenario?: string;
}

interface QuizAIJson {
  quiz: {
    questions?: QuizQuestion[];
    multipleChoice?: { questions: QuizQuestion[] };
    trueFalse?: { questions: { id: string; correctAnswer: boolean; statement?: string; question?: string; explanation?: string }[] };
    codeOutput?: { questions: QuizQuestion[] };
    fillInBlank?: { questions: QuizQuestion[] };
    codeDebugging?: { questions: QuizQuestion[] };
    scenarioBased?: { questions: { id: string; scenario: string; question: string; options: { id: string; text: string }[]; correctAnswer: string; explanation: string }[] };
    quizOverview?: {
      title?: string;
      description?: string;
      timeLimit?: string;
      xpReward?: number;
    };
    title?: string;
    description?: string;
    duration?: string;
    xp?: number;
  };
}

interface VisualAIJson {
  visualExplanation: {
    visualOverview?: { title?: string; description?: string; learningStyle?: string };
    conceptDiagram?: {
      title?: string;
      components?: { id: string; name: string; description: string }[];
      connections?: { from: string; to: string; label: string }[];
    };
    flowchartExplanation?: {
      title?: string;
      description?: string;
      steps?: { id: string; label: string; description: string; type: string }[];
      explanation?: string;
    };
    comparisonChart?: {
      title?: string;
      description?: string;
      items?: { name: string; useCase: string; pros: string[]; cons: string[] }[];
    };
    mindMap?: {
      title?: string;
      centralConcept?: string;
      description?: string;
      branches?: { id: string; title: string; subtopics?: string[] }[];
    };
    architectureDiagram?: {
      title?: string;
      layers?: { id: string; name: string; description: string; components?: string[] }[];
      dataFlow?: string;
    };
    timelineVisualization?: {
      events?: { id: string; time: string; event: string; description: string }[];
    };
    visualSummary?: {
      title?: string;
      keyVisualTakeaways?: string[];
      nextSteps?: string;
      visualLearningTips?: string[];
    };
  };
}

interface PracticeAIJson {
  practiceTest: {
    theoryQuestions?: { questions: QuizQuestion[] };
    practicalQuestions?: { questions: QuizQuestion[] };
    codeAnalysisQuestions?: { questions: QuizQuestion[] };
    debuggingQuestions?: { questions: QuizQuestion[] };
  };
}

export async function POST(request: NextRequest) {
  try {
    const { subtopicId, subtopicInfo, section, content } = await request.json() as RequestBody;

    if (!subtopicId || !section || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
    const transformedData = transformAIJsonToRegistry(section, parsedContent as Record<string, unknown>);

    if (!transformedData) {
      return NextResponse.json(
        { error: `Unsupported section: ${section}` },
        { status: 400 }
      );
    }

    const registryPath = path.join(process.cwd(), '../../src/share-branding/subtopicContentRegistry.ts');
    let registryContent = fs.readFileSync(registryPath, 'utf-8');
    const subtopicExists = registryContent.includes(`'${subtopicId}':`);

    if (!subtopicExists) {
      const newEntry = generateNewSubtopicEntry(subtopicId, subtopicInfo, transformedData);
      const exportIndex = registryContent.indexOf('export function getSubtopicContent');
      const lastBraceIndex = registryContent.lastIndexOf('};', exportIndex);
      registryContent = 
        registryContent.slice(0, lastBraceIndex) +
        `,\n\n${newEntry}` +
        registryContent.slice(lastBraceIndex);
    } else {
      registryContent = updateSubtopicSection(registryContent, subtopicId, transformedData);
    }

    fs.writeFileSync(registryPath, registryContent, 'utf-8');

    return NextResponse.json({
      success: true,
      message: `Section '${section}' added successfully`,
      url: `/start-learning/subtopic/${subtopicId}?tab=${section}`
    });

  } catch (error: unknown) {
    console.error('Error adding section:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to add section';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

function transformAIJsonToRegistry(section: string, aiJson: Record<string, unknown>): TransformedData | null {
  if (section === 'notes') {
    return transformNotesSection(aiJson as unknown as NotesAIJson);
  } else if (section === 'layman') {
    return transformLaymanSection(aiJson as unknown as LaymanAIJson);
  } else if (section === 'reallife') {
    return transformRealLifeSection(aiJson);
  } else if (section === 'technical') {
    return transformTechnicalSection(aiJson);
  } else if (section === 'code') {
    return transformCodeSection(aiJson as unknown as CodeAIJson);
  } else if (section === 'assignment') {
    return transformAssignmentSection(aiJson as unknown as AssignmentAIJson);
  } else if (section === 'project') {
    return transformProjectSection(aiJson as unknown as ProjectAIJson);
  } else if (section === 'quiz') {
    return transformQuizSection(aiJson as unknown as QuizAIJson);
  } else if (section === 'visual') {
    return transformVisualSection(aiJson as unknown as VisualAIJson);
  } else if (section === 'practice') {
    return transformPracticeSection(aiJson as unknown as PracticeAIJson);
  }
  return { [section]: aiJson };
}

function transformNotesSection(aiJson: NotesAIJson) {
  const notes = aiJson.notes;
  return {
    definitionBlock: {
      badge: notes.coreDefinition.badge,
      headline: notes.coreDefinition.headline,
      definitionText: notes.coreDefinition.definition,
      importanceCallout: notes.coreDefinition.whyItMatters,
      quickSummary: [notes.coreDefinition.simpleExplanation, notes.coreDefinition.keyTakeaway]
    },
    sections: [{
      id: 's1',
      title: notes.conceptExplanation.title,
      content: `${notes.conceptExplanation.introduction}\n\n${notes.conceptExplanation.mainConcept}\n\n${notes.conceptExplanation.detailedBreakdown}`,
      keyPoint: notes.conceptExplanation.visualAnalogy
    }],
    componentGrid: {
      gridTitle: notes.keyComponents.title,
      componentCards: notes.keyComponents.components.map((comp) => ({
        id: comp.id,
        title: comp.name,
        description: comp.description,
        icon: comp.icon,
        subcomponents: [comp.purpose]
      }))
    },
    examplePanel: {
      exampleTitle: notes.syntaxStructure?.title || 'Examples',
      scenarios: [
        ...(notes.syntaxStructure ? [{
          id: 'sc1',
          title: notes.syntaxStructure.syntaxTitle,
          scenarioDescription: notes.syntaxStructure.explanation,
          practicalSolution: notes.syntaxStructure.code,
          industryContext: 'Basic syntax pattern used in modern applications'
        }] : []),
        ...(notes.examples?.exampleCards || []).map((ex, idx) => ({
          id: `sc${idx + 2}`,
          title: ex.title,
          scenarioDescription: ex.scenario,
          practicalSolution: ex.code,
          industryContext: ex.explanation
        }))
      ]
    },
    practiceCard: {
      bestPracticeTitle: notes.bestPractices.title,
      recommendations: notes.bestPractices.practices.map((bp) => ({
        id: bp.id,
        title: bp.title,
        description: `${bp.description} Do: ${bp.doExample} Don't: ${bp.dontExample}`
      })),
      optimizationTips: ['Follow industry standards', 'Write clean, maintainable code'],
      industryStandards: ['Use consistent naming conventions', 'Follow best practices']
    },
    warningFaq: {
      commonErrors: notes.commonErrors.errors.map((err) => ({
        id: err.id,
        error: err.error,
        solution: `${err.why} ${err.fix}`
      })),
      faqItems: notes.commonErrors.faqItems,
      misconceptionAlerts: ['Review common mistakes carefully', 'Practice to avoid errors']
    },
    summaryCard: {
      summaryTitle: notes.revisionSummary.title,
      keyTakeaways: notes.revisionSummary.keyPoints,
      revisionChecklist: notes.revisionSummary.quickRecap.map((item, idx) => ({
        id: `rc${idx + 1}`,
        item: item,
        checked: false
      })),
      memoryReinforcement: notes.revisionSummary.rememberThis,
      examTips: notes.revisionSummary.examTips
    }
  };
}

function transformLaymanSection(aiJson: LaymanAIJson) {
  const layman = aiJson.laymanExplanation;
  return {
    laymanExplanation: {
      simpleOverview: layman.simpleOverview,
      everydayAnalogy: layman.everydayAnalogy,
      whyItExists: layman.whyItExists,
      simpleUseCases: {
        gridTitle: layman.simpleUseCases.gridTitle,
        useCaseCards: layman.simpleUseCases.useCaseCards.map((card) => ({
          id: card.id,
          title: card.title,
          description: card.example ? `${card.description} ${card.example}` : card.description,
          category: card.category || 'everyday',
          icon: card.icon
        }))
      },
      beginnerBreakdown: layman.beginnerBreakdown,
      mentalModel: {
        title: layman.mentalModel.title,
        conceptMap: { nodes: [], connections: [] },
        visualLabels: (layman.mentalModel.visualLabels || []).map((item) => 
          typeof item === 'string' ? item : `${item.label}: ${item.description}`
        )
      },
      commonConfusions: layman.commonConfusions,
      simpleRecap: layman.simpleRecap
    }
  };
}

function transformRealLifeSection(aiJson: Record<string, unknown>) {
  const reallife = (aiJson.realLifeExamples || aiJson) as Record<string, unknown>;
  return { realLifeExamples: reallife };
}

function transformTechnicalSection(aiJson: Record<string, unknown>) {
  const technical = (aiJson.technicalDeepDive || aiJson) as { title?: string; badge?: string; intro?: string; sections?: unknown[] };
  return {
    technicalDeepDive: {
      title: technical.title || 'Technical Deep Dive',
      badge: technical.badge || 'Advanced',
      intro: technical.intro || '',
      sections: technical.sections || []
    }
  };
}

function generateNewSubtopicEntry(
  subtopicId: string,
  subtopicInfo: { subtopic: string; subject: string },
  transformedData: TransformedData
): string {
  const dataString = JSON.stringify(transformedData, null, 4)
    .replace(/"([^"]+)":/g, '$1:');
  return `  '${subtopicId}': {
    simpleWords: '${subtopicInfo.subtopic} in ${subtopicInfo.subject}',
    ${dataString.slice(1, -1).trim()}
  }`;
}

function updateSubtopicSection(
  registryContent: string,
  subtopicId: string,
  transformedData: TransformedData
): string {
  const subtopicStart = registryContent.indexOf(`'${subtopicId}':`);
  if (subtopicStart === -1) throw new Error(`Subtopic '${subtopicId}' not found`);
  
  let braceCount = 0;
  let inSubtopic = false;
  let subtopicEnd = subtopicStart;
  for (let i = subtopicStart; i < registryContent.length; i++) {
    if (registryContent[i] === '{') { braceCount++; inSubtopic = true; } 
    else if (registryContent[i] === '}') { braceCount--; if (inSubtopic && braceCount === 0) { subtopicEnd = i; break; } }
  }
  const existingEntry = registryContent.slice(subtopicStart, subtopicEnd + 1);
  const dataString = JSON.stringify(transformedData, null, 4).replace(/"([^"]+)":/g, '$1:').slice(1, -1).trim();
  const updatedEntry = existingEntry.replace(/}\s*$/, `,\n    ${dataString}\n  }`);
  return registryContent.slice(0, subtopicStart) + updatedEntry + registryContent.slice(subtopicEnd + 1);
}

function transformCodeSection(aiJson: CodeAIJson) {
  return { codeExample: aiJson.codeExample };
}

function transformAssignmentSection(aiJson: AssignmentAIJson) {
  const assignment = aiJson.assignment;
  const overview = assignment.assignmentOverview || {};
  const taskReqs = assignment.taskRequirements || {};
  let starterCodeString = '';
  if (typeof assignment.starterCode === 'string') {
    starterCodeString = assignment.starterCode;
  } else if (assignment.starterCode && typeof assignment.starterCode === 'object' && 'code' in assignment.starterCode) {
    starterCodeString = assignment.starterCode.code;
  }
  return {
    assignment: {
      title: overview.title || assignment.title || 'Assignment',
      description: overview.description || assignment.description || '',
      xp: overview.xpReward || assignment.xp || 150,
      duration: overview.estimatedTime || assignment.duration || '20 Mins',
      task: assignment.task || {
        title: taskReqs.title || 'Assignment Task',
        description: taskReqs.description || '',
        requirements: taskReqs.requirements ? taskReqs.requirements.map(r => `${r.requirement}: ${r.details || ''}`) : []
      },
      objectives: assignment.learningObjectives?.objectives || assignment.objectives || [],
      starterCode: starterCodeString,
      submissionGuidelines: assignment.submissionFeedback?.guidelines || assignment.submissionGuidelines || assignment.guidelines || []
    }
  };
}

function transformProjectSection(aiJson: ProjectAIJson) {
  const project = aiJson.project;
  const overview = project.projectOverview || {};
  const goals = project.projectGoals || {};
  return {
    project: {
      title: overview.title || project.title || 'Capstone Project',
      description: overview.description || project.description || '',
      xp: overview.xpReward || project.xp || 500,
      deadline: overview.estimatedTime || project.deadline || '2 Days Left',
      hero: project.hero || { badge: overview.badge || 'project', title: overview.title || project.title || 'Build Something Amazing', description: overview.description || goals.mainGoal || project.description || '', image: project.image || '/project_mockup.svg' },
      realWorldUse: goals.realWorldRelevance || project.realWorldUse || project.applications || 'Apply your skills',
      skills: project.technicalSpecifications?.technologies || project.skills || [],
      buildItems: project.implementationGuide?.phases?.map(p => p.phase || p.title || p.description || '') || project.featureRequirements?.features?.map(f => f.feature || f.title || f.description || '') || project.buildItems || project.tasks || [],
      deliverables: goals.learningOutcomes || project.deliverables || []
    }
  };
}

function transformQuizSection(aiJson: QuizAIJson) {
  const quiz = aiJson.quiz;
  const allQuestions: QuizQuestion[] = [];
  if (Array.isArray(quiz.questions)) {
    allQuestions.push(...quiz.questions);
  } else {
    let questionNumber = 1;
    if (quiz.multipleChoice?.questions) allQuestions.push(...quiz.multipleChoice.questions.map(q => ({ ...q, questionNumber: questionNumber++, type: 'Multiple Choice', points: 2 })));
    if (quiz.trueFalse?.questions) allQuestions.push(...quiz.trueFalse.questions.map(q => ({ id: q.id, questionNumber: questionNumber++, type: 'True/False', points: 1, question: q.statement || q.question || '', options: [{ id: 'true', text: 'True' }, { id: 'false', text: 'False' }], correctAnswer: q.correctAnswer ? 'true' : 'false', explanation: q.explanation || '' })));
    if (quiz.codeOutput?.questions) allQuestions.push(...quiz.codeOutput.questions.map(q => ({ ...q, questionNumber: questionNumber++, type: 'Code Output', points: 3 })));
  }
  return {
    quiz: {
      title: quiz.quizOverview?.title || quiz.title || 'Interactive Quiz',
      description: quiz.quizOverview?.description || quiz.description || '',
      totalQuestions: allQuestions.length,
      duration: quiz.quizOverview?.timeLimit || quiz.duration || '15 min',
      xp: quiz.quizOverview?.xpReward || quiz.xp || 100,
      questions: allQuestions
    }
  };
}

function transformVisualSection(aiJson: VisualAIJson) {
  const visual = aiJson.visualExplanation;
  
  return {
    visualExplanation: {
      conceptVisualIntro: visual.visualOverview ? {
        badge: 'Visual Learning',
        headline: visual.visualOverview.title || 'Visual Explanation',
        visualDefinition: visual.visualOverview.description || '',
        heroDiagramPreview: visual.visualOverview.learningStyle || '',
        importanceBlock: 'Visual understanding helps you see relationships and patterns more clearly.',
        progressIndicator: 'Follow along with diagrams and visual aids'
      } : undefined,
      
      diagrammaticBreakdown: visual.conceptDiagram ? {
        title: visual.conceptDiagram.title || 'Concept Breakdown',
        diagramTitle: visual.conceptDiagram.title || 'Visual Diagram',
        componentLabels: (visual.conceptDiagram.components || []).map((comp: { id: string; name: string; description: string }) => ({
          id: comp.id,
          label: comp.name,
          description: comp.description
        })),
        stepMarkers: (visual.conceptDiagram.connections || []).map((conn: { from: string; to: string; label: string }) => 
          `${conn.from} → ${conn.to}: ${conn.label}`
        ),
        technicalTooltips: (visual.conceptDiagram.components || []).map((comp: { id: string; name: string; description: string }) => ({
          id: comp.id,
          term: comp.name,
          explanation: comp.description
        }))
      } : undefined,
      
      stepByStepVisualFlow: visual.flowchartExplanation ? {
        title: visual.flowchartExplanation.title || 'Process Flow',
        sequenceTitle: visual.flowchartExplanation.description || 'Step-by-Step Process',
        steps: (visual.flowchartExplanation.steps || []).map((step: { id: string; label: string; description: string; type: string }, idx: number) => ({
          id: step.id,
          stepNumber: idx + 1,
          title: step.label,
          description: step.description,
          visualCue: `${step.type}: ${step.label}`
        })),
        phaseExplanations: [visual.flowchartExplanation.explanation || 'Follow the flow from start to finish']
      } : undefined,
      
      comparativeVisualization: visual.comparisonChart ? {
        title: visual.comparisonChart.title || 'Comparison',
        comparisonTitle: visual.comparisonChart.description || 'Compare Options',
        sideBySideVisuals: {
          option1: {
            title: visual.comparisonChart.items?.[0]?.name || 'Option 1',
            description: visual.comparisonChart.items?.[0]?.useCase || '',
            pros: visual.comparisonChart.items?.[0]?.pros || [],
            cons: visual.comparisonChart.items?.[0]?.cons || []
          },
          option2: {
            title: visual.comparisonChart.items?.[1]?.name || 'Option 2',
            description: visual.comparisonChart.items?.[1]?.useCase || '',
            pros: visual.comparisonChart.items?.[1]?.pros || [],
            cons: visual.comparisonChart.items?.[1]?.cons || []
          }
        },
        differenceHighlights: (visual.comparisonChart.items || []).map((item: { name: string; useCase: string }) => 
          `${item.name}: ${item.useCase}`
        )
      } : undefined,
      
      mentalModelVisualization: visual.mindMap ? {
        title: visual.mindMap.title || 'Mental Model',
        frameworkMap: {
          nodes: [
            {
              id: 'central',
              label: visual.mindMap.centralConcept || 'Core Concept',
              description: visual.mindMap.description || '',
              type: 'core' as const
            },
            ...(visual.mindMap.branches || []).map((branch: { id: string; title: string; subtopics?: string[] }) => ({
              id: branch.id,
              label: branch.title,
              description: branch.subtopics?.join(', ') || '',
              type: 'supporting' as const
            }))
          ],
          connections: (visual.mindMap.branches || []).map((branch: { id: string }) => ({
            from: 'central',
            to: branch.id,
            label: 'relates to',
            type: 'primary' as const
          }))
        },
        memoryLabels: (visual.mindMap.branches || []).map((branch: { title: string }) => branch.title)
      } : undefined,
      
      realWorldVisualMapping: visual.architectureDiagram ? {
        title: visual.architectureDiagram.title || 'Architecture',
        practicalScenarios: (visual.architectureDiagram.layers || []).map((layer: { id: string; name: string; description: string; components?: string[] }) => ({
          id: layer.id,
          title: layer.name,
          description: layer.description,
          industryContext: layer.components?.join(', ') || '',
          visualRepresentation: visual.architectureDiagram?.dataFlow || '',
          icon: 'Layers'
        })),
        careerRelevance: 'Understanding architecture is crucial for system design roles'
      } : undefined,
      
      commonConfusionVisualization: visual.timelineVisualization ? {
        title: 'Timeline of Events',
        confusionItems: (visual.timelineVisualization.events || []).map((event: { id: string; time: string; event: string; description: string }) => ({
          id: event.id,
          confusion: `Phase: ${event.time}`,
          visualClarification: event.event,
          correctVisualization: event.description
        })),
        faqItems: [],
        misconceptionDiagrams: []
      } : undefined,
      
      visualSummary: visual.visualSummary ? {
        summaryTitle: visual.visualSummary.title || 'Visual Summary',
        keyVisualTakeaways: visual.visualSummary.keyVisualTakeaways || [],
        revisionInfographic: visual.visualSummary.nextSteps || '',
        memoryReinforcement: visual.visualSummary.visualLearningTips?.join(' ') || '',
        examVisualChecklist: visual.visualSummary.keyVisualTakeaways || []
      } : undefined
    }
  };
}

function transformPracticeSection(aiJson: PracticeAIJson) {
  const practice = aiJson.practiceTest;
  const allQuestions: QuizQuestion[] = [];
  
  if (practice.theoryQuestions?.questions) {
    allQuestions.push(...practice.theoryQuestions.questions.map((q: QuizQuestion) => ({
      id: q.id,
      questionNumber: allQuestions.length + 1,
      type: 'single-choice' as const,
      points: q.points || 2,
      question: q.question,
      code: q.code,
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: (q.difficulty || 'easy') as 'easy' | 'medium' | 'hard'
    })));
  }
  
  const scenarios = [];
  if (practice.practicalQuestions?.questions) {
    for (const q of practice.practicalQuestions.questions) {
      scenarios.push({
        id: q.id,
        scenarioTitle: q.scenario || 'Practical Scenario',
        realWorldProblem: q.scenario || '',
        businessContext: 'Real-world application',
        decisionQuestion: q.question,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: (q.difficulty || 'medium') as 'easy' | 'medium' | 'hard'
      });
    }
  }
  
  return {
    practiceTest: {
      assessmentIntro: {
        title: 'Final Knowledge Assessment',
        objective: 'Validate your understanding and practical application skills',
        estimatedTime: '20 Mins',
        totalQuestions: allQuestions.length + scenarios.length,
        passingScore: '70%'
      },
      conceptRecallQuestions: allQuestions,
      scenarioBasedQuestions: scenarios,
      skillMapping: {
        title: 'Skills Validated',
        skills: ['Problem Solving', 'Concept Application', 'Critical Thinking']
      }
    }
  };
}
