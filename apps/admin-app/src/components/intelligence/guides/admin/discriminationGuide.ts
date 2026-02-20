import { InsightGuideCardProps } from "../../InsightGuideCard";

export const discriminationGuide: InsightGuideCardProps = {
    title: "Discrimination Index",
    measures: "Separation of strong vs weak students per item.",
    matters: "Core psychometric quality check.",
    howToRead: "Top-left = good; diagonal = neutral; bottom-right = broken.",
    confidence: "medium",
    sampleSize: 80,
    lastUpdated: "Just now",
    owner: "Psychometrics",
    signals: [
        { type: 'good', text: 'Top-left ? keep' },
        { type: 'risk', text: 'Bottom-right ? pull and fix' }
    ],
    nextSteps: [
        'Remove or rewrite bottom-right items.',
        'Keep top-left as calibrated anchors.',
        'Tweak diagonal items (clarify stem/distractors).'
    ]
};

