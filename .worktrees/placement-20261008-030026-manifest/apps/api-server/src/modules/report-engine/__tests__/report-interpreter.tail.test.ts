import { describe, it, expect } from 'vitest';
import { ReportInterpreter } from '../report-interpreter.service';

describe('ReportInterpreter 100% Branch Coverage - Combinatorial Blitz', () => {
    const callPrivate = (method: string, arg: any) => (ReportInterpreter as any)[method](arg);

    it('interpretKPI: Exhaustive Readiness & Confidence branches (Lines 24-55)', () => {
        const cases = [
            { score: 90, mastery: 90, readiness: 85, confidence: 'HIGH', expected: ['MASTERY', 'READY'] },
            { score: 75, mastery: 75, readiness: 65, confidence: 'LOW', expected: ['ADVANCING', 'BORDERLINE', 'Warning'] },
            { score: 65, mastery: 65, readiness: 50, confidence: 'HIGH', expected: ['WEAK', 'NOT READY'] },
            { score: 40, mastery: 40, readiness: 40, confidence: 'HIGH', expected: ['CRITICAL', 'stressed', 'NOT READY'] }
        ];
        cases.forEach(c => {
            const res = callPrivate('interpretKPI', { ...c, percentile: 50 });
            const joined = res.join('|');
            c.expected.forEach(e => expect(joined).toContain(e));
        });
    });

    it('interpretSubtopics: Exhaustive filter branches (Lines 58-81)', () => {
        // Line 63: bullets.length === 0
        expect(callPrivate('interpretSubtopics', { subtopics: [{ attempts: 2 }] })[0]).toContain('No subtopic-level diagnostics');

        const report = {
            subtopics: [
                { name: 'Weak', attempts: 5, accuracy: 60 },
                { name: 'Strong', attempts: 5, accuracy: 90 },
                { name: 'Mid', attempts: 5, accuracy: 75 }
            ]
        } as any;
        const res = callPrivate('interpretSubtopics', report).join('|');
        expect(res).toContain('Critical Vectors');
        expect(res).toContain('Established Vectors');

        // Mixed case where bullets list is empty
        const reportMid = { subtopics: [{ name: 'Mid', attempts: 5, accuracy: 75 }] } as any;
        expect(callPrivate('interpretSubtopics', reportMid)[0]).toContain('stable mid-range');
    });

    it('interpretSkills: Exhaustive branch coverage (Lines 84-103)', () => {
        expect(callPrivate('interpretSkills', { skills: [{ attempts: 1 }] })[0]).toContain('Insufficient data');

        const report = {
            skills: [
                { name: 'S1', attempts: 5, accuracy: 60 },
                { name: 'S2', attempts: 5, accuracy: 90 },
                { name: 'S3', attempts: 5, accuracy: 75 }
            ]
        } as any;
        const res = callPrivate('interpretSkills', report).join('|');
        expect(res).toContain('Friction Points');
        expect(res).toContain('Peak Strength');

        // Empty bullets
        expect(callPrivate('interpretSkills', { skills: [{ name: 'M', attempts: 5, accuracy: 75 }] })).toHaveLength(0);
    });

    it('interpretHeatmap: Surgical combinatorial and nullish coverage (Lines 106-142)', () => {
        const runH = (h: any[]) => callPrivate('interpretHeatmap', { heatmap: h }).join('|');

        // Line 112-113: Expert Gaps Filter (accuracy ?? 0, attempts ?? 0)
        const gaps = [
            { subtopic: 'G1', difficulty: 'expert', attempts: 5, accuracy: 60 },      // True
            { subtopic: 'G2', difficulty: 'expert', attempts: null, accuracy: 60 },   // False (attempts ?? 0 -> 0)
            { subtopic: 'G3', difficulty: 'expert', attempts: 5, accuracy: undefined } // True (accuracy ?? 0 -> 0)
        ];
        expect(runH(gaps)).toContain('Depth Gaps');
        expect(runH(gaps)).toContain('G1');
        expect(runH(gaps)).toContain('G3');
        expect(runH(gaps)).not.toContain('G2');

        // Line 125 Combinatorial (A && B && C && D)
        const st = 'ST';
        const inter = { subtopic: st, difficulty: 'intermediate', attempts: 5, accuracy: 90 };
        const expert = { subtopic: st, difficulty: 'expert', attempts: 5, accuracy: 60 };

        // False branches for 125
        expect(runH([{ ...inter, attempts: 2 }, expert])).not.toContain('Rigidity Alert'); // < 3
        expect(runH([inter, { ...expert, attempts: 2 }])).not.toContain('Rigidity Alert'); // < 3
        expect(runH([inter])).not.toContain('Rigidity Alert'); // expert missing
        expect(runH([expert])).not.toContain('Rigidity Alert'); // inter missing

        // Nullish branches for 125 (?? 0)
        expect(runH([{ ...inter, attempts: undefined }, expert])).not.toContain('Rigidity Alert');
        expect(runH([inter, { ...expert, attempts: null }])).not.toContain('Rigidity Alert');

        // Line 129 True/False (Drop Arr)
        expect(runH([inter, expert])).toContain('Rigidity Alert');
        expect(runH([inter, { ...expert, accuracy: 80 }])).not.toContain('Rigidity Alert');

        // Accuracy nullish in drop calculation (Line 126-127)
        expect(runH([{ ...inter, accuracy: undefined }, expert])).not.toContain('Rigidity Alert'); // 0 - 60
        expect(runH([inter, { ...expert, accuracy: null }])).toContain('Rigidity Alert'); // 90 - 0

        // Matrix Saturation & Balance
        expect(runH([{ attempts: 1 }, { attempts: 1 }])).toContain('Matrix Saturation');
        expect(runH([{ attempts: 5 }])).toContain('Knowledge Matrix');
    });

    it('interpretDifficulty: Surgical combinatorial and nullish coverage (Lines 145-170)', () => {
        expect(callPrivate('interpretDifficulty', { difficulty: null })).toHaveLength(0);
        const runD = (d: any[]) => callPrivate('interpretDifficulty', { difficulty: d }).join('|');

        const levels = ['simple', 'inter', 'expert'];
        const markers = ['Foundations', 'Logic Base', 'Expert Load'];

        levels.forEach((level, idx) => {
            const marker = markers[idx];
            // Level Absent
            expect(runD([])).not.toContain(marker);
            // attempts nullish
            expect(runD([{ level, attempts: null }])).not.toContain(marker);
            expect(runD([{ level, attempts: undefined }])).not.toContain(marker);
            // attempts < 3
            expect(runD([{ level, attempts: 2 }])).not.toContain(marker);
            // accuracy nullish in template
            expect(runD([{ level, attempts: 5, accuracy: undefined }])).toContain(`${marker}: 0%`);
            expect(runD([{ level, attempts: 5, accuracy: null }])).toContain(`${marker}: 0%`);
        });

        // Expert Status (Line 158)
        expect(runD([{ level: 'expert', attempts: 3, accuracy: 65 }])).toContain('Status: Stable');
        expect(runD([{ level: 'expert', attempts: 3, accuracy: 64 }])).toContain('Status: Unstable');

        // Line 163 Combinatorial
        const i3 = { level: 'inter', attempts: 3, accuracy: 90 };
        const e3 = { level: 'expert', attempts: 3, accuracy: 60 };
        expect(runD([i3, { ...e3, attempts: 2 }])).not.toContain('Complexity Friction');
        expect(runD([{ ...i3, attempts: 2 }, e3])).not.toContain('Complexity Friction');
        expect(runD([i3, { ...e3, attempts: null }])).not.toContain('Complexity Friction');
        expect(runD([{ ...i3, attempts: undefined }, e3])).not.toContain('Complexity Friction');

        // Line 164 accuracy nullish
        expect(runD([i3, { ...e3, accuracy: undefined }])).toContain('Significant 90-point drop');
        expect(runD([{ ...i3, accuracy: null }, e3])).not.toContain('Complexity Friction');

        // Line 165: drop <= 15 (False branch)
        expect(runD([i3, { ...e3, accuracy: 80 }])).not.toContain('Complexity Friction');
    });

    it('interpretTime & Meta: (Lines 173-228)', () => {
        expect(callPrivate('interpretTime', { timeBuckets: { stable: 0, logic: 0, neural: 0 } })[0]).toContain('No temporal data');
        
        // neuralPct > 30 (Line 187)
        const rNeural = { timeBuckets: { stable: 10, logic: 10, neural: 80 }, totalTimeSpentSeconds: 100 } as any;
        expect(callPrivate('interpretTime', rNeural).join('|')).toContain('Temporal Profile: High error density');

        // logicPct > 40 && stablePct < 30 (Line 192)
        const rLogic = { timeBuckets: { stable: 20, logic: 70, neural: 10 }, totalTimeSpentSeconds: 100 } as any;
        expect(callPrivate('interpretTime', rLogic).join('|')).toContain('Fluency Alert');

        // stablePct > 60 (Line 196)
        const rStable = { timeBuckets: { stable: 80, logic: 10, neural: 10 }, totalTimeSpentSeconds: 100 } as any;
        expect(callPrivate('interpretTime', rStable).join('|')).toContain('Direct Recall');

        // Default / False branches
        const rTime = { timeBuckets: { stable: 150, logic: 100, neural: 50 }, totalTimeSpentSeconds: 1000 } as any; 
        expect(callPrivate('interpretTime', rTime).join('|')).toContain('Total temporal spend');

        const rMeta = { expertDropOff: true, score: 85, confidence: 'LOW', readiness: 50 } as any;
        expect(callPrivate('interpretMeta', rMeta)).toHaveLength(3);

        const s = (n: number) => callPrivate('getOrdinalSuffix', n);
        expect(s(1)).toBe('st');
        expect(s(11)).toBe('th');
        expect(s(22)).toBe('nd');
        expect(s(23)).toBe('rd');
        expect(s(4)).toBe('th');
    });

    it('interpret: Covers full synthesis (Lines 12-21)', () => {
        const report = {
            score: 85, mastery: 85, readiness: 85, confidence: 'HIGH', percentile: 90,
            subtopics: [], skills: [], heatmap: [], difficulty: [], 
            timeBuckets: { stable: 0, logic: 0, neural: 0 }, totalTimeSpentSeconds: 0
        } as any;
        const res = ReportInterpreter.interpret(report);
        expect(res).toHaveProperty('kpi');
    });
});
