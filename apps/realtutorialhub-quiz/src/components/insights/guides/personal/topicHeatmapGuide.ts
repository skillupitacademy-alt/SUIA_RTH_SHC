import { InsightGuideCardProps } from "../../InsightGuideCard";

export const topicHeatmapGuide: InsightGuideCardProps = {
    title: "Topic Performance",
    measures: "Your accuracy per topic.",
    matters: "Quickly shows strengths and weaknesses.",
    howToRead: "Green = strong; yellow = moderate; red = needs revision; grey = untested.",
    confidence: "medium",
    sampleSize: 20,
    lastUpdated: "Just now",
    signals: [
        { type: 'good', text: 'Green on core topics → exam ready' },
        { type: 'neutral', text: 'Yellow on advanced → practice more' },
        { type: 'risk', text: 'Red on fundamentals → immediate revision' }
    ],
    nextSteps: [
        'Tackle the 2–3 reddest topics first.',
        'Read the provided notes, then do 5–10 practice questions.',
        'Recheck after your next quiz.'
    ],
    expectedOutcome: "Your heatmap will turn 'Deep Emerald' on your most studied subjects."
};

