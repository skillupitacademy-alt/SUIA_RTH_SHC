import { InsightGuideCardProps } from "../../InsightGuideCard";

export const itemDifficultyGuide: InsightGuideCardProps = {
    title: "Item Difficulty",
    measures: "Accuracy per question.",
    matters: "Finds broken or trivial items.",
    howToRead: "Very low = ambiguous/too hard; very high = trivial; mid = healthy.",
    confidence: "medium",
    sampleSize: 80,
    lastUpdated: "Just now",
    owner: "Content Team",
    signals: [
        { type: 'risk', text: '<30% accuracy ? likely unclear' },
        { type: 'risk', text: '>80% accuracy ? too easy' },
        { type: 'good', text: '30–80% ? keep' }
    ],
    nextSteps: [
        'Rewrite or review the lowest/highest accuracy items.',
        'Keep mid-accuracy items as anchors.'
    ]
};

