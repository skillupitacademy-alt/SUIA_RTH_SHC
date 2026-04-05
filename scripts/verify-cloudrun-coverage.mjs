import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

const workflowPath = resolve(root, '.github/workflows/deploy-cloudrun.yml');
const dockerScriptPath = resolve(root, 'scripts/build-docker-images.ps1');
const packageJsonPath = resolve(root, 'package.json');

const workflowContent = readFileSync(workflowPath, 'utf8');
const dockerScriptContent = readFileSync(dockerScriptPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

const dockerfileToService = new Map([
  ['apps/api-server/Dockerfile', { tag: 'api-server', pkg: '@quiz/api-server' }],
  ['apps/realtutorialhub-web/Dockerfile', { tag: 'realtutorialhub-web', pkg: '@quiz/realtutorialhub-web' }],
  ['apps/realtutorialhub-quiz/Dockerfile', { tag: 'realtutorialhub-quiz', pkg: '@quiz/realtutorialhub-quiz' }],
  ['apps/realtutorialhub-admin/Dockerfile', { tag: 'realtutorialhub-admin', pkg: '@quiz/realtutorialhub-admin' }],
  ['apps/skillup-web/Dockerfile', { tag: 'skillup-web', pkg: '@quiz/skillup-web' }],
  ['apps/skillup-admin/Dockerfile', { tag: 'skillup-admin', pkg: '@quiz/skillup-admin' }],
  ['apps/faculty-app/Dockerfile', { tag: 'faculty-app', pkg: '@quiz/faculty-app' }],
  ['apps/skillhubcore-admin/Dockerfile', { tag: 'skillhubcore-admin', pkg: '@quiz/skillhubcore-admin' }],
  ['apps/skillhub-placement/Dockerfile', { tag: 'skillhub-placement', pkg: '@quiz/skillhub-placement' }],
  ['services/skillhubcore-service/Dockerfile', { tag: 'skillhubcore-service', pkg: '@quiz/skillhubcore-service' }],
]);

function collectWorkflowDockerfiles(content) {
  const dockerfiles = [];
  const regex = /-f\s+([A-Za-z0-9./-]+Dockerfile)\s*\\/g;
  for (const match of content.matchAll(regex)) {
    dockerfiles.push(match[1]);
  }
  return [...new Set(dockerfiles)];
}

function collectLocalDockerTags(content) {
  return [...content.matchAll(/Build-Image -Tag "([^"]+)"/g)].map((match) => match[1]);
}

const workflowDockerfiles = collectWorkflowDockerfiles(workflowContent);
const unknownWorkflowDockerfiles = workflowDockerfiles.filter((path) => !dockerfileToService.has(path));

if (unknownWorkflowDockerfiles.length > 0) {
  console.error(
    JSON.stringify(
      {
        error: 'Unmapped Dockerfile(s) found in deploy-cloudrun workflow',
        dockerfiles: unknownWorkflowDockerfiles,
      },
      null,
      2,
    ),
  );
  process.exit(1);
}

const workflowServices = workflowDockerfiles.map((path) => dockerfileToService.get(path));
const workflowTags = workflowServices.map((service) => service.tag);
const workflowPackages = workflowServices.map((service) => service.pkg);

const localDockerTags = collectLocalDockerTags(dockerScriptContent);
const buildAll = packageJson.scripts['build:all'] ?? '';
const typecheckAll = packageJson.scripts['typecheck:all'] ?? '';

const missingFromDockerScript = workflowTags.filter((tag) => !localDockerTags.includes(tag));
const missingFromBuildAll = workflowPackages.filter((pkg) => !buildAll.includes(pkg));
const missingFromTypecheckAll = workflowPackages.filter((pkg) => !typecheckAll.includes(pkg));

const result = {
  workflowDockerfiles,
  workflowTags,
  localDockerTags,
  missingFromDockerScript,
  missingFromBuildAll,
  missingFromTypecheckAll,
};

if (missingFromDockerScript.length > 0 || missingFromBuildAll.length > 0 || missingFromTypecheckAll.length > 0) {
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(result, null, 2));
