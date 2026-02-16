import { describe, expect, it } from 'vitest';

import { ForecastService } from '../forecast.service';

describe('ForecastService', () => {
    it('should return confidence: low for insufficient data', () => {
        const history = [
            { date: '2024-01-01', accuracy: 50 },
            { date: '2024-01-02', accuracy: 60 }
        ];
        const result = ForecastService.calculateTrajectory(history);
        expect(result.confidence).toBe('low');
        expect(result.predictedMasteryDate).toBeNull();
    });

    it('should predict mastery correctly for improving student', () => {
        const history = [
            { date: '2024-01-01', accuracy: 40 },
            { date: '2024-01-03', accuracy: 50 },
            { date: '2024-01-05', accuracy: 60 }
        ];
        // Velocity = (60 - 40) / 4 days = 5% per day
        // Need 30 more points to reach 90% (Mastery Target)
        // 30 / 5 = 6 days after Jan 5th = Jan 11th
        
        const result = ForecastService.calculateTrajectory(history);
        expect(result.velocity).toBe(5);
        expect(result.predictedMasteryDate).toBeDefined();
        
        const predictedDate = new Date(result.predictedMasteryDate!);
        expect(predictedDate.getUTCDate()).toBe(11);
    });

    it('should flag struggling students with negative velocity', () => {
        const history = [
            { date: '2024-01-01', accuracy: 80 },
            { date: '2024-01-03', accuracy: 75 },
            { date: '2024-01-05', accuracy: 70 }
        ];
        // Velocity = (70 - 80) / 4 = -2.5% per day
        
        const result = ForecastService.calculateTrajectory(history);
        expect(result.velocity).toBe(-2.5);
        expect(result.isStruggling).toBe(true);
        expect(result.predictedMasteryDate).toBeNull();
    });
});
