import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { subtopicId, subtopicInfo, section, content } = await request.json();

    if (!subtopicId || !section || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Parse the content if it's a string
    const parsedContent = typeof content === 'string' ? JSON.parse(content) : content;

    // Transform the AI JSON to registry format
    const transformedData = transformAIJsonToRegistry(section, parsedContent);

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

  } catch (error: any) {
    console.error('Error adding section:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add section' },
      { status: 500 }
    );
  }
}

/**
 * Transform AI-generated JSON to registry format
 */
function transformAIJsonToRegistry(section: string, aiJson: any): any {
  if (section === 'notes') {
    return transformNotesSection(aiJson);
  } else if (section === 'layman') {
    return transformLaymanSection(aiJson);
  } else if (section === 'reallife') {
    return transformRealLifeSection(aiJson);
  } else if (section === 'technical') {
    return transformTechnicalSection(aiJson);
  } else if (section === 'code') {
    return transformCodeSection(aiJson);
  } else if (section === 'assignment') {
    return transformAssignmentSection(aiJson);
  } else if (section === 'project') {
    return transformProjectSection(aiJson);
  } else if (section === 'quiz') {
    return transformQuizSection(aiJson);
  } else if (section === 'visual') {
    return transformVisualSection(aiJson);
  } else if (section === 'practice') {
    return transformPracticeSection(aiJson);
  }
  // Unknown section - return as-is
  return { [section]: aiJson };
}

/**
 * Transform Notes section AI JSON to registry format
 */
