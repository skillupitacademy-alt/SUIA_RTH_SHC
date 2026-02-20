import { InsightGuideCardProps } from "../../InsightGuideCard";

export const plannedVsActualGuide: InsightGuideCardProps = {
    title: "Planned vs Actual Difficulty",
    measures: "Blueprint compliance.",
    matters: "Ensures fairness and consistency.",
    howToRead: "Compare bars; big gaps = misaligned delivery.",
    confidence: "high",
    sampleSize: 80,
    lastUpdated: "Just now",
    owner: "Content Team",
    signals: [
        { type: 'good', text: 'Planned ≈ Actual ? compliant' },
        { type: 'risk', text: 'Large mismatch ? selection bias or pool gap' }
    ],
    nextSteps: [
        'Add/reclassify items to close gaps.',
        'Tune selection weights.',
        'Re-evaluate after the next build.'
    ]
};

