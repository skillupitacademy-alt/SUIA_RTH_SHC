import { readFile, access, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { constants } from 'node:fs';
import type { RepositoryAdapter } from '../contracts/repository-adapter.js';
import {
  RepositoryAccessError,
  FileNotFoundError,
  PermissionError,
} from '../contracts/errors.js';

export class FilesystemRepositoryAdapter implements RepositoryAdapter {
  constructor(private readonly rootPath: string) {}

  async readFile(path: string): Promise<string> {
    try {
      const fullPath = resolve(this.rootPath, path);
      return await readFile(fullPath, 'utf-8');
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error) {
        if (error.code === 'ENOENT') {
          throw new FileNotFoundError(path, this.rootPath);
        }
        if (error.code === 'EACCES' || error.code === 'EPERM') {
          throw new PermissionError(path, this.rootPath, 'read');
        }
      }
      throw new RepositoryAccessError(
        `Failed to read file: ${path}`,
        this.rootPath,
        error
      );
    }
  }

  async fileExists(path: string): Promise<boolean> {
    try {
      const fullPath = resolve(this.rootPath, path);
      await access(fullPath, constants.F_OK);
      return true;
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error) {
        if (error.code === 'ENOENT') {
          return false;
        }
        if (error.code === 'EACCES' || error.code === 'EPERM') {
          throw new PermissionError(path, this.rootPath, 'access');
        }
      }
      throw new RepositoryAccessError(
        `Failed to check file existence: ${path}`,
        this.rootPath,
        error
      );
    }
  }

  async listFiles(directory: string, pattern?: string): Promise<string[]> {
    try {
      const fullPath = resolve(this.rootPath, directory);
      const entries = await readdir(fullPath, { withFileTypes: true });
      
      const files: string[] = [];
      for (const entry of entries) {
        const relativePath = join(directory, entry.name).replace(/\\/g, '/');
        
        if (entry.isDirectory()) {
          // Recursively list files in subdirectories
          // Skip common directories that might cause issues
          if (entry.name === 'node_modules' || entry.name === '.git') {
            continue;
          }
          
          try {
            const subFiles = await this.listFiles(relativePath, pattern);
            files.push(...subFiles);
          } catch (error) {
            // Skip directories we can't access, but don't fail the entire operation
            // This handles permission errors, symlink issues, etc.
            continue;
          }
        } else if (entry.isFile()) {
          // Apply pattern filter if provided
          if (pattern === undefined || this.matchPattern(entry.name, pattern)) {
            files.push(relativePath);
          }
        }
      }
      
      return files;
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error) {
        if (error.code === 'ENOENT') {
          throw new FileNotFoundError(directory, this.rootPath);
        }
        if (error.code === 'EACCES' || error.code === 'EPERM') {
          throw new PermissionError(directory, this.rootPath, 'read');
        }
      }
      // Re-throw if it's already one of our custom errors
      if (error instanceof RepositoryAccessError) {
        throw error;
      }
      throw new RepositoryAccessError(
        `Failed to list files in directory: ${directory}`,
        this.rootPath,
        error
      );
    }
  }

  async getFileHash(path: string): Promise<string> {
    const content = await this.readFile(path);
    return createHash('sha256').update(content, 'utf-8').digest('hex');
  }

  async getGitCommit(): Promise<string> {
    try {
      const commit = execSync('git rev-parse HEAD', {
        cwd: this.rootPath,
        encoding: 'utf-8',
      }).trim();
      return commit;
    } catch (error: unknown) {
      throw new RepositoryAccessError(
        'Failed to get git commit',
        this.rootPath,
        error
      );
    }
  }

  async getGitRoot(): Promise<string> {
    try {
      const root = execSync('git rev-parse --show-toplevel', {
        cwd: this.rootPath,
        encoding: 'utf-8',
      }).trim();
      return root;
    } catch (error: unknown) {
      throw new RepositoryAccessError(
        'Failed to get git root',
        this.rootPath,
        error
      );
    }
  }

  private matchPattern(filename: string, pattern: string): boolean {
    // Simple pattern matching - convert glob-style pattern to regex
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filename);
  }
}
