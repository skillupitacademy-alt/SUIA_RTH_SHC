export const getStrictSectionJsonTemplate = (section: string, subtopicName: string): Record<string, unknown> => {
  const base = { schemaVersion: 1, sectionType: section };
  const templates: Record<string, Record<string, unknown>> = {
    overview: {
      overview: {
        ...base,
        hero: {
          iconLabel: 'JS',
          title: subtopicName,
          description: `Clear overview of ${subtopicName}.`,
          difficulty: 'Beginner',
          topicsCount: 10,
          lastUpdated: 'Today',
        },
        progressSummary: {
          percentage: 0,
          checklist: [
            { label: 'Notes', completed: false },
            { label: 'Practice', completed: false },
            { label: 'Assignment', completed: false },
            { label: 'Quiz', completed: false },
          ],
        },
        learningOutcomes: ['Outcome 1', 'Outcome 2', 'Outcome 3'],
        learningRoadmap: {
          contentCards: [
            { id: 'notes', title: 'Notes', type: 'notes', content: 'What notes teach.', ctaLabel: 'Read Full Notes' },
            { id: 'layman', title: 'Layman Explanation', type: 'layman', content: 'Simple explanation angle.', ctaLabel: 'Read Simply' },
            { id: 'real-life', title: 'Real-Life Example', type: 'example', content: 'Real-world usage.', ctaLabel: 'View Examples' },
            { id: 'code', title: 'Code Example', type: 'code', code: 'console.log("example");', ctaLabel: 'Run Code' },
            { id: 'technical', title: 'Technical Deep Dive', type: 'deep-dive', content: 'Technical depth.', ctaLabel: 'Read Details' },
            { id: 'visual', title: 'Visual Explanation', type: 'visual', content: 'Visual model.', ctaLabel: 'View Visual' },
          ],
          taskCards: [
            { id: 'practice', title: 'Practice Tasks', type: 'practice', content: 'Practice scope.', ctaLabel: 'Start Practice' },
            { id: 'assignment', title: 'Assignment', type: 'assignment', content: 'Assignment scope.', badge: { text: 'Easy', type: 'success' }, ctaLabel: 'Start Assignment' },
            { id: 'project', title: 'Project', type: 'project', content: 'Project scope.', badge: { text: 'Beginner', type: 'success' }, ctaLabel: 'View Project' },
            { id: 'quiz', title: 'Quiz', type: 'quiz', content: 'Quiz scope.', ctaLabel: 'Start Quiz' },
          ],
        },
        recommendedFlow: ['Read Notes', 'Review Layman Explanation', 'Try Code Example', 'Complete Practice', 'Take Quiz'],
        readinessContext: {
          prerequisites: ['Prerequisite 1', 'Prerequisite 2'],
          successCriteria: ['Success criterion 1', 'Success criterion 2'],
        },
        navigation: { prevTitle: 'Previous subtopic', nextTitle: 'Next subtopic' },
      },
    },
    notes: {
      notes: {
        ...base,
        simpleWords: `Simple explanation of ${subtopicName}.`,
        definitionBlock: {
          badge: 'Core Concept',
          headline: `What is ${subtopicName}?`,
          definitionText: 'Precise definition.',
          importanceCallout: 'Why it matters.',
          quickSummary: ['Summary point 1', 'Summary point 2'],
        },
        sections: [
          { id: 'concept', title: 'Concept', content: 'Main explanation.', keyPoint: 'Key point.' },
          { id: 'syntax', title: 'Syntax', content: 'Syntax explanation.', codeExample: { code: 'const value = true;', output: 'true' } },
        ],
        syntaxBlock: {
          code: 'Code snippet here',
          language: 'python',
          title: 'Syntax Example',
          subtitle: `${subtopicName} Basic Syntax`,
          explanations: [
            { id: 'exp1', term: 'Line 1', explanation: 'Explanation of this line or term.' }
          ]
        },
        componentGrid: {
          gridTitle: 'Key Components',
          componentCards: [
            { id: 'comp1', title: 'Component 1', description: 'Description.', icon: 'Box', subcomponents: ['Part 1'] },
          ],
        },
        examplePanel: {
          exampleTitle: 'Practical Examples',
          scenarios: [
            { id: 'ex1', title: 'Example 1', scenarioDescription: 'Scenario.', practicalSolution: 'Solution.', industryContext: 'Industry context.' },
          ],
        },
        practiceCard: {
          bestPracticeTitle: 'Best Practices',
          recommendations: [{ id: 'bp1', title: 'Practice 1', description: 'Description.' }],
          optimizationTips: ['Tip 1'],
          industryStandards: ['Standard 1'],
        },
        warningFaq: {
          commonErrors: [{ id: 'err1', error: 'Mistake.', solution: 'Fix.' }],
          faqItems: [{ id: 'faq1', question: 'Question?', answer: 'Answer.' }],
          misconceptionAlerts: ['Misconception to avoid.'],
        },
        summaryCard: {
          summaryTitle: 'Quick Revision Summary',
          keyTakeaways: ['Takeaway 1'],
          revisionChecklist: [{ id: 'check1', item: 'Review item.', checked: false }],
          memoryReinforcement: 'Memory hook.',
          examTips: ['Exam tip 1'],
        },
        summaryHeroInfographic: {
          summaryTitle: `Quick Revision: What is ${subtopicName}?`,
          examTips: [
            `Top core point about ${subtopicName}.`,
            `Important takeaway regarding ${subtopicName} implementation.`
          ],
          howItWorks: [
            { step: 1, label: 'Trigger', description: 'Setup environment.' },
            { step: 2, label: 'Process', description: 'Execution logic.' },
            { step: 3, label: 'Render', description: 'Display result.' }
          ]
        },
        conceptMemoryMap: {
          nodes: [
            { id: 'node-1', label: `${subtopicName} Core`, description: 'Primary learning objective.' },
            { id: 'node-2', label: 'Context Integration', description: 'How it relates to parent architecture.' }
          ],
          connections: [
            { from: 'node-1', to: 'node-2', label: 'connects to' }
          ]
        },
        cheatSheetSVG: {
          title: `${subtopicName} Cheat Sheet`,
          sections: [
            {
              id: 'quick-ref-1',
              title: 'Operation or Rule 1',
              code: 'example_syntax_here',
              description: 'Short explanation of when to use this syntax.'
            },
            {
              id: 'quick-ref-2',
              title: 'Operation or Rule 2',
              code: 'another_example_here',
              description: 'Short explanation of the expected result.'
            }
          ]
        },
        flashcardVisualSystem: {
          cards: [{ id: 'card1', question: 'Question?', answer: 'Answer.' }]
        },
        comparisonSummaryChart: {
          title: 'Comparison Chart',
          columns: ['Column 1', 'Column 2'],
          rows: [['Row 1 Col 1', 'Row 1 Col 2']]
        },
        mnemonicRetentionGraphic: {
          mnemonicTitle: 'Mnemonic',
          memoryHook: 'Hook.',
          rememberItems: [{ letter: 'A', label: 'Apple', description: 'Desc.' }],
          keyPoints: ['Key point 1']
        },
        footerBlock: {
          finalNote: 'Final note.',
          nextStepLabel: 'Next Step',
          nextStepTarget: 'next-subtopic'
        }
      },
    },
    layman: {
      layman: {
        ...base,
        simpleOverview: { badge: 'Layman Section', headline: `${subtopicName} in Simple Words`, simpleDefinition: 'A clear beginner-friendly definition written in short, direct language.', subExplanation: 'A second paragraph that explains how the concept behaves in normal learning or real usage.', importanceBlock: 'Explain why understanding this concept helps a beginner make sense of later technical sections.', progressIndicator: 'Beginner-ready explanation.' },
        everydayAnalogy: { title: 'Everyday Analogy', storyAnalogy: 'A vivid real-world comparison that makes the concept intuitive for a first-time learner.', comparisonPanel: 'Describe the everyday object or situation in plain language.', visualMetaphor: [{ label: 'Real World', comparison: 'Technical Mapping' }], keyTakeaway: 'One short takeaway sentence that the learner can recall quickly.', image: 'Optional illustration URL if available.' },
        whyItExists: {
          sectionTitle: 'Why It Exists',
          benefitCards: [
            { id: 'benefit1', title: 'Career Benefit', description: 'How this concept helps in interviews, job tasks, or professional growth.', icon: 'Briefcase', type: 'career' },
            { id: 'benefit2', title: 'Practical Benefit', description: 'How this concept helps a learner understand or build something real.', icon: 'Zap', type: 'practical' },
            { id: 'benefit3', title: 'Future Benefit', description: 'How this concept prepares the learner for the next related ideas.', icon: 'TrendingUp', type: 'future' },
          ],
        },
        simpleUseCases: {
          gridTitle: 'Simple Use Cases',
          useCaseCards: [
            { id: 'use1', title: 'Everyday Use Case 1', description: 'A normal beginner-friendly example from daily digital life.', category: 'everyday', icon: 'Monitor' },
            { id: 'use2', title: 'Everyday Use Case 2', description: 'Another everyday example that feels concrete and easy to imagine.', category: 'everyday', icon: 'ShoppingCart' },
            { id: 'use3', title: 'Career Use Case 1', description: 'A work or software-building example where this concept matters.', category: 'career', icon: 'Briefcase' },
            { id: 'use4', title: 'Career Use Case 2', description: 'A second professional or project-oriented example.', category: 'career', icon: 'Gauge' },
          ],
        },
        beginnerBreakdown: { title: 'Beginner Breakdown', steps: [{ id: 'step1', stepTitle: 'Step 1', stepExplanation: 'First small idea the learner should understand.', microLearningChunk: 'A tiny example or memory hook for step 1.' }, { id: 'step2', stepTitle: 'Step 2', stepExplanation: 'Second idea that builds naturally from the first.', microLearningChunk: 'A tiny example or memory hook for step 2.' }, { id: 'step3', stepTitle: 'Step 3', stepExplanation: 'Third idea that shows the concept in action.', microLearningChunk: 'A tiny example or memory hook for step 3.' }, { id: 'step4', stepTitle: 'Step 4', stepExplanation: 'Fourth idea that helps remove beginner confusion.', microLearningChunk: 'A tiny example or memory hook for step 4.' }] },
        mentalModel: { title: 'Mental Model', conceptMap: [{ id: 'node1', label: 'Start', type: 'core' }], visualLabels: [{ from: 'node1', to: 'node2', label: 'leads to' }] },
        commonConfusions: { title: 'Common Confusions', confusionItems: [{ id: 'conf1', confusion: 'A beginner-style confusion question.', clarification: 'A direct clarification in simple language.' }, { id: 'conf2', confusion: 'Another likely confusion.', clarification: 'A clear correction that removes the doubt.' }, { id: 'conf3', confusion: 'A third confusion that often appears early.', clarification: 'A plain explanation that resets understanding.' }], faqItems: [{ id: 'faq1', question: 'Short practical question 1?', answer: 'Short practical answer 1.' }, { id: 'faq2', question: 'Short practical question 2?', answer: 'Short practical answer 2.' }, { id: 'faq3', question: 'Short practical question 3?', answer: 'Short practical answer 3.' }], misconceptionAlerts: ['One myth or misconception to avoid.', 'Another misconception to avoid.'] },
        simpleRecap: { summaryTitle: 'Simple Recap', keyTakeaways: ['Takeaway 1', 'Takeaway 2', 'Takeaway 3'], simpleRecapPoints: [{ id: 'recap1', item: 'Recap point 1', checked: false }], confidenceBoost: 'A final confidence-building sentence for the learner.', memoryReinforcement: 'A short memory hook the learner should remember later.' },
      },
    },
    real_life: {
      real_life: {
        ...base,
        conceptMapping: { badge: 'Real World', headline: `${subtopicName} in Real Life`, conceptDefinition: 'Concept definition.', realWorldTranslation: 'Real-world translation.', importanceBlock: 'Importance.', careerRelevance: 'Career relevance.' },
        industryUseCase: { title: 'Industry Use Case', industryName: 'Industry', scenarioDescription: 'Scenario.', businessContext: 'Context.', implementation: 'Implementation.', impact: 'Impact.', keyTakeaway: 'Takeaway.' },
        dailyLifeExample: { title: 'Daily Life Example', storyTitle: 'Story', storyNarrative: 'Story narrative.', everydayConnection: 'Connection.', technicalMapping: 'Mapping.', relatableInsight: 'Insight.' },
        careerRelevance: { title: 'Career Relevance', careerPaths: [{ id: 'career1', role: 'Developer', description: 'Description.', skillLevel: 'entry', salaryRange: 'Varies', icon: 'Briefcase' }], industryDemand: 'Demand.', futureGrowth: 'Growth.' },
        problemSolutionContext: { title: 'Problem Solution Context', problemStatement: 'Problem.', context: 'Context.', solution: 'Solution.', implementation: 'Implementation.', outcome: 'Outcome.', lessonsLearned: 'Lesson.' },
        businessApplication: { title: 'Business Application', companyType: 'Company type.', businessChallenge: 'Challenge.', technicalApplication: 'Application.', businessProcess: 'Process.', roi: 'ROI.', scalability: 'Scalability.', keyInsight: 'Insight.' },
        domainScenarios: { title: 'Domain Scenarios', scenarios: [{ id: 'domain1', domain: 'Domain', title: 'Scenario', description: 'Description.', application: 'Application.', icon: 'Globe' }] },
        practicalRecap: { summaryTitle: 'Practical Recap', keyApplications: ['Application 1'], industryRelevance: ['Relevance 1'], careerImpact: 'Impact.', nextSteps: ['Next step 1'], practicalAdvice: 'Advice.' },
      },
    },
    technical: {
      technical: {
        ...base,
        title: `${subtopicName} Technical Deep Dive`,
        badge: 'Technical',
        intro: 'Technical introduction.',
        sections: [
          { id: 'tech1', title: 'Technical Section', content: 'Detailed technical content.', diagram: { type: 'flow', data: { label: 'Flow' } }, code: { language: 'javascript', code: 'console.log("technical");', output: 'technical' }, keyPoints: ['Key point'], steps: [{ id: 'step1', text: 'Step text.' }], highlight: 'Important highlight.' },
        ],
      },
    },
    code: {
      code: {
        ...base,
        problemContext: { title: 'Problem Context', scenario: 'Scenario.', requirements: ['Requirement 1'], constraints: 'Constraint.' },
        basicCodeExample: { title: 'Basic Code Example', description: 'Description.', code: 'const example = true;', language: 'javascript', explanation: 'Explanation.' },
        lineByLineExplanation: { title: 'Line-by-Line Explanation', lines: [{ id: 'line1', lineNumber: 1, code: 'const example = true;', explanation: 'Line explanation.' }] },
        outputDemonstration: { title: 'Output Demonstration', input: 'Input.', output: 'Output.', explanation: 'Explanation.', visualRepresentation: 'Visual representation.' },
        bestPracticeVersion: { title: 'Best Practice Version', improvements: ['Improvement 1'], code: 'const example = true;', explanation: 'Explanation.', benefits: ['Benefit 1'] },
        commonMistakes: { title: 'Common Mistakes', mistakes: [{ id: 'mistake1', mistake: 'Mistake.', badCode: 'bad();', goodCode: 'good();', why: 'Why.', lesson: 'Lesson.' }] },
        realWorldImplementation: { title: 'Real-World Implementation', scenario: 'Scenario.', code: 'console.log("production");', features: ['Feature 1'], explanation: 'Explanation.', scalability: 'Scalability.' },
        codeSummary: { title: 'Code Summary', keyTakeaways: ['Takeaway 1'], practiceExercise: 'Exercise.', nextSteps: ['Next step 1'] },
      },
    },
    visual: {
      visual: {
        ...base,
        conceptVisualIntro: { badge: 'Visual', headline: `${subtopicName} Visually`, visualDefinition: 'Visual definition.', heroDiagramPreview: 'Diagram preview.', importanceBlock: 'Importance.', progressIndicator: 'Progress note.' },
        diagrammaticBreakdown: { title: 'Diagrammatic Breakdown', diagramTitle: 'Diagram', componentLabels: [{ id: 'A', label: 'Part A', description: 'Description.' }], stepMarkers: ['Step marker'], technicalTooltips: [{ id: 'tip1', term: 'Term', explanation: 'Explanation.' }] },
        stepByStepVisualFlow: { title: 'Step-by-Step Visual Flow', sequenceTitle: 'Flow', steps: [{ id: 'step1', stepNumber: 1, title: 'Step', description: 'Description.', visualCue: 'Cue.' }], phaseExplanations: ['Phase explanation'] },
        comparativeVisualization: { title: 'Comparative Visualization', comparisonTitle: 'Comparison', sideBySideVisuals: { option1: { title: 'Option 1', description: 'Description.', pros: ['Pro'], cons: ['Con'] }, option2: { title: 'Option 2', description: 'Description.', pros: ['Pro'], cons: ['Con'] } }, differenceHighlights: ['Difference'] },
        mentalModelVisualization: { title: 'Mental Model Visualization', frameworkMap: { nodes: [{ id: 'node1', label: 'Node', description: 'Description.', type: 'core' }], connections: [{ from: 'node1', to: 'node1', label: 'relates', type: 'primary' }] }, memoryLabels: ['Memory label'] },
        realWorldVisualMapping: { title: 'Real-World Visual Mapping', practicalScenarios: [{ id: 'scenario1', title: 'Scenario', description: 'Description.', industryContext: 'Context.', visualRepresentation: 'Representation.', icon: 'Briefcase' }], careerRelevance: 'Career relevance.' },
        commonConfusionVisualization: { title: 'Common Confusion Visualization', confusionItems: [{ id: 'conf1', confusion: 'Confusion.', visualClarification: 'Clarification.', correctVisualization: 'Correct view.' }], faqItems: [{ id: 'faq1', question: 'Question?', answer: 'Answer.' }], misconceptionDiagrams: ['Misconception diagram'] },
        visualSummary: { summaryTitle: 'Visual Summary', keyVisualTakeaways: ['Takeaway'], revisionInfographic: 'Infographic description.', memoryReinforcement: 'Memory hook.', examVisualChecklist: ['Checklist item'] },
      },
    },
    practice: {
      practice: {
        ...base,
        assessmentIntro: { badge: 'Practice', headline: `${subtopicName} Practice Test`, testDescription: 'Test description.', difficultyOverview: 'Difficulty overview.', learningGoals: ['Goal 1'], readinessIndicator: 'Readiness indicator.' },
        conceptRecallQuestions: { title: 'Concept Recall Questions', questions: [{ id: 'q1', questionNumber: 1, type: 'single-choice', points: 5, question: 'Question?', options: [{ id: 'a', text: 'Option A' }, { id: 'b', text: 'Option B' }], correctAnswer: 'a', explanation: 'Explanation.', difficulty: 'easy' }] },
        scenarioBasedQuestions: { title: 'Scenario-Based Questions', scenarios: [{ id: 's1', scenarioTitle: 'Scenario', realWorldProblem: 'Problem.', businessContext: 'Context.', decisionQuestion: 'Decision?', options: [{ id: 'a', text: 'Option A' }, { id: 'b', text: 'Option B' }], correctAnswer: 'a', explanation: 'Explanation.', difficulty: 'medium' }] },
        difficultyProgression: { title: 'Difficulty Progression', levels: [{ id: 'level1', level: 'beginner', description: 'Description.', questionCount: 5, passingScore: 70 }], adaptiveLogic: false },
        instantFeedback: { enabled: true, feedbackType: 'immediate' },
        commonMistakeDetection: { title: 'Common Mistake Detection', mistakeCategories: [{ id: 'mistake1', category: 'Category', description: 'Description.', frequency: 1 }], weaknessHeatmap: { topics: [{ id: 'topic1', topic: subtopicName, score: 0, status: 'weak' }] } },
        performanceAnalytics: { title: 'Performance Analytics', scoreDisplay: { currentScore: 0, maxScore: 100, percentage: 0 }, performanceGraphs: { accuracyTrend: [0], speedTrend: [0] }, benchmarkComparison: { userScore: 0, averageScore: 70, topScore: 100 }, masteryPercentage: 0, examReadinessScore: 0 },
        revisionRecommendations: { title: 'Revision Recommendations', personalizedLearningPath: [{ id: 'path1', topic: subtopicName, priority: 'high', estimatedTime: '20 mins', resources: ['Notes'] }], weaknessRecoverySteps: ['Recovery step'], recommendedResources: [{ id: 'res1', title: 'Resource', type: 'article', link: 'https://example.com' }], futureGoals: ['Future goal'] },
      },
    },
    assignment: {
      assignment: {
        ...base,
        title: `${subtopicName} Assignment`,
        description: 'Assignment description.',
        task: { title: 'Task title', description: 'Task description.', requirements: ['Requirement 1'] },
        objectives: ['Objective 1'],
        starterCode: '// starter code',
        submissionGuidelines: ['Guideline 1'],
      },
    },
    project: {
      project: {
        ...base,
        title: `${subtopicName} Project`,
        description: 'Project description.',
        deadline: '2 days',
        hero: { badge: 'Project', title: `${subtopicName} Project`, description: 'Hero description.', image: '/project_mockup.svg' },
        realWorldUse: 'Real-world use.',
        skills: ['Skill 1'],
        buildItems: ['Build item 1'],
        deliverables: ['Deliverable 1'],
      },
    },
    quiz: {
      quiz: {
        ...base,
        title: `${subtopicName} Quiz`,
        description: 'Quiz description.',
        totalQuestions: 1,
        questions: [{ id: 'q1', questionNumber: 1, type: 'Single Choice', points: 2, question: 'Question?', options: [{ id: 'a', text: 'Option A' }, { id: 'b', text: 'Option B' }], correctAnswer: 'a', explanation: 'Explanation.' }],
      },
    },
    summary: {
      summary: {
        ...base,
        title: `${subtopicName} Summary`,
        description: 'Summary description.',
        masteryRecapCard: { headline: 'What You Should Know Now', recap: 'Recap.', confidenceSignal: 'Confidence signal.' },
        keyTakeawayGrid: [{ id: 'takeaway1', title: 'Takeaway', description: 'Description.', importance: 'Importance.' }],
        revisionChecklist: [{ id: 'check1', item: 'Checklist item.', checked: false }],
        nextStepPanel: { title: 'Recommended Next Step', description: 'Next step description.', actions: ['Action 1'] },
      },
    },
    interview: {
      interview: {
        ...base,
        title: `${subtopicName} Interview Prep`,
        description: 'Interview prep description.',
        interviewIntroCard: { badge: 'Interview Ready', headline: `How ${subtopicName} Appears in Interviews`, overview: 'Overview.', evaluationFocus: ['Focus 1'] },
        questionBankPanel: { title: 'Common Interview Questions', questions: [{ id: 'iq1', difficulty: 'easy', question: 'Question?', idealAnswer: 'Ideal answer.', followUps: ['Follow-up'], mistakesToAvoid: ['Mistake'] }] },
        answerFrameworkCard: { title: 'Answer Framework', framework: ['Define', 'Explain', 'Example'], sampleStructure: 'Sample answer structure.' },
        mockInterviewFlow: { title: 'Mock Interview Flow', rounds: [{ id: 'round1', focus: 'Concept clarity', prompt: 'Prompt.', expectedSignal: 'Signal.' }] },
      },
    },
    ai_tutor: {
      ai_tutor: {
        ...base,
        greeting: `Hi! Ask me anything about ${subtopicName}.`,
        qaPairs: [{ question: 'Question?', answer: 'Answer.' }],
        tutorPromptCard: { title: 'Tutor Guidance', systemPrompt: 'Tutor behavior and tone.', starterQuestions: ['Starter question'] },
        misconceptionDetector: { title: 'Common Misconceptions', misconceptions: [{ id: 'mis1', wrongBelief: 'Wrong belief.', correction: 'Correction.', example: 'Example.' }] },
        adaptiveHintPanel: { title: 'Adaptive Hints', hints: [{ level: 1, hint: 'Hint.' }] },
      },
    },
  };

  return templates[section] ?? templates.notes;
};
