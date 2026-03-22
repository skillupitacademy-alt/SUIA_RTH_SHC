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
