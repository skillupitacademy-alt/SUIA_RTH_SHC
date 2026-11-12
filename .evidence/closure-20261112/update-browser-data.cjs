// Preserve the owner's lockfile baseline and update only these leaf data packages.
const fs = require('fs');
const { execFileSync } = require('child_process');
const YAML = require('yaml');
async function main() {
  const original = execFileSync('git', ['show', 'HEAD:pnpm-lock.yaml'], { encoding: 'utf8' });
  const doc = YAML.parseDocument(original);
  const changes = [];
  for (const name of ['caniuse-lite', 'baseline-browser-mapping']) {
    const response = await fetch(`https://registry.npmjs.org/${name}/latest`, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error('Registry metadata unavailable');
    const metadata = await response.json();
    if (Object.keys(metadata.dependencies || {}).length) throw new Error('New non-leaf dependency requires separate review');
    const packages = doc.get('packages', true);
    const oldVersions = new Set();
    for (const pair of packages.items) {
      const key = String(pair.key.value);
      if (!key.startsWith(`${name}@`)) continue;
      oldVersions.add(key.slice(name.length + 1));
      pair.key.value = `${name}@${metadata.version}`;
      pair.value.set('resolution', doc.createNode({ integrity: metadata.dist.integrity }));
      if (metadata.engines) pair.value.set('engines', doc.createNode(metadata.engines));
      else pair.value.delete('engines');
    }
    if (!oldVersions.size) throw new Error('Expected locked package missing');
    const snapshots = doc.get('snapshots', true);
    for (const pair of snapshots.items) {
      const key = String(pair.key.value);
      if (key.startsWith(`${name}@`) && oldVersions.has(key.slice(name.length + 1))) pair.key.value = `${name}@${metadata.version}`;
    }
    YAML.visit(doc, { Pair(_key, pair) {
      if (String(pair.key?.value) !== name) return;
      if (YAML.isScalar(pair.value) && oldVersions.has(String(pair.value.value))) pair.value.value = metadata.version;
      if (YAML.isMap(pair.value)) {
        const version = pair.value.get('version', true);
        if (YAML.isScalar(version) && oldVersions.has(String(version.value))) version.value = metadata.version;
      }
    } });
    changes.push({ name, from: [...oldVersions], to: metadata.version });
  }
  if (doc.errors.length) throw new Error('Invalid lockfile syntax');
  fs.writeFileSync('pnpm-lock.yaml', doc.toString({ lineWidth: 0, flowCollectionPadding: false }));
  fs.writeFileSync('.evidence/closure-20261112/browser-data-updates.json', JSON.stringify(changes, null, 2));
  console.log(JSON.stringify(changes));
}
main().catch(e => { console.error(e.name); process.exitCode = 1; });
