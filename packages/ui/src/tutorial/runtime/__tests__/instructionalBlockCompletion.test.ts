/**
 * Instructional Block Completion Unit Tests - Phase 2B.18
 * 
 * Tests the pure function completion evaluator in isolation.
 * 
 * Coverage:
 * 1. Completion formula (activeTimeSec >= expectedTimeSec × 0.80)
 * 2. Threshold validation (80% ratio)
 * 3. Missing expectedTimeSec (graceful degradation)
 * 4. progressRole filtering (instructional only)
 * 5. Identity validation (blockId/blockVersion mismatch detection)
 * 6. Edge cases (zero time, negative time, boundary conditions)
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateInstructionalBlockCompletion,
  evaluateMultipleBlocks,
  hasBlocksReadyForCompletion,
  getReadyBlockIndices,
  COMPLETION_TIME_RATIO,
  type InstructionalBlockMetadata,
  type BlockTelemetryData,
} from '../instructionalBlockCompletion';

describe('instructionalBlockCompletion - Phase 2B.18', () => {
  // Test fixtures
  const createMetadata = (
    overrides: Partial<InstructionalBlockMetadata> = {}
  ): InstructionalBlockMetadata => ({
    blockId: 'test-block-id',
    blockVersion: 'D1',
    progressRole: 'instructional',
    expectedTimeSec: 180, // 3 minutes default
    ...overrides,
  });

  const createTelemetry = (
    overrides: Partial<BlockTelemetryData> = {}
  ): BlockTelemetryData => ({
    blockId: 'test-block-id',
    blockVersion: 'D1',
    activeTimeSec: 0,
    ...overrides,
  });

  describe('COMPLETION_TIME_RATIO constant', () => {
    it('should be 0.80 (80% threshold)', () => {
      expect(COMPLETION_TIME_RATIO).toBe(0.80);
    });
  });

  describe('Completion formula: activeTimeSec >= expectedTimeSec × 0.80', () => {
    it('should complete when activeTimeSec exactly equals threshold (144s = 180s × 0.80)', () => {
      const metadata = createMetadata({ expectedTimeSec: 180 });
      const telemetry = createTelemetry({ activeTimeSec: 144 }); // Exactly 80%

      const result = evaluateInstructionalBlockCompletion(metadata, telemetry);

      expect(result.shouldComplete).toBe(true);
      expect(result.completionRatio).toBe(0.8);
      expect(result.reason).toContain('Active time (144s) >= 80% of expected time (180s)');
    });

    it('should complete when activeTimeSec exceeds threshold (150s > 144s)', () => {
      const metadata = createMetadata({ expectedTimeSec: 180 });
      const telemetry = createTelemetry({ activeTimeSec: 150 });

      const result = evaluateInstructionalBlockCompletion(metadata, telemetry);

      expect(result.shouldComplete).toBe(true);
      expect(result.completionRatio).toBeCloseTo(0.833, 2);
    });

    it('should NOT complete when activeTimeSec below threshold (143s < 144s)', () => {
      const metadata = createMetadata({ expectedTimeSec: 180 });
      const telemetry = createTelemetry({ activeTimeSec: 143 });

      const result = evaluateInstructionalBlockCompletion(metadata, telemetry);

      expect(result.shouldComplete).toBe(false);
      expect(result.completionRatio).toBeCloseTo(0.794, 2);
      expect(result.reason).toContain('Need 1s more active time');
    });

    it('should complete when activeTimeSec equals expectedTimeSec (100%)', () => {
      const metadata = createMetadata({ expectedTimeSec: 180 });
      const telemetry = createTelemetry({ activeTimeSec: 180 });

      const result = evaluateInstructionalBlockCompletion(metadata, telemetry);

      expect(result.shouldComplete).toBe(true);
      expect(result.completionRatio).toBe(1.0);
    });

    it('should complete when activeTimeSec exceeds expectedTimeSec (over 100%)', () => {
      const metadata = createMetadata({ expectedTimeSec: 180 });
      const telemetry = createTelemetry({ activeTimeSec: 200 });

      const result = evaluateInstructionalBlockCompletion(metadata, telemetry);

      expect(result.shouldComplete).toBe(true);
      expect(result.completionRatio).toBeCloseTo(1.111, 2);
    });
  });

  describe('Threshold validation (80%)', () => {
    it('should always return thresholdRatio = 0.80', () => {
      const metadata = createMetadata({ expectedTimeSec: 180 });
      const telemetry = createTelemetry({ activeTimeSec: 100 });

      const result = evaluateInstructionalBlockCompletion(metadata, telemetry);

      expect(result.thresholdRatio).toBe(0.80);
    });

    it('should calculate remaining time correctly (below threshold)', () => {
      const metadata = createMetadata({ expectedTimeSec: 200 });
      const telemetry = createTelemetry({ activeTimeSec: 100 });
      // Threshold: 200 × 0.80 = 160s
      // Remaining: 160 - 100 = 60s

      const result = evaluateInstructionalBlockCompletion(metadata, telemetry);

      expect(result.shouldComplete).toBe(false);
      expect(result.reason).toContain('Need 60s more active time');
    });

    it('should round up remaining time (fractional seconds)', () => {
      const metadata = createMetadata({ expectedTimeSec: 100 });
      const telemetry = createTelemetry({ activeTimeSec: 75 });
      // Threshold: 100 × 0.80 = 80s
      // Remaining: 80 - 75 = 5s

      const result = evaluateInstructionalBlockCompletion(metadata, telemetry);

      expect(result.reason).toContain('Need 5s more active time');
    });
  });

  describe('Missing expectedTimeSec (graceful degradation)', () => {
    it('should NOT complete when expectedTimeSec is undefined', () => {
      const metadata = createMetadata({ expectedTimeSec: undefined });
      const telemetry = createTelemetry({ activeTimeSec: 1000 });

      const result = evaluateInstructionalBlockCompletion(metadata, telemetry);

      expect(result.shouldComplete).toBe(false);
      expect(result.reason).toContain('Missing or invalid expectedTimeSec');
      expect(result.reason).toContain('automatic completion disabled');
      expect(result.reason).toContain('manual fallback available');
      expect(result.completionRatio).toBeUndefined();
    });

    it('should NOT complete when expectedTimeSec is 0', () => {
      const metadata = createMetadata({ expectedTimeSec: 0 });
      const telemetry = createTelemetry({ activeTimeSec: 100 });

      const result = evaluateInstructionalBlockCompletion(metadata, telemetry);

      expect(result.shouldComplete).toBe(false);
      expect(result.reason).toContain('Missing or invalid expectedTimeSec');
    });

    it('should NOT complete when expectedTimeSec is negative', () => {
      const metadata = createMetadata({ expectedTimeSec: -100 });
      const telemetry = createTelemetry({ activeTimeSec: 100 });

      const result = evaluateInstructionalBlockCompletion(metadata, telemetry);

      expect(result.shouldComplete).toBe(false);
      expect(result.reason).toContain('Missing or invalid expectedTimeSec');
    });
  });

  describe('progressRole filtering', () => {
    it('should complete instructional blocks when threshold met', () => {
      const metadata = createMetadata({
        progressRole: 'instructional',
        expectedTimeSec: 100,
      });
      const telemetry = createTelemetry({ activeTimeSec: 80 });

      const result = evaluateInstructionalBlockCompletion(metadata, telemetry);

      expect(result.shouldComplete).toBe(true);
    });

    it('should NOT complete structural blocks (regardless of time)', () => {
      const metadata = createMetadata({
        progressRole: 'structural',
        expectedTimeSec: 100,
      });
      const telemetry = createTelemetry({ activeTimeSec: 1000 });

      const result = evaluateInstructionalBlockCompletion(metadata, telemetry);

      expect(result.shouldComplete).toBe(false);
      expect(result.reason).toContain("progressRole is 'structural'");
      expect(result.reason).toContain('not instructional');
      expect(result.reason).toContain('automatic completion does not apply');
      expect(result.completionRatio).toBeUndefined();
    });

    it('should NOT complete assessment blocks (regardless of time)', () => {
      const metadata = createMetadata({
        progressRole: 'assessment',
        expectedTimeSec: 100,
      });
      const telemetry = createTelemetry({ activeTimeSec: 1000 });

      const result = evaluateInstructionalBlockCompletion(metadata, telemetry);

      expect(result.shouldComplete).toBe(false);
      expect(result.reason).toContain("progressRole is 'assessment'");
    });

    it('should NOT complete media blocks (regardless of time)', () => {
      const metadata = createMetadata({
        progressRole: 'media',
        expectedTimeSec: 100,
      });
      const telemetry = createTelemetry({ activeTimeSec: 1000 });

      const result = evaluateInstructionalBlockCompletion(metadata, telemetry);

      expect(result.shouldComplete).toBe(false);
      expect(result.reason).toContain("progressRole is 'media'");
    });
  });

  describe('Identity validation', () => {
    it('should throw when blockId mismatch', () => {
      const metadata = createMetadata({ blockId: 'block-a' });
      const telemetry = createTelemetry({ blockId: 'block-b' });

      expect(() => {
        evaluateInstructionalBlockCompletion(metadata, telemetry);
      }).toThrow('Block ID mismatch');
      expect(() => {
        evaluateInstructionalBlockCompletion(metadata, telemetry);
      }).toThrow('metadata=block-a');
      expect(() => {
        evaluateInstructionalBlockCompletion(metadata, telemetry);
      }).toThrow('telemetry=block-b');
    });

    it('should throw when blockVersion mismatch', () => {
      const metadata = createMetadata({ blockVersion: 'D1' });
      const telemetry = createTelemetry({ blockVersion: 'D2' });

      expect(() => {
        evaluateInstructionalBlockCompletion(metadata, telemetry);
      }).toThrow('Block version mismatch');
      expect(() => {
        evaluateInstructionalBlockCompletion(metadata, telemetry);
      }).toThrow('metadata=D1');
      expect(() => {
        evaluateInstructionalBlockCompletion(metadata, telemetry);
      }).toThrow('telemetry=D2');
    });

    it('should NOT throw when identity matches', () => {
      const metadata = createMetadata({
        blockId: 'matching-id',
        blockVersion: 'D1',
      });
      const telemetry = createTelemetry({
        blockId: 'matching-id',
        blockVersion: 'D1',
        activeTimeSec: 150,
      });

      expect(() => {
        evaluateInstructionalBlockCompletion(metadata, telemetry);
      }).not.toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle zero activeTimeSec', () => {
      const metadata = createMetadata({ expectedTimeSec: 180 });
      const telemetry = createTelemetry({ activeTimeSec: 0 });

      const result = evaluateInstructionalBlockCompletion(metadata, telemetry);

      expect(result.shouldComplete).toBe(false);
      expect(result.completionRatio).toBe(0);
      expect(result.reason).toContain('Need 144s more active time');
    });

    it('should handle very small expectedTimeSec (1 second)', () => {
      const metadata = createMetadata({ expectedTimeSec: 1 });
      const telemetry = createTelemetry({ activeTimeSec: 1 });
      // Threshold: 1 × 0.80 = 0.8s

      const result = evaluateInstructionalBlockCompletion(metadata, telemetry);

      expect(result.shouldComplete).toBe(true);
      expect(result.completionRatio).toBe(1.0);
    });

    it('should handle very large expectedTimeSec (1 hour)', () => {
      const metadata = createMetadata({ expectedTimeSec: 3600 });
      const telemetry = createTelemetry({ activeTimeSec: 2880 }); // 80%

      const result = evaluateInstructionalBlockCompletion(metadata, telemetry);

      expect(result.shouldComplete).toBe(true);
      expect(result.completionRatio).toBe(0.8);
    });

    it('should handle fractional completion ratios', () => {
      const metadata = createMetadata({ expectedTimeSec: 333 });
      const telemetry = createTelemetry({ activeTimeSec: 267 }); // 80.18%

      const result = evaluateInstructionalBlockCompletion(metadata, telemetry);

      expect(result.shouldComplete).toBe(true);
      expect(result.completionRatio).toBeCloseTo(0.8018, 3);
    });
  });

  describe('Multiple block versions (D1, C1, I1, S1)', () => {
    it('should evaluate D1 blocks generically', () => {
      const metadata = createMetadata({
        blockVersion: 'D1',
        expectedTimeSec: 180,
      });
      const telemetry = createTelemetry({
        blockVersion: 'D1',
        activeTimeSec: 144,
      });

      const result = evaluateInstructionalBlockCompletion(metadata, telemetry);

      expect(result.shouldComplete).toBe(true);
    });

    it('should evaluate C1 blocks generically', () => {
      const metadata = createMetadata({
        blockVersion: 'C1',
        expectedTimeSec: 240,
      });
      const telemetry = createTelemetry({
        blockVersion: 'C1',
        activeTimeSec: 192, // 80%
      });

      const result = evaluateInstructionalBlockCompletion(metadata, telemetry);

      expect(result.shouldComplete).toBe(true);
    });

    it('should evaluate I1 blocks generically', () => {
      const metadata = createMetadata({
        blockVersion: 'I1',
        expectedTimeSec: 120,
      });
      const telemetry = createTelemetry({
        blockVersion: 'I1',
        activeTimeSec: 96, // 80%
      });

      const result = evaluateInstructionalBlockCompletion(metadata, telemetry);

      expect(result.shouldComplete).toBe(true);
    });

    it('should evaluate S1 blocks generically', () => {
      const metadata = createMetadata({
        blockVersion: 'S1',
        expectedTimeSec: 150,
      });
      const telemetry = createTelemetry({
        blockVersion: 'S1',
        activeTimeSec: 120, // 80%
      });

      const result = evaluateInstructionalBlockCompletion(metadata, telemetry);

      expect(result.shouldComplete).toBe(true);
    });

    it('should NOT have version-specific thresholds (generic formula)', () => {
      // All block versions use same 80% threshold
      const versions = ['D1', 'C1', 'I1', 'S1'];
      
      for (const version of versions) {
        const metadata = createMetadata({
          blockVersion: version,
          expectedTimeSec: 100,
        });
        const telemetry = createTelemetry({
          blockVersion: version,
          activeTimeSec: 80, // Exactly 80%
        });

        const result = evaluateInstructionalBlockCompletion(metadata, telemetry);

        expect(result.shouldComplete).toBe(true);
        expect(result.thresholdRatio).toBe(0.80);
      }
    });
  });

  describe('Helper function: evaluateMultipleBlocks', () => {
    it('should evaluate multiple blocks and preserve order', () => {
      const blocks: Array<[InstructionalBlockMetadata, BlockTelemetryData]> = [
        [
          createMetadata({ blockId: 'block-1', expectedTimeSec: 100 }),
          createTelemetry({ blockId: 'block-1', activeTimeSec: 80 }), // Complete
        ],
        [
          createMetadata({ blockId: 'block-2', expectedTimeSec: 100 }),
          createTelemetry({ blockId: 'block-2', activeTimeSec: 50 }), // Not complete
        ],
        [
          createMetadata({ blockId: 'block-3', expectedTimeSec: 100 }),
          createTelemetry({ blockId: 'block-3', activeTimeSec: 100 }), // Complete
        ],
      ];

      const results = evaluateMultipleBlocks(blocks);

      expect(results).toHaveLength(3);
      expect(results[0].shouldComplete).toBe(true);
      expect(results[1].shouldComplete).toBe(false);
      expect(results[2].shouldComplete).toBe(true);
    });

    it('should handle empty array', () => {
      const results = evaluateMultipleBlocks([]);

      expect(results).toEqual([]);
    });
  });

  describe('Helper function: hasBlocksReadyForCompletion', () => {
    it('should return true if any block ready', () => {
      const evaluations = [
        { shouldComplete: false, reason: 'not ready', thresholdRatio: 0.80 },
        { shouldComplete: true, reason: 'ready', completionRatio: 0.85, thresholdRatio: 0.80 },
        { shouldComplete: false, reason: 'not ready', thresholdRatio: 0.80 },
      ];

      const result = hasBlocksReadyForCompletion(evaluations);

      expect(result).toBe(true);
    });

    it('should return false if no blocks ready', () => {
      const evaluations = [
        { shouldComplete: false, reason: 'not ready', thresholdRatio: 0.80 },
        { shouldComplete: false, reason: 'not ready', thresholdRatio: 0.80 },
      ];

      const result = hasBlocksReadyForCompletion(evaluations);

      expect(result).toBe(false);
    });

    it('should return false for empty array', () => {
      const result = hasBlocksReadyForCompletion([]);

      expect(result).toBe(false);
    });
  });

  describe('Helper function: getReadyBlockIndices', () => {
    it('should return indices of ready blocks', () => {
      const evaluations = [
        { shouldComplete: false, reason: 'not ready', thresholdRatio: 0.80 }, // index 0
        { shouldComplete: true, reason: 'ready', completionRatio: 0.85, thresholdRatio: 0.80 }, // index 1
        { shouldComplete: false, reason: 'not ready', thresholdRatio: 0.80 }, // index 2
        { shouldComplete: true, reason: 'ready', completionRatio: 0.90, thresholdRatio: 0.80 }, // index 3
      ];

      const indices = getReadyBlockIndices(evaluations);

      expect(indices).toEqual([1, 3]);
    });

    it('should return empty array if no blocks ready', () => {
      const evaluations = [
        { shouldComplete: false, reason: 'not ready', thresholdRatio: 0.80 },
        { shouldComplete: false, reason: 'not ready', thresholdRatio: 0.80 },
      ];

      const indices = getReadyBlockIndices(evaluations);

      expect(indices).toEqual([]);
    });

    it('should return empty array for empty input', () => {
      const indices = getReadyBlockIndices([]);

      expect(indices).toEqual([]);
    });
  });

  describe('Phase 2B.13 contract preservation', () => {
    it('should NOT evaluate non-instructional blocks even with expectedTimeSec', () => {
      // Verifies progressRole remains authoritative for eligibility
      const metadata = createMetadata({
        progressRole: 'structural',
        expectedTimeSec: 100, // Has threshold
      });
      const telemetry = createTelemetry({ activeTimeSec: 100 }); // Meets threshold

      const result = evaluateInstructionalBlockCompletion(metadata, telemetry);

      expect(result.shouldComplete).toBe(false);
      expect(result.reason).toContain('not instructional');
    });

    it('should evaluate instructional blocks with expectedTimeSec', () => {
      // Verifies expectedTimeSec used as threshold input (Phase 2B.18)
      const metadata = createMetadata({
        progressRole: 'instructional',
        expectedTimeSec: 100,
      });
      const telemetry = createTelemetry({ activeTimeSec: 80 });

      const result = evaluateInstructionalBlockCompletion(metadata, telemetry);

      expect(result.shouldComplete).toBe(true);
      expect(result.completionRatio).toBe(0.8);
    });
  });
});
