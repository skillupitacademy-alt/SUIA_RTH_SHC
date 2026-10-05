import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FilesystemRepositoryAdapter } from '../../src/adapters/filesystem-repository-adapter.js';
import {
  FileNotFoundError,
  PermissionError,
  RepositoryAccessError,
} from '../../src/contracts/errors.js';

// Mock node:fs/promises
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  access: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
}));

// Mock node:crypto
vi.mock('node:crypto', () => ({
  createHash: vi.fn(() => ({
    update: vi.fn().mockReturnThis(),
    digest: vi.fn(() => 'mock-hash'),
  })),
}));

// Mock node:child_process
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

import { readFile, access, readdir } from 'node:fs/promises';

describe('FilesystemRepositoryAdapter Error Handling', () => {
  let adapter: FilesystemRepositoryAdapter;

  beforeEach(() => {
    adapter = new FilesystemRepositoryAdapter('/test/repo');
    vi.clearAllMocks();
  });

  describe('readFile error handling', () => {
    it('should throw FileNotFoundError for ENOENT', async () => {
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      vi.mocked(readFile).mockRejectedValue(error);

      await expect(adapter.readFile('missing.txt')).rejects.toThrow(FileNotFoundError);
      await expect(adapter.readFile('missing.txt')).rejects.toThrow('File not found: missing.txt');
    });

    it('should throw PermissionError for EACCES', async () => {
      const error = new Error('Permission denied') as NodeJS.ErrnoException;
      error.code = 'EACCES';
      vi.mocked(readFile).mockRejectedValue(error);

      await expect(adapter.readFile('restricted.txt')).rejects.toThrow(PermissionError);
      await expect(adapter.readFile('restricted.txt')).rejects.toThrow('Permission denied: restricted.txt');
    });

    it('should throw PermissionError for EPERM', async () => {
      const error = new Error('Operation not permitted') as NodeJS.ErrnoException;
      error.code = 'EPERM';
      vi.mocked(readFile).mockRejectedValue(error);

      await expect(adapter.readFile('restricted.txt')).rejects.toThrow(PermissionError);
    });

    it('should throw RepositoryAccessError for other errors', async () => {
      const error = new Error('Network error') as NodeJS.ErrnoException;
      error.code = 'EIO';
      vi.mocked(readFile).mockRejectedValue(error);

      await expect(adapter.readFile('corrupted.txt')).rejects.toThrow(RepositoryAccessError);
      await expect(adapter.readFile('corrupted.txt')).rejects.toThrow('Failed to read file: corrupted.txt');
    });
  });

  describe('fileExists error handling', () => {
    it('should return false for ENOENT', async () => {
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      vi.mocked(access).mockRejectedValue(error);

      const exists = await adapter.fileExists('missing.txt');
      expect(exists).toBe(false);
    });

    it('should throw PermissionError for EACCES', async () => {
      const error = new Error('Permission denied') as NodeJS.ErrnoException;
      error.code = 'EACCES';
      vi.mocked(access).mockRejectedValue(error);

      await expect(adapter.fileExists('restricted.txt')).rejects.toThrow(PermissionError);
    });

    it('should throw PermissionError for EPERM', async () => {
      const error = new Error('Operation not permitted') as NodeJS.ErrnoException;
      error.code = 'EPERM';
      vi.mocked(access).mockRejectedValue(error);

      await expect(adapter.fileExists('restricted.txt')).rejects.toThrow(PermissionError);
    });

    it('should throw RepositoryAccessError for other errors', async () => {
      const error = new Error('Network error') as NodeJS.ErrnoException;
      error.code = 'EIO';
      vi.mocked(access).mockRejectedValue(error);

      await expect(adapter.fileExists('corrupted.txt')).rejects.toThrow(RepositoryAccessError);
    });
  });

  describe('listFiles error handling', () => {
    it('should throw FileNotFoundError for missing directory', async () => {
      const error = new Error('Directory not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      vi.mocked(readdir).mockRejectedValue(error);

      await expect(adapter.listFiles('missing-dir')).rejects.toThrow(FileNotFoundError);
      await expect(adapter.listFiles('missing-dir')).rejects.toThrow('File not found: missing-dir');
    });

    it('should throw PermissionError for EACCES', async () => {
      const error = new Error('Permission denied') as NodeJS.ErrnoException;
      error.code = 'EACCES';
      vi.mocked(readdir).mockRejectedValue(error);

      await expect(adapter.listFiles('restricted-dir')).rejects.toThrow(PermissionError);
      await expect(adapter.listFiles('restricted-dir')).rejects.toThrow('Permission denied: restricted-dir');
    });

    it('should throw PermissionError for EPERM', async () => {
      const error = new Error('Operation not permitted') as NodeJS.ErrnoException;
      error.code = 'EPERM';
      vi.mocked(readdir).mockRejectedValue(error);

      await expect(adapter.listFiles('restricted-dir')).rejects.toThrow(PermissionError);
    });

    it('should throw RepositoryAccessError for other errors', async () => {
      const error = new Error('Network error') as NodeJS.ErrnoException;
      error.code = 'EIO';
      vi.mocked(readdir).mockRejectedValue(error);

      await expect(adapter.listFiles('corrupted-dir')).rejects.toThrow(RepositoryAccessError);
    });
  });

  describe('listFiles recursive error handling', () => {
    it('should continue past FileNotFoundError in subdirectory (race condition)', async () => {
      // Mock readdir for parent directory
      vi.mocked(readdir).mockResolvedValueOnce([
        { name: 'file1.txt', isDirectory: () => false, isFile: () => true } as any,
        { name: 'subdir', isDirectory: () => true, isFile: () => false } as any,
      ]);

      // Mock readdir for subdirectory to throw FileNotFoundError
      const subdirError = new Error('Directory disappeared') as NodeJS.ErrnoException;
      subdirError.code = 'ENOENT';
      vi.mocked(readdir).mockRejectedValueOnce(subdirError);

      const files = await adapter.listFiles('parent-dir');
      
      // Should return parent file, skip disappeared subdirectory
      expect(files).toContain('parent-dir/file1.txt');
      expect(files).toHaveLength(1);
    });

    it('should propagate PermissionError from subdirectory', async () => {
      // Mock readdir for parent directory
      vi.mocked(readdir).mockResolvedValueOnce([
        { name: 'file1.txt', isDirectory: () => false, isFile: () => true } as any,
        { name: 'restricted-subdir', isDirectory: () => true, isFile: () => false } as any,
      ]);

      // Mock readdir for subdirectory to throw PermissionError
      const subdirError = new Error('Permission denied') as NodeJS.ErrnoException;
      subdirError.code = 'EACCES';
      vi.mocked(readdir).mockRejectedValueOnce(subdirError);

      await expect(adapter.listFiles('parent-dir')).rejects.toThrow(PermissionError);
    });

    it('should propagate RepositoryAccessError from subdirectory', async () => {
      // Mock readdir for parent directory
      vi.mocked(readdir).mockResolvedValueOnce([
        { name: 'file1.txt', isDirectory: () => false, isFile: () => true } as any,
        { name: 'corrupted-subdir', isDirectory: () => true, isFile: () => false } as any,
      ]);

      // Mock readdir for subdirectory to throw generic error
      const subdirError = new Error('I/O error') as NodeJS.ErrnoException;
      subdirError.code = 'EIO';
      vi.mocked(readdir).mockRejectedValueOnce(subdirError);

      await expect(adapter.listFiles('parent-dir')).rejects.toThrow(RepositoryAccessError);
    });
  });

  describe('getFileHash error handling', () => {
    it('should throw FileNotFoundError for missing file', async () => {
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      vi.mocked(readFile).mockRejectedValue(error);

      await expect(adapter.getFileHash('missing.txt')).rejects.toThrow(FileNotFoundError);
    });

    it('should throw PermissionError for EACCES', async () => {
      const error = new Error('Permission denied') as NodeJS.ErrnoException;
      error.code = 'EACCES';
      vi.mocked(readFile).mockRejectedValue(error);

      await expect(adapter.getFileHash('restricted.txt')).rejects.toThrow(PermissionError);
    });
  });
});
