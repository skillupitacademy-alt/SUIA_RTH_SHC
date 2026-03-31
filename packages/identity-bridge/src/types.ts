export interface SyncUserInput {
  externalId: string;
  externalBrand: 'realtutorialhub' | 'skillup';
  email: string;
  platform: 'realtutorialhub' | 'skillup';
  role?: 'student' | 'admin' | 'faculty' | 'super_admin';
}

export interface SyncUserResult {
  shadowUserId: string;
  created: boolean;
}
