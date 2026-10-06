/**
 * Approved operations for runCommand() execution.
 * Only these operations are permitted to prevent arbitrary shell execution.
 */
export enum ApprovedOperation {
  NODE_VERSION = 'node_version',
  PNPM_VERSION = 'pnpm_version',
  TURBO_VERSION = 'turbo_version',
  TSC_VERSION = 'tsc_version',
  VITEST_VERSION = 'vitest_version',
  PLAYWRIGHT_VERSION = 'playwright_version',
}

/**
 * Result from executing an approved command operation
 */
export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Repository adapter interface for filesystem/git operations
 * 
 * Error handling contract:
 * - FileNotFoundError: thrown when a requested file does not exist
 * - PermissionError: thrown when access is denied (EACCES/EPERM)
 * - RepositoryAccessError: thrown for other infrastructure failures
 * 
 * fileExists() returns false for ENOENT without throwing, but throws for permission errors.
 */
export interface RepositoryAdapter {
  /**
   * Read file content as UTF-8 string
   * @throws {FileNotFoundError} if file does not exist
   * @throws {PermissionError} if read permission denied
   * @throws {RepositoryAccessError} for other I/O errors
   */
  readFile(path: string): Promise<string>;

  /**
   * Check if file or directory exists
   * @returns false if path does not exist (ENOENT)
   * @throws {PermissionError} if access permission denied
   * @throws {RepositoryAccessError} for other I/O errors
   */
  fileExists(path: string): Promise<boolean>;

  /**
   * List files recursively in directory
   * @throws {FileNotFoundError} if directory does not exist
   * @throws {PermissionError} if read permission denied
   * @throws {RepositoryAccessError} for other I/O errors
   */
  listFiles(directory: string, pattern?: string): Promise<string[]>;

  /**
   * Get SHA-256 hash of file content
   * @throws {FileNotFoundError} if file does not exist
   * @throws {PermissionError} if read permission denied
   * @throws {RepositoryAccessError} for other I/O errors
   */
  getFileHash(path: string): Promise<string>;

  /**
   * Get current git commit SHA
   * @throws {RepositoryAccessError} if git command fails
   */
  getGitCommit(): Promise<string>;

  /**
   * Get git repository root path
   * @throws {RepositoryAccessError} if git command fails
   */
  getGitRoot(): Promise<string>;

  /**
   * Execute an approved command operation with timeout enforcement
   * @param operation - One of the predefined approved operations
   * @returns Command result with stdout, stderr, and exit code
   * @throws {RepositoryAccessError} if command times out or fails unexpectedly
   */
  runCommand(operation: ApprovedOperation): Promise<CommandResult>;
}

