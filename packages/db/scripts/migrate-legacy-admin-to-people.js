/* eslint-disable no-console */
process.env.SOURCE_EMAIL ??= 'admin@test.com';
process.env.TARGET_PLATFORM ??= 'realtutorialhub';
process.env.TARGET_SUBSCRIPTION_PLAN ??= 'free';
process.env.TARGET_SUBSCRIPTION_FEATURES ??= 'notes';

require('./migrate-legacy-user-to-people');
