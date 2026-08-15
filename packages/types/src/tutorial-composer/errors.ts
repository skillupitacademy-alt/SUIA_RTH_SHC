/**
 * Tutorial Composer - Domain Errors
 * Typed error classes for the NEW Tutorial Composer
 */

import type { ValidationError as ZodValidationError } from '../tutorial-rich-document/validation';

/**
 * Base Tutorial Composer Error
 */
export class TutorialComposerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TutorialComposerError';
  }
}

/**
 * Tutorial Document Validation Error
 * Thrown when TutorialDocument fails validation
 */
export class TutorialDocumentValidationError extends TutorialComposerError {
  public readonly validationErrors: ZodValidationError[];

  constructor(
    errorsOrMessage: ZodValidationError[] | string = 'Tutorial document validation failed',
    validationErrors?: ZodValidationError[]
  ) {
    if (typeof errorsOrMessage === 'string') {
      super(errorsOrMessage);
      this.validationErrors = validationErrors || [];
    } else {
      super('Tutorial document validation failed');
      this.validationErrors = errorsOrMessage;
    }
    this.name = 'TutorialDocumentValidationError';
  }
}

/**
 * Section Not Found Error
 */
export class SectionNotFoundError extends TutorialComposerError {
  constructor(sectionId: string) {
    super(`Section not found: ${sectionId}`);
    this.name = 'SectionNotFoundError';
  }
}

/**
 * Section Already Exists Error
 */
export class SectionAlreadyExistsError extends TutorialComposerError {
  constructor(message: string) {
    super(message);
    this.name = 'SectionAlreadyExistsError';
  }
}

/**
 * Unauthorized Error
 */
export class UnauthorizedError extends TutorialComposerError {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Forbidden Error
 */
export class ForbiddenError extends TutorialComposerError {
  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * Invalid Status Transition Error
 */
export class InvalidStatusTransitionError extends TutorialComposerError {
  constructor(from: string, to: string) {
    super(`Invalid status transition from '${from}' to '${to}'`);
    this.name = 'InvalidStatusTransitionError';
  }
}

/**
 * Version Conflict Error
 */
export class VersionConflictError extends TutorialComposerError {
  constructor(expectedVersion: number, actualVersion: number) {
    super(
      `Version conflict: expected ${expectedVersion}, got ${actualVersion}`
    );
    this.name = 'VersionConflictError';
  }
}
