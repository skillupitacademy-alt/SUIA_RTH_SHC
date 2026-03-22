import { InsightGuideCardProps } from "../../InsightGuideCard";

export const difficultySplitGuide: InsightGuideCardProps = {
    title: "Difficulty Accuracy Split",
    measures: "Accuracy by difficulty level.",
    matters: "Shows your current level and readiness to advance.",
    howToRead: "High simple/low expert = early stage; balanced = ready.",
    confidence: "medium",
    sampleSize: 20,
    lastUpdated: "Just now",
    signals: [
        { type: 'good', text: 'High expert → advanced' },
        { type: 'neutral', text: 'Strong simple, weak intermediate → practice mids' },
        { type: 'risk', text: 'Weak simple → fix fundamentals first' }
    ],
    nextSteps: [
        'Master simple, then intermediate, then expert.',
        'Don’t move up until the current level is solid.',
        'Retest after each practice block.'
    ],
    expectedOutcome: "You will unlock 'Expert' tier questions once 'Intermediate' reaches 80% accuracy."
};

