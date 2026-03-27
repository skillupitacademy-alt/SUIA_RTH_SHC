import { describe, expect, it } from 'vitest';

import {
  jobListings,
  placementApplications,
  placementOffers,
  schema,
  studentPlacementProfiles,
} from '../index';

describe('db-placement schema', () => {
  it('exports the placement tables', () => {
    expect(jobListings).toBeDefined();
    expect(studentPlacementProfiles).toBeDefined();
    expect(placementApplications).toBeDefined();
    expect(placementOffers).toBeDefined();
    expect(schema).toBeDefined();
  });
});
