import { InsightGuideCardProps } from "../../InsightGuideCard";

export const scoreHistoryGuide: InsightGuideCardProps = {
    title: "Score History",
    measures: "How your total score changes over time.",
    matters: "Shows if your study approach is working.",
    howToRead: "Up = improving; flat = no progress; down = slipping.",
    confidence: "high",
    sampleSize: 20,
    lastUpdated: "Just now",
    signals: [
        { type: 'good', text: 'Steady upward trend ? strong retention' },
        { type: 'neutral', text: 'Zig-zag ? inconsistent understanding' },
        { type: 'risk', text: 'Sharp drop ? weak fundamentals in recent topics' }
    ],
    nextSteps: [
        'Review topics from the lowest recent test.',
        'Take shorter quizzes more often.',
        'Focus on accuracy before speed.'
    ],
    expectedOutcome: "Your overall test average should stabilize upwards within 2-3 sessions."
};

