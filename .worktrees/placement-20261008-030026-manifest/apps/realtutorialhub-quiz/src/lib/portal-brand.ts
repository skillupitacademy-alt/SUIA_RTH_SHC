import {
  buildBrandAwarePath,
  realtutorialhubBrand,
  resolveSharedLoginBrand,
  skillupBrand,
  type SharedLoginBrand,
} from '@quiz/config/src/brands';

export type QuizPortalBrand = SharedLoginBrand;

export function resolveQuizPortalBrand(value?: string | null): QuizPortalBrand | undefined {
  return resolveSharedLoginBrand(value);
}

export function getQuizPortalBrandDefinition(brand: QuizPortalBrand) {
  return brand === 'skillup' ? skillupBrand : realtutorialhubBrand;
}

export function withQuizPortalBrand(pathname: string, brand: QuizPortalBrand): string {
  return buildBrandAwarePath(pathname, brand);
}
