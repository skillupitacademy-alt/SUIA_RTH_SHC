export class ProjectTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Invalid project transition from '${from}' to '${to}'`);
    this.name = 'ProjectTransitionError';
  }
}

export class ProjectNotEligibleError extends Error {
  constructor(reason: string) {
    super(`Project submission not eligible: ${reason}`);
    this.name = 'ProjectNotEligibleError';
  }
}
