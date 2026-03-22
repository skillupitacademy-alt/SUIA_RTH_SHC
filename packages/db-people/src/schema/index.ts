/* istanbul ignore file */
export * from './enums';
export * from './users';
export * from './platform-access';
export * from './subscriptions';
export * from './sso-sessions';
export * from './token-families';
export * from './audit-log';
export * from './hierarchy';

import * as enums from './enums';
import * as usersModule from './users';
import * as platformAccessModule from './platform-access';
import * as subscriptionsModule from './subscriptions';
import * as ssoSessionsModule from './sso-sessions';
import * as refreshTokenFamiliesModule from './token-families';
import * as authAuditLogModule from './audit-log';
import * as hierarchyModule from './hierarchy';

export const schema = {
  ...enums,
  ...usersModule,
  ...platformAccessModule,
  ...subscriptionsModule,
  ...ssoSessionsModule,
  ...refreshTokenFamiliesModule,
  ...authAuditLogModule,
  ...hierarchyModule,
};
