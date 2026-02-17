import path from 'path';

const workspaceRoot = path.resolve(__dirname, '..', '..');

export const resolveWorkspacePath = (...segments: string[]): string =>
  path.resolve(workspaceRoot, ...segments);

export const envPath = (relative: string): string =>
  resolveWorkspacePath(relative);

export const testsPath = (relative: string): string =>
  resolveWorkspacePath('tests', relative);