function transformNotesSection(aiJson: any) {
  const notes = aiJson.notes || aiJson;
  
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
      componentCards: notes.keyComponents.components.map((comp: any) => ({
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
        ...(notes.examples?.exampleCards || []).map((ex: any, idx: number) => ({
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
      recommendations: notes.bestPractices.practices.map((bp: any) => ({
        id: bp.id,
        title: bp.title,
        description: `${bp.description} Do: ${bp.doExample} Don't: ${bp.dontExample}`
      })),
      optimizationTips: ['Follow industry standards', 'Write clean, maintainable code'],
      industryStandards: ['Use consistent naming conventions', 'Follow best practices']
    },
    warningFaq: {
      commonErrors: notes.commonErrors.errors.map((err: any) => ({
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
function transformLaymanSection(aiJson: any) {
  const layman = aiJson.laymanExplanation || aiJson;
  
  return {
    laymanExplanation: {
      simpleOverview: layman.simpleOverview,
      everydayAnalogy: layman.everydayAnalogy,
      whyItExists: layman.whyItExists,
      simpleUseCases: {
        gridTitle: layman.simpleUseCases.gridTitle,
        useCaseCards: layman.simpleUseCases.useCaseCards.map((card: any) => ({
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
        conceptMap: {
          nodes: [],
          connections: []
        },
        visualLabels: (layman.mentalModel.visualLabels || []).map((item: any) => 
          typeof item === 'string' ? item : `${item.label}: ${item.description}`
        )
      },
      commonConfusions: layman.commonConfusions,
      simpleRecap: layman.simpleRecap
    }
  };
}

/**
 * Transform Real Life Examples section AI JSON to registry format
 */
function transformRealLifeSection(aiJson: any) {
  const reallife = aiJson.realLifeExamples || aiJson;
  
  return {
    realLifeExamples: reallife
  };
}

/**
 * Transform Technical Deep Dive section AI JSON to registry format
 */
function transformTechnicalSection(aiJson: any) {
  const technical = aiJson.technicalDeepDive || aiJson;
  
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
  subtopicInfo: any,
  transformedData: any
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
  transformedData: any
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
function transformCodeSection(aiJson: any) {
  const code = aiJson.codeExample || aiJson;
  
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
function transformAssignmentSection(aiJson: any) {
  const assignment = aiJson.assignment || aiJson;
  
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
  } else if (starterCodeObj.code) {
    starterCodeString = starterCodeObj.code;
  } else if (assignment.initialCode) {
    starterCodeString = typeof assignment.initialCode === 'string' 
      ? assignment.initialCode 
      : assignment.initialCode.code || '';
  }
  
  // Build task object from taskRequirements
  const task = assignment.task || {
    title: taskReqs.title || 'Assignment Task',
    description: taskReqs.description || '',
    requirements: taskReqs.requirements 
      ? taskReqs.requirements.map((req: any) => 
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
function transformProjectSection(aiJson: any) {
  const project = aiJson.project || aiJson;
  
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
    buildItems = implementation.phases.map((phase: any) => 
      phase.phase || phase.title || phase.description
    );
  } else if (features.features && Array.isArray(features.features)) {
    buildItems = features.features.map((feat: any) => 
      feat.feature || feat.title || feat.description
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

/**
 * Transform Quiz section AI JSON to registry format
 */
function transformQuizSection(aiJson: any) {
  const quiz = aiJson.quiz || aiJson;
  
  // Handle nested question structure from AI prompt
  let allQuestions: any[] = [];
  
  // If questions is already a flat array, use it
  if (Array.isArray(quiz.questions)) {
    allQuestions = quiz.questions;
  } else {
    // Otherwise, flatten from nested structure (multipleChoice, trueFalse, etc.)
    let questionNumber = 1;
    
    // Multiple Choice questions
    if (quiz.multipleChoice?.questions) {
      allQuestions.push(...quiz.multipleChoice.questions.map((q: any) => ({
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
      allQuestions.push(...quiz.trueFalse.questions.map((q: any) => ({
        id: q.id,
        questionNumber: questionNumber++,
        type: 'True/False',
        points: 1,
        question: q.statement || q.question,
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
      allQuestions.push(...quiz.codeOutput.questions.map((q: any) => ({
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
      allQuestions.push(...quiz.fillInBlank.questions.map((q: any) => ({
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
      allQuestions.push(...quiz.codeDebugging.questions.map((q: any) => ({
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
      allQuestions.push(...quiz.scenarioBased.questions.map((q: any) => ({
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

/**
 * Transform Visual Explanation section AI JSON to registry format
 * AI generates: visualOverview, conceptDiagram, flowchartExplanation, etc.
 * Registry expects: conceptVisualIntro, diagrammaticBreakdown, stepByStepVisualFlow, etc.
 */
function transformVisualSection(aiJson: any) {
  const visual = aiJson.visualExplanation || aiJson;
  
  return {
    visualExplanation: {
      // 1. visualOverview → conceptVisualIntro
      conceptVisualIntro: visual.visualOverview ? {
        badge: 'Visual Learning',
        headline: visual.visualOverview.title || 'Visual Explanation',
        visualDefinition: visual.visualOverview.description || '',
        heroDiagramPreview: visual.visualOverview.learningStyle || '',
        importanceBlock: 'Visual understanding helps you see relationships and patterns more clearly.',
        progressIndicator: 'Follow along with diagrams and visual aids'
      } : undefined,
      
      // 2. conceptDiagram → diagrammaticBreakdown
      diagrammaticBreakdown: visual.conceptDiagram ? {
        title: visual.conceptDiagram.title || 'Concept Breakdown',
        diagramTitle: visual.conceptDiagram.title || 'Visual Diagram',
        componentLabels: (visual.conceptDiagram.components || []).map((comp: any) => ({
          id: comp.id,
          label: comp.name,
          description: comp.description
        })),
        stepMarkers: (visual.conceptDiagram.connections || []).map((conn: any) => 
          `${conn.from} → ${conn.to}: ${conn.label}`
        ),
        technicalTooltips: (visual.conceptDiagram.components || []).map((comp: any) => ({
          id: comp.id,
          term: comp.name,
          explanation: comp.description
        }))
      } : undefined,
      
      // 3. flowchartExplanation → stepByStepVisualFlow
      stepByStepVisualFlow: visual.flowchartExplanation ? {
        title: visual.flowchartExplanation.title || 'Process Flow',
        sequenceTitle: visual.flowchartExplanation.description || 'Step-by-Step Process',
        steps: (visual.flowchartExplanation.steps || []).map((step: any, idx: number) => ({
          id: step.id,
          stepNumber: idx + 1,
          title: step.label,
          description: step.description,
          visualCue: `${step.type}: ${step.label}`
        })),
        phaseExplanations: [visual.flowchartExplanation.explanation || 'Follow the flow from start to finish']
      } : undefined,
      
      // 4. comparisonChart → comparativeVisualization
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
        differenceHighlights: (visual.comparisonChart.items || []).map((item: any) => 
          `${item.name}: ${item.useCase}`
        )
      } : undefined,
      
      // 5. mindMap → mentalModelVisualization
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
            ...(visual.mindMap.branches || []).map((branch: any) => ({
              id: branch.id,
              label: branch.title,
              description: branch.subtopics?.join(', ') || '',
              type: 'supporting' as const
            }))
          ],
          connections: (visual.mindMap.branches || []).map((branch: any) => ({
            from: 'central',
            to: branch.id,
            label: 'relates to',
            type: 'primary' as const
          }))
        },
        memoryLabels: (visual.mindMap.branches || []).map((branch: any) => branch.title)
      } : undefined,
      
      // 6. architectureDiagram → realWorldVisualMapping
      realWorldVisualMapping: visual.architectureDiagram ? {
        title: visual.architectureDiagram.title || 'Architecture',
        practicalScenarios: (visual.architectureDiagram.layers || []).map((layer: any) => ({
          id: layer.id,
          title: layer.name,
          description: layer.description,
          industryContext: layer.components?.join(', ') || '',
          visualRepresentation: visual.architectureDiagram.dataFlow || '',
          icon: 'Layers'
        })),
        careerRelevance: 'Understanding architecture is crucial for system design roles'
      } : undefined,
      
      // 7. timelineVisualization → commonConfusionVisualization (repurposed)
      commonConfusionVisualization: visual.timelineVisualization ? {
        title: 'Timeline of Events',
        confusionItems: (visual.timelineVisualization.events || []).map((event: any) => ({
          id: event.id,
          confusion: `Phase: ${event.time}`,
          visualClarification: event.event,
          correctVisualization: event.description
        })),
        faqItems: [],
        misconceptionDiagrams: []
      } : undefined,
      
      // 8. visualSummary → visualSummary (same name!)
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

/**
 * Transform Practice Test section AI JSON to registry format
 * AI generates: testOverview, theoryQuestions, practicalQuestions, etc.
 * Registry expects: assessmentIntro, conceptRecallQuestions, scenarioBasedQuestions, etc.
 */
function transformPracticeSection(aiJson: any) {
  const practice = aiJson.practiceTest || aiJson;
  
  // Combine all questions from different categories
  let allQuestions: any[] = [];
  
  // Theory questions → concept recall
  if (practice.theoryQuestions?.questions) {
    allQuestions.push(...practice.theoryQuestions.questions.map((q: any) => ({
      id: q.id,
      questionNumber: allQuestions.length + 1,
      type: 'single-choice' as const,
      points: q.points || 2,
      question: q.question,
      code: q.code,
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty || 'easy' as const
    })));
  }
  
  // Practical questions → scenario-based
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
        difficulty: q.difficulty || 'medium' as const
      });
    }
  }
  
  // Code analysis questions → add to concept recall
  if (practice.codeAnalysisQuestions?.questions) {
    allQuestions.push(...practice.codeAnalysisQuestions.questions.map((q: any) => ({
      id: q.id,
      questionNumber: allQuestions.length + 1,
      type: 'single-choice' as const,
      points: q.points || 3,
      question: q.question,
      code: q.code,
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty || 'medium' as const
    })));
  }
  
  // Debugging questions → add to concept recall
  if (practice.debuggingQuestions?.questions) {
    allQuestions.push(...practice.debuggingQuestions.questions.map((q: any) => ({
      id: q.id,
      questionNumber: allQuestions.length + 1,
      type: 'single-choice' as const,
      points: q.points || 3,
      question: q.question,
      code: q.code,
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty || 'hard' as const
    })));
  }
  
  return {
    practiceTest: {
      // 1. testOverview → assessmentIntro
      assessmentIntro: practice.testOverview ? {
        badge: 'Practice Test',
        headline: practice.testOverview.title || 'Practice Test',
        testDescription: practice.testOverview.description || '',
        difficultyOverview: `Difficulty: ${practice.testOverview.difficulty || 'mixed'}`,
        learningGoals: [
          'Test your understanding',
          'Identify knowledge gaps',
          'Practice for exams'
        ],
        readinessIndicator: `${practice.testOverview.totalQuestions || allQuestions.length} questions, ${practice.testOverview.timeLimit || '45 minutes'}`
      } : undefined,
      
      // 2. Combined questions → conceptRecallQuestions
      conceptRecallQuestions: allQuestions.length > 0 ? {
        title: 'Concept Recall Questions',
        questions: allQuestions
      } : undefined,
      
      // 3. Practical questions → scenarioBasedQuestions
      scenarioBasedQuestions: scenarios.length > 0 ? {
        title: 'Scenario-Based Questions',
        scenarios: scenarios
      } : undefined,
      
      // 4. Difficulty progression
      difficultyProgression: {
        title: 'Difficulty Levels',
        levels: [
          {
            id: 'beginner',
            level: 'beginner' as const,
            description: 'Basic concepts',
            questionCount: Math.floor(allQuestions.length * 0.4),
            passingScore: 70
          },
          {
            id: 'intermediate',
            level: 'intermediate' as const,
            description: 'Applied knowledge',
            questionCount: Math.floor(allQuestions.length * 0.4),
            passingScore: 75
          },
          {
            id: 'advanced',
            level: 'advanced' as const,
            description: 'Advanced concepts',
            questionCount: Math.floor(allQuestions.length * 0.2),
            passingScore: 80
          }
        ],
        adaptiveLogic: false
      },
      
      // 5. Instant feedback
      instantFeedback: {
        enabled: true,
        feedbackType: 'immediate' as const
      },
      
      // 6. Common mistake detection
      commonMistakeDetection: {
        title: 'Common Mistakes',
        mistakeCategories: [
          {
            id: 'cm1',
            category: 'Conceptual misunderstanding',
            description: 'Misunderstanding core concepts',
            frequency: 40
          },
          {
            id: 'cm2',
            category: 'Syntax errors',
            description: 'Common syntax mistakes',
            frequency: 30
          },
          {
            id: 'cm3',
            category: 'Logic errors',
            description: 'Incorrect problem-solving approach',
            frequency: 30
          }
        ],
        weaknessHeatmap: {
          topics: [
            {
              id: 'topic1',
              topic: 'Core Concepts',
              score: 75,
              status: 'moderate' as const
            }
          ]
        }
      },
      
      // 7. Performance analytics
      performanceAnalytics: {
        title: 'Your Performance',
        scoreDisplay: {
          currentScore: 0,
          maxScore: allQuestions.reduce((sum, q) => sum + (q.points || 2), 0),
          percentage: 0
        },
        performanceGraphs: {
          accuracyTrend: [0, 0, 0, 0, 0],
          speedTrend: [0, 0, 0, 0, 0]
        },
        benchmarkComparison: {
          userScore: 0,
          averageScore: 70,
          topScore: 95
        },
        masteryPercentage: 0,
        examReadinessScore: 0
      },
      
      // 8. Revision recommendations
      revisionRecommendations: {
        title: 'Personalized Learning Path',
        personalizedLearningPath: [
          {
            id: 'rec1',
            topic: 'Review weak areas',
            priority: 'high' as const,
            estimatedTime: '30 minutes',
            resources: ['Notes Section', 'Code Examples']
          }
        ],
        weaknessRecoverySteps: [
          'Review the concepts you struggled with',
          'Practice with additional examples',
          'Retake the test to measure improvement'
        ],
        recommendedResources: [
          {
            id: 'res1',
            title: 'Review Notes',
            type: 'article' as const,
            link: '/notes'
          }
        ],
        futureGoals: [
          'Master all concepts',
          'Achieve 90%+ score',
          'Move to advanced topics'
        ]
      }
    }
  };
}
