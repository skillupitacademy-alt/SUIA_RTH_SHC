import { InsightGuideCardProps } from "../../InsightGuideCard";

export const helpQueueGuide: InsightGuideCardProps = {
    title: "Help Request Queue",
    measures: "Live help requests and their status/priority.",
    matters: "Ensures timely human intervention.",
    howToRead: "Pending/Scheduled/Resolved with Urgent flag (<50% accuracy).",
    confidence: "medium",
    sampleSize: 40,
    lastUpdated: "Just now",
    owner: "Tutor Ops",
    signals: [
        { type: 'risk', text: 'Many urgent pending → staffing or content issue' },
        { type: 'good', text: 'Fast movement to resolved → healthy ops' }
    ],
    nextSteps: [
        'Schedule or resolve urgent requests first; add a tutor note.',
        'If a topic repeats, review its questions/notes.'
    ]
};

