import { InsightGuideCardProps } from "../../InsightGuideCard";

export const topicSkillHeatmapGuide: InsightGuideCardProps = {
    title: "Topic–Skill Heatmap",
    measures: "Where the cohort struggles across topics and skills.",
    matters: "Directs remediation and content investment.",
    howToRead: "Red cells = high error areas; grey = no data.",
    confidence: "medium",
    sampleSize: 80,
    lastUpdated: "Just now",
    owner: "Academic Support",
    signals: [
        { type: 'risk', text: 'Darkest cells → immediate remediation targets' },
        { type: 'neutral', text: 'Grey cells → need coverage' }
    ],
    nextSteps: [
        'Add hints/notes for the darkest cells.',
        'Create items for uncovered (grey) cells.',
        'Recheck after next cycle to confirm improvement.'
    ]
};

