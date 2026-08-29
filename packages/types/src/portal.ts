import type { Brand } from './brand.types';

export type PortalIdentity = 'admin' | 'user' | 'faculty' | 'super_admin' | 'infrastructure';

// Re-export Brand for backward compatibility
export type { Brand };
