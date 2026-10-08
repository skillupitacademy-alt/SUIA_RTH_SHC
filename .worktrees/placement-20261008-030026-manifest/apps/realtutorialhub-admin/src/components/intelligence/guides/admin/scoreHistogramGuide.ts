import { InsightGuideCardProps } from "../../InsightGuideCard";

export const scoreHistogramGuide: InsightGuideCardProps = {
    title: "Score Distribution",
    measures: "Cohort score spread.",
    matters: "Checks if exam difficulty is balanced.",
    howToRead: "Bell = good; left-heavy = too hard; right-heavy = too easy.",
    confidence: "medium",
    sampleSize: 80,
    lastUpdated: "Just now",
    owner: "Psychometrics",
    signals: [
        { type: 'good', text: 'Most scores mid-range → balanced' },
        { type: 'risk', text: 'Left-heavy → unclear or too-hard items' },
        { type: 'risk', text: 'Right-heavy → items too easy' }
    ],
    nextSteps: [
        'If left-heavy, soften or replace the hardest items.',
        'If right-heavy, add a few harder items.',
        'Recheck after the next exam run.'
    ]
};

