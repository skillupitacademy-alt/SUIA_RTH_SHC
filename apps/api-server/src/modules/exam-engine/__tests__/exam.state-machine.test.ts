import { describe, expect, it } from 'vitest';
import { ExamStateMachine, ExamTransitionError } from '../exam.state-machine';

describe('ExamStateMachine', () => {
    it('should initialize with correct status', () => {
        const machine = new ExamStateMachine('started');
        expect(machine.getStatus()).toBe('started');
    });

    it('should identify legal transitions', () => {
        const machine = new ExamStateMachine('started');
        expect(machine.canTransition('processing')).toBe(true);
        expect(machine.canTransition('failed')).toBe(true);
        expect(machine.canTransition('abandoned')).toBe(true);
        expect(machine.canTransition('expired')).toBe(true);
        expect(machine.canTransition('completed')).toBe(false);
    });

    it('should throw ExamTransitionError for illegal transitions', () => {
        const machine = new ExamStateMachine('completed');
        expect(() => machine.assertTransition('started')).toThrow(ExamTransitionError);
    });

    it('should identify terminal states', () => {
        expect(new ExamStateMachine('completed').isTerminal()).toBe(true);
        expect(new ExamStateMachine('started').isTerminal()).toBe(false);
    });

    it('should create machine from raw status string', () => {
        const machine = ExamStateMachine.from('processing');
        expect(machine.getStatus()).toBe('processing');
    });
});
