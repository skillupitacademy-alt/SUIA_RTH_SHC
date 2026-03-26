/* istanbul ignore file */
export * from './enums';
export * from './users';
export * from './user-profiles';
export * from './platform-access';
export * from './subscriptions';
export * from './sso-sessions';
export * from './token-families';
export * from './audit-log';
export * from './hierarchy';
export * from './enquiries';
export * from './enquiry-follow-ups';
export * from './admissions';
export * from './faculty';
export * from './faculty-availability';
export * from './batches';
export * from './batch-sessions';
export * from './batch-enrollments';
export * from './attendance-records';
export * from './demo-sessions';
export * from './payment-installments';
export * from './student-placement-profiles';
export * from './placement-jobs';

import * as enums from './enums';
import * as usersModule from './users';
import * as userProfilesModule from './user-profiles';
import * as platformAccessModule from './platform-access';
import * as subscriptionsModule from './subscriptions';
import * as ssoSessionsModule from './sso-sessions';
import * as refreshTokenFamiliesModule from './token-families';
import * as authAuditLogModule from './audit-log';
import * as hierarchyModule from './hierarchy';
import * as enquiriesModule from './enquiries';
import * as enquiryFollowUpsModule from './enquiry-follow-ups';
import * as admissionsModule from './admissions';
import * as facultyModule from './faculty';
import * as facultyAvailabilityModule from './faculty-availability';
import * as batchesModule from './batches';
import * as batchSessionsModule from './batch-sessions';
import * as batchEnrollmentsModule from './batch-enrollments';
import * as attendanceRecordsModule from './attendance-records';
import * as demoSessionsModule from './demo-sessions';
import * as paymentInstallmentsModule from './payment-installments';
import * as studentPlacementProfilesModule from './student-placement-profiles';
import * as placementJobsModule from './placement-jobs';

export const schema = {
  ...enums,
  ...usersModule,
  ...userProfilesModule,
  ...platformAccessModule,
  ...subscriptionsModule,
  ...ssoSessionsModule,
  ...refreshTokenFamiliesModule,
  ...authAuditLogModule,
  ...hierarchyModule,
  ...enquiriesModule,
  ...enquiryFollowUpsModule,
  ...admissionsModule,
  ...facultyModule,
  ...facultyAvailabilityModule,
  ...batchesModule,
  ...batchSessionsModule,
  ...batchEnrollmentsModule,
  ...attendanceRecordsModule,
  ...demoSessionsModule,
  ...paymentInstallmentsModule,
  ...studentPlacementProfilesModule,
  ...placementJobsModule,
};
