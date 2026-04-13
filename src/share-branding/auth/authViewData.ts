import type { SharedBrandId } from '../brandConfig';

export interface AuthViewData {
  email: string;
  password: string;
  error?: string;
  loading: boolean;
}

export interface LoginUserSummary {
  id?: string;
  email?: string;
  roles?: string[];
}

export interface LoginApiResponse {
  user?: LoginUserSummary;
  expiresAt?: string | null;
  error?: string;
  message?: string;
  _error?: string;
}

export interface LoginRequestData {
  email: string;
  password: string;
  brand: SharedBrandId;
}

export interface LoginResultViewData {
  success: boolean;
  user?: LoginUserSummary;
  expiresAt?: string | null;
}
