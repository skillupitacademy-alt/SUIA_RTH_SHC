/**
 * UNIFIED BRAND CONFIG — Single Source of Truth
 * Used by both root LandingPage (/) and gateway pages (/start-learning)
 * for RealTutorialHub and SkillUp IT Academy.
 */
export interface BrandConfig {
  // ── Identity ────────────────────────────────────────
  name: string;               // e.g. "RealTutorialHub" | "SkillUp IT Academy"

  // ── Colors ──────────────────────────────────────────
  primaryColor: string;       // RTH: #d03f00  |  SkillUp: #f54a8d
  primaryColorDark: string;   // RTH: #b63600  |  SkillUp: #d63d7a
  secondaryColor: string;     // RTH: #124fd6  |  SkillUp: #133382
  primaryRgb: string;         // For shadow rgba() — e.g. "208,63,0"

  // ── Tailwind Gradient Classes (used by gateway) ─────
  gradientFrom: string;       // e.g. "from-orange-500" | "from-pink-500"
  gradientTo: string;         // e.g. "to-orange-600"   | "to-pink-600"
  accentColor: string;        // e.g. "orange" | "pink"

  // ── Hero Section ────────────────────────────────────
  heroHeadingLine1: string;
  heroHeadingLine2: string;

  // ── Tutor / Mentor Section ──────────────────────────
  tutorLabel: string;         // "AI Tutor" | "Live Mentor"
  tutorBadgeText: string;     // "AI-Powered Learning" | "Expert-Led Training"
  tutorHeading: string;
  tutorDescription: string;
  tutorButtonText: string;
  tutorChatResponse: string;
  tutorContextLabel: string;

  // ── Comparison & Testimonials ───────────────────────
  ecosystemLabel: string;         // "RealTutorialHub Ecosystem" | "SkillUp Ecosystem"
  tutorComparisonLabel: string;   // "AI Tutor Support" | "Live Mentor Support"
  testimonialMention: string;

  // ── Pricing ─────────────────────────────────────────
  pricingTutorLabel: string;      // "Limited AI Tutor queries" | "Limited Live Mentor sessions"
  pricingTutorUnlimited: string;  // "Unlimited AI Tutor"       | "Unlimited Live Mentor"

  // ── Auth Section ────────────────────────────────────
  authWelcomeHeading: string;     // e.g. "Learn Smarter. Not Harder."
  authWelcomeSubtext: string;     // e.g. "Join 10k+ developers mastering real-world skills."
  authShowcaseIcon: 'tutor' | 'mentor';

  // ── Footer ──────────────────────────────────────────
  footerDescription: string;
  footerCopyright: string;

  // ── Dashboard ───────────────────────────────────────
  dashboardGreeting: string;
  dashboardSubtext: string;
}

// ── RTH Brand Config ──────────────────────────────────
export const rthConfig: BrandConfig = {
  name: 'RealTutorialHub',

  primaryColor: '#d03f00',
  primaryColorDark: '#b63600',
  secondaryColor: '#124fd6',
  primaryRgb: '208,63,0',

  gradientFrom: 'from-orange-700',
  gradientTo: 'to-orange-800',
  accentColor: 'orange',

  heroHeadingLine1: 'Learn Smarter.',
  heroHeadingLine2: 'Not Harder.',

  tutorLabel: 'AI Tutor',
  tutorBadgeText: 'AI-Powered Learning',
  tutorHeading: 'Stuck? Ask AI — Get Answers Based on Your Exact Topic',
  tutorDescription: 'Our AI Tutor is context-aware and provides guidance without spoon-feeding answers',
  tutorButtonText: 'Try AI Tutor Free',
  tutorChatResponse: 'Based on the lesson you just completed on functions, let me guide you through recursion step by step...',
  tutorContextLabel: '✨ Powered by your learning context',

  ecosystemLabel: 'RealTutorialHub Ecosystem',
  tutorComparisonLabel: 'AI Tutor Support',
  testimonialMention: 'RealTutorialHub',

  pricingTutorLabel: 'Limited AI Tutor queries',
  pricingTutorUnlimited: 'Unlimited AI Tutor',

  authWelcomeHeading: 'Learn Smarter. Not Harder.',
  authWelcomeSubtext: 'Join 10k+ developers and tech professionals mastering real-world skills with AI-powered guidance.',
  authShowcaseIcon: 'tutor',

  footerDescription: 'The most advanced structured learning engine designed for modern developers and tech professionals.',
  footerCopyright: '© 2026 RealTutorialHub. All rights reserved.',

  dashboardGreeting: 'Ready to Level Up?',
  dashboardSubtext: 'Your personalized learning path is waiting.',
};

// ── SkillUp Brand Config ──────────────────────────────
export const skillUpConfig: BrandConfig = {
  name: 'SkillUp IT Academy',

  primaryColor: '#f54a8d',
  primaryColorDark: '#d63d7a',
  secondaryColor: '#133382',
  primaryRgb: '245,74,141',

  gradientFrom: 'from-pink-500',
  gradientTo: 'to-pink-600',
  accentColor: 'pink',

  heroHeadingLine1: 'Skill Up.',
  heroHeadingLine2: 'Stand Out.',

  tutorLabel: 'Live Mentor',
  tutorBadgeText: 'Expert-Led Training',
  tutorHeading: 'Stuck? Ask Your Mentor — Get Guided by Industry Experts',
  tutorDescription: 'Our Live Mentors provide real-time, context-aware guidance tailored to your current lesson',
  tutorButtonText: 'Connect with a Mentor',
  tutorChatResponse: 'Based on the lesson you just completed on functions, let me walk you through recursion with a real example...',
  tutorContextLabel: '✨ Powered by expert mentorship',

  ecosystemLabel: 'SkillUp Ecosystem',
  tutorComparisonLabel: 'Live Mentor Support',
  testimonialMention: 'SkillUp IT Academy',

  pricingTutorLabel: 'Limited Live Mentor sessions',
  pricingTutorUnlimited: 'Unlimited Live Mentor',

  authWelcomeHeading: 'Skill Up. Stand Out.',
  authWelcomeSubtext: 'Industry-ready IT training powered by expert mentors and hands-on practice. Your career starts here.',
  authShowcaseIcon: 'mentor',

  footerDescription: 'Industry-ready IT training powered by expert mentors and hands-on practice.',
  footerCopyright: '© 2026 SkillUp IT Academy. All rights reserved.',

  dashboardGreeting: 'Master Your Craft',
  dashboardSubtext: 'Connect with a mentor and start building today.',
};

// ── Legacy gateway export (brands record) re-exported for compatibility ──
export const brands: Record<'rth' | 'skillup', BrandConfig> = {
  rth: rthConfig,
  skillup: skillUpConfig,
};
