export interface RepositoryAdapter {
  readFile(path: string): Promise<string>;
  fileExists(path: string): Promise<boolean>;
  listFiles(directory: string, pattern?: string): Promise<string[]>;
  getFileHash(path: string): Promise<string>;
  getGitCommit(): Promise<string>;
  getGitRoot(): Promise<string>;
}
