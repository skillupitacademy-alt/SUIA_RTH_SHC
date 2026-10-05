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
}

