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
    simpleUseCases: unknown;
    beginnerBreakdown: unknown;
    mentalModel: {
      title: string;
      visualLabels?: unknown[];
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

export async function POST(request: NextRequest) {
  try {
    const { subtopicId, subtopicInfo, section, content } = await request.json() as RequestBody;

    if (!subtopicId || !section || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Parse the content if it's a string
    const parsedContent = typeof content === 'string' ? JSON.parse(content) : content;

    // Transform the AI JSON to registry format
    const transformedData = transformAIJsonToRegistry(section, parsedContent as Record<string, unknown>);

    if (!transformedData) {
      return NextResponse.json(
        { error: `Unsupported section: ${section}` },
        { status: 400 }
      );
    }

    // Path to the registry file
    const registryPath = path.join(process.cwd(), '../../src/share-branding/subtopicContentRegistry.ts');

    // Read the current registry file
    let registryContent = fs.readFileSync(registryPath, 'utf-8');

    // Check if subtopic already exists
    const subtopicExists = registryContent.includes(`'${subtopicId}':`);

    if (!subtopicExists) {
      // Create new subtopic entry
      const newEntry = generateNewSubtopicEntry(subtopicId, subtopicInfo, transformedData);
      
      // Find the closing brace of the registry object (before the export function)
      const exportIndex = registryContent.indexOf('export function getSubtopicContent');
      const lastBraceIndex = registryContent.lastIndexOf('};', exportIndex);
      
      // Insert the new entry before the closing brace
      registryContent = 
        registryContent.slice(0, lastBraceIndex) +
        `,\n\n${newEntry}` +
        registryContent.slice(lastBraceIndex);
    } else {
      // Update existing subtopic with new section
      registryContent = updateSubtopicSection(registryContent, subtopicId, transformedData);
    }

    // Write back to file
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

/**
 * Transform AI-generated JSON to registry format
 */
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
  }
  // visual and practice sections - return as-is for now
  return { [section]: aiJson };
}

/**
 * Transform Notes section AI JSON to registry format
 */
function transformNotesSection(aiJson: NotesAIJson) {
  const notes = aiJson.notes;
  
  return {
    definitionBlock: {
      badge: notes.coreDefinition.badge,
      headline: notes.coreDefinition.headline,
      definitionText: notes.coreDefinition.definition,
      importanceCallout: notes.coreDefinition.whyItMatters,
      quickSummary: [
        notes.coreDefinition.simpleExplanation,
        notes.coreDefinition.keyTakeaway
      ]
    },
    sections: [
      {
        id: 's1',
        title: notes.conceptExplanation.title,
        content: `${notes.conceptExplanation.introduction}\n\n${notes.conceptExplanation.mainConcept}\n\n${notes.conceptExplanation.detailedBreakdown}`,
        keyPoint: notes.conceptExplanation.visualAnalogy
      }
    ],
    componentGrid: {
      gridTitle: notes.keyComponents.title,
      componentCards: notes.keyComponents.components.map((comp: { id: string; name: string; description: string; icon: string; purpose: string }) => ({
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
        ...(notes.examples?.exampleCards || []).map((ex: { title: string; scenario: string; code: string; explanation: string }, idx: number) => ({
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
      recommendations: notes.bestPractices.practices.map((bp: { id: string; title: string; description: string; doExample: string; dontExample: string }) => ({
        id: bp.id,
        title: bp.title,
        description: `${bp.description} Do: ${bp.doExample} Don't: ${bp.dontExample}`
      })),
      optimizationTips: ['Follow industry standards', 'Write clean, maintainable code'],
      industryStandards: ['Use consistent naming conventions', 'Follow best practices']
    },
    warningFaq: {
      commonErrors: notes.commonErrors.errors.map((err: { id: string; error: string; why: string; fix: string }) => ({
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
      revisionChecklist: notes.revisionSummary.quickRecap.map((item: string, idx: number) => ({
        id: `rc${idx + 1}`,
        item: item,
        checked: false
      })),
      memoryReinforcement: notes.revisionSummary.rememberThis,
      examTips: notes.revisionSummary.examTips
    }
  };
}

/**
 * Transform Layman Explanation section AI JSON to registry format
 */
function transformLaymanSection(aiJson: LaymanAIJson) {
  const layman = aiJson.laymanExplanation;
  
  return {
    laymanExplanation: {
      simpleOverview: layman.simpleOverview,
      everydayAnalogy: layman.everydayAnalogy,
      whyItExists: layman.whyItExists,
      simpleUseCases: layman.simpleUseCases,
      beginnerBreakdown: layman.beginnerBreakdown,
      mentalModel: {
        title: layman.mentalModel.title,
        conceptMap: {
          nodes: [],
          connections: []
        },
        visualLabels: layman.mentalModel.visualLabels || []
      },
      commonConfusions: layman.commonConfusions,
      simpleRecap: layman.simpleRecap
    }
  };
}

/**
 * Transform Real Life Examples section AI JSON to registry format
 */
function transformRealLifeSection(aiJson: Record<string, unknown>) {
  const reallife = (aiJson.realLifeExamples || aiJson) as Record<string, unknown>;
  
  return {
    realLifeExamples: reallife
  };
}

/**
 * Transform Technical Deep Dive section AI JSON to registry format
 */
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
    .replace(/"([^"]+)":/g, '$1:'); // Remove quotes from keys
  
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
  // Find the subtopic entry
  const subtopicStart = registryContent.indexOf(`'${subtopicId}':`);
  if (subtopicStart === -1) {
    throw new Error(`Subtopic '${subtopicId}' not found`);
  }

  // Find the closing brace of this subtopic
  let braceCount = 0;
  let inSubtopic = false;
  let subtopicEnd = subtopicStart;

  for (let i = subtopicStart; i < registryContent.length; i++) {
    if (registryContent[i] === '{') {
      braceCount++;
      inSubtopic = true;
    } else if (registryContent[i] === '}') {
      braceCount--;
      if (inSubtopic && braceCount === 0) {
        subtopicEnd = i;
        break;
      }
    }
  }

  // Extract the existing entry
  const existingEntry = registryContent.slice(subtopicStart, subtopicEnd + 1);

  // Add the new section data
  const dataString = JSON.stringify(transformedData, null, 4)
    .replace(/"([^"]+)":/g, '$1:')
    .slice(1, -1)
    .trim();

  const updatedEntry = existingEntry.replace(/}\s*$/, `,\n    ${dataString}\n  }`);

  // Replace in the content
  return registryContent.slice(0, subtopicStart) + updatedEntry + registryContent.slice(subtopicEnd + 1);
}

/**
 * Transform Code Example section AI JSON to registry format
 */
function transformCodeSection(aiJson: CodeAIJson) {
  const code = aiJson.codeExample;
  
  return {
    codeExample: {
      problemContext: code.problemContext || {
        title: 'The Problem',
        scenario: '',
        requirements: [],
        constraints: ''
      },
      basicCodeExample: code.basicCodeExample || {
        title: 'Basic Implementation',
        description: '',
        code: '',
        language: 'javascript',
        explanation: ''
      },
      lineByLineExplanation: code.lineByLineExplanation || {
        title: 'Line-by-Line Breakdown',
        lines: []
      },
      outputDemonstration: code.outputDemonstration || {
        title: 'Output and Results',
        input: '',
        output: '',
        explanation: '',
        visualRepresentation: ''
      },
      bestPracticeVersion: code.bestPracticeVersion || {
        title: 'Best Practice Implementation',
        improvements: [],
        code: '',
        explanation: '',
        benefits: []
      },
      commonMistakes: code.commonMistakes || {
        title: 'Common Mistakes to Avoid',
        mistakes: []
      },
      realWorldImplementation: code.realWorldImplementation || {
        title: 'Real-World Implementation',
        scenario: '',
        code: '',
        features: [],
        explanation: '',
        scalability: ''
      },
      codeSummary: code.codeSummary || {
        title: 'Code Summary',
        keyTakeaways: [],
        practiceExercise: '',
        nextSteps: []
      }
    }
  };
}

/**
 * Transform Assignment section AI JSON to registry format
 */
function transformAssignmentSection(aiJson: AssignmentAIJson) {
  const assignment = aiJson.assignment;
  
  // Extract from nested structure
  const overview = assignment.assignmentOverview || {};
  const objectives = assignment.learningObjectives || {};
  const taskReqs = assignment.taskRequirements || {};
  const starterCodeObj = assignment.starterCode || {};
  const submission = assignment.submissionFeedback || {};
  
  // Handle starterCode - it might be an object with {code, title, description} or a string
  let starterCodeString = '';
  if (typeof assignment.starterCode === 'string') {
    starterCodeString = assignment.starterCode;
  } else if (starterCodeObj && typeof starterCodeObj === 'object' && 'code' in starterCodeObj) {
    starterCodeString = (starterCodeObj as { code: string }).code;
  } else if (assignment.initialCode) {
    starterCodeString = typeof assignment.initialCode === 'string' 
      ? assignment.initialCode 
      : (assignment.initialCode as { code: string }).code || '';
  }
  
  // Build task object from taskRequirements
  const task = assignment.task || {
    title: taskReqs.title || 'Assignment Task',
    description: taskReqs.description || '',
    requirements: taskReqs.requirements 
      ? taskReqs.requirements.map((req: { requirement: string; details?: string }) => 
          `${req.requirement}: ${req.details || ''}`
        )
      : []
  };
  
  // Build objectives array from learningObjectives
  const objectivesArray = objectives.objectives || assignment.objectives || [];
  
  // Build submission guidelines from submissionFeedback
  const guidelines = submission.guidelines || assignment.submissionGuidelines || assignment.guidelines || [];
  
  return {
    assignment: {
      title: overview.title || assignment.title || 'Assignment',
      description: overview.description || assignment.description || '',
      xp: overview.xpReward || assignment.xp || 150,
      duration: overview.estimatedTime || assignment.duration || '20 Mins',
      task: task,
      objectives: objectivesArray,
      starterCode: starterCodeString,
      submissionGuidelines: guidelines
    }
  };
}

/**
 * Transform Project section AI JSON to registry format
 */
function transformProjectSection(aiJson: ProjectAIJson) {
  const project = aiJson.project;
  
  // Extract from nested structure
  const overview = project.projectOverview || {};
  const goals = project.projectGoals || {};
  const features = project.featureRequirements || {};
  const technical = project.technicalSpecifications || {};
  const implementation = project.implementationGuide || {};
  
  // Build skills array from various sources
  let skills: string[] = [];
  if (technical.technologies) {
    skills = technical.technologies;
  } else if (project.skills) {
    skills = project.skills;
  }
  
  // Build items array from implementation phases or features
  let buildItems: string[] = [];
  if (implementation.phases && Array.isArray(implementation.phases)) {
    buildItems = implementation.phases.map((phase: { phase?: string; title?: string; description?: string }) => 
      phase.phase || phase.title || phase.description || ''
    );
  } else if (features.features && Array.isArray(features.features)) {
    buildItems = features.features.map((feat: { feature?: string; title?: string; description?: string }) => 
      feat.feature || feat.title || feat.description || ''
    );
  } else if (project.buildItems) {
    buildItems = project.buildItems;
  } else if (project.tasks) {
    buildItems = project.tasks;
  }
  
  // Build deliverables array
  let deliverables: string[] = [];
  if (goals.learningOutcomes) {
    deliverables = goals.learningOutcomes;
  } else if (project.deliverables) {
    deliverables = project.deliverables;
  }
  
  return {
    project: {
      title: overview.title || project.title || 'Capstone Project',
      description: overview.description || project.description || '',
      xp: overview.xpReward || project.xp || 500,
      deadline: overview.estimatedTime || project.deadline || '2 Days Left',
      hero: project.hero || {
        badge: overview.badge || overview.difficulty || 'project',
        title: overview.title || project.title || 'Build Something Amazing',
        description: overview.description || goals.mainGoal || project.description || '',
        image: project.image || '/project_mockup.svg'
      },
      realWorldUse: goals.realWorldRelevance || project.realWorldUse || project.applications || 'Apply your skills to real-world scenarios',
      skills: skills,
      buildItems: buildItems,
      deliverables: deliverables
    }
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
}

/**
 * Transform Quiz section AI JSON to registry format
 */
function transformQuizSection(aiJson: QuizAIJson) {
  const quiz = aiJson.quiz;
  
  // Handle nested question structure from AI prompt
  let allQuestions: QuizQuestion[] = [];
  
  // If questions is already a flat array, use it
  if (Array.isArray(quiz.questions)) {
    allQuestions = quiz.questions;
  } else {
    // Otherwise, flatten from nested structure (multipleChoice, trueFalse, etc.)
    let questionNumber = 1;
    
    // Multiple Choice questions
    if (quiz.multipleChoice?.questions) {
      allQuestions.push(...quiz.multipleChoice.questions.map((q: QuizQuestion) => ({
        id: q.id,
        questionNumber: questionNumber++,
        type: 'Multiple Choice',
        points: 2,
        question: q.question,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
        code: q.code
      })));
    }
    
    // True/False questions
    if (quiz.trueFalse?.questions) {
      allQuestions.push(...quiz.trueFalse.questions.map((q: { id: string; correctAnswer: boolean; statement?: string; question?: string; explanation?: string }) => ({
        id: q.id,
        questionNumber: questionNumber++,
        type: 'True/False',
        points: 1,
        question: q.statement || q.question || '',
        options: [
          { id: 'true', text: 'True' },
          { id: 'false', text: 'False' }
        ],
        correctAnswer: q.correctAnswer === true ? 'true' : 'false',
        explanation: q.explanation || ''
      })));
    }
    
    // Code Output questions
    if (quiz.codeOutput?.questions) {
      allQuestions.push(...quiz.codeOutput.questions.map((q: QuizQuestion) => ({
        id: q.id,
        questionNumber: questionNumber++,
        type: 'Code Output',
        points: 3,
        question: q.question,
        code: q.code,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || ''
      })));
    }
    
    // Fill in the Blank questions
    if (quiz.fillInBlank?.questions) {
      allQuestions.push(...quiz.fillInBlank.questions.map((q: QuizQuestion) => ({
        id: q.id,
        questionNumber: questionNumber++,
        type: 'Fill in the Blank',
        points: 2,
        question: q.question,
        options: [], // Fill in blank doesn't have options
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || ''
      })));
    }
    
    // Code Debugging questions
    if (quiz.codeDebugging?.questions) {
      allQuestions.push(...quiz.codeDebugging.questions.map((q: QuizQuestion) => ({
        id: q.id,
        questionNumber: questionNumber++,
        type: 'Debug the Code',
        points: 3,
        question: q.question,
        code: q.code,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || ''
      })));
    }
    
    // Scenario-Based questions
    if (quiz.scenarioBased?.questions) {
      allQuestions.push(...quiz.scenarioBased.questions.map((q: { id: string; scenario: string; question: string; options: { id: string; text: string }[]; correctAnswer: string; explanation: string }) => ({
        id: q.id,
        questionNumber: questionNumber++,
        type: 'Scenario-Based',
        points: 3,
        question: `${q.scenario}\n\n${q.question}`,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || ''
      })));
    }
  }
  
  // Extract overview data
  const overview = quiz.quizOverview || {};
  
  return {
    quiz: {
      title: overview.title || quiz.title || 'Interactive Quiz',
      description: overview.description || quiz.description || '',
      totalQuestions: allQuestions.length, // Use actual count, not the claimed count
      duration: overview.timeLimit || quiz.duration || '15 min',
      xp: overview.xpReward || quiz.xp || 100,
      questions: allQuestions
    }
  };
}

