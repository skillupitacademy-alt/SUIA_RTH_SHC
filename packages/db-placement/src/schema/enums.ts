import { pgEnum } from 'drizzle-orm/pg-core';

export const jobListingStatusEnum = pgEnum('job_listing_status', ['draft', 'open', 'closed', 'paused']);
export const placementProfileStatusEnum = pgEnum('placement_profile_status', ['active', 'paused', 'placed', 'archived']);
export const placementApplicationStatusEnum = pgEnum('placement_application_status', [
  'applied',
  'screening',
  'shortlisted',
  'rejected',
  'withdrawn',
]);
export const placementOfferStatusEnum = pgEnum('placement_offer_status', ['offered', 'accepted', 'declined', 'expired']);
export const placementInterviewStatusEnum = pgEnum('placement_interview_status', [
  'scheduled',
  'completed',
  'cancelled',
  'no_show',
]);
