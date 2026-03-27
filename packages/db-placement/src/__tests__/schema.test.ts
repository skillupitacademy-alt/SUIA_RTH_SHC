import { describe, expect, it } from 'vitest';

import {
  jobListings,
  placementApplications,
  placementInterviews,
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
    expect(placementInterviews).toBeDefined();
    expect(schema).toBeDefined();
  });
});
