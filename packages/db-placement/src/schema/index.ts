/* istanbul ignore file */
export * from './enums';
export * from './job-listings';
export * from './student-placement-profiles';
export * from './placement-applications';
export * from './placement-offers';

import * as enums from './enums';
import * as jobListingsModule from './job-listings';
import * as studentPlacementProfilesModule from './student-placement-profiles';
import * as placementApplicationsModule from './placement-applications';
import * as placementOffersModule from './placement-offers';

export const schema = {
  ...enums,
  ...jobListingsModule,
  ...studentPlacementProfilesModule,
  ...placementApplicationsModule,
  ...placementOffersModule,
};
