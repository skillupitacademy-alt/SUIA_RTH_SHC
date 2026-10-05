/**
 * Base error for repository access failures
 */
export class RepositoryAccessError extends Error {
  constructor(
    message: string,
    public readonly repositoryPath: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'RepositoryAccessError';
  }
}

/**
 * Error thrown when a requested file does not exist
 */
export class FileNotFoundError extends RepositoryAccessError {
  constructor(
    public readonly filePath: string,
    repositoryPath: string
  ) {
    super(`File not found: ${filePath}`, repositoryPath);
    this.name = 'FileNotFoundError';
  }
}

/**
 * Error thrown when permission is denied for file/directory access
 */
export class PermissionError extends RepositoryAccessError {
  constructor(
    filePath: string,
    repositoryPath: string,
    public readonly requiredPermission: string
  ) {
    super(`Permission denied: ${filePath}`, repositoryPath);
    this.name = 'PermissionError';
  }
}
