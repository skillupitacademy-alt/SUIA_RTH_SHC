/**
 * Minimal Asset Specifications for Content Manager
 * Simplified version after removal of prompt-generator tool
 */

export interface AssetSpec {
  id: string;
  label: string;
  fieldPath: string;
  width: number;
  height: number;
  purpose: string;
}

// Minimal asset specs for sections still in use
export const ASSET_SPECS: Record<string, AssetSpec[]> = {
  overview: [],
  notes: [],
  real_life: [],
  technical: [],
  code: [],
  visual: [],
  practice: [],
  assignment: [],
  project: [],
  quiz: [],
  summary: [],
  interview: [],
  ai_tutor: [],
};
