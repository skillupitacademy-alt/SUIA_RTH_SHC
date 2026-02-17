const path = require('path');

const workspaceRoot = path.resolve(__dirname, '..', '..');

const resolveWorkspacePath = (...segments) => path.resolve(workspaceRoot, ...segments);
const envPath = (relative) => resolveWorkspacePath(relative);
const testsPath = (relative) => resolveWorkspacePath('tests', relative);

module.exports = { resolveWorkspacePath, envPath, testsPath, workspaceRoot };
