import { PremiumExamReport } from "@/types/premium-report";

export const MOCK_PREMIUM_REPORT: PremiumExamReport = {
  examId: "EXM-8829-NEURAL",
  score: 68,
  mastery: 61,
  readiness: 58,

  subtopics: [
    { name: "Variables", accuracy: 80 },
    { name: "Looping", accuracy: 55 },
    { name: "Conditional", accuracy: 40 },
    { name: "Data Types", accuracy: 72 },
    { name: "Scope", accuracy: 31 }
  ],

  skills: [
    { name: "Problem Solving", accuracy: 62 },
    { name: "Code Debugging", accuracy: 31 },
    { name: "Syntax Mastery", accuracy: 85 },
    { name: "Optimization", accuracy: 44 }
  ],

  difficulty: [
    { level: "simple", accuracy: 85 },
    { level: "intermediate", accuracy: 52 },
    { level: "expert", accuracy: 28 }
  ],

  heatmap: [
    { subtopic: "Variables", difficulty: "simple", accuracy: 90 },
    { subtopic: "Variables", difficulty: "intermediate", accuracy: 70 },
    { subtopic: "Variables", difficulty: "expert", accuracy: 60 },
    { subtopic: "Looping", difficulty: "simple", accuracy: 75 },
    { subtopic: "Looping", difficulty: "intermediate", accuracy: 50 },
    { subtopic: "Looping", difficulty: "expert", accuracy: 30 },
    { subtopic: "Conditional", difficulty: "simple", accuracy: 60 },
    { subtopic: "Conditional", difficulty: "intermediate", accuracy: 40 },
    { subtopic: "Conditional", difficulty: "expert", accuracy: 20 },
    { subtopic: "Data Types", difficulty: "simple", accuracy: 95 },
    { subtopic: "Data Types", difficulty: "intermediate", accuracy: 80 },
    { subtopic: "Data Types", difficulty: "expert", accuracy: 50 }
  ],

  ai: {
    status: "BORDERLINE",
    actions: [
      "Practice nested conditionals immediately",
      "Perform loop dry-run debugging for 30 mins",
      "Focus on intermediate difficulty before expert topics",
      "Reattempt logic-heavy sessions in 48 hours"
    ],
    weakestSubtopic: "Conditional Logic",
    weakestSkill: "Code Debugging",
    nextExamHours: 48
  }
};
