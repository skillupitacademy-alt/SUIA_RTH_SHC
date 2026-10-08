import { InsightGuideCardProps } from "../../InsightGuideCard";

export const notesSecurityGuide: InsightGuideCardProps = {
    title: "Secure Notes Delivery",
    measures: "Secure access to study notes.",
    matters: "Protects IP and ensures only eligible students access notes.",
    howToRead: "Expiring, signed links; access logs.",
    confidence: "high",
    sampleSize: 50,
    lastUpdated: "Just now",
    owner: "Infrastructure",
    signals: [
        { type: 'good', text: 'Successful deliveries; low failures' },
        { type: 'risk', text: 'Many failures → check storage or signatures' }
    ],
    nextSteps: [
        'Monitor failures; reissue links if needed.',
        'Keep links short-lived (e.g., 1 hour).'
    ]
};

