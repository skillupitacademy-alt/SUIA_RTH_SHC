import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FilesystemRepositoryAdapter } from '../../src/adapters/filesystem-repository-adapter.js';

// Mock the node modules
const mockReadFile = vi.fn();
const mockAccess = vi.fn();
const mockReaddir = vi.fn();
const mockCreateHash = vi.fn();
const mockExecSync = vi.fn();

vi.mock('node:fs/promises', () => ({
  readFile: (...args: unknown[]) => mockReadFile(...args),
  access: (...args: unknown[]) => mockAccess(...args),
  readdir: (...args: unknown[]) => mockReaddir(...args),
}));

vi.mock('node:crypto', () => ({
  createHash: (...args: unknown[]) => mockCreateHash(...args),
}));

vi.mock('node:child_process', () => ({
  execSync: (...args: unknown[]) => mockExecSync(...args),
}));

describe('FilesystemRepositoryAdapter', () => {
  let adapter: FilesystemRepositoryAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new FilesystemRepositoryAdapter('/test/root');
  });

  describe('readFile', () => {
    it('should read file successfully', async () => {
      mockReadFile.mockResolvedValue('file content');

      const result = await adapter.readFile('test.txt');

      expect(result).toBe('file content');
      expect(mockReadFile).toHaveBeenCalledWith(
        expect.stringContaining('test.txt'),
        'utf-8'
      );
    });

    it('should return empty string on failure', async () => {
      mockReadFile.mockRejectedValue(new Error('File not found'));

      const result = await adapter.readFile('missing.txt');

      expect(result).toBe('');
    });
  });

  describe('fileExists', () => {
    it('should return true when file exists', async () => {
      mockAccess.mockResolvedValue(undefined);

      const result = await adapter.fileExists('exists.txt');

      expect(result).toBe(true);
    });

    it('should return false when file does not exist', async () => {
      mockAccess.mockRejectedValue(new Error('Not found'));

      const result = await adapter.fileExists('missing.txt');

      expect(result).toBe(false);
    });
  });

  describe('listFiles', () => {
    it('should list files recursively', async () => {
      // Mock first call - returns directory and file
      mockReaddir.mockResolvedValueOnce([
        { name: 'subdir', isDirectory: () => true, isFile: () => false },
        { name: 'file1.txt', isDirectory: () => false, isFile: () => true },
      ]);
      
      // Mock second call for subdir - returns file
      mockReaddir.mockResolvedValueOnce([
        { name: 'file2.txt', isDirectory: () => false, isFile: () => true },
      ]);

      const result = await adapter.listFiles('testdir');

      expect(result).toHaveLength(2);
      expect(result).toContain('testdir/file1.txt');
      expect(result).toContain('testdir/subdir/file2.txt');
    });

    it('should filter files by pattern', async () => {
      mockReaddir.mockResolvedValueOnce([
        { name: 'file1.txt', isDirectory: () => false, isFile: () => true },
        { name: 'file2.js', isDirectory: () => false, isFile: () => true },
      ]);

      const result = await adapter.listFiles('testdir', '*.txt');

      expect(result).toHaveLength(1);
      expect(result).toContain('testdir/file1.txt');
    });

    it('should return empty array on failure', async () => {
      mockReaddir.mockRejectedValue(new Error('Directory not found'));

      const result = await adapter.listFiles('missing');

      expect(result).toEqual([]);
    });
  });

  describe('getFileHash', () => {
    it('should generate deterministic SHA-256 hash', async () => {
      mockReadFile.mockResolvedValue('file content');
      
      const mockHash = {
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue('abc123hash'),
      };
      mockCreateHash.mockReturnValue(mockHash);

      const result = await adapter.getFileHash('test.txt');

      expect(result).toBe('abc123hash');
      expect(mockCreateHash).toHaveBeenCalledWith('sha256');
      expect(mockHash.update).toHaveBeenCalledWith('file content', 'utf-8');
      expect(mockHash.digest).toHaveBeenCalledWith('hex');
    });

    it('should return empty string on failure', async () => {
      mockReadFile.mockRejectedValue(new Error('File not found'));

      const result = await adapter.getFileHash('missing.txt');

      expect(result).toBe('');
    });
  });

  describe('getGitCommit', () => {
    it('should return current git commit SHA', async () => {
      mockExecSync.mockReturnValue('abc123commit\n');

      const result = await adapter.getGitCommit();

      expect(result).toBe('abc123commit');
      expect(mockExecSync).toHaveBeenCalledWith('git rev-parse HEAD', {
        cwd: '/test/root',
        encoding: 'utf-8',
      });
    });

    it('should return empty string on failure', async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Not a git repository');
      });

      const result = await adapter.getGitCommit();

      expect(result).toBe('');
    });
  });

  describe('getGitRoot', () => {
    it('should return git repository root path', async () => {
      mockExecSync.mockReturnValue('/path/to/repo\n');

      const result = await adapter.getGitRoot();

      expect(result).toBe('/path/to/repo');
      expect(mockExecSync).toHaveBeenCalledWith('git rev-parse --show-toplevel', {
        cwd: '/test/root',
        encoding: 'utf-8',
      });
    });

    it('should return empty string on failure', async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Not a git repository');
      });

      const result = await adapter.getGitRoot();

      expect(result).toBe('');
    });
  });
});
