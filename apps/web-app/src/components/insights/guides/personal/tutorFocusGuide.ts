import { InsightGuideCardProps } from "../../InsightGuideCard";

export const tutorFocusGuide: InsightGuideCardProps = {
    title: "Focus Recommendations",
    measures: "Topics the system recommends you study next.",
    matters: "Gives you the fastest path to improvement.",
    howToRead: "Revise = urgent; practice = strengthen; advance = ready for next level.",
    confidence: "high",
    sampleSize: 10,
    lastUpdated: "Just now",
    signals: [
        { type: 'good', text: 'Few revise items → safe' },
        { type: 'risk', text: 'Many revise items → at risk' }
    ],
    nextSteps: [
        'Open the study link for the recommended topic.',
        'Do the suggested practice today.',
        'Retake a quiz within 48 hours.'
    ],
    expectedOutcome: "Targeted revision will eliminate knowledge gaps in your lowest-performing areas."
};

