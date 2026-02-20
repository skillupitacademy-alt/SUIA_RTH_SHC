import { InsightGuideCardProps } from "../../InsightGuideCard";

export const poolGaugeGuide: InsightGuideCardProps = {
    title: "Pool Sufficiency Gauge",
    measures: "Available vs required questions.",
    matters: "Prevents generation failures and repeats.",
    howToRead: "Green = safe; Yellow = watch; Red = shortage.",
    confidence: "high",
    sampleSize: 80,
    lastUpdated: "Just now",
    owner: "Asset Management",
    signals: [
        { type: 'good', text: '>80% of required ? good' },
        { type: 'neutral', text: '50–80% ? start authoring' },
        { type: 'risk', text: '<50% ? at risk' }
    ],
    nextSteps: [
        'Author items for low-stock topics/difficulties.',
        'Prioritize areas with weak performance.'
    ]
};

