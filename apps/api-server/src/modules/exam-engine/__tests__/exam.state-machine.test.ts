import { describe, expect, it } from 'vitest';
import { ExamStateMachine, ExamTransitionError } from '../exam.state-machine';

describe('ExamStateMachine', () => {
  describe('Valid Transitions', () => {
    it('should transition from pending to started', () => {
      const machine = ExamStateMachine.from('pending');
      expect(machine.canTransition('started')).toBe(true);
      expect(() => machine.assertTransition('started')).not.toThrow();
      expect(machine.getStatus()).toBe('pending'); // internal class status is immutable
    });

    it('should transition from started to processing', () => {
      const machine = ExamStateMachine.from('started');
      expect(machine.canTransition('processing')).toBe(true);
      expect(() => machine.assertTransition('processing')).not.toThrow();
    });

    it('should transition from processing to completed', () => {
      const machine = ExamStateMachine.from('processing');
      expect(machine.canTransition('completed')).toBe(true);
      expect(() => machine.assertTransition('completed')).not.toThrow();
    });
    
    it('should transition from started to expired', () => {
      const machine = ExamStateMachine.from('started');
      expect(machine.canTransition('expired')).toBe(true);
      expect(() => machine.assertTransition('expired')).not.toThrow();
    });
  });

  describe('Invalid Transitions', () => {
    it('should throw when transitioning from pending to completed', () => {
      const machine = ExamStateMachine.from('pending');
      expect(machine.canTransition('completed')).toBe(false);
      expect(() => machine.assertTransition('completed')).toThrow(ExamTransitionError);
    });

    it('should throw when transitioning from completed to started', () => {
      const machine = ExamStateMachine.from('completed');
      expect(machine.canTransition('started')).toBe(false);
      expect(() => machine.assertTransition('started')).toThrow(ExamTransitionError);
    });
  });

  describe('Terminal States', () => {
    it('should identify completed as terminal', () => {
      const machine = ExamStateMachine.from('completed');
      expect(machine.isTerminal()).toBe(true);
      expect(machine.canTransition('started')).toBe(false);
    });

    it('should identify failed as terminal', () => {
      const machine = ExamStateMachine.from('failed');
      expect(machine.isTerminal()).toBe(true);
    });

    it('should identify abandoned as terminal', () => {
      const machine = ExamStateMachine.from('abandoned');
      expect(machine.isTerminal()).toBe(true);
    });
    
    it('should identify expired as terminal', () => {
      const machine = ExamStateMachine.from('expired');
      expect(machine.isTerminal()).toBe(true);
    });

    it('should not identify processing as terminal', () => {
      const machine = ExamStateMachine.from('processing');
      expect(machine.isTerminal()).toBe(false);
    });
  });
});
