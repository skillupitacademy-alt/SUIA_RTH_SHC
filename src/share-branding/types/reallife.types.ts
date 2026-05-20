export interface RealLifeSectionPattern {
  conceptMapping?: {
    badge: string;
    headline: string;
    conceptDefinition: string;
    realWorldTranslation: string;
    importanceBlock: string;
    careerRelevance?: string;
  };
  industryUseCase?: {
    title: string;
    industryName: string;
    scenarioDescription: string;
    businessContext: string;
    implementation: string;
    impact: string;
    keyTakeaway: string;
    image?: string;
  };
  dailyLifeExample?: {
    title: string;
    storyTitle: string;
    storyNarrative: string;
    everydayConnection: string;
    technicalMapping: string;
    relatableInsight: string;
    image?: string;
  };
  careerRelevance?: {
    title: string;
    careerPaths: Array<{
      id: string;
      role: string;
      description: string;
      skillLevel: 'entry' | 'mid' | 'senior';
      salaryRange?: string;
      icon: string;
    }>;
    industryDemand: string;
    futureGrowth: string;
  };
  problemSolutionContext?: {
    title: string;
    problemStatement: string;
    context: string;
    solution: string;
    implementation: string;
    outcome: string;
    lessonsLearned: string;
  };
  businessApplication?: {
    title: string;
    companyType: string;
    businessChallenge: string;
    technicalApplication: string;
    businessProcess: string;
    roi: string;
    scalability: string;
    keyInsight: string;
  };
  domainScenarios?: {
    title: string;
    scenarios: Array<{
      id: string;
      domain: string;
      title: string;
      description: string;
      application: string;
      icon: string;
    }>;
  };
  practicalRecap?: {
    summaryTitle: string;
    keyApplications: string[];
    industryRelevance: string[];
    careerImpact: string;
    nextSteps: string[];
    practicalAdvice: string;
  };
}
