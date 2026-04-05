export interface BrandConfig {
  name: string;
  primaryColor: string;
  primaryColorDark: string;
  secondaryColor: string;
  tutorLabel: string;
  gradientFrom: string;
  gradientTo: string;
  accentColor: string;
}

export const brands: Record<'rth' | 'skillup', BrandConfig> = {
  rth: {
    name: 'RealTutorialHub',
    primaryColor: '#d03f00',
    primaryColorDark: '#b63600',
    secondaryColor: '#1E3A8A',
    tutorLabel: 'AI Tutor',
    gradientFrom: 'from-orange-500',
    gradientTo: 'to-orange-600',
    accentColor: 'orange'
  },
  skillup: {
    name: 'SkillUp IT Academy',
    primaryColor: '#f54a8d',
    primaryColorDark: '#d63d7a',
    secondaryColor: '#1E3A8A',
    tutorLabel: 'Live Mentor',
    gradientFrom: 'from-pink-500',
    gradientTo: 'to-pink-600',
    accentColor: 'pink'
  }
};
