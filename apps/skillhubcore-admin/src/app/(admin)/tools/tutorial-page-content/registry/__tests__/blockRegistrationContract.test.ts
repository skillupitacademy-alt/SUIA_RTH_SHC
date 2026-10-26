import { describe, expect, it } from 'vitest';
import { hasRegisteredBlockRenderer } from '@quiz/ui';
import { getRegisteredBlockVersionDefinitions } from '../../document/blockVersionDefinitions';
import { getBlockTypes } from '../index';

describe('Composer block registration contract', () => {
  it('keeps each selectable version backed by a lifecycle adapter and renderer', () => {
    const definitions = getRegisteredBlockVersionDefinitions();

    for (const family of getBlockTypes()) {
      for (const version of family.versions) {
        expect(
          definitions.some((definition) => definition.type === family.id && definition.version === version.code),
          `${family.id} ${version.code} is missing a Composer lifecycle definition`,
        ).toBe(true);
        expect(
          hasRegisteredBlockRenderer(family.id, version.code),
          `${family.id} ${version.code} is missing a runtime renderer`,
        ).toBe(true);
        expect(version.getDefaultPayload()).toBeTruthy();
      }
    }
  });
});
