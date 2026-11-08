import { expect, it } from 'vitest';
import { getIdentityNode, saveIdentityNode } from '../packages/marketing-site/src/lib/analytics/identity/identity-store';
import { getIdentityEdgesForNode } from '../packages/marketing-site/src/lib/analytics/identity/identity-graph';
import { mergeIdentityNodes } from '../packages/marketing-site/src/lib/analytics/identity/user-merge-engine';

function seed(brand: 'realtutorialhub' | 'skillupitacademy', suffix: string) {
  const id = `identity:${brand}:sol-merge-${suffix}`;
  saveIdentityNode(brand, {
    id, brandId: brand, identifiers: { anonymous_id: suffix, user_id: `${brand}-${suffix}` },
    confidence: 0.5, createdAt: '2026-11-06T00:00:00.000Z', updatedAt: '2026-11-06T00:00:00.000Z',
  });
  return id;
}

it('preserves a legitimate same-brand identity merge', () => {
  const primary = seed('realtutorialhub', 'local-primary');
  const secondary = seed('realtutorialhub', 'local-secondary');
  expect(mergeIdentityNodes(primary, secondary)?.merged.brandId).toBe('realtutorialhub');
  expect(getIdentityNode('realtutorialhub', secondary)?.mergedInto).toBe(primary);
});

it('denies a foreign-brand merge before changing nodes or graph edges', () => {
  const primary = seed('realtutorialhub', 'foreign-primary');
  const secondary = seed('skillupitacademy', 'foreign-secondary');
  const beforePrimary = JSON.stringify(getIdentityNode('realtutorialhub', primary));
  const beforeSecondary = JSON.stringify(getIdentityNode('skillupitacademy', secondary));
  const beforeEdges = JSON.stringify(getIdentityEdgesForNode(secondary));
  try { mergeIdentityNodes(primary, secondary); } catch { /* A sanitized denial is allowed. */ }
  expect({
    primary: JSON.stringify(getIdentityNode('realtutorialhub', primary)),
    secondary: JSON.stringify(getIdentityNode('skillupitacademy', secondary)),
    edges: JSON.stringify(getIdentityEdgesForNode(secondary)),
  }).toEqual({ primary: beforePrimary, secondary: beforeSecondary, edges: beforeEdges });
});
