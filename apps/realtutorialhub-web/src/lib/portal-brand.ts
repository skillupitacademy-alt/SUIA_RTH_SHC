import {
  buildBrandAwarePath,
  realtutorialhubBrand,
  resolveSharedLoginBrand,
  skillupBrand,
  type SharedLoginBrand,
} from '@quiz/config/src/brands';

export type TutorialPortalBrand = SharedLoginBrand;

export function resolveTutorialPortalBrand(value?: string | null): TutorialPortalBrand {
  return resolveSharedLoginBrand(value);
}

export function getTutorialPortalBrandDefinition(brand: TutorialPortalBrand) {
  return brand === 'skillup' ? skillupBrand : realtutorialhubBrand;
}

export function withTutorialPortalBrand(pathname: string, brand: TutorialPortalBrand): string {
  return buildBrandAwarePath(pathname, brand);
}
