import { readFile, access, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execSync, spawn } from 'node:child_process';
import { join, resolve } from 'node:path';
import { constants } from 'node:fs';
import type { RepositoryAdapter, ApprovedOperation, CommandResult } from '../contracts/repository-adapter.js';
import {
  RepositoryAccessError,
  FileNotFoundError,
  PermissionError,
} from '../contracts/errors.js';

/**
 * Mapping of approved operations to their command and arguments.
 * This is the single source of truth for permitted command execution.
 */
const APPROVED_COMMANDS: Record<
  ApprovedOperation,
  { command: string; args: string[] }
> = {
  node_version: { command: 'node', args: ['--version'] },
  pnpm_version: { command: 'pnpm', args: ['--version'] },
  turbo_version: { command: 'turbo', args: ['--version'] },
  tsc_version: { command: 'pnpm', args: ['exec', 'tsc', '--version'] },
  vitest_version: { command: 'pnpm', args: ['exec', 'vitest', '--version'] },
  playwright_version: { command: 'pnpm', args: ['exec', 'playwright', '--version'] },
};

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
            // FileNotFoundError: directory disappeared during scan (race condition), skip it
            if (error instanceof FileNotFoundError) {
              continue;
            }
            // PermissionError or RepositoryAccessError: propagate upward
            throw error;
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

  async runCommand(operation: ApprovedOperation): Promise<CommandResult> {
    const commandSpec = APPROVED_COMMANDS[operation];
    if (!commandSpec) {
      throw new RepositoryAccessError(
        `Invalid operation: ${operation}`,
        this.rootPath,
        new Error('Operation not in approved list')
      );
    }

    const TIMEOUT_MS = 10000; // 10 second timeout

    return new Promise((resolve, reject) => {
      const child = spawn(commandSpec.command, commandSpec.args, {
        cwd: this.rootPath,
        shell: false,
        timeout: TIMEOUT_MS,
      });

      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const timeoutId = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
      }, TIMEOUT_MS);

      child.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      child.on('error', (error: Error) => {
        clearTimeout(timeoutId);
        if (timedOut) {
          resolve({
            stdout: '',
            stderr: `Command timed out after ${TIMEOUT_MS}ms`,
            exitCode: -1,
          });
        } else {
          // Command not found or spawn failure - return as structured failure
          resolve({
            stdout: '',
            stderr: error.message,
            exitCode: -1,
          });
        }
      });

      child.on('close', (code: number | null) => {
        clearTimeout(timeoutId);
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code ?? -1,
        });
      });
    });
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
