import { InsightGuideCardProps } from "../../InsightGuideCard";

export const masteryTrendGuide: InsightGuideCardProps = {
    title: "Mastery Trend",
    measures: "How solid your understanding is becoming.",
    matters: "Indicates if knowledge is sticking.",
    howToRead: "Rising = sticking; flat = maintaining; falling = forgetting.",
    confidence: "high",
    sampleSize: 20,
    lastUpdated: "Just now",
    signals: [
        { type: 'good', text: 'Rising → keep current routine' },
        { type: 'neutral', text: 'Flat → add light mid-week reviews' },
        { type: 'risk', text: 'Falling → quick refresher needed' }
    ],
    nextSteps: [
        'Revisit notes for the last dip.',
        'Add one short review session mid-week.',
        'Retake a focused quiz to confirm recovery.'
    ],
    expectedOutcome: "Long-term retention scores will improve by approximately 15%."
};

