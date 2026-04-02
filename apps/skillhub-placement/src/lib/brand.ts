export type PlacementBrand = 'realtutorialhub' | 'skillup';

export type PlacementTheme = {
  brand: PlacementBrand;
  name: string;
  tagline: string;
  accentClass: string;
  softClass: string;
  borderClass: string;
  buttonClass: string;
  chipClass: string;
};

export function resolvePlacementBrand(value?: string | null): PlacementBrand {
  return value === 'realtutorialhub' ? 'realtutorialhub' : 'skillup';
}

export function withPlacementBrand(path: string, brand: PlacementBrand): string {
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}brand=${brand}`;
}

export function getPlacementLoginUrl(brand: PlacementBrand, redirectPath: string): string {
  const baseUrl =
    brand === 'realtutorialhub'
      ? 'https://user.realtutorialhub.com/login'
      : 'https://user.skillupitacademy.com/login';

  return `${baseUrl}?redirect=${encodeURIComponent(redirectPath)}`;
}

export function getPlacementLaunchUrl(brand: PlacementBrand, redirectPath: string): string {
  const baseUrl =
    brand === 'realtutorialhub'
      ? 'https://user.realtutorialhub.com/placement'
      : 'https://user.skillupitacademy.com/placement';

  return `${baseUrl}?redirect=${encodeURIComponent(redirectPath)}`;
}

export function getPlacementRefreshUrl(brand: PlacementBrand): string {
  return brand === 'realtutorialhub'
    ? 'https://api.realtutorialhub.com/api/auth/refresh'
    : 'https://api.skillupitacademy.com/api/auth/refresh';
}

export function getPlacementTheme(brand: PlacementBrand): PlacementTheme {
  if (brand === 'realtutorialhub') {
    return {
      brand,
      name: 'Real Tutorial Hub',
      tagline: 'Career launchpad for AI-guided learners',
      accentClass: 'text-rose-600',
      softClass: 'bg-rose-50',
      borderClass: 'border-rose-200',
      buttonClass: 'bg-rose-500 hover:bg-rose-600 text-white',
      chipClass: 'border-rose-200 bg-rose-50 text-rose-700',
    };
  }

  return {
    brand,
    name: 'SkillUp IT Academy',
    tagline: 'Placement momentum for mentor-led cohorts',
    accentClass: 'text-sky-600',
    softClass: 'bg-sky-50',
    borderClass: 'border-sky-200',
    buttonClass: 'bg-sky-500 hover:bg-sky-600 text-white',
    chipClass: 'border-sky-200 bg-sky-50 text-sky-700',
  };
}
