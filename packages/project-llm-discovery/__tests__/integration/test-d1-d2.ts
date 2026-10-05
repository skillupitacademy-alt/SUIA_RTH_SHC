import { FilesystemRepositoryAdapter } from '../../src/adapters/index.js';
import { scanRepositoryStructure, scanRuntime } from '../../src/scanners/index.js';

async function main() {
  const repositoryRoot = 'e:\\onlinewebsites\\quiz-platform';
  const adapter = new FilesystemRepositoryAdapter(repositoryRoot);

  console.log('Running D1 Structure Scanner...');
  const d1Result = await scanRepositoryStructure(adapter);
  
  console.log('\n=== D1 Structure Scanner Results ===');
  console.log(`Applications discovered: ${d1Result.data.applications.length}`);
  console.log(`Packages discovered: ${d1Result.data.packages.length}`);
  console.log(`Services discovered: ${d1Result.data.services.length}`);
  console.log(`Evidence records: ${d1Result.evidence.length}`);
  
  console.log('\nApplications:');
  d1Result.data.applications.forEach((app) => {
    console.log(`  - ${app.name} (${app.framework})`);
  });
  
  console.log('\nPackages:');
  d1Result.data.packages.forEach((pkg) => {
    console.log(`  - ${pkg.name} v${pkg.version}`);
  });
  
  console.log('\nServices:');
  d1Result.data.services.forEach((svc) => {
    console.log(`  - ${svc.name}`);
  });

  console.log('\n\nRunning D2 Runtime Scanner...');
  const d2Result = await scanRuntime(adapter);
  
  console.log('\n=== D2 Runtime Scanner Results ===');
  console.log(`Workspace Manager: ${d2Result.data.workspace.manager} v${d2Result.data.workspace.version}`);
  console.log(`Workspace Packages: ${d2Result.data.workspace.packages.length} patterns`);
  console.log(`Build System: ${d2Result.data.buildSystem.tool} v${d2Result.data.buildSystem.version}`);
  console.log(`Frameworks detected: ${d2Result.data.frameworks.length}`);
  console.log(`Evidence records: ${d2Result.evidence.length}`);
  
  console.log('\nFrameworks:');
  d2Result.data.frameworks.forEach((fw) => {
    console.log(`  - ${fw.name} v${fw.version} (${fw.packages.length} packages)`);
  });

  console.log('\n\n=== Verification ===');
  const appsCount = d1Result.data.applications.length;
  const packagesCount = d1Result.data.packages.length;
  const servicesCount = d1Result.data.services.length;
  
  console.log(`Expected: 11 apps, 18 packages, 3 services`);
  console.log(`Actual: ${appsCount} apps, ${packagesCount} packages, ${servicesCount} services`);
  
  const success = appsCount === 11 && packagesCount === 18 && servicesCount === 3;
  
  if (success) {
    console.log('\n✓ VERIFICATION PASSED');
    process.exit(0);
  } else {
    console.log('\n✗ VERIFICATION FAILED');
    console.log(`Apps: ${appsCount === 11 ? '✓' : '✗'}`);
    console.log(`Packages: ${packagesCount === 18 ? '✓' : '✗'}`);
    console.log(`Services: ${servicesCount === 3 ? '✓' : '✗'}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Integration test failed:', error);
  process.exit(1);
});
