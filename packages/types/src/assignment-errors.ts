export class AssignmentTierLockedError extends Error {
  constructor(difficulty: string, requiredDifficulty: string) {
    super(`Tier '${difficulty}' is locked. Complete '${requiredDifficulty}' first.`);
    this.name = 'AssignmentTierLockedError';
  }
}

export class AssignmentTierAlreadyCompletedError extends Error {
  constructor(difficulty: string) {
    super(`Tier '${difficulty}' is already completed.`);
    this.name = 'AssignmentTierAlreadyCompletedError';
  }
}

export class SessionRequestNotFoundError extends Error {
  constructor(id: string) {
    super(`Session request ${id} not found`);
    this.name = 'SessionRequestNotFoundError';
  }
}

export class SessionRequestInvalidTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Cannot transition session from '${from}' to '${to}'`);
    this.name = 'SessionRequestInvalidTransitionError';
  }
}

export class SessionRequestDuplicateError extends Error {
  constructor(studentId: string, subtopicId: string) {
    super(`Open session request already exists for student '${studentId}' and subtopic '${subtopicId}'`);
    this.name = 'SessionRequestDuplicateError';
  }
}

export class SessionRequestForbiddenError extends Error {
  constructor(id: string) {
    super(`Session request ${id} does not belong to this student`);
    this.name = 'SessionRequestForbiddenError';
  }
}
