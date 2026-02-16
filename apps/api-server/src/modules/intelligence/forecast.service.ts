export interface ForecastResult {
    velocity: number; // Avg accuracy gain/loss per day
    predictedMasteryDate: string | null;
    isStruggling: boolean;
    confidence: 'low' | 'medium' | 'high';
}

export class ForecastService {
    private static MASTERY_TARGET = 90;

    /**
     * Calculates the trajectory of a student's learning using historical data points.
     * Velocity is calculated as the change in accuracy over time.
     */
    static calculateTrajectory(history: { date: Date | string; accuracy: number }[]): ForecastResult {
        // Engineering Manifesto: Guard against insufficient data
        if (history.length < 3) {
            return { velocity: 0, predictedMasteryDate: null, isStruggling: false, confidence: 'low' };
        }

        // Sort by date ascending
        const sorted = [...history].sort((a, b) => {
            const dA = a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime();
            const dB = b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime();
            return dA - dB;
        });

        const first = sorted[0];
        const last = sorted[sorted.length - 1];

        const firstTime = first.date instanceof Date ? first.date.getTime() : new Date(first.date).getTime();
        const lastTime = last.date instanceof Date ? last.date.getTime() : new Date(last.date).getTime();

        const msDiff = lastTime - firstTime;
        const daysDiff = msDiff / (1000 * 60 * 60 * 24);

        // Velocity = Change in Accuracy / Time
        const velocity = daysDiff > 0 ? (last.accuracy - first.accuracy) / daysDiff : 0;
        
        let predictedMasteryDate: string | null = null;
        
        // Only predict if velocity is positive and they aren't already at target
        if (velocity > 0 && last.accuracy < this.MASTERY_TARGET) {
            const pointsNeeded = this.MASTERY_TARGET - last.accuracy;
            const daysToMastery = Math.ceil(pointsNeeded / velocity);
            
            // Limit prediction to 1 year out to avoid absurd forecasts
            if (daysToMastery < 365) {
                const targetTime = lastTime + (daysToMastery * 24 * 60 * 60 * 1000);
                predictedMasteryDate = new Date(targetTime).toISOString();
            }
        }

        return {
            velocity: Number(velocity.toFixed(2)),
            predictedMasteryDate,
            isStruggling: velocity < -0.2, // Losing more than 0.2% accuracy per day is a red flag
            confidence: history.length > 10 ? 'high' : history.length > 5 ? 'medium' : 'low'
        };
    }
}
