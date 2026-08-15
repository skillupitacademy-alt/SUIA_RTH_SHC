/**
 * Minimal Template Generator for Content Manager
 * Simplified version after removal of prompt-generator tool
 */

type JsonRecord = Record<string, unknown>;

/**
 * Generates a minimal JSON template for a section
 */
export const getStrictSectionJsonTemplate = (section: string, subtopicName: string): JsonRecord => {
  const base = { schemaVersion: 1, sectionType: section };
  
  const templates: Record<string, JsonRecord> = {
    overview: {
      overview: {
        ...base,
        hero: {
          title: subtopicName,
          description: `Overview of ${subtopicName}`,
        },
        progressSummary: { percentage: 0 },
        learningOutcomes: [],
        learningRoadmap: { contentCards: [], taskCards: [] },
        recommendedFlow: [],
        readinessContext: { prerequisites: [] },
        navigation: {},
      },
    },
    notes: {
      notes: {
        ...base,
        concept_card: {
          heroTitle: `${subtopicName} Notes`,
          heroSubtitle: `Overview of ${subtopicName}`,
          quickLook: ['Definition', 'Mechanics', 'Syntax'],
        },
        definition_block: {},
        component_grid: {},
        syntax_block: {},
        example_panel: {},
        practice_card: {},
        warning_faq: {},
        summary_card: {},
      },
    },
    real_life: {
      real_life: {
        ...base,
        conceptMapping: {},
        industryUseCase: {},
        dailyLifeExample: {},
        careerRelevance: {},
        problemSolutionContext: {},
        businessApplication: {},
        domainScenarios: {},
        practicalRecap: {},
      },
    },
    technical: {
      technical: {
        ...base,
        title: `${subtopicName} Technical Details`,
        badge: 'Advanced',
        intro: '',
        sections: [],
      },
    },
    code: {
      code: {
        ...base,
        problemContext: {},
        basicCodeExample: {},
        lineByLineExplanation: {},
        outputDemonstration: {},
        bestPracticeVersion: {},
        commonMistakes: {},
        realWorldImplementation: {},
        codeSummary: {},
      },
    },
    visual: {
      visual: {
        ...base,
        conceptVisualIntro: {},
        diagrammaticBreakdown: {},
        stepByStepVisualFlow: {},
        comparativeVisualization: {},
        mentalModelVisualization: {},
        realWorldVisualMapping: {},
        commonConfusionVisualization: {},
        visualSummary: {},
      },
    },
    practice: {
      practice: {
        ...base,
        assessmentIntro: {},
        conceptRecallQuestions: {},
        scenarioBasedQuestions: {},
        instantFeedback: {},
        difficultyProgression: {},
        commonMistakeDetection: {},
        performanceAnalytics: {},
        revisionRecommendations: {},
      },
    },
    assignment: {
      assignment: {
        ...base,
        title: `${subtopicName} Assignment`,
        description: '',
        xp: 150,
        duration: '20 Mins',
        task: {},
        objectives: [],
        starterCode: '',
        submissionGuidelines: [],
      },
    },
    project: {
      project: {
        ...base,
        title: `${subtopicName} Project`,
        description: '',
        xp: 500,
        deadline: '2 Days',
        hero: {},
        realWorldUse: '',
        skills: [],
        buildItems: [],
        deliverables: [],
      },
    },
    quiz: {
      quiz: {
        ...base,
        title: `${subtopicName} Quiz`,
        description: '',
        totalQuestions: 0,
        duration: '15 min',
        xp: 100,
        questions: [],
      },
    },
    summary: {
      summary: {
        ...base,
        title: `${subtopicName} Summary`,
        description: '',
        masteryRecapCard: {},
        keyTakeawayGrid: [],
        revisionChecklist: [],
        nextStepPanel: {},
      },
    },
    interview: {
      interview: {
        ...base,
        title: `${subtopicName} Interview Prep`,
        description: '',
        interviewIntroCard: {},
        questionBankPanel: {},
        answerFrameworkCard: {},
        mockInterviewFlow: {},
      },
    },
    ai_tutor: {
      ai_tutor: {
        ...base,
        greeting: `Welcome! Let's learn about ${subtopicName}`,
        qaPairs: [],
        tutorPromptCard: {},
        misconceptionDetector: {},
        adaptiveHintPanel: {},
      },
    },
  };

  return templates[section] || { [section]: base };
};
