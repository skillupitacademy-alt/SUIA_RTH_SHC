export interface SyncUserInput {
  // externalBrand and platform must always be the same value.
  // They are kept separate for future extensibility only.
  externalId: string;
  externalBrand: 'realtutorialhub' | 'skillup' | 'skillhubcore';
  email: string;
  platform: 'realtutorialhub' | 'skillup' | 'skillhubcore';
  role?: 'student' | 'admin' | 'faculty' | 'super_admin';
}

export interface SyncUserResult {
  shadowUserId: string;
  created: boolean;
}
