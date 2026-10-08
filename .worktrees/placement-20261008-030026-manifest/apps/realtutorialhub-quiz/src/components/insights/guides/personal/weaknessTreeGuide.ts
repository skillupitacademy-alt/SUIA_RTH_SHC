import { InsightGuideCardProps } from "../../InsightGuideCard";

export const weaknessTreeGuide: InsightGuideCardProps = {
    title: "Weakness Tree",
    measures: "Where mistakes cluster in the hierarchy.",
    matters: "Pinpoints exactly where to study.",
    howToRead: "Bigger/redder blocks = bigger gaps; green/small = stable.",
    confidence: "medium",
    sampleSize: 20,
    lastUpdated: "Just now",
    signals: [
        { type: 'good', text: 'Few red leaves → isolated gaps' },
        { type: 'risk', text: 'Whole red branch → core concept missing' }
    ],
    nextSteps: [
        'If only leaves are red, study those subtopics.',
        'If a whole branch is red, relearn the topic from basics.',
        'Practice a small set immediately after studying.'
    ],
    expectedOutcome: "Targeted study will prune away red branches, freeing up focus for complex labs."
};

