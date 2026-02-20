import { InsightGuideCardProps } from "../../InsightGuideCard";

export const timeBoxplotGuide: InsightGuideCardProps = {
    title: "Time per Question",
    measures: "Your pacing.",
    matters: "Detects guessing or overthinking.",
    howToRead: "Very low time = guessing; very high time = stuck; middle = healthy.",
    confidence: "medium",
    sampleSize: 20,
    lastUpdated: "Just now",
    signals: [
        { type: 'good', text: 'Medium time + good accuracy ? optimal' },
        { type: 'risk', text: 'Low time + low accuracy ? guessing' },
        { type: 'risk', text: 'High time + low accuracy ? confusion' }
    ],
    nextSteps: [
        'If too fast, slow down and read fully.',
        'If too slow, practice timed mini-sets.',
        'Keep most answers in the middle band.'
    ],
    expectedOutcome: "Your time-to-answer will align with top-decile performers."
};

