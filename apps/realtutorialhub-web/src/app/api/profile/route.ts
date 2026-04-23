import type { NextRequest } from 'next/server';
import { 
  handleProfileGet, 
  handleProfilePatch 
} from '../../../../../../src/share-branding/auth/bffProfileHandler';

/**
 * 🔐 REALTUTORIALHUB BFF PROFILE ROUTE
 * 
 * Uses shared handler to eliminate code duplication.
 * Implementation is in: src/share-branding/auth/bffProfileHandler.ts
 */

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return handleProfileGet(req);
}

export async function PATCH(req: NextRequest) {
  return handleProfilePatch(req);
}