import { readFile, access, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { constants } from 'node:fs';
import type { RepositoryAdapter } from '../contracts/repository-adapter.js';

export class FilesystemRepositoryAdapter implements RepositoryAdapter {
  constructor(private readonly rootPath: string) {}

  async readFile(path: string): Promise<string> {
    try {
      const fullPath = resolve(this.rootPath, path);
      return await readFile(fullPath, 'utf-8');
    } catch {
      return '';
    }
  }

  async fileExists(path: string): Promise<boolean> {
    try {
      const fullPath = resolve(this.rootPath, path);
      await access(fullPath, constants.F_OK);
      return true;
    } catch {
      return false;
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
          const subFiles = await this.listFiles(relativePath, pattern);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          // Apply pattern filter if provided
          if (pattern === undefined || this.matchPattern(entry.name, pattern)) {
            files.push(relativePath);
          }
        }
      }
      
      return files;
    } catch {
      return [];
    }
  }

  async getFileHash(path: string): Promise<string> {
    try {
      const content = await this.readFile(path);
      if (content === '') {
        return '';
      }
      return createHash('sha256').update(content, 'utf-8').digest('hex');
    } catch {
      return '';
    }
  }

  async getGitCommit(): Promise<string> {
    try {
      const commit = execSync('git rev-parse HEAD', {
        cwd: this.rootPath,
        encoding: 'utf-8',
      }).trim();
      return commit;
    } catch {
      return '';
    }
  }

  async getGitRoot(): Promise<string> {
    try {
      const root = execSync('git rev-parse --show-toplevel', {
        cwd: this.rootPath,
        encoding: 'utf-8',
      }).trim();
      return root;
    } catch {
      return '';
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
