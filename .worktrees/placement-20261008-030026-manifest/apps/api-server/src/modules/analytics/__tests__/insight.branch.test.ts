import { describe, it, expect } from 'vitest';
import { InsightEngineService } from '../insight-engine.service';
import { AnswerEvaluationEngine } from '../../answer-engine/answer.engine';

describe('Insight & Answer Engine branch coverage', () => {
    it('InsightEngineService.analyzePerformanceTrend hits confidence and trend branches (Lines 33, 64, 80-84)', () => {
        const userName = 'TestUser';
        const data = {
            dates: ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05', '2024-01-06', '2024-01-07', '2024-01-08'],
            scores: [70, 75, 80, 85, 90, 85, 80, 95]
        };

        const insight = InsightEngineService.analyzePerformanceTrend(userName, data);
        
        // Confidence high (Line 33)
        expect(insight.confidence).toBe('high');
        
        // Positive momentum (Line 64) - latestScore (95) > previous (80)
        const goodMomentum = insight.signals.find(s => s.text.includes('Positive momentum'));
        expect(goodMomentum).toBeDefined();

        // Data notes (Lines 80-84)
        const trendNote = insight.dataNotes.find(n => n.label === 'Trend');
        expect(trendNote?.value).toBe('15 pts vs previous exam');
    });

    it('InsightEngineService.analyzePerformanceTrend hits variance and low data branches', () => {
        const data = {
            dates: ['2024-01-01'],
            scores: [50]
        };
        const insight = InsightEngineService.analyzePerformanceTrend('User', data);
        expect(insight.confidence).toBe('low');
        
        const trendNote = insight.dataNotes.find(n => n.label === 'Trend');
        expect(trendNote?.value).toBe('Not enough data for trend');
    });

    it('AnswerEvaluationEngine hits partial score placeholder (Line 31)', () => {
        const score = AnswerEvaluationEngine.calculatePartialScore('mcq', {}, {});
        expect(score).toBe(0);
    });
});
