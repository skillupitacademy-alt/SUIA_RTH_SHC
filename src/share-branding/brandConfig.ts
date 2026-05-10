/**
 * Unified brand config single source of truth.
 * Used by shared branding routes and components for both brands.
 */
export interface BrandConfig {
  // Identity
  name: string; // e.g. "RealTutorialHub" | "SkillUp IT Academy"
  brandMark: string; // e.g. "R" | "S"

  // Colors
  primaryColor: string; // RTH: #d03f00 | SkillUp: #f54a8d
  primaryColorDark: string; // RTH: #b63600 | SkillUp: #d63d7a
  secondaryColor: string; // RTH: #124fd6 | SkillUp: #133382
  primaryRgb: string; // For shadow rgba(), e.g. "208,63,0"
  accentBackground: string;

  // Tailwind gradients
  gradientFrom: string;
  gradientTo: string;
  accentColor: string;

  // Hero section
  heroHeadingLine1: string;
  heroHeadingLine2: string;

  // Tutor / mentor section
  tutorLabel: string; // "AI Tutor" | "Live Mentor"
  tutorBadgeText: string;
  tutorHeading: string;
  tutorDescription: string;
  tutorButtonText: string;
  tutorChatResponse: string;
  tutorContextLabel: string;

  // Comparison and testimonials
  ecosystemLabel: string;
  tutorComparisonLabel: string;
  testimonialMention: string;

  // Pricing
  pricingTutorLabel: string;
  pricingTutorUnlimited: string;

  // Auth section
  authWelcomeHeading: string;
  authWelcomeSubtext: string;
  authShowcaseIcon: 'tutor' | 'mentor';

  // Footer
  footerDescription: string;
  footerCopyright: string;
  onboardingFooterText: string;
  illustrationAccentColor: string;
  illustrationHighlightColor: string;

  // Dashboard
  dashboardGreeting: string;
  dashboardSubtext: string;

  // Tutorial dashboard
  tutorialDashboardTitle: string;
  tutorialDashboardSubtitle: string;
  tutorialDashboardSearchPlaceholder: string;
}

export type SharedBrandId = 'realtutorialhub' | 'skillup' | 'skillhubcore';

export const rthConfig: BrandConfig = {
  name: 'RealTutorialHub',
  brandMark: 'R',

  primaryColor: '#d03f00',
  primaryColorDark: '#b63600',
  secondaryColor: '#124fd6',
  primaryRgb: '208,63,0',
  accentBackground: '#fff1eb',

  gradientFrom: 'from-orange-700',
  gradientTo: 'to-orange-800',
  accentColor: 'orange',

  heroHeadingLine1: 'Learn Smarter.',
  heroHeadingLine2: 'Not Harder.',

  tutorLabel: 'AI Tutor',
  tutorBadgeText: 'AI-Powered Learning',
  tutorHeading: 'Stuck? Ask AI - Get Answers Based on Your Exact Topic',
  tutorDescription:
    'Our AI Tutor is context-aware and provides guidance without spoon-feeding answers',
  tutorButtonText: 'Try AI Tutor Free',
  tutorChatResponse:
    'Based on the lesson you just completed on functions, let me guide you through recursion step by step...',
  tutorContextLabel: 'Powered by your learning context',

  ecosystemLabel: 'RealTutorialHub Ecosystem',
  tutorComparisonLabel: 'AI Tutor Support',
  testimonialMention: 'RealTutorialHub',

  pricingTutorLabel: 'Limited AI Tutor queries',
  pricingTutorUnlimited: 'Unlimited AI Tutor',

  authWelcomeHeading: 'Learn Smarter. Not Harder.',
  authWelcomeSubtext:
    'Join 10k+ developers and tech professionals mastering real-world skills with AI-powered guidance.',
  authShowcaseIcon: 'tutor',

  footerDescription:
    'The most advanced structured learning engine designed for modern developers and tech professionals.',
  footerCopyright: '© 2026 RealTutorialHub. All rights reserved.',
  onboardingFooterText: '© 2024 RealTutorialHub • Privacy Policy • Terms',
  illustrationAccentColor: '#ea580c',
  illustrationHighlightColor: '#fbbf24',

  dashboardGreeting: 'Ready to Level Up?',
  dashboardSubtext: 'Your personalized learning path is waiting.',

  tutorialDashboardTitle: 'Tutorial Engine Dashboard',
  tutorialDashboardSubtitle: 'Your personalized learning command center',
  tutorialDashboardSearchPlaceholder: 'Search courses, topics...',
};

export const skillUpConfig: BrandConfig = {
  name: 'SkillUp IT Academy',
  brandMark: 'S',

  primaryColor: '#f54a8d',
  primaryColorDark: '#d63d7a',
  secondaryColor: '#133382',
  primaryRgb: '245,74,141',
  accentBackground: '#fff0f6',

  gradientFrom: 'from-pink-500',
  gradientTo: 'to-pink-600',
  accentColor: 'pink',

  heroHeadingLine1: 'Skill Up.',
  heroHeadingLine2: 'Stand Out.',

  tutorLabel: 'Live Mentor',
  tutorBadgeText: 'Expert-Led Training',
  tutorHeading: 'Stuck? Ask Your Mentor - Get Guided by Industry Experts',
  tutorDescription:
    'Our Live Mentors provide real-time, context-aware guidance tailored to your current lesson',
  tutorButtonText: 'Connect with a Mentor',
  tutorChatResponse:
    'Based on the lesson you just completed on functions, let me walk you through recursion with a real example...',
  tutorContextLabel: 'Powered by expert mentorship',

  ecosystemLabel: 'SkillUp Ecosystem',
  tutorComparisonLabel: 'Live Mentor Support',
  testimonialMention: 'SkillUp IT Academy',

  pricingTutorLabel: 'Limited Live Mentor sessions',
  pricingTutorUnlimited: 'Unlimited Live Mentor',

  authWelcomeHeading: 'Skill Up. Stand Out.',
  authWelcomeSubtext:
    'Industry-ready IT training powered by expert mentors and hands-on practice. Your career starts here.',
  authShowcaseIcon: 'mentor',

  footerDescription:
    'Industry-ready IT training powered by expert mentors and hands-on practice.',
  footerCopyright: '© 2026 SkillUp IT Academy. All rights reserved.',
  onboardingFooterText: '© 2024 SkillUp IT Academy • Privacy Policy • Terms',
  illustrationAccentColor: '#ec4899',
  illustrationHighlightColor: '#f9a8d4',

  dashboardGreeting: 'Master Your Craft',
  dashboardSubtext: 'Connect with a mentor and start building today.',

  tutorialDashboardTitle: 'Mentorship Dashboard',
  tutorialDashboardSubtitle: 'Your personalized learning and mentorship command center',
  tutorialDashboardSearchPlaceholder: 'Search courses, topics, mentors...',
};

export const brands: Record<'rth' | 'skillup' | 'skillhubcore', BrandConfig> = {
  rth: rthConfig,
  skillup: skillUpConfig,
  skillhubcore: skillUpConfig, // Temporarily use SkillUp config for SHC
};

export function getBrandConfig(brand: SharedBrandId): BrandConfig {
  if (brand === 'skillhubcore') return skillUpConfig; // Temporarily use SkillUp config
  return brand === 'skillup' ? skillUpConfig : rthConfig;
}
